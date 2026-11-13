// Capa de datos de Wellness Fitness 5AM sobre el SQLite integrado en Node (node:sqlite).
// Todas las consultas usan sentencias preparadas: nunca se interpola texto del usuario en SQL.
import { DatabaseSync } from "node:sqlite";
import { randomInt, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { addMonths, addDays, daysBetween, isDateStr, todayStr } from "./dates.mjs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  months INTEGER NOT NULL CHECK (months BETWEEN 1 AND 36),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  plan_id INTEGER REFERENCES plans(id),
  end_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  archived INTEGER NOT NULL DEFAULT 0,
  reminder_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id),
  plan_id INTEGER REFERENCES plans(id),
  plan_name TEXT NOT NULL,
  months INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  paid_on TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_paid_on ON payments(paid_on);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id),
  day TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  allowed INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visits_day ON visits(day);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS phrases (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  method TEXT NOT NULL,
  sold_on TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_sales_sold_on ON sales(sold_on);
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_text TEXT NOT NULL DEFAULT '',
  starts_on TEXT,
  ends_on TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS instructors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  archived INTEGER NOT NULL DEFAULT 0
);
`;

export const DEFAULT_SETTINGS = {
  gymName: "Wellness Fitness 5AM",
  currency: "$",
  countryCode: "52",
  warnDays: "5",
  showStreaks: "1",
  reminderTemplate:
    "Hola {nombre}, te saluda {gimnasio}. Te recordamos que tu mensualidad {estado} el {fecha}. Puedes renovarla en recepción o respondiendo a este mensaje. ¡Nos vemos a las 5AM!",
};

// Mensualidad de Wellness Fitness 5AM: $549 MXN. Otros planes se añaden en Administración → Ajustes.
const DEFAULT_PLANS = [["Mensual", 1, 54900]];

// Frases iniciales; el dueño las edita en Administración → Motivación.
const DEFAULT_PHRASES = [
  "El mejor entrenamiento es el que sí haces.",
  "Llegaste. Eso ya es ganarle al día.",
  "La constancia vence al talento cuando el talento no es constante.",
  "Hoy duele, mañana es tu fuerza.",
  "No tienes que ser extremo, solo constante.",
  "Cada repetición cuenta, incluso la que nadie ve.",
  "Tu único rival es quien fuiste ayer.",
  "La disciplina es elegir lo que quieres a largo plazo sobre lo que quieres ahora.",
  "Mientras otros duermen, tú construyes.",
  "Un día más, una versión mejor.",
  "No pares cuando estés cansado; para cuando termines.",
  "El progreso es lento, pero rendirse no lo acelera.",
  "Suda hoy, sonríe mañana.",
  "Tu cuerpo logra lo que tu mente cree.",
  "Los resultados llegan a quien no falta.",
  "Empieza donde estás, usa lo que tienes, da lo que puedas.",
  "Fuerte no es el que no cae, sino el que vuelve cada día.",
  "La motivación te trae, el hábito te mantiene.",
  "Hoy entrenas por la persona que quieres ser.",
  "Pequeños pasos todos los días hacen grandes cambios.",
];

export const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia", "Otro"];

const hashPin = (pin, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(String(pin), salt, 32).toString("hex")}`;

