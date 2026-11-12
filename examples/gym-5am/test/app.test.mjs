// Pruebas: node --no-warnings --test test/
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createStore } from "../lib/store.mjs";
import { createApp } from "../server.mjs";
import { addDays, addMonths, daysBetween, isDateStr, todayStr } from "../lib/dates.mjs";

describe("fechas", () => {
  test("addMonths ajusta al último día del mes", () => {
    assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
    assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
    assert.equal(addMonths("2026-11-12", 1), "2026-12-12");
    assert.equal(addMonths("2026-11-12", 12), "2027-11-12");
  });
  test("addDays y daysBetween cruzan meses y años", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(daysBetween("2026-12-25", "2027-01-04"), 10);
    assert.equal(daysBetween("2026-11-12", "2026-11-10"), -2);
  });
  test("isDateStr rechaza fechas imposibles", () => {
    assert.ok(isDateStr("2026-02-28"));
    assert.ok(!isDateStr("2026-02-30"));
    assert.ok(!isDateStr("12/11/2026"));
  });
});

describe("store", () => {
  let store;
  before(() => (store = createStore(":memory:")));
  after(() => store.close());

  test("genera códigos únicos de 4 dígitos", () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) codes.add(store.createMember({ name: `Socio ${i}` }).code);
    assert.equal(codes.size, 50);
    for (const c of codes) assert.match(c, /^\d{4}$/);
  });

  test("un cobro mensual deja al socio activo hasta un día antes del mismo día del mes siguiente", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Laura Gómez" });
    const today = todayStr();
    const updated = store.registerPayment(m.id, { planId: plan.id, method: "Efectivo" });
    assert.equal(updated.end_date, addDays(addMonths(today, 1), -1));
    assert.equal(updated.status, "activo");
  });

  test("renovar antes de vencer acumula desde el vencimiento actual", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Renueva Pronto" });
    const first = store.registerPayment(m.id, { planId: plan.id, method: "Tarjeta" });
    const second = store.registerPayment(m.id, { planId: plan.id, method: "Tarjeta" });
    assert.equal(second.end_date, addDays(addMonths(addDays(first.end_date, 1), 1), -1));
  });

  test("renovar después de vencer empieza hoy", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Volvió Tarde" });
    store.registerPayment(m.id, { planId: plan.id, method: "Efectivo", startDate: "2020-01-01" });
    assert.equal(store.getMember(m.id).status, "vencido");
    const renewed = store.registerPayment(m.id, { planId: plan.id, method: "Efectivo" });
    assert.equal(renewed.end_date, addDays(addMonths(todayStr(), 1), -1));
  });

  test("estados según días restantes", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Casi Vence" });
    // Periodo que termina dentro de 3 días: empieza un mes antes de (hoy + 4)
    const start = addMonths(addDays(todayStr(), 4), -1);
    const r = store.registerPayment(m.id, {
      planId: plan.id,
      method: "Efectivo",
      startDate: start,
    });
    assert.ok(r.daysLeft >= 0 && r.daysLeft <= 5, `daysLeft=${r.daysLeft}`);
    assert.equal(r.status, "por_vencer");
    assert.ok(store.reminders().some((x) => x.id === m.id));
  });

  test("checkIn registra la entrada y deniega a socios vencidos", () => {
    const plan = store.listPlans()[0];
    const ok = store.createMember({ name: "Ana Activa" });
    store.registerPayment(ok.id, { planId: plan.id, method: "Efectivo" });
    const bad = store.createMember({ name: "Pedro Vencido" });
    store.registerPayment(bad.id, { planId: plan.id, method: "Efectivo", startDate: "2020-01-01" });

    assert.deepEqual(
      { allowed: store.checkIn(ok.code).allowed, name: store.checkIn(ok.code).firstName },
      { allowed: true, name: "Ana" }
    );
    assert.equal(store.checkIn(bad.code).allowed, false);
    assert.equal(store.checkIn("00000000"), null);
    const visits = store.listVisits();
    assert.ok(visits.some((v) => v.name === "Pedro Vencido" && v.allowed === 0));
  });

  test("el PIN se guarda con hash y se verifica", () => {
    store.setPin("4321");
    assert.ok(store.checkPin("4321"));
    assert.ok(!store.checkPin("1234"));
    const raw = store.db.prepare("SELECT value FROM settings WHERE key = 'adminPin'").get().value;
    assert.ok(!raw.includes("4321"));
  });
});

