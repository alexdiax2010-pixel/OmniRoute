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

  test("un cobro mensual vence el mismo día del mes siguiente", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Laura Gómez" });
    const today = todayStr();
    const updated = store.registerPayment(m.id, { planId: plan.id, method: "Efectivo" });
    assert.equal(updated.end_date, addMonths(today, 1));
    assert.equal(updated.status, "activo");
  });

  test("pagar el 11 de noviembre vence el 11 de diciembre y admite códigos con cero inicial", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Alejandro Díaz", code: "06417" });
    assert.equal(m.code, "06417");
    const paid = store.registerPayment(m.id, {
      planId: plan.id,
      method: "Efectivo",
      startDate: "2026-11-11",
    });
    assert.equal(paid.end_date, "2026-12-11");
    const detail = store.memberDetail(m.id);
    assert.equal(detail.payments[0].paid_on <= todayStr(), true);
    assert.equal(store.checkIn("06417").firstName, "Alejandro");
    assert.equal(store.checkIn("6417"), null, "el cero inicial forma parte del código");
  });

  test("renovar antes de vencer acumula desde el vencimiento actual", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Renueva Pronto" });
    const first = store.registerPayment(m.id, { planId: plan.id, method: "Tarjeta" });
    const second = store.registerPayment(m.id, { planId: plan.id, method: "Tarjeta" });
    assert.equal(second.end_date, addMonths(first.end_date, 1));
  });

  test("renovar después de vencer empieza hoy", () => {
    const plan = store.listPlans().find((p) => p.months === 1);
    const m = store.createMember({ name: "Volvió Tarde" });
    store.registerPayment(m.id, { planId: plan.id, method: "Efectivo", startDate: "2020-01-01" });
    assert.equal(store.getMember(m.id).status, "vencido");
    const renewed = store.registerPayment(m.id, { planId: plan.id, method: "Efectivo" });
    assert.equal(renewed.end_date, addMonths(todayStr(), 1));
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

  test("la tienda descuenta existencias y no vende más de lo que hay", () => {
    const p = store.createProduct({ name: "Proteína 1 kg", priceCents: 4500, stock: 3 });
    assert.equal(store.sellProduct(p.id, { qty: 2, method: "Efectivo" }).stock, 1);
    assert.throws(() => store.sellProduct(p.id, { qty: 2, method: "Efectivo" }), /Solo quedan 1/);
    assert.equal(
      store.listProducts().find((x) => x.id === p.id).stock,
      1,
      "una venta rechazada no cambia existencias"
    );
    const sales = store.listSales();
    assert.equal(sales.length, 1);
    assert.equal(sales[0].total_cents, 9000);
    assert.equal(store.sellProduct(999999, { qty: 1, method: "Efectivo" }), null);
  });

  test("el resumen y las estadísticas suman membresías y tienda", () => {
    const s = store.summary();
    assert.equal(s.tiendaMes, 9000);
    assert.equal(s.ingresosMes, s.membresiasMes + s.tiendaMes);
    const st = store.stats();
    assert.equal(st.months.length, 6);
    assert.equal(st.months.at(-1).month, todayStr().slice(0, 7));
    assert.equal(st.months.at(-1).shop, 9000);
    assert.equal(st.hours.length, 24);
    assert.ok(st.hours.reduce((a, h) => a + h.n, 0) >= 1);
  });

  test("la copia de seguridad genera una base de datos legible", async () => {
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(tmpdir(), "gym5am-"));
    const file = join(dir, "copia.db");
    store.backupTo(file);
    const copy = createStore(file);
    assert.equal(copy.listMembers().length, store.listMembers().length);
    copy.close();
    await rm(dir, { recursive: true, force: true });
  });

  test("solo se publican las promociones vigentes y los instructores visibles", () => {
    const t = todayStr();
    const live = store.savePromotion(null, {
      title: "Inscripción gratis",
      priceText: "$0",
      endsOn: addDays(t, 10),
    });
    store.savePromotion(null, { title: "Futura", startsOn: addDays(t, 3) });
    store.savePromotion(null, { title: "Pasada", endsOn: addDays(t, -1) });
    store.savePromotion(null, { title: "Oculta", published: false });
    assert.equal(live.state, "vigente");
    const states = Object.fromEntries(store.listPromotions().map((p) => [p.title, p.state]));
    assert.deepEqual(states, {
      "Inscripción gratis": "vigente",
      Futura: "programada",
      Pasada: "terminada",
      Oculta: "oculta",
    });
    assert.throws(
      () => store.savePromotion(null, { title: "X", startsOn: t, endsOn: addDays(t, -2) }),
      /anterior/
    );

    const ana = store.saveInstructor(null, {
      name: "Ana Paredes",
      specialty: "Yoga",
      schedule: "Lun–Vie 5:00",
      bio: "Tel. privado 555",
    });
    store.saveInstructor(null, { name: "Oculto", published: false });
    const pub = store.publicContent();
    assert.deepEqual(
      pub.promotions.map((p) => p.title),
      ["Inscripción gratis"]
    );
    assert.deepEqual(
      pub.instructors.map((i) => i.name),
      ["Ana Paredes"]
    );
    assert.equal(pub.instructors[0].bio, undefined, "la descripción interna no se publica");

    store.saveInstructor(ana.id, { published: false });
    assert.equal(store.publicContent().instructors.length, 0);
    assert.ok(store.archiveInstructor(ana.id));
    assert.ok(!store.listInstructors().some((i) => i.id === ana.id));
    assert.ok(store.deletePromotion(live.id));
  });

  test("importar socios: valida todo y no importa nada si hay errores", () => {
    const before = store.listMembers().length;
    const bad = store.importMembers([
      { name: "Uno", code: "0101", joinedOn: "2024-03-15" },
      { name: "", code: "0102" },
      { name: "Tres", code: "0101" },
      { name: "Cuatro", code: "12", endDate: "2026-02-30" },
      { name: "Cinco", code: "0105", plan: "Platino" },
    ]);
    assert.equal(bad.created, 0);
    assert.deepEqual(
      bad.errors.map((e) => e.row),
      [2, 3, 4, 4, 5]
    );
    assert.equal(
      store.listMembers().length,
      before,
      "una importación con errores no deja registros"
    );

    const ok = store.importMembers([
      {
        name: "Rosa Núñez",
        code: "0201",
        phone: "+52 55 1000 2000",
        joinedOn: "2023-08-01",
        endDate: addDays(todayStr(), 20),
        plan: "mensual",
      },
      { name: "Luis Ortega", code: "0202" },
    ]);
    assert.equal(ok.created, 2);
    const rosa = store.listMembers({ search: "Rosa" })[0];
    assert.equal(rosa.code, "0201", "conserva el cero inicial");
    assert.equal(rosa.joined_on, "2023-08-01");
    assert.equal(rosa.status, "activo");
    assert.equal(rosa.plan_name, "Mensual");
    assert.equal(store.memberDetail(rosa.id).payments.length, 0, "no inventa cobros históricos");
    const luis = store.listMembers({ search: "Luis" })[0];
    assert.equal(luis.status, "sin_pago");
    assert.equal(luis.joined_on, todayStr());
    assert.equal(
      store.importMembers([{ name: "Otra", code: "0201" }]).errors[0].message,
      "El código 0201 ya pertenece a otro socio"
    );
  });

  test("la entrada informa visitas del mes, racha y antigüedad", () => {
    const plan = store.listPlans()[0];
    const m = store.createMember({ name: "Racha Larga", joinedOn: "2025-01-10" });
    store.registerPayment(m.id, { planId: plan.id, method: "Efectivo" });
    const t = todayStr();
    const ins = store.db.prepare("INSERT INTO visits (member_id, day, allowed) VALUES (?, ?, 1)");
    ins.run(m.id, addDays(t, -1));
    ins.run(m.id, addDays(t, -2));
    ins.run(m.id, addDays(t, -4));
    const first = store.checkIn(m.code);
    assert.equal(first.streak, 3);
    assert.equal(first.joinedOn, "2025-01-10");
    const second = store.checkIn(m.code);
    assert.equal(second.streak, 3, "dos entradas el mismo día no alargan la racha");
    assert.equal(second.visitsThisMonth, first.visitsThisMonth, "ni cuentan como dos visitas");
    const denied = store.createMember({ name: "Sin Pago" });
    const r = store.checkIn(denied.code);
    assert.equal(r.allowed, false);
    assert.equal(r.streak, undefined, "a un acceso denegado no se le muestran estadísticas");
  });

  test("ranking de rachas y frases motivadoras", () => {
    const t = todayStr();
    const plan = store.listPlans()[0];
    const ins = store.db.prepare("INSERT INTO visits (member_id, day, allowed) VALUES (?, ?, ?)");
    const mk = (name, days, allowed = 1) => {
      const m = store.createMember({ name });
      store.registerPayment(m.id, { planId: plan.id, method: "Efectivo" });
      days.forEach((d) => ins.run(m.id, addDays(t, d), allowed));
      return m;
    };
    mk("Zoe Constante Uno", [0, -1, -2, -3, -4]);
    mk("Yago Ayer Dos", [-1, -2, -3]);
    mk("Xime Rota Tres", [0, -2, -3]);
    mk("Walter Denegado", [0, -1, -2], 0);
    const board = store.streakBoard();
    const byName = Object.fromEntries(board.map((m) => [m.name, m]));
    assert.equal(byName["Zoe Constante Uno"].streak, 5);
    assert.equal(byName["Zoe Constante Uno"].cameToday, true);
    assert.equal(byName["Yago Ayer Dos"].streak, 3, "una racha que termina ayer sigue viva");
    assert.equal(
      byName["Xime Rota Tres"],
      undefined,
      "un día sin venir rompe la racha; 1 día no entra al ranking"
    );
    assert.equal(byName["Walter Denegado"], undefined, "las entradas denegadas no cuentan");
    const zoeIdx = board.findIndex((m) => m.name === "Zoe Constante Uno");
    const yagoIdx = board.findIndex((m) => m.name === "Yago Ayer Dos");
    assert.ok(zoeIdx < yagoIdx, "ordenado de mayor a menor");

    const pub = store.publicContent();
    assert.ok(
      pub.streaks.some((m) => m.name === "Zoe C." && m.streak === 5),
      "en público solo nombre e inicial"
    );
    assert.ok(!JSON.stringify(pub.streaks).includes("Constante Uno"));
    store.updateSettings({ showStreaks: "0" });
    assert.deepEqual(store.publicContent().streaks, []);
    store.updateSettings({ showStreaks: "1" });

    const phrases = store.listPhrases();
    assert.ok(phrases.length >= 20, "trae frases iniciales");
    const added = store.savePhrase(null, { text: "Hoy también cuenta." });
    store.savePhrase(phrases[0].id, { active: false });
    const pubPhrases = store.publicContent().phrases;
    assert.ok(pubPhrases.includes("Hoy también cuenta."));
    assert.ok(!pubPhrases.includes(phrases[0].text), "las frases desactivadas no se muestran");
    assert.ok(store.deletePhrase(added.id));
  });

  test("la contraseña se guarda con hash y el código especial nunca choca con un socio", () => {
    store.setPassword("Gym5am!2026");
    assert.ok(store.checkPassword("Gym5am!2026"));
    assert.ok(!store.checkPassword("gym5am!2026"));
    const raw = store.db.prepare("SELECT value FROM settings WHERE key = 'adminPin'").get().value;
    assert.ok(!raw.includes("Gym5am"));

    store.setAdminCode("909090");
    assert.ok(store.isAdminCode("909090"));
    assert.equal(
      store.getSettings().adminCode,
      undefined,
      "el código especial no sale en los ajustes"
    );
    assert.equal(store.getSettings().adminPin, undefined);
    assert.throws(() => store.createMember({ name: "Choque", code: "909090" }), /en uso/);
    assert.match(
      store.importMembers([{ name: "Choque", code: "909090" }]).errors[0].message,
      /reservado/
    );
    const m = store.createMember({ name: "Dueña del código", code: "818181" });
    assert.throws(() => store.setAdminCode("818181"), /lo usa un socio/);
    assert.ok(store.archiveMember(m.id));
  });
});

