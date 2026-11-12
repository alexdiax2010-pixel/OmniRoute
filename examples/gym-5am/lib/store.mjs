// Capa de datos de Wellness Fitness 5AM sobre el SQLite integrado en Node (node:sqlite).
// Todas las consultas usan sentencias preparadas: nunca se interpola texto del usuario en SQL.
import { DatabaseSync } from "node:sqlite";
import { randomInt, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { addMonths, addDays, daysBetween, todayStr } from "./dates.mjs";

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
`;

export const DEFAULT_SETTINGS = {
  gymName: "Wellness Fitness 5AM",
  currency: "$",
  countryCode: "",
  warnDays: "5",
  reminderTemplate:
    "Hola {nombre}, te saluda {gimnasio}. Te recordamos que tu mensualidad {estado} el {fecha}. Puedes renovarla en recepción o respondiendo a este mensaje. ¡Nos vemos a las 5AM!",
};

const DEFAULT_PLANS = [
  ["Mensual", 1, 3900],
  ["Trimestral", 3, 10500],
  ["Anual", 12, 39900],
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
    m.end_date, m.notes, m.reminder_sent_at, m.created_at,
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

  const createMember = ({ name, phone = "", email = "", notes = "", code }) => {
    if (code && q("SELECT 1 FROM members WHERE code = ?").get(code)) {
      const err = new Error("Ese código ya está en uso");
      err.status = 409;
      throw err;
    }
    const r = q("INSERT INTO members (code, name, phone, email, notes) VALUES (?, ?, ?, ?, ?)").run(
      code || generateCode(),
      name,
      phone,
      email,
      notes
    );
    return getMember(Number(r.lastInsertRowid));
  };

  const updateMember = (id, { name, phone, email, notes }) => {
    const m = getMember(id);
    if (!m) return null;
    q("UPDATE members SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?").run(
      name ?? m.name,
      phone ?? m.phone,
      email ?? m.email,
      notes ?? m.notes,
      id
    );
    return getMember(id);
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
      if (!startDate && member.end_date && member.end_date >= today)
        start = addDays(member.end_date, 1);
      const end = addDays(addMonths(start, plan.months), -1);
      const amount = amountCents ?? plan.price_cents;
      q(
        `INSERT INTO payments (member_id, plan_id, plan_name, months, amount_cents, method, period_start, period_end, note, paid_on)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(memberId, plan.id, plan.name, plan.months, amount, method, start, end, note, today);
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
  const checkIn = (code) => {
    const m = q("SELECT id, name, end_date FROM members WHERE code = ? AND archived = 0").get(
      String(code)
    );
    if (!m) return null;
    const today = todayStr();
    const st = statusOf(m.end_date, today);
    const allowed = st.status === "activo" || st.status === "por_vencer";
    q("INSERT INTO visits (member_id, day, allowed) VALUES (?, ?, ?)").run(
      m.id,
      today,
      allowed ? 1 : 0
    );
    return { firstName: m.name.trim().split(/\s+/)[0], endDate: m.end_date, allowed, ...st };
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
    close: () => db.close(),
  };
}
