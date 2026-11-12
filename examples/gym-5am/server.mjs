// Wellness Fitness 5AM — servidor de entrada y administración.
// Sin dependencias: node:http + node:sqlite (Node >= 22.5). Uso: node --no-warnings server.mjs
import { createServer } from "node:http";
import { readFile, mkdir, access } from "node:fs/promises";
import { randomInt } from "node:crypto";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, PAYMENT_METHODS } from "./lib/store.mjs";
import { isDateStr, todayStr } from "./lib/dates.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
};

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com; style-src-attr 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// ---------- Errores y validación ----------
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};

const str = (v, field, { max = 120, required = false } = {}) => {
  if (v === undefined || v === null || v === "") {
    if (required) fail(400, `El campo "${field}" es obligatorio`);
    return undefined;
  }
  if (typeof v !== "string") fail(400, `El campo "${field}" no es válido`);
  const s = v.trim();
  if (required && !s) fail(400, `El campo "${field}" es obligatorio`);
  if (s.length > max) fail(400, `El campo "${field}" es demasiado largo`);
  return s;
};
const int = (v, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) fail(400, `El campo "${field}" no es válido`);
  return n;
};
const money = (v, field) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 1e7) fail(400, `El campo "${field}" no es válido`);
  return Math.round(n * 100);
};
const phone = (v) => {
  const s = str(v, "teléfono", { max: 24 });
  if (s && !/^\+?[\d\s().-]{6,24}$/.test(s)) fail(400, "El teléfono no es válido");
  return s;
};
const email = (v) => {
  const s = str(v, "email", { max: 120 });
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) fail(400, "El email no es válido");
  return s;
};
const pinValue = (v) => {
  const s = str(v, "PIN", { max: 12, required: true });
  if (!/^\d{4,12}$/.test(s)) fail(400, "El PIN debe tener entre 4 y 12 dígitos");
  return s;
};

const paymentInput = (p) => {
  const startDate = str(p.startDate, "fecha de inicio", { max: 10 });
  if (startDate && !isDateStr(startDate)) fail(400, "Fecha de inicio no válida");
  if (!PAYMENT_METHODS.includes(p.method)) fail(400, "Método de pago no válido");
  return {
    planId: int(p.planId, "plan", { min: 1 }),
    amountCents: money(p.amount, "monto"),
    method: p.method,
    note: str(p.note, "nota", { max: 200 }) || "",
    startDate,
  };
};

// ---------- Límite de intentos por IP ----------
function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      if (hits.size > 5000) for (const [k, e] of hits) if (e.reset < now) hits.delete(k);
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}

// ---------- Utilidades HTTP ----------
const send = (res, status, body, headers = {}) => {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    "Content-Type": isJson
      ? "application/json; charset=utf-8"
      : headers["Content-Type"] || "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    if (!String(req.headers["content-type"] || "").includes("application/json")) {
      return reject(new HttpError(415, "Se esperaba JSON"));
    }
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 32 * 1024) {
        reject(new HttpError(413, "Solicitud demasiado grande"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
        if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error();
        resolve(body);
      } catch {
        reject(new HttpError(400, "JSON no válido"));
      }
    });
    req.on("error", reject);
  });

const cookies = (req) =>
  Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k, v]) => k && v)
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );

const clientIp = (req, trustProxy) =>
  (trustProxy &&
    String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim()) ||
  req.socket.remoteAddress ||
  "?";