const verifyPin = (pin, stored) => {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(String(pin), salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
};

export function createStore(path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);

  // Migración: fecha de inscripción (antigüedad). Las bases creadas antes no tenían la columna.
  if (
    !db
      .prepare("PRAGMA table_info(members)")
      .all()
      .some((c) => c.name === "joined_on")
  ) {
    db.exec("ALTER TABLE members ADD COLUMN joined_on TEXT");
    db.exec("UPDATE members SET joined_on = date(created_at) WHERE joined_on IS NULL");
  }

  const q = (sql) => db.prepare(sql);
  const tx = (fn) => {
    db.exec("BEGIN");
    try {
      const out = fn();
      db.exec("COMMIT");
      return out;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };

  // ---------- Semillas ----------
  if (q("SELECT COUNT(*) n FROM plans").get().n === 0) {
    const ins = q("INSERT INTO plans (name, months, price_cents) VALUES (?, ?, ?)");
    DEFAULT_PLANS.forEach((p) => ins.run(...p));
  }
  if (q("SELECT COUNT(*) n FROM phrases").get().n === 0) {
    const insPhrase = q("INSERT INTO phrases (text) VALUES (?)");
    DEFAULT_PHRASES.forEach((t) => insPhrase.run(t));
  }
  const insSetting = q("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => insSetting.run(k, v));

  // ---------- Ajustes ----------
  const getSettings = () => {
    const out = {};
    for (const row of q("SELECT key, value FROM settings WHERE key != 'adminPin'").all()) {
      out[row.key] = row.value;
    }
    return out;
  };
  const updateSettings = (patch) => {
    const up = q(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    );
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (patch[key] !== undefined) up.run(key, String(patch[key]));
    }
    return getSettings();
  };

  // ---------- PIN de administración y sesiones ----------
  const hasPin = () => Boolean(q("SELECT value FROM settings WHERE key = 'adminPin'").get());
  const setPin = (pin) =>
    q(
      "INSERT INTO settings (key, value) VALUES ('adminPin', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(hashPin(pin));
  const checkPin = (pin) =>
    verifyPin(pin, q("SELECT value FROM settings WHERE key = 'adminPin'").get()?.value);

  const SESSION_MS = 12 * 60 * 60 * 1000;
  const createSession = () => {
    const token = randomBytes(32).toString("hex");
    q("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
    q("INSERT INTO sessions (token, expires_at) VALUES (?, ?)").run(token, Date.now() + SESSION_MS);
    return token;
  };
  const validSession = (token) =>
    Boolean(token) &&
    Boolean(q("SELECT 1 FROM sessions WHERE token = ? AND expires_at > ?").get(token, Date.now()));
  const destroySession = (token) => q("DELETE FROM sessions WHERE token = ?").run(token);
  const destroyAllSessions = () => q("DELETE FROM sessions").run();

  // ---------- Planes ----------
  const listPlans = (all = false) =>
    q(
      `SELECT id, name, months, price_cents FROM plans ${all ? "" : "WHERE active = 1"} ORDER BY months`
    ).all();
  const getPlan = (id) => q("SELECT * FROM plans WHERE id = ? AND active = 1").get(id);
  const savePlans = (plans) =>
    tx(() => {
      const keep = new Set();
      for (const p of plans) {
        if (p.id) {
          q("UPDATE plans SET name = ?, months = ?, price_cents = ?, active = 1 WHERE id = ?").run(
            p.name,
            p.months,
            p.price_cents,
            p.id
          );
          keep.add(Number(p.id));
        } else {
          const r = q("INSERT INTO plans (name, months, price_cents) VALUES (?, ?, ?)").run(
            p.name,
            p.months,
            p.price_cents
          );
          keep.add(Number(r.lastInsertRowid));
        }
      }
      for (const { id } of q("SELECT id FROM plans").all()) {
        if (!keep.has(id)) q("UPDATE plans SET active = 0 WHERE id = ?").run(id);
      }
      return listPlans();
    });

  // ---------- Estado de membresía ----------
  const warnDays = () => Number(getSettings().warnDays) || 5;
  const statusOf = (endDate, today = todayStr()) => {
    if (!endDate) return { status: "sin_pago", daysLeft: null };
    const daysLeft = daysBetween(today, endDate);
    if (daysLeft < 0) return { status: "vencido", daysLeft };
    if (daysLeft <= warnDays()) return { status: "por_vencer", daysLeft };
    return { status: "activo", daysLeft };
  };
  const decorate = (m) => (m ? { ...m, ...statusOf(m.end_date) } : m);

  // ---------- Socios ----------
  const generateCode = () => {
    const exists = q("SELECT 1 FROM members WHERE code = ?");
    for (let digits = 4; digits <= 8; digits++) {
      for (let i = 0; i < 50; i++) {
        const code = String(randomInt(10 ** (digits - 1), 10 ** digits));
        if (!exists.get(code)) return code;
      }
    }
    throw new Error("No se pudo generar un código único");
  };

  const MEMBER_COLS = `m.id, m.code, m.name, m.phone, m.email, m.plan_id, p.name AS plan_name,
    m.end_date, m.notes, m.reminder_sent_at, m.created_at, m.joined_on,
    (SELECT MAX(at) FROM visits v WHERE v.member_id = m.id AND v.allowed = 1) AS last_visit`;

  const listMembers = ({ search = "", filter = "all" } = {}) => {
    const like = `%${search.trim().toLowerCase()}%`;
    const rows = q(
      `SELECT ${MEMBER_COLS} FROM members m LEFT JOIN plans p ON p.id = m.plan_id
       WHERE m.archived = 0 AND (lower(m.name) LIKE ? OR m.code LIKE ? OR m.phone LIKE ?)
       ORDER BY m.name COLLATE NOCASE`
    )
      .all(like, like, like)
      .map(decorate);
    return filter === "all" ? rows : rows.filter((m) => m.status === filter);
  };

  const getMember = (id) =>
    decorate(
      q(
        `SELECT ${MEMBER_COLS} FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE m.id = ? AND m.archived = 0`
      ).get(id)
    );

  const memberDetail = (id) => {
    const member = getMember(id);
    if (!member) return null;
    return {
      member,
      payments: q("SELECT * FROM payments WHERE member_id = ? ORDER BY paid_on DESC, id DESC").all(
        id
      ),
      visits: q("SELECT at, allowed FROM visits WHERE member_id = ? ORDER BY id DESC LIMIT 20").all(
        id
      ),
    };
  };

  const createMember = ({ name, phone = "", email = "", notes = "", code, joinedOn }) => {
    if (code && q("SELECT 1 FROM members WHERE code = ?").get(code)) {
      const err = new Error("Ese código ya está en uso");
      err.status = 409;
      throw err;
    }
    const r = q(
      "INSERT INTO members (code, name, phone, email, notes, joined_on) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(code || generateCode(), name, phone, email, notes, joinedOn || todayStr());
    return getMember(Number(r.lastInsertRowid));
  };

  const updateMember = (id, { name, phone, email, notes, joinedOn }) => {
    const m = getMember(id);
    if (!m) return null;
    q(
      "UPDATE members SET name = ?, phone = ?, email = ?, notes = ?, joined_on = ? WHERE id = ?"
    ).run(
      name ?? m.name,
      phone ?? m.phone,
      email ?? m.email,
      notes ?? m.notes,
      joinedOn ?? m.joined_on,
      id
    );
    return getMember(id);
  };

  // Importación en bloque: valida todas las filas y, si alguna falla, no importa ninguna.
  // Las filas traen la fecha de vencimiento ya pagada; no se inventan cobros históricos.
  const importMembers = (rows) => {
    const today = todayStr();
    const plans = listPlans();
    const errors = [];
    const seen = new Set();
    const exists = q("SELECT 1 FROM members WHERE code = ?");
    const clean = rows.map((r, i) => {
      const row = i + 1;
      const name = String(r.name ?? "").trim();
      const code = String(r.code ?? "").trim();
      const add = (msg) => errors.push({ row, message: msg });
      if (!name) add("Falta el nombre");
      if (name.length > 80) add("El nombre es demasiado largo");
      if (!/^\d{4,8}$/.test(code)) add(`El código "${code}" debe tener entre 4 y 8 dígitos`);
      else if (seen.has(code)) add(`El código ${code} está repetido en el archivo`);
      else if (exists.get(code)) add(`El código ${code} ya pertenece a otro socio`);
      seen.add(code);
      const phone = String(r.phone ?? "").trim();
      if (phone && !/^\+?[\d\s().-]{6,24}$/.test(phone)) add(`Teléfono no válido: ${phone}`);
      const joinedOn = r.joinedOn || today;
      if (!isDateStr(joinedOn)) add("Fecha de inscripción no válida");
      else if (joinedOn > today) add("La fecha de inscripción está en el futuro");
      const endDate = r.endDate || null;
      if (endDate && !isDateStr(endDate)) add("Fecha de vencimiento no válida");
      const plan = r.plan
        ? plans.find((p) => p.name.toLowerCase() === String(r.plan).trim().toLowerCase())
        : null;
      if (r.plan && !plan) add(`El plan "${r.plan}" no existe (créalo antes en Ajustes)`);
      return {
        name,
        code,
        phone,
        email: String(r.email ?? "")
          .trim()
          .slice(0, 120),
        joinedOn,
        endDate,
        planId: plan?.id ?? (endDate ? plans[0]?.id : null),
      };
    });
    if (errors.length) return { created: 0, errors };
    tx(() => {
      const ins = q(
        "INSERT INTO members (code, name, phone, email, joined_on, end_date, plan_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      for (const m of clean)
        ins.run(m.code, m.name, m.phone, m.email, m.joinedOn, m.endDate, m.planId ?? null);
    });
    return { created: clean.length, errors: [] };
  };

  const regenerateCode = (id) => {
    if (!getMember(id)) return null;
    q("UPDATE members SET code = ? WHERE id = ?").run(generateCode(), id);
    return getMember(id);
  };

  const archiveMember = (id) =>
    q("UPDATE members SET archived = 1 WHERE id = ?").run(id).changes > 0;

  // ---------- Cobros ----------
  // Renovar extiende desde el vencimiento actual si sigue vigente, o desde hoy si ya venció.
  const registerPayment = (memberId, { planId, amountCents, method, note = "", startDate }) =>
    tx(() => {
      const member = getMember(memberId);
      if (!member) return null;
      const plan = getPlan(planId);
      if (!plan) {
        const err = new Error("Plan no válido");
        err.status = 400;
        throw err;
      }
      const today = todayStr();
      let start = startDate || today;
      // La mensualidad vence el mismo día del mes siguiente (pago el 11 → vence el 11).
      // Renovar antes de vencer conserva ese día: el nuevo periodo parte del vencimiento actual.
      if (!startDate && member.end_date && member.end_date >= today) start = member.end_date;
      const end = addMonths(start, plan.months);
      // Un cobro con fecha de inicio pasada se registra en esa fecha (pago capturado después).
      const paidOn = startDate && startDate <= today ? startDate : today;
      const amount = amountCents ?? plan.price_cents;
      q(
        `INSERT INTO payments (member_id, plan_id, plan_name, months, amount_cents, method, period_start, period_end, note, paid_on)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(memberId, plan.id, plan.name, plan.months, amount, method, start, end, note, paidOn);
      q("UPDATE members SET end_date = ?, plan_id = ?, reminder_sent_at = NULL WHERE id = ?").run(
        end,
        plan.id,
        memberId
      );
      return getMember(memberId);
    });

  const listPayments = (month = todayStr().slice(0, 7)) =>
    q(
      `SELECT pa.*, m.name AS member_name, m.code AS member_code FROM payments pa
       JOIN members m ON m.id = pa.member_id WHERE substr(pa.paid_on, 1, 7) = ? ORDER BY pa.paid_on DESC, pa.id DESC`
    ).all(month);

  // ---------- Entrada con código ----------
  // Racha: días seguidos con al menos una entrada permitida, contando hasta hoy.
  const streakFor = (memberId, today) => {
    const days = q(
      "SELECT DISTINCT day FROM visits WHERE member_id = ? AND allowed = 1 AND day <= ? ORDER BY day DESC LIMIT 400"
    )
      .all(memberId, today)
      .map((r) => r.day);
    let streak = 0;
    let expected = today;
    for (const d of days) {
      if (d !== expected) break;
      streak += 1;
      expected = addDays(expected, -1);
    }
    return streak;
  };

  const checkIn = (code) => {
    const m = q(
      "SELECT id, name, end_date, joined_on FROM members WHERE code = ? AND archived = 0"
    ).get(String(code));
    if (!m) return null;
    const today = todayStr();
    const st = statusOf(m.end_date, today);
    const allowed = st.status === "activo" || st.status === "por_vencer";
    q("INSERT INTO visits (member_id, day, allowed) VALUES (?, ?, ?)").run(
      m.id,
      today,
      allowed ? 1 : 0
    );
    const out = {
      firstName: m.name.trim().split(/\s+/)[0],
      endDate: m.end_date,
      joinedOn: m.joined_on,
      allowed,
      ...st,
    };
    if (allowed) {
      // Varias entradas el mismo día cuentan como una sola visita.
      out.visitsThisMonth = q(
        "SELECT COUNT(DISTINCT day) n FROM visits WHERE member_id = ? AND allowed = 1 AND substr(day, 1, 7) = ?"
      ).get(m.id, today.slice(0, 7)).n;
      out.streak = streakFor(m.id, today);
    }
    return out;
  };

  const listVisits = (day = todayStr()) =>
    q(
      `SELECT v.at, v.allowed, m.id AS member_id, m.name, m.code FROM visits v
       JOIN members m ON m.id = v.member_id WHERE v.day = ? ORDER BY v.id DESC`
    ).all(day);

  // ---------- Avisos de vencimiento ----------
  const reminders = () =>
    listMembers()
      .filter((m) => m.status === "por_vencer" || (m.status === "vencido" && m.daysLeft >= -30))
      .sort((a, b) => a.daysLeft - b.daysLeft);

  const markReminderSent = (id) =>
    q("UPDATE members SET reminder_sent_at = datetime('now', 'localtime') WHERE id = ?").run(id)
      .changes > 0;

  // ---------- Tienda ----------
  const listProducts = () =>
    q(
      "SELECT id, name, price_cents, stock FROM products WHERE archived = 0 ORDER BY name COLLATE NOCASE"
    ).all();
  const getProduct = (id) =>
    q("SELECT id, name, price_cents, stock FROM products WHERE id = ? AND archived = 0").get(id);
  const createProduct = ({ name, priceCents, stock }) => {
    const r = q("INSERT INTO products (name, price_cents, stock) VALUES (?, ?, ?)").run(
      name,
      priceCents,
      stock
    );
    return getProduct(Number(r.lastInsertRowid));
  };
  const updateProduct = (id, { name, priceCents, stock }) => {
    const p = getProduct(id);
    if (!p) return null;
    q("UPDATE products SET name = ?, price_cents = ?, stock = ? WHERE id = ?").run(
      name ?? p.name,
      priceCents ?? p.price_cents,
      stock ?? p.stock,
      id
    );
    return getProduct(id);
  };
  const archiveProduct = (id) =>
    q("UPDATE products SET archived = 1 WHERE id = ?").run(id).changes > 0;

  // Vender descuenta existencias en la misma transacción: nunca se vende más de lo que hay.
  const sellProduct = (id, { qty, method }) =>
    tx(() => {
      const p = getProduct(id);
      if (!p) return null;
      if (p.stock < qty) {
        const err = new Error(`Solo quedan ${p.stock} en existencia`);
        err.status = 409;
        throw err;
      }
      q("UPDATE products SET stock = stock - ? WHERE id = ?").run(qty, id);
      q(
        "INSERT INTO sales (product_id, product_name, qty, unit_cents, total_cents, method, sold_on) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(id, p.name, qty, p.price_cents, p.price_cents * qty, method, todayStr());
      return getProduct(id);
    });
  const listSales = (month = todayStr().slice(0, 7)) =>
    q("SELECT * FROM sales WHERE substr(sold_on, 1, 7) = ? ORDER BY id DESC").all(month);

  // ---------- Estadísticas ----------
  const stats = (monthsBack = 6) => {
    const [y, m] = todayStr().split("-").map(Number);
    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      months.push({
        month: key,
        memberships: q(
          "SELECT COALESCE(SUM(amount_cents), 0) s FROM payments WHERE substr(paid_on, 1, 7) = ?"
        ).get(key).s,
        shop: q(
          "SELECT COALESCE(SUM(total_cents), 0) s FROM sales WHERE substr(sold_on, 1, 7) = ?"
        ).get(key).s,
      });
    }
    const byHour = q(
      "SELECT CAST(substr(at, 12, 2) AS INTEGER) h, COUNT(*) n FROM visits WHERE day = ? AND allowed = 1 GROUP BY h"
    ).all(todayStr());
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      n: byHour.find((r) => r.h === h)?.n || 0,
    }));
    return { months, hours };
  };

  // ---------- Rachas ----------
  // Racha viva: días seguidos con entrada permitida que terminan hoy o ayer (aún puede venir hoy).
  const streakBoard = (limit = 50) => {
    const today = todayStr();
    const since = addDays(today, -400);
    const rows = q(
      `SELECT v.member_id, v.day, m.name, m.code FROM visits v JOIN members m ON m.id = v.member_id
       WHERE v.allowed = 1 AND m.archived = 0 AND v.day >= ? AND v.day <= ?
       GROUP BY v.member_id, v.day ORDER BY v.member_id, v.day DESC`
    ).all(since, today);
    const byMember = new Map();
    for (const r of rows) {
      if (!byMember.has(r.member_id))
        byMember.set(r.member_id, { id: r.member_id, name: r.name, code: r.code, days: [] });
      byMember.get(r.member_id).days.push(r.day);
    }
    const out = [];
    for (const m of byMember.values()) {
      let expected = m.days[0] === today ? today : addDays(today, -1);
      let streak = 0;
      for (const d of m.days) {
        if (d !== expected) break;
        streak += 1;
        expected = addDays(expected, -1);
      }
      if (streak >= 2)
        out.push({
          id: m.id,
          name: m.name,
          code: m.code,
          streak,
          cameToday: m.days[0] === today,
          lastDay: m.days[0],
        });
    }
    return out
      .sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name, "es"))
      .slice(0, limit);
  };
  // En la pantalla pública solo se muestra el nombre de pila y la inicial del apellido.
  const publicName = (name) => {
    const [first, last] = name.trim().split(/\s+/);
    return last ? `${first} ${last[0].toUpperCase()}.` : first;
  };

  // ---------- Frases motivadoras ----------
  const decoPhrase = (p) => (p ? { ...p, active: Boolean(p.active) } : p);
  const listPhrases = () =>
    q("SELECT id, text, active FROM phrases ORDER BY id").all().map(decoPhrase);
  const savePhrase = (id, { text, active }) => {
    if (id) {
      const p = q("SELECT * FROM phrases WHERE id = ?").get(id);
      if (!p) return null;
      q("UPDATE phrases SET text = ?, active = ? WHERE id = ?").run(
        text ?? p.text,
        active === undefined ? p.active : active ? 1 : 0,
        id
      );
      return decoPhrase(q("SELECT id, text, active FROM phrases WHERE id = ?").get(id));
    }
    const r = q("INSERT INTO phrases (text, active) VALUES (?, ?)").run(
      text,
      active === false ? 0 : 1
    );
    return decoPhrase(
      q("SELECT id, text, active FROM phrases WHERE id = ?").get(Number(r.lastInsertRowid))
    );
  };
  const deletePhrase = (id) => q("DELETE FROM phrases WHERE id = ?").run(id).changes > 0;

  // ---------- Promociones ----------
  // Estado calculado: "programada" (aún no empieza), "vigente", "terminada" u "oculta".
  const promoState = (p, today = todayStr()) => {
    if (!p.published) return "oculta";
    if (p.starts_on && p.starts_on > today) return "programada";
    if (p.ends_on && p.ends_on < today) return "terminada";
    return "vigente";
  };
  const decoPromo = (p) =>
    p ? { ...p, published: Boolean(p.published), state: promoState(p) } : p;
  const listPromotions = () =>
    q("SELECT * FROM promotions ORDER BY COALESCE(ends_on, '9999-12-31') DESC, id DESC")
      .all()
      .map(decoPromo);
  const getPromotion = (id) => decoPromo(q("SELECT * FROM promotions WHERE id = ?").get(id));
  const savePromotion = (id, { title, description, priceText, startsOn, endsOn, published }) => {
    if (startsOn && endsOn && endsOn < startsOn) {
      const err = new Error("La fecha de fin no puede ser anterior a la de inicio");
      err.status = 400;
      throw err;
    }
    if (id) {
      const p = q("SELECT * FROM promotions WHERE id = ?").get(id);
      if (!p) return null;
      q(
        "UPDATE promotions SET title = ?, description = ?, price_text = ?, starts_on = ?, ends_on = ?, published = ? WHERE id = ?"
      ).run(
        title ?? p.title,
        description ?? p.description,
        priceText ?? p.price_text,
        startsOn === undefined ? p.starts_on : startsOn,
        endsOn === undefined ? p.ends_on : endsOn,
        published === undefined ? p.published : published ? 1 : 0,
        id
      );
      return getPromotion(id);
    }
    const r = q(
      "INSERT INTO promotions (title, description, price_text, starts_on, ends_on, published) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      title,
      description || "",
      priceText || "",
      startsOn || null,
      endsOn || null,
      published === false ? 0 : 1
    );
    return getPromotion(Number(r.lastInsertRowid));
  };
  const deletePromotion = (id) => q("DELETE FROM promotions WHERE id = ?").run(id).changes > 0;

  // ---------- Instructores ----------
  const decoInstructor = (i) => (i ? { ...i, published: Boolean(i.published) } : i);
  const listInstructors = () =>
    q(
      "SELECT id, name, specialty, schedule, bio, published FROM instructors WHERE archived = 0 ORDER BY name COLLATE NOCASE"
    )
      .all()
      .map(decoInstructor);
  const getInstructor = (id) =>
    decoInstructor(
      q(
        "SELECT id, name, specialty, schedule, bio, published FROM instructors WHERE id = ? AND archived = 0"
      ).get(id)
    );
  const saveInstructor = (id, { name, specialty, schedule, bio, published }) => {
    if (id) {
      const i = getInstructor(id);
      if (!i) return null;
      q(
        "UPDATE instructors SET name = ?, specialty = ?, schedule = ?, bio = ?, published = ? WHERE id = ?"
      ).run(
        name ?? i.name,
        specialty ?? i.specialty,
        schedule ?? i.schedule,
        bio ?? i.bio,
        published === undefined ? (i.published ? 1 : 0) : published ? 1 : 0,
        id
      );
      return getInstructor(id);
    }
    const r = q(
      "INSERT INTO instructors (name, specialty, schedule, bio, published) VALUES (?, ?, ?, ?, ?)"
    ).run(name, specialty || "", schedule || "", bio || "", published === false ? 0 : 1);
    return getInstructor(Number(r.lastInsertRowid));
  };
  const archiveInstructor = (id) =>
    q("UPDATE instructors SET archived = 1 WHERE id = ?").run(id).changes > 0;

  // Lo que ve el público en la pantalla de entrada: solo promociones vigentes e instructores publicados.
  const publicContent = () => ({
    promotions: listPromotions()
      .filter((p) => p.state === "vigente")
      .map(({ id, title, description, price_text, ends_on }) => ({
        id,
        title,
        description,
        price_text,
        ends_on,
      })),
    instructors: listInstructors()
      .filter((i) => i.published)
      .map(({ id, name, specialty, schedule }) => ({ id, name, specialty, schedule })),
    phrases: listPhrases()
      .filter((p) => p.active)
      .map((p) => p.text),
    streaks:
      getSettings().showStreaks === "0"
        ? []
        : streakBoard(5).map((m) => ({ name: publicName(m.name), streak: m.streak })),
  });

  // ---------- Copia de seguridad ----------
  const backupTo = (file) => q("VACUUM INTO ?").run(file);

  // ---------- Resumen ----------
  const summary = () => {
    const members = listMembers();
    const count = (s) => members.filter((m) => m.status === s).length;
    const month = todayStr().slice(0, 7);
    const membresiasMes = q(
      "SELECT COALESCE(SUM(amount_cents), 0) s FROM payments WHERE substr(paid_on, 1, 7) = ?"
    ).get(month).s;
    const tiendaMes = q(
      "SELECT COALESCE(SUM(total_cents), 0) s FROM sales WHERE substr(sold_on, 1, 7) = ?"
    ).get(month).s;
    return {
      total: members.length,
      activos: count("activo"),
      porVencer: count("por_vencer"),
      vencidos: count("vencido"),
      sinPago: count("sin_pago"),
      entradasHoy: q("SELECT COUNT(*) n FROM visits WHERE day = ? AND allowed = 1").get(todayStr())
        .n,
      ingresosMes: membresiasMes + tiendaMes,
      membresiasMes,
      tiendaMes,
      cobrosMes: q("SELECT COUNT(*) n FROM payments WHERE substr(paid_on, 1, 7) = ?").get(month).n,
    };
  };

  return {
    db,
    getSettings,
    updateSettings,
    hasPin,
    setPin,
    checkPin,
    createSession,
    validSession,
    destroySession,
    destroyAllSessions,
    listPlans,
    savePlans,
    listMembers,
    getMember,
    memberDetail,
    createMember,
    importMembers,
    updateMember,
    regenerateCode,
    archiveMember,
    registerPayment,
    listPayments,
    checkIn,
    listVisits,
    reminders,
    markReminderSent,
    summary,
    listProducts,
    createProduct,
    updateProduct,
    archiveProduct,
    sellProduct,
    listSales,
    stats,
    backupTo,
    listPromotions,
    savePromotion,
    deletePromotion,
    listInstructors,
    saveInstructor,
    archiveInstructor,
    publicContent,
    streakBoard,
    listPhrases,
    savePhrase,
    deletePhrase,
    close: () => db.close(),
  };
}