describe("API HTTP", () => {
  let server;
  let base;
  let store;
  let cookie = "";

  const call = async (path, { method = "GET", body, auth = true } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(auth && cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, headers: res.headers };
  };

  before(async () => {
    store = createStore(":memory:");
    store.setPin("246810");
    server = createServer(createApp({ store }));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    await new Promise((r) => server.close(r));
    store.close();
  });

  test("las rutas de administración exigen sesión", async () => {
    assert.equal((await call("/api/admin/members", { auth: false })).status, 401);
    assert.equal(
      (await call("/api/admin/login", { method: "POST", body: { pin: "000000" } })).status,
      401
    );
  });

  test("flujo completo: login, alta con cobro, entrada, aviso y exportación", async () => {
    const login = await call("/api/admin/login", { method: "POST", body: { pin: "246810" } });
    assert.equal(login.status, 200);
    assert.match(cookie, /^sid=/);

    const meta = await call("/api/admin/meta");
    const plan = meta.data.plans[0];
    const created = await call("/api/admin/members", {
      method: "POST",
      body: {
        name: "Laura Gómez",
        phone: "+52 55 1234 5678",
        payment: { planId: plan.id, method: "Efectivo", amount: "39" },
      },
    });
    assert.equal(created.status, 200);
    assert.equal(created.data.status, "activo");

    const checkin = await call("/api/checkin", {
      method: "POST",
      body: { code: created.data.code },
      auth: false,
    });
    assert.equal(checkin.status, 200);
    assert.equal(checkin.data.allowed, true);
    assert.equal(checkin.data.firstName, "Laura");
    assert.equal(checkin.data.phone, undefined, "la pantalla pública no expone datos personales");

    const summary = await call("/api/admin/summary");
    assert.equal(summary.data.activos, 1);
    assert.equal(summary.data.entradasHoy, 1);
    assert.equal(summary.data.ingresosMes, 3900);

    const csv = await call("/api/admin/export/members.csv");
    assert.equal(csv.status, 200);
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.match(csv.data, /Laura Gómez/);
  });

  test("un cobro con plan inválido no crea al socio", async () => {
    const before = (await call("/api/admin/members")).data.length;
    const r = await call("/api/admin/members", {
      method: "POST",
      body: { name: "No Debe Existir", payment: { planId: 9999, method: "Efectivo" } },
    });
    assert.equal(r.status, 400);
    assert.equal((await call("/api/admin/members")).data.length, before);
  });

  test("validación de entradas", async () => {
    assert.equal(
      (await call("/api/admin/members", { method: "POST", body: { name: "" } })).status,
      400
    );
    assert.equal(
      (await call("/api/admin/members", { method: "POST", body: { name: "X", phone: "abc" } }))
        .status,
      400
    );
    assert.equal(
      (await call("/api/checkin", { method: "POST", body: { code: "12a4" }, auth: false })).status,
      400
    );
    assert.equal(
      (await call("/api/checkin", { method: "POST", body: { code: "99999999" }, auth: false }))
        .status,
      404
    );
  });

  test("CSV neutraliza fórmulas", async () => {
    await call("/api/admin/members", { method: "POST", body: { name: "=HYPERLINK(1)" } });
    const csv = await call("/api/admin/export/members.csv");
    assert.match(csv.data, /'=HYPERLINK/);
  });

  test("no sirve archivos fuera de public/", async () => {
    const r = await call("/../server.mjs", { auth: false });
    assert.notEqual(r.status, 200);
    const r2 = await call("/%2e%2e/server.mjs", { auth: false });
    assert.notEqual(r2.status, 200);
  });

  test("los errores no exponen detalles internos y llevan cabeceras de seguridad", async () => {
    const r = await call("/api/no-existe");
    assert.equal(r.status, 404);
    assert.ok(r.headers.get("content-security-policy"));
    assert.equal(r.headers.get("x-frame-options"), "DENY");
  });

  test("limita los intentos de código por IP", async () => {
    let last;
    for (let i = 0; i < 25; i++) {
      last = await call("/api/checkin", { method: "POST", body: { code: "1111" }, auth: false });
    }
    assert.equal(last.status, 429);
  });

  test("cerrar sesión invalida la cookie", async () => {
    await call("/api/admin/logout", { method: "POST", body: {} });
    assert.equal((await call("/api/admin/members")).status, 401);
  });
});