describe("API HTTP", () => {
  let server;
  let base;
  let store;
  // Mini "navegador": guarda las cookies que envía el servidor (sesión y pase de acceso).
  const jar = new Map();
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const ADMIN_CODE = "246810";
  const PASSWORD = "Wellness5am";

  const call = async (path, { method = "GET", body, auth = true } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(auth && jar.size ? { Cookie: cookieHeader() } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const [k, v] = [pair.slice(0, i), pair.slice(i + 1)];
      if (v) jar.set(k, v);
      else jar.delete(k);
    }
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
    store.setPassword(PASSWORD);
    store.setAdminCode(ADMIN_CODE);
    server = createServer(createApp({ store }));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    await new Promise((r) => server.close(r));
    store.close();
  });

  test("el endpoint de salud responde sin sesión", async () => {
    const r = await call("/api/health", { auth: false });
    assert.equal(r.status, 200);
    assert.deepEqual(r.data, { ok: true });
  });

  test("las rutas de administración exigen sesión", async () => {
    assert.equal((await call("/api/admin/members", { auth: false })).status, 401);
  });

  test("acceso en dos pasos: sin el código especial no se puede ni intentar la contraseña", async () => {
    let s = await call("/api/admin/session");
    assert.deepEqual(s.data, { authenticated: false, ticket: false });
    const direct = await call("/api/admin/login", { method: "POST", body: { password: PASSWORD } });
    assert.equal(direct.status, 403, "la contraseña correcta sola no basta");
    assert.ok(!jar.has("sid"));

    const visitsBefore = store.listVisits().length;
    const code = await call("/api/checkin", { method: "POST", body: { code: ADMIN_CODE } });
    assert.equal(code.status, 200);
    assert.deepEqual(code.data, { admin: true }, "no revela nada más");
    assert.ok(jar.has("aticket"));
    assert.equal(
      store.listVisits().length,
      visitsBefore,
      "el código especial no registra una entrada"
    );
    s = await call("/api/admin/session");
    assert.deepEqual(s.data, { authenticated: false, ticket: true });

    const wrong = await call("/api/admin/login", {
      method: "POST",
      body: { password: "otra-cosa" },
    });
    assert.equal(wrong.status, 401);
    const ok = await call("/api/admin/login", { method: "POST", body: { password: PASSWORD } });
    assert.equal(ok.status, 200);
    assert.ok(jar.has("sid"));
    assert.ok(!jar.has("aticket"), "el pase se consume al entrar");
    assert.equal((await call("/api/admin/members")).status, 200);

    // El pase es de un solo uso: reenviar uno ya usado no permite volver a intentar la contraseña.
    await call("/api/admin/logout", { method: "POST", body: {} });
    jar.set("aticket", "pase-viejo-o-inventado");
    assert.equal(
      (await call("/api/admin/login", { method: "POST", body: { password: PASSWORD } })).status,
      403
    );
    jar.delete("aticket");
  });

  const loginAdmin = async () => {
    await call("/api/checkin", { method: "POST", body: { code: ADMIN_CODE } });
    const r = await call("/api/admin/login", { method: "POST", body: { password: PASSWORD } });
    assert.equal(r.status, 200);
  };

  test("cambiar contraseña y código especial", async () => {
    await loginAdmin();
    assert.equal(
      (
        await call("/api/admin/password", {
          method: "POST",
          body: { current: "mala", next: "NuevaClave1" },
        })
      ).status,
      401
    );
    assert.equal(
      (
        await call("/api/admin/password", {
          method: "POST",
          body: { current: PASSWORD, next: "corta" },
        })
      ).status,
      400
    );
    assert.equal(
      (await call("/api/admin/code", { method: "POST", body: { password: PASSWORD, code: "12" } }))
        .status,
      400
    );
    const changed = await call("/api/admin/code", {
      method: "POST",
      body: { password: PASSWORD, code: "551155" },
    });
    assert.equal(changed.status, 200);
    assert.ok(store.isAdminCode("551155"));
    store.setAdminCode(ADMIN_CODE);
  });

  test("flujo completo: login, alta con cobro, entrada, aviso y exportación", async () => {
    await loginAdmin();

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

  test("tienda por HTTP: alta, venta y existencias insuficientes", async () => {
    const p = await call("/api/admin/products", {
      method: "POST",
      body: { name: "Agua 600 ml", price: "1.5", stock: 2 },
    });
    assert.equal(p.status, 200);
    assert.equal(p.data.price_cents, 150);
    const sold = await call(`/api/admin/products/${p.data.id}/sell`, {
      method: "POST",
      body: { qty: 2, method: "Tarjeta" },
    });
    assert.equal(sold.data.stock, 0);
    const over = await call(`/api/admin/products/${p.data.id}/sell`, {
      method: "POST",
      body: { qty: 1, method: "Tarjeta" },
    });
    assert.equal(over.status, 409);
    assert.equal(
      (
        await call(`/api/admin/products/${p.data.id}/sell`, {
          method: "POST",
          body: { qty: 0, method: "Tarjeta" },
        })
      ).status,
      400
    );
    assert.equal((await call("/api/admin/products", { auth: false })).status, 401);
    const stats = await call("/api/admin/stats");
    assert.equal(stats.data.months.at(-1).shop, 300);
  });

  test("promociones e instructores por HTTP y en la pantalla de entrada", async () => {
    assert.equal((await call("/api/admin/promotions", { auth: false })).status, 401);
    const promo = await call("/api/admin/promotions", {
      method: "POST",
      body: { title: "2×1 en noviembre", description: "Trae a un amigo", priceText: "2×1" },
    });
    assert.equal(promo.status, 200);
    assert.equal(promo.data.state, "vigente");
    const coach = await call("/api/admin/instructors", {
      method: "POST",
      body: {
        name: "Carlos Rivera",
        specialty: "Fuerza",
        schedule: "5:00–9:00",
        bio: "nota interna",
      },
    });
    assert.equal(coach.status, 200);
    let kiosk = await call("/api/kiosk", { auth: false });
    assert.ok(kiosk.data.promotions.some((p) => p.title === "2×1 en noviembre"));
    assert.ok(
      kiosk.data.instructors.some((i) => i.name === "Carlos Rivera" && i.bio === undefined)
    );

    await call(`/api/admin/promotions/${promo.data.id}`, {
      method: "PATCH",
      body: { published: false },
    });
    kiosk = await call("/api/kiosk", { auth: false });
    assert.ok(!kiosk.data.promotions.some((p) => p.id === promo.data.id));

    assert.equal(
      (await call("/api/admin/promotions", { method: "POST", body: { title: "" } })).status,
      400
    );
    assert.equal(
      (
        await call("/api/admin/promotions", {
          method: "POST",
          body: { title: "X", endsOn: "2026-02-30" },
        })
      ).status,
      400
    );
    assert.equal((await call("/api/admin/instructors/99999", { method: "DELETE" })).status, 404);
  });

  test("importación por HTTP: devuelve los errores por fila", async () => {
    const bad = await call("/api/admin/import", {
      method: "POST",
      body: { rows: [{ name: "X", code: "1" }] },
    });
    assert.equal(bad.status, 422);
    assert.equal(bad.data.details[0].row, 1);
    const ok = await call("/api/admin/import", {
      method: "POST",
      body: { rows: [{ name: "Importado Uno", code: "07001", joinedOn: "2024-01-15" }] },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.created, 1);
    const tpl = await call("/api/admin/import/plantilla.csv");
    assert.match(tpl.data, /Fecha de inscripción/);
    assert.equal(
      (await call("/api/admin/import", { method: "POST", body: { rows: [] } })).status,
      400
    );
    assert.equal(
      (
        await call("/api/admin/members", {
          method: "POST",
          body: { name: "Futuro", joinedOn: "2999-01-01" },
        })
      ).status,
      400
    );
  });

  test("motivación por HTTP: frases y rachas", async () => {
    assert.equal((await call("/api/admin/phrases", { auth: false })).status, 401);
    const added = await call("/api/admin/phrases", {
      method: "POST",
      body: { text: "A las 5AM se construye el día." },
    });
    assert.equal(added.status, 200);
    assert.equal(
      (await call("/api/admin/phrases", { method: "POST", body: { text: "" } })).status,
      400
    );
    let kiosk = await call("/api/kiosk", { auth: false });
    assert.ok(kiosk.data.phrases.includes("A las 5AM se construye el día."));
    assert.ok(Array.isArray(kiosk.data.streaks));
    await call(`/api/admin/phrases/${added.data.id}`, { method: "PATCH", body: { active: false } });
    kiosk = await call("/api/kiosk", { auth: false });
    assert.ok(!kiosk.data.phrases.includes("A las 5AM se construye el día."));
    const streaks = await call("/api/admin/streaks");
    assert.equal(streaks.status, 200);
    const off = await call("/api/admin/settings", { method: "PUT", body: { showStreaks: false } });
    assert.equal(off.data.settings.showStreaks, "0");
    assert.equal(
      (await call(`/api/admin/phrases/${added.data.id}`, { method: "DELETE" })).status,
      200
    );
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
    // (también protege el código especial frente a quien intente adivinarlo)
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

describe("bloqueo por contraseñas incorrectas", () => {
  test("5 fallos bloquean el acceso aunque luego se escriba la contraseña correcta", async () => {
    const store = createStore(":memory:");
    store.setPassword("Correcta123");
    store.setAdminCode("123987");
    const server = createServer(createApp({ store }));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = async (path, body, cookie = "") => {
      const res = await fetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify(body),
      });
      const ticket = res.headers.getSetCookie().find((c) => c.startsWith("aticket="));
      return { status: res.status, ticket: ticket ? ticket.split(";")[0] : "" };
    };
    try {
      const { ticket } = await post("/api/checkin", { code: "123987" });
      assert.ok(ticket);
      for (let i = 0; i < 5; i++) {
        assert.equal(
          (await post("/api/admin/login", { password: `mala-${i}` }, ticket)).status,
          401
        );
      }
      assert.equal(
        (await post("/api/admin/login", { password: "Correcta123" }, ticket)).status,
        429
      );
    } finally {
      await new Promise((r) => server.close(r));
      store.close();
    }
  });
});