const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita inyección de fórmulas al abrir en Excel
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ---------- Aplicación ----------
export function createApp({ store, secureCookies = false, trustProxy = false } = {}) {
  const checkinLimit = rateLimiter(20, 60_000);
  const loginLimit = rateLimiter(5, 5 * 60_000);
  const SID = "sid";
  const sessionCookie = (token, maxAge) =>
    `${SID}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookies ? "; Secure" : ""}`;

  const routes = [];
  const route = (method, pattern, handler, { admin = false } = {}) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "(\\d+)"))}$`);
    routes.push({ method, re, keys, handler, admin });
  };

  // --- Público: entrada con código ---
  route("GET", "/api/kiosk", async () => ({
    gymName: store.getSettings().gymName,
    hasPhoto: await access(join(PUBLIC, "img", "kiosk.jpg")).then(
      () => true,
      () => false
    ),
  }));

  route("POST", "/api/checkin", async ({ req, ip }) => {
    if (!checkinLimit(ip)) fail(429, "Demasiados intentos. Espera un minuto.");
    const { code } = await readJson(req);
    const c = str(code, "código", { max: 8, required: true });
    if (!/^\d{4,8}$/.test(c)) fail(400, "Código no válido");
    const result = store.checkIn(c);
    if (!result) fail(404, "Código no encontrado");
    return result;
  });

  // --- Sesión de administración ---
  route("GET", "/api/admin/session", ({ authed }) => ({ authenticated: authed }));

  route("POST", "/api/admin/login", async ({ req, ip }) => {
    if (!loginLimit(ip)) fail(429, "Demasiados intentos. Espera unos minutos.");
    const { pin } = await readJson(req);
    if (!store.checkPin(String(pin ?? ""))) fail(401, "PIN incorrecto");
    return { ok: true, _cookie: sessionCookie(store.createSession(), 12 * 3600) };
  });

  route("POST", "/api/admin/logout", ({ token }) => {
    if (token) store.destroySession(token);
    return { ok: true, _cookie: sessionCookie("", 0) };
  });

  route(
    "POST",
    "/api/admin/pin",
    async ({ req }) => {
      const { current, next } = await readJson(req);
      if (!store.checkPin(String(current ?? ""))) fail(401, "El PIN actual no es correcto");
      store.setPin(pinValue(next));
      store.destroyAllSessions();
      return { ok: true, _cookie: sessionCookie(store.createSession(), 12 * 3600) };
    },
    { admin: true }
  );

  // --- Datos de administración ---
  route(
    "GET",
    "/api/admin/summary",
    () => ({ ...store.summary(), settings: store.getSettings() }),
    { admin: true }
  );
  route(
    "GET",
    "/api/admin/meta",
    () => ({
      plans: store.listPlans(),
      methods: PAYMENT_METHODS,
      settings: store.getSettings(),
      today: todayStr(),
    }),
    {
      admin: true,
    }
  );

  route(
    "GET",
    "/api/admin/members",
    ({ url }) => {
      const filter = url.searchParams.get("filter") || "all";
      if (!["all", "activo", "por_vencer", "vencido", "sin_pago"].includes(filter))
        fail(400, "Filtro no válido");
      return store.listMembers({ search: (url.searchParams.get("q") || "").slice(0, 60), filter });
    },
    { admin: true }
  );

  route(
    "POST",
    "/api/admin/members",
    async ({ req }) => {
      const b = await readJson(req);
      const code = str(b.code, "código", { max: 8 });
      if (code && !/^\d{4,8}$/.test(code)) fail(400, "El código debe tener entre 4 y 8 dígitos");
      const data = {
        name: str(b.name, "nombre", { required: true, max: 80 }),
        phone: phone(b.phone) || "",
        email: email(b.email) || "",
        notes: str(b.notes, "notas", { max: 500 }) || "",
        code,
      };
      // Se valida el primer cobro antes de crear al socio para no dejar registros a medias.
      const payment = b.payment ? paymentInput(b.payment) : null;
      if (payment && !store.listPlans().some((p) => p.id === payment.planId))
        fail(400, "Plan no válido");
      const member = store.createMember(data);
      if (payment) return store.registerPayment(member.id, payment);
      return member;
    },
    { admin: true }
  );

  route(
    "GET",
    "/api/admin/members/:id",
    ({ params }) => store.memberDetail(params.id) || fail(404, "Socio no encontrado"),
    {
      admin: true,
    }
  );

  route(
    "PATCH",
    "/api/admin/members/:id",
    async ({ req, params }) => {
      const b = await readJson(req);
      return (
        store.updateMember(params.id, {
          name:
            b.name === undefined ? undefined : str(b.name, "nombre", { required: true, max: 80 }),
          phone: b.phone === undefined ? undefined : phone(b.phone) || "",
          email: b.email === undefined ? undefined : email(b.email) || "",
          notes: b.notes === undefined ? undefined : str(b.notes, "notas", { max: 500 }) || "",
        }) || fail(404, "Socio no encontrado")
      );
    },
    { admin: true }
  );

  route(
    "POST",
    "/api/admin/members/:id/code",
    ({ params }) => store.regenerateCode(params.id) || fail(404, "Socio no encontrado"),
    {
      admin: true,
    }
  );

  route(
    "DELETE",
    "/api/admin/members/:id",
    ({ params }) => ({ ok: store.archiveMember(params.id) || fail(404, "Socio no encontrado") }),
    {
      admin: true,
    }
  );

  route(
    "POST",
    "/api/admin/members/:id/payments",
    async ({ req, params }) => {
      const b = await readJson(req);
      return store.registerPayment(params.id, paymentInput(b)) || fail(404, "Socio no encontrado");
    },
    { admin: true }
  );

  route(
    "GET",
    "/api/admin/payments",
    ({ url }) => {
      const month = url.searchParams.get("month") || todayStr().slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(month)) fail(400, "Mes no válido");
      return store.listPayments(month);
    },
    { admin: true }
  );

  route(
    "GET",
    "/api/admin/visits",
    ({ url }) => {
      const day = url.searchParams.get("day") || todayStr();
      if (!isDateStr(day)) fail(400, "Fecha no válida");
      return store.listVisits(day);
    },
    { admin: true }
  );

  route("GET", "/api/admin/reminders", () => store.reminders(), { admin: true });
  route(
    "POST",
    "/api/admin/members/:id/reminded",
    ({ params }) => ({ ok: store.markReminderSent(params.id) || fail(404, "Socio no encontrado") }),
    {
      admin: true,
    }
  );

  route(
    "PUT",
    "/api/admin/settings",
    async ({ req }) => {
      const b = await readJson(req);
      const patch = {
        gymName: str(b.gymName, "nombre del gimnasio", { max: 60 }),
        currency: str(b.currency, "moneda", { max: 4 }),
        countryCode: str(b.countryCode, "código de país", { max: 4 }),
        reminderTemplate: str(b.reminderTemplate, "mensaje", { max: 600 }),
        warnDays:
          b.warnDays === undefined
            ? undefined
            : String(int(b.warnDays, "días de aviso", { min: 1, max: 30 })),
      };
      if (patch.countryCode && !/^\d{1,4}$/.test(patch.countryCode))
        fail(400, "Código de país no válido");
      if (patch.gymName === "") fail(400, "El nombre del gimnasio es obligatorio");
      const settings = store.updateSettings(patch);
      let plans = store.listPlans();
      if (Array.isArray(b.plans)) {
        if (!b.plans.length || b.plans.length > 12) fail(400, "Debe haber entre 1 y 12 planes");
        plans = store.savePlans(
          b.plans.map((p) => ({
            id: p.id ? int(p.id, "plan", { min: 1 }) : undefined,
            name: str(p.name, "nombre del plan", { required: true, max: 40 }),
            months: int(p.months, "meses", { min: 1, max: 36 }),
            price_cents: money(p.price, "precio") ?? fail(400, "Precio obligatorio"),
          }))
        );
      }
      return { settings, plans };
    },
    { admin: true }
  );

  route(
    "GET",
    "/api/admin/export/members.csv",
    () => {
      const rows = store.listMembers();
      const head = [
        "Código",
        "Nombre",
        "Teléfono",
        "Email",
        "Plan",
        "Vence",
        "Estado",
        "Última entrada",
      ];
      const body = rows.map((m) =>
        [m.code, m.name, m.phone, m.email, m.plan_name, m.end_date, m.status, m.last_visit]
          .map(csvCell)
          .join(",")
      );
      return {
        _raw: "﻿" + [head.join(","), ...body].join("\n"),
        _headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="socios-${todayStr()}.csv"`,
        },
      };
    },
    { admin: true }
  );

  // ---------- Archivos estáticos ----------
  const serveStatic = async (res, pathname) => {
    const clean =
      pathname === "/" ? "/index.html" : pathname === "/admin" ? "/admin.html" : pathname;
    const file = normalize(join(PUBLIC, clean));
    if (!file.startsWith(PUBLIC)) return send(res, 403, "Prohibido");
    try {
      const data = await readFile(file);
      const type = MIME[extname(file)] || "application/octet-stream";
      const cache = /\.(woff2|png|jpg|webp|svg|mp4)$/.test(file)
        ? "public, max-age=604800"
        : "no-cache";
      send(res, 200, data, { "Content-Type": type, "Cache-Control": cache });
    } catch {
      send(res, 404, "No encontrado");
    }
  };

  return async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (!url.pathname.startsWith("/api/")) {
        if (req.method !== "GET" && req.method !== "HEAD")
          return send(res, 405, "Método no permitido");
        return await serveStatic(res, url.pathname);
      }
      const token = cookies(req)[SID];
      const authed = store.validSession(token);
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const match = url.pathname.match(r.re);
        if (!match) continue;
        if (r.admin && !authed) fail(401, "Sesión no válida");
        const params = Object.fromEntries(r.keys.map((k, i) => [k, Number(match[i + 1])]));
        const out = await r.handler({
          req,
          url,
          params,
          token,
          authed,
          ip: clientIp(req, trustProxy),
        });
        if (out && out._raw !== undefined) return send(res, 200, out._raw, out._headers);
        const headers = {};
        if (out && out._cookie) {
          headers["Set-Cookie"] = out._cookie;
          delete out._cookie;
        }
        return send(res, 200, out ?? { ok: true }, headers);
      }
      fail(404, "Ruta no encontrada");
    } catch (err) {
      const status = err instanceof HttpError || Number.isInteger(err.status) ? err.status : 500;
      if (status === 500) console.error("[error]", req.method, url.pathname, err);
      // Nunca se devuelve el stack ni mensajes internos al cliente.
      send(res, status, { error: status === 500 ? "Error interno del servidor" : err.message });
    }
  };
}

// ---------- Arranque ----------
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (isMain) {
  const dataDir = process.env.DATA_DIR || join(ROOT, "data");
  await mkdir(dataDir, { recursive: true });
  const store = createStore(join(dataDir, "gym.db"));

  if (!store.hasPin()) {
    const pin = process.env.ADMIN_PIN || String(randomInt(100000, 1000000));
    store.setPin(pin);
    console.log(
      process.env.ADMIN_PIN
        ? "PIN de administración configurado desde ADMIN_PIN."
        : `\n  PIN de administración inicial: ${pin}\n  Cámbialo en Administración → Ajustes.\n`
    );
  }

  const port = Number(process.env.PORT) || 5050;
  const host = process.env.HOST || "0.0.0.0";
  createServer(
    createApp({
      store,
      secureCookies: process.env.SECURE_COOKIES === "1",
      trustProxy: process.env.TRUST_PROXY === "1",
    })
  ).listen(port, host, () => {
    console.log(`Wellness Fitness 5AM en http://localhost:${port}  (administración: /admin)`);
  });
}
