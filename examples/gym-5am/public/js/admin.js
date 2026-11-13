/* Panel de administración de Wellness Fitness 5AM (JavaScript sin dependencias). */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const state = { tab: "resumen", meta: null, filter: "all", search: "", month: null, day: null };

  // ---------- API ----------
  async function api(path, { method = "GET", body } = {}) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== "/api/admin/login" && path !== "/api/admin/pin") {
      showLogin();
      throw new Error("Sesión expirada");
    }
    if (!res.ok) {
      const err = new Error(data.error || "Error inesperado");
      err.details = data.details;
      throw err;
    }
    return data;
  }

  // ---------- Utilidades de formato ----------
  const money = (cents) => {
    const cur = state.meta?.settings.currency ?? "$";
    const n = (cents || 0) / 100;
    return `${cur}${n.toLocaleString("es", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  };
  const fmtDate = (s, opts = { day: "numeric", month: "short", year: "numeric" }) =>
    s ? new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString("es", opts) : "—";
  const fmtTime = (s) => (s ? s.slice(11, 16) : "");
  const fmtDateTime = (s) =>
    s ? `${fmtDate(s, { day: "numeric", month: "short" })} · ${fmtTime(s)}` : "—";
  const STATUS = {
    activo: "Activo",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    sin_pago: "Sin pago",
  };
  const pill = (m) => `<span class="pill pill--${m.status}">${STATUS[m.status]}</span>`;
  // Antigüedad legible: "3 meses", "1 año", "2 años y 4 meses".
  const tenure = (from, to = state.meta?.today) => {
    if (!from || !to) return "";
    const [y1, m1, d1] = from.split("-").map(Number);
    const [y2, m2, d2] = to.split("-").map(Number);
    let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
    if (months < 1) return "menos de 1 mes";
    const y = Math.floor(months / 12);
    months %= 12;
    const ys = y ? `${y} ${y === 1 ? "año" : "años"}` : "";
    const ms = months ? `${months} ${months === 1 ? "mes" : "meses"}` : "";
    return [ys, ms].filter(Boolean).join(" y ");
  };
  const daysText = (m) => {
    if (m.daysLeft === null || m.daysLeft === undefined) return "";
    if (m.daysLeft === 0) return "vence hoy";
    if (m.daysLeft > 0) return `faltan ${m.daysLeft} ${m.daysLeft === 1 ? "día" : "días"}`;
    const d = -m.daysLeft;
    return `venció hace ${d} ${d === 1 ? "día" : "días"}`;
  };

  // Fechas en el cliente (solo para la vista previa; el servidor hace el cálculo real).
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const parse = (s) => s.split("-").map(Number);
  const addDays = (s, n) => {
    const [y, m, d] = parse(s);
    return ymd(new Date(Date.UTC(y, m - 1, d + n)));
  };
  const addMonths = (s, n) => {
    const [y, m, d] = parse(s);
    const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
    return ymd(new Date(Date.UTC(y, m - 1 + n, Math.min(d, last))));
  };
  const periodFor = (member, plan, startDate) => {
    const today = state.meta.today;
    let start = startDate || today;
    if (!startDate && member?.end_date && member.end_date >= today) start = member.end_date;
    return { start, end: addMonths(start, plan.months) };
  };

  // ---------- WhatsApp ----------
  const waPhone = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (phone.trim().startsWith("+")) return digits;
    const cc = state.meta?.settings.countryCode || "";
    return cc && !digits.startsWith(cc) ? cc + digits : digits;
  };
  const waLink = (phone, text) => {
    const p = waPhone(phone);
    return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : "";
  };
  const reminderText = (m) => {
    const s = state.meta.settings;
    const estado = m.daysLeft < 0 ? "venció" : m.daysLeft === 0 ? "vence hoy," : "vence";
    return s.reminderTemplate
      .replaceAll("{nombre}", m.name.split(/\s+/)[0])
      .replaceAll("{gimnasio}", s.gymName)
      .replaceAll("{fecha}", fmtDate(m.end_date, { day: "numeric", month: "long" }))
      .replaceAll("{estado}", estado)
      .replaceAll("{dias}", daysText(m))
      .replaceAll("{codigo}", m.code);
  };
  const codeText = (m) =>
    `Hola ${m.name.split(/\s+/)[0]}, bienvenido/a a ${state.meta.settings.gymName}. Tu código de acceso es: ${m.code}. Escríbelo en la pantalla de entrada cada vez que vengas. ¡Nos vemos a las 5AM!`;

  // ---------- Toast ----------
  let toastTimer;
  const toast = (msg, error = false) => {
    const t = $("[data-toast]");
    t.textContent = msg;
    t.classList.toggle("toast--error", error);
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 3200);
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copiado al portapapeles");
    } catch {
      toast("No se pudo copiar", true);
    }
  };

  // ---------- Modal ----------
  const modal = $("[data-modal]");
  const openModal = (html) => {
    $("[data-modal-body]").innerHTML = html;
    if (!modal.open) modal.showModal();
    const first = $("input:not([type=hidden]):not([type=checkbox]), select", modal);
    if (first) first.focus();
  };
  const closeModal = () => modal.open && modal.close();
  $("[data-close]").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => e.target === modal && closeModal());

  // ---------- Vistas: login / app ----------
  function showLogin() {
    $("[data-view=app]").hidden = true;
    $("[data-view=login]").hidden = false;
    closeModal();
    setTimeout(() => $("#pin").focus(), 50);
  }
  async function showApp() {
    state.meta = await api("/api/admin/meta");
    state.month = state.meta.today.slice(0, 7);
    state.day = state.meta.today;
    $("[data-view=login]").hidden = true;
    $("[data-view=app]").hidden = false;
    $("[data-today]").textContent = fmtDate(state.meta.today, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    render();
  }

  $("[data-login]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-login-error]");
    err.textContent = "";
    try {
      await api("/api/admin/login", { method: "POST", body: { pin: e.target.pin.value } });
      e.target.reset();
      await showApp();
    } catch (ex) {
      err.textContent = ex.message;
    }
  });

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST", body: {} }).catch(() => {});
    showLogin();
  };
  $("[data-logout]").addEventListener("click", logout);

  // ---------- Navegación ----------
  const TITLES = {
    resumen: "Resumen",
    socios: "Socios",
    cobros: "Cobros",
    tienda: "Tienda",
    promociones: "Promociones",
    instructores: "Instructores",
    motivacion: "Motivación",
    avisos: "Avisos",
    entradas: "Entradas",
    ajustes: "Ajustes",
  };
  const go = (tab) => {
    state.tab = tab;
    $$("[data-tab]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.tab === tab);
      b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false");
    });
    $("[data-title]").textContent = TITLES[tab];
    render();
  };
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));

  const panel = $("[data-panel]");
  async function render() {
    try {
      await VIEWS[state.tab]();
      updateBadge();
    } catch (e) {
      if (e.message !== "Sesión expirada") toast(e.message, true);
    }
  }
  async function updateBadge() {
    const list = await api("/api/admin/reminders").catch(() => []);
    const pending = list.filter((m) => !m.reminder_sent_at).length;
    const b = $("[data-reminders-badge]");
    b.hidden = !pending;
    b.textContent = pending;
  }

  // ---------- Fila de socio reutilizable ----------
  const memberRow = (m) => `
    <tr>
      <td><span class="code">${esc(m.code)}</span></td>
      <td><button class="link" data-action="detail" data-id="${m.id}">${esc(m.name)}</button>
        <div class="muted">${esc(m.phone || "")}</div></td>
      <td>${esc(m.plan_name || "—")}</td>
      <td>${fmtDate(m.end_date)}<div class="muted">${daysText(m)}</div></td>
      <td>${pill(m)}</td>
      <td>${m.joined_on ? esc(tenure(m.joined_on)) : "—"}<div class="muted">${m.joined_on ? `desde ${fmtDate(m.joined_on, { month: "short", year: "numeric" })}` : ""}</div></td>
      <td class="muted">${m.last_visit ? fmtDateTime(m.last_visit) : "—"}</td>
      <td><div class="row-actions">
        <button class="btn btn--sm btn--lime" data-action="pay" data-id="${m.id}">Cobrar</button>
        <button class="btn btn--sm" data-action="detail" data-id="${m.id}">Ver</button>
      </div></td>
    </tr>`;
  const membersTable = (rows) =>
    rows.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Código</th><th>Socio</th><th>Plan</th><th>Vence</th><th>Estado</th><th>Antigüedad</th><th>Última entrada</th><th></th></tr></thead>
          <tbody>${rows.map(memberRow).join("")}</tbody></table></div>`
      : `<p class="empty">No hay socios que mostrar.</p>`;

  // ---------- Gráficas (HTML/CSS, sin librerías) ----------
  const monthLabel = (key) => fmtDate(`${key}-01`, { month: "short" }).replace(".", "");
  const PLOT = 150; // alto del área de barras en px
  function incomeChart(months) {
    const max = Math.max(...months.map((m) => m.memberships + m.shop), 1);
    const px = (v) => (v ? Math.max(Math.round((v / max) * PLOT), 3) : 0);
    return `
      <div class="bars" role="img" aria-label="Ingresos por mes, membresías y tienda">
        ${months
          .map((m) => {
            const total = m.memberships + m.shop;
            return `<div class="bars__col" tabindex="0">
              <span class="bars__val">${total ? money(total) : ""}</span>
              <div class="bars__stack">
                ${m.shop ? `<span class="bars__seg bars__seg--2" style="height:${px(m.shop)}px"></span>` : ""}
                ${m.memberships ? `<span class="bars__seg bars__seg--1" style="height:${px(m.memberships)}px"></span>` : ""}
                ${total ? "" : `<span class="bars__zero"></span>`}
              </div>
              <span class="bars__x">${esc(monthLabel(m.month))}</span>
              <div class="viz__tip"><strong>${esc(fmtDate(`${m.month}-01`, { month: "long", year: "numeric" }))}</strong>
                <span><i class="viz__sw viz__sw--1"></i>Membresías ${money(m.memberships)}</span>
                <span><i class="viz__sw viz__sw--2"></i>Tienda ${money(m.shop)}</span>
                <span>Total ${money(total)}</span></div>
            </div>`;
          })
          .join("")}
      </div>
      <table class="sr-only"><caption>Ingresos por mes</caption><thead><tr><th>Mes</th><th>Membresías</th><th>Tienda</th></tr></thead>
        <tbody>${months.map((m) => `<tr><td>${esc(m.month)}</td><td>${money(m.memberships)}</td><td>${money(m.shop)}</td></tr>`).join("")}</tbody></table>`;
  }
  function hoursChart(hours) {
    const open = hours.filter((h) => h.hour >= 5 && h.hour <= 22);
    const max = Math.max(...open.map((h) => h.n), 1);
    const peak = open.reduce((a, h) => (h.n > a.n ? h : a), open[0]);
    return `
      <div class="bars bars--thin" role="img" aria-label="Entradas permitidas por hora">
        ${open
          .map(
            (h) => `<div class="bars__col" tabindex="0">
              <span class="bars__val">${h.n && h.hour === peak.hour ? h.n : ""}</span>
              <div class="bars__stack">${
                h.n
                  ? `<span class="bars__seg bars__seg--1" style="height:${Math.max(Math.round((h.n / max) * PLOT), 3)}px"></span>`
                  : `<span class="bars__zero"></span>`
              }</div>
              <span class="bars__x">${h.hour % 3 === 2 ? `${h.hour}h` : ""}</span>
              <div class="viz__tip"><strong>${h.hour}:00–${h.hour}:59</strong><span>${h.n} ${h.n === 1 ? "entrada" : "entradas"}</span></div>
            </div>`
          )
          .join("")}
      </div>
      <table class="sr-only"><caption>Entradas por hora</caption><thead><tr><th>Hora</th><th>Entradas</th></tr></thead>
        <tbody>${open.map((h) => `<tr><td>${h.hour}:00</td><td>${h.n}</td></tr>`).join("")}</tbody></table>`;
  }

  const receiptText = (m, p) =>
    `Hola ${m.name.split(/\s+/)[0]}, recibimos tu pago de ${money(p.amount_cents)} (${p.plan_name}, ${p.method.toLowerCase()}) en ${state.meta.settings.gymName}. Tu mensualidad queda activa del ${fmtDate(p.period_start, { day: "numeric", month: "long" })} al ${fmtDate(p.period_end, { day: "numeric", month: "long", year: "numeric" })}. ¡Gracias y nos vemos a las 5AM!`;

  function receiptModal(m, p) {
    const text = receiptText(m, p);
    const link = waLink(m.phone, text);
    openModal(`
      <h2>Cobro registrado</h2>
      <div class="receipt">
        <div class="receipt__row"><span>Socio</span><strong>${esc(m.name)}</strong></div>
        <div class="receipt__row"><span>Plan</span><strong>${esc(p.plan_name)}</strong></div>
        <div class="receipt__row"><span>Método</span><strong>${esc(p.method)}</strong></div>
        <div class="receipt__row"><span>Periodo</span><strong>${fmtDate(p.period_start)} → ${fmtDate(p.period_end)}</strong></div>
        <div class="receipt__row receipt__row--total"><span>Total cobrado</span><strong>${money(p.amount_cents)}</strong></div>
      </div>
      <p class="preview">Activo/a hasta el <strong>${fmtDate(m.end_date, { day: "numeric", month: "long", year: "numeric" })}</strong></p>
      <div class="modal__foot">
        <button type="button" class="btn" data-copy="${esc(text)}">Copiar recibo</button>
        ${link ? `<a class="btn wa" href="${esc(link)}" target="_blank" rel="noopener">Enviar recibo por WhatsApp</a>` : ""}
        <button type="button" class="btn btn--lime" data-close-modal>Listo</button>
      </div>`);
  }

  const PROMO_STATE = {
    vigente: ["pill--activo", "Publicada"],
    programada: ["pill--por_vencer", "Programada"],
    terminada: ["pill--sin_pago", "Terminada"],
    oculta: ["pill--sin_pago", "Oculta"],
  };
  const promoPill = (p) =>
    `<span class="pill ${PROMO_STATE[p.state][0]}">${PROMO_STATE[p.state][1]}</span>`;
  const promoDates = (p) => {
    const f = (d) => fmtDate(d, { day: "numeric", month: "short" });
    if (p.starts_on && p.ends_on) return `Del ${f(p.starts_on)} al ${f(p.ends_on)}`;
    if (p.ends_on) return `Hasta el ${f(p.ends_on)}`;
    if (p.starts_on) return `Desde el ${f(p.starts_on)}`;
    return "Sin fecha de fin";
  };

  function promoModal(p) {
    openModal(`
      <h2>${p ? "Editar promoción" : "Nueva promoción"}</h2>
      <form data-promo class="stack">
        <div class="form-grid">
          <label class="field full"><span>Título</span><input name="title" required maxlength="80" value="${esc(p?.title || "")}" placeholder="Ej. Inscripción gratis en noviembre" autocomplete="off" /></label>
          <label class="field full"><span>Descripción</span><textarea name="description" maxlength="300" rows="3" placeholder="Qué incluye y cómo aprovecharla">${esc(p?.description || "")}</textarea></label>
          <label class="field"><span>Precio o descuento (opcional)</span><input name="priceText" maxlength="40" value="${esc(p?.price_text || "")}" placeholder="Ej. $449 o 2×1" /></label>
          <span></span>
          <label class="field"><span>Empieza (opcional)</span><input name="startsOn" type="date" value="${esc(p?.starts_on || "")}" /></label>
          <label class="field"><span>Termina (opcional)</span><input name="endsOn" type="date" value="${esc(p?.ends_on || "")}" /></label>
        </div>
        <label class="check"><input type="checkbox" name="published" ${!p || p.published ? "checked" : ""} /> Publicar en la pantalla de entrada</label>
        <p class="hint">Se muestra a los socios solo mientras esté publicada y dentro de sus fechas.</p>
        <div class="modal__foot">
          ${p ? `<button type="button" class="btn btn--danger" data-action="del-promo" data-id="${p.id}" style="margin-right:auto">Eliminar</button>` : ""}
          <button type="button" class="btn" data-close-modal>Cancelar</button>
          <button class="btn btn--lime" type="submit">Guardar</button></div>
      </form>`);
    $("[data-promo]", modal).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const body = {
          title: f.title.value,
          description: f.description.value,
          priceText: f.priceText.value,
          startsOn: f.startsOn.value || null,
          endsOn: f.endsOn.value || null,
          published: f.published.checked,
        };
        await api(p ? `/api/admin/promotions/${p.id}` : "/api/admin/promotions", {
          method: p ? "PATCH" : "POST",
          body,
        });
        closeModal();
        toast(body.published ? "Promoción guardada y publicada" : "Promoción guardada (oculta)");
        render();
      } catch (ex) {
        toast(ex.message, true);
      }
    });
  }

  function instructorModal(i) {
    openModal(`
      <h2>${i ? "Editar instructor" : "Nuevo instructor"}</h2>
      <form data-instructor class="stack">
        <div class="form-grid">
          <label class="field full"><span>Nombre</span><input name="name" required maxlength="60" value="${esc(i?.name || "")}" autocomplete="off" /></label>
          <label class="field"><span>Especialidad</span><input name="specialty" maxlength="60" value="${esc(i?.specialty || "")}" placeholder="Ej. Fuerza, Yoga, Cycling" /></label>
          <label class="field"><span>Horario</span><input name="schedule" maxlength="120" value="${esc(i?.schedule || "")}" placeholder="Ej. Lun a Vie 5:00–9:00" /></label>
          <label class="field full"><span>Descripción (solo la ve el dueño)</span><textarea name="bio" maxlength="300" rows="3" placeholder="Certificaciones, experiencia, contacto…">${esc(i?.bio || "")}</textarea></label>
        </div>
        <label class="check"><input type="checkbox" name="published" ${!i || i.published ? "checked" : ""} /> Mostrar en la pantalla de entrada</label>
        <div class="modal__foot">
          ${i ? `<button type="button" class="btn btn--danger" data-action="del-instructor" data-id="${i.id}" style="margin-right:auto">Eliminar</button>` : ""}
          <button type="button" class="btn" data-close-modal>Cancelar</button>
          <button class="btn btn--lime" type="submit">Guardar</button></div>
      </form>`);
    $("[data-instructor]", modal).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const body = {
          name: f.name.value,
          specialty: f.specialty.value,
          schedule: f.schedule.value,
          bio: f.bio.value,
          published: f.published.checked,
        };
        await api(i ? `/api/admin/instructors/${i.id}` : "/api/admin/instructors", {
          method: i ? "PATCH" : "POST",
          body,
        });
        closeModal();
        toast("Instructor guardado");
        render();
      } catch (ex) {
        toast(ex.message, true);
      }
    });
  }

  const initials = (name) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

  function productModal(p) {
    openModal(`
      <h2>${p ? "Editar producto" : "Nuevo producto"}</h2>
      <form data-product class="stack">
        <div class="form-grid">
          <label class="field full"><span>Nombre</span><input name="name" required maxlength="60" value="${esc(p?.name || "")}" autocomplete="off" /></label>
          <label class="field"><span>Precio</span><input name="price" type="number" min="0" step="0.01" required value="${p ? p.price_cents / 100 : ""}" /></label>
          <label class="field"><span>Existencias</span><input name="stock" type="number" min="0" step="1" required value="${p ? p.stock : 0}" /></label>
        </div>
        <div class="modal__foot">
          ${p ? `<button type="button" class="btn btn--danger" data-action="del-product" data-id="${p.id}" style="margin-right:auto">Eliminar</button>` : ""}
          <button type="button" class="btn" data-close-modal>Cancelar</button>
          <button class="btn btn--lime" type="submit">Guardar</button></div>
      </form>`);
    $("[data-product]", modal).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const body = { name: f.name.value, price: f.price.value, stock: f.stock.value };
        await api(p ? `/api/admin/products/${p.id}` : "/api/admin/products", {
          method: p ? "PATCH" : "POST",
          body,
        });
        closeModal();
        toast("Producto guardado");
        render();
      } catch (ex) {
        toast(ex.message, true);
      }
    });
  }

  function sellModal(p) {
    openModal(`
      <h2>Vender</h2>
      <div class="detail-head"><div><p><strong>${esc(p.name)}</strong></p><p class="muted" style="font-size:14px">${money(p.price_cents)} c/u · ${p.stock} en existencia</p></div></div>
      <form data-sell class="stack">
        <div class="form-grid">
          <label class="field"><span>Cantidad</span><input name="qty" type="number" min="1" max="${p.stock}" step="1" value="1" required /></label>
          <label class="field"><span>Método de pago</span><select name="method">${methodOptions()}</select></label>
        </div>
        <p class="preview" data-sell-total></p>
        <div class="modal__foot"><button type="button" class="btn" data-close-modal>Cancelar</button>
          <button class="btn btn--lime" type="submit">Registrar venta</button></div>
      </form>`);
    const form = $("[data-sell]", modal);
    const upd = () =>
      ($("[data-sell-total]", form).innerHTML =
        `Total: <strong>${money(p.price_cents * (Number(form.qty.value) || 0))}</strong>`);
    form.qty.addEventListener("input", upd);
    upd();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api(`/api/admin/products/${p.id}/sell`, {
          method: "POST",
          body: { qty: form.qty.value, method: form.method.value },
        });
        closeModal();
        toast(`Venta registrada: ${form.qty.value} × ${p.name}`);
        render();
      } catch (ex) {
        toast(ex.message, true);
      }
    });
  }

  // ---------- Vistas ----------
  const VIEWS = {
    async resumen() {
      const [s, rem, visits, st] = await Promise.all([
        api("/api/admin/summary"),
        api("/api/admin/reminders"),
        api(`/api/admin/visits?day=${state.meta.today}`),
        api("/api/admin/stats"),
      ]);
      panel.innerHTML = `
        <div class="kpis">
          <button class="kpi kpi--feature" data-goto="cobros"><span class="kpi__label">Ingresos del mes</span><span class="kpi__value">${money(s.ingresosMes)}</span><span class="kpi__sub">Membresías ${money(s.membresiasMes)} · Tienda ${money(s.tiendaMes)}</span></button>
          <button class="kpi kpi--lime" data-goto="socios" data-filter="activo"><span class="kpi__label">Activos</span><span class="kpi__value">${s.activos}</span></button>
          <button class="kpi kpi--amber" data-goto="socios" data-filter="por_vencer"><span class="kpi__label">Por vencer</span><span class="kpi__value">${s.porVencer}</span></button>
          <button class="kpi kpi--red" data-goto="socios" data-filter="vencido"><span class="kpi__label">Vencidos</span><span class="kpi__value">${s.vencidos}</span></button>
          <button class="kpi" data-goto="entradas"><span class="kpi__label">Entradas hoy</span><span class="kpi__value">${s.entradasHoy}</span></button>
        </div>
        <div class="grid-2 viz-row">
          <div class="card viz"><div class="card__head"><h2>Ingresos de los últimos 6 meses</h2>
            <ul class="viz__legend"><li><i class="viz__sw viz__sw--1"></i>Membresías</li><li><i class="viz__sw viz__sw--2"></i>Tienda</li></ul></div>
            <div class="card__body">${incomeChart(st.months)}</div></div>
          <div class="card viz"><div class="card__head"><h2>Entradas de hoy por hora</h2><span class="muted">${s.entradasHoy} en total</span></div>
            <div class="card__body">${hoursChart(st.hours)}</div></div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card__head"><h2>Vencimientos próximos</h2><button class="btn btn--sm" data-goto="avisos">Ver avisos</button></div>
            ${
              rem.length
                ? `<ul class="list">${rem
                    .slice(0, 8)
                    .map(
                      (
                        m
                      ) => `<li><div class="list__main"><p><button class="link" data-action="detail" data-id="${m.id}">${esc(m.name)}</button></p>
                        <p class="list__sub">${fmtDate(m.end_date)} · ${daysText(m)}</p></div>
                        <div class="row-actions">${pill(m)}<button class="btn btn--sm btn--lime" data-action="pay" data-id="${m.id}">Cobrar</button></div></li>`
                    )
                    .join("")}</ul>`
                : `<p class="empty">Ningún socio vence en los próximos días.</p>`
            }
          </div>
          <div class="card">
            <div class="card__head"><h2>Entradas de hoy</h2><span class="muted">${visits.length} registros</span></div>
            ${
              visits.length
                ? `<ul class="list">${visits
                    .slice(0, 8)
                    .map(
                      (
                        v
                      ) => `<li><div class="list__main"><p>${esc(v.name)}</p><p class="list__sub">${fmtTime(v.at)} · código ${esc(v.code)}</p></div>
                        <span class="pill ${v.allowed ? "pill--activo" : "pill--vencido"}">${v.allowed ? "Permitida" : "Denegada"}</span></li>`
                    )
                    .join("")}</ul>`
                : `<p class="empty">Todavía no hay entradas hoy.</p>`
            }
          </div>
        </div>`;
    },

    async socios() {
      const filters = [
        ["all", "Todos"],
        ["activo", "Activos"],
        ["por_vencer", "Por vencer"],
        ["vencido", "Vencidos"],
        ["sin_pago", "Sin pago"],
      ];
      if (!$("[data-members-toolbar]", panel)) {
        panel.innerHTML = `
          <div class="toolbar" data-members-toolbar>
            <input class="input" type="search" placeholder="Buscar por nombre, código o teléfono" aria-label="Buscar socios" data-search value="${esc(state.search)}" />
            <div class="chips" role="group" aria-label="Filtrar">${filters
              .map(([k, l]) => `<button class="chip" data-filter-chip="${k}">${l}</button>`)
              .join("")}</div>
            <span class="toolbar__spacer"></span>
            <button class="btn btn--sm" data-action="import">Importar socios</button>
            <a class="btn btn--sm" href="/api/admin/export/members.csv">Exportar CSV</a>
          </div>
          <div class="card" data-members></div>`;
        let t;
        $("[data-search]", panel).addEventListener("input", (e) => {
          clearTimeout(t);
          t = setTimeout(() => {
            state.search = e.target.value;
            VIEWS.socios();
          }, 200);
        });
      }
      $$("[data-filter-chip]", panel).forEach((c) =>
        c.classList.toggle("is-active", c.dataset.filterChip === state.filter)
      );
      const rows = await api(
        `/api/admin/members?filter=${state.filter}&q=${encodeURIComponent(state.search)}`
      );
      $("[data-members]", panel).innerHTML = membersTable(rows);
    },

    async promociones() {
      const list = await api("/api/admin/promotions");
      panel._promos = list;
      const live = list.filter((p) => p.state === "vigente").length;
      panel.innerHTML = `
        <div class="toolbar">
          <p class="muted">Las promociones publicadas y vigentes aparecen en la pantalla de entrada. ${live ? `Ahora se muestran <strong>${live}</strong>.` : "Ahora no se muestra ninguna."}</p>
          <span class="toolbar__spacer"></span>
          <button class="btn btn--lime" data-action="new-promo">+ Promoción</button>
        </div>
        ${
          list.length
            ? `<div class="promos">${list
                .map(
                  (p) => `<article class="promo ${p.state === "vigente" ? "promo--live" : ""}">
                    <div class="promo__top">${promoPill(p)}<span class="muted promo__dates">${promoDates(p)}</span></div>
                    <h3>${esc(p.title)}</h3>
                    ${p.price_text ? `<p class="promo__price">${esc(p.price_text)}</p>` : ""}
                    ${p.description ? `<p class="promo__desc">${esc(p.description)}</p>` : ""}
                    <div class="promo__actions">
                      <button class="btn btn--sm" data-action="edit-promo" data-id="${p.id}">Editar</button>
                      <button class="btn btn--sm" data-action="toggle-promo" data-id="${p.id}">${p.published ? "Ocultar" : "Publicar"}</button>
                    </div>
                  </article>`
                )
                .join("")}</div>`
            : `<div class="card"><p class="empty">Aún no hay promociones. Pulsa <strong>+ Promoción</strong> para publicar la primera.</p></div>`
        }`;
    },

    async instructores() {
      const list = await api("/api/admin/instructors");
      panel._instructors = list;
      panel.innerHTML = `
        <div class="toolbar">
          <p class="muted">Los instructores marcados como visibles aparecen en la pantalla de entrada con su especialidad y horario.</p>
          <span class="toolbar__spacer"></span>
          <button class="btn btn--lime" data-action="new-instructor">+ Instructor</button>
        </div>
        ${
          list.length
            ? `<div class="coaches-grid">${list
                .map(
                  (i) => `<article class="coach-card">
                    <div class="coach-card__head">
                      <span class="coach-card__avatar" aria-hidden="true">${esc(initials(i.name))}</span>
                      <div class="list__main"><h3>${esc(i.name)}</h3><p class="muted">${esc(i.specialty || "Sin especialidad")}</p></div>
                    </div>
                    <p class="coach-card__row"><span>Horario</span>${esc(i.schedule || "—")}</p>
                    ${i.bio ? `<p class="coach-card__bio">${esc(i.bio)}</p>` : ""}
                    <div class="promo__actions">
                      <span class="pill ${i.published ? "pill--activo" : "pill--sin_pago"}">${i.published ? "Visible" : "Oculto"}</span>
                      <span class="toolbar__spacer"></span>
                      <button class="btn btn--sm" data-action="toggle-instructor" data-id="${i.id}">${i.published ? "Ocultar" : "Mostrar"}</button>
                      <button class="btn btn--sm" data-action="edit-instructor" data-id="${i.id}">Editar</button>
                    </div>
                  </article>`
                )
                .join("")}</div>`
            : `<div class="card"><p class="empty">Aún no hay instructores. Pulsa <strong>+ Instructor</strong> para añadir el primero.</p></div>`
        }`;
    },

    async motivacion() {
      const [streaks, phrases, meta] = await Promise.all([
        api("/api/admin/streaks"),
        api("/api/admin/phrases"),
        api("/api/admin/meta"),
      ]);
      state.meta = meta;
      panel._phrases = phrases;
      const showing = meta.settings.showStreaks !== "0";
      const activeCount = phrases.filter((p) => p.active).length;
      const rank = (i) => `<span class="rank ${i < 3 ? `rank--${i + 1}` : ""}">${i + 1}</span>`;
      panel.innerHTML = `
        <div class="grid-2 motivation">
          <section class="card">
            <div class="card__head"><h2>Ranking de rachas</h2>
              <label class="check" style="font-size:13px"><input type="checkbox" data-show-streaks ${showing ? "checked" : ""} /> Mostrar en la entrada</label></div>
            <p class="card__body muted" style="padding-bottom:0;font-size:14px">Días seguidos que cada socio ha venido. La racha sigue viva si vino hoy o ayer.
              En la pantalla de entrada se ven los 5 primeros solo con nombre e inicial (por ejemplo "Laura G.").</p>
            ${
              streaks.length
                ? `<ol class="streaks">${streaks
                    .map(
                      (m, i) => `<li>
                        ${rank(i)}
                        <div class="list__main"><p><button class="link" data-action="detail" data-id="${m.id}">${esc(m.name)}</button></p>
                          <p class="list__sub">${m.cameToday ? "Vino hoy" : "Vino ayer · si viene hoy, sigue la racha"}</p></div>
                        <span class="streak-count"><b>${m.streak}</b> días</span>
                      </li>`
                    )
                    .join("")}</ol>`
                : `<p class="empty">Todavía nadie lleva 2 días seguidos. Las rachas aparecen solas cuando los socios entran con su código.</p>`
            }
          </section>
          <section class="card">
            <div class="card__head"><h2>Frases motivadoras</h2><span class="muted">${activeCount} activas</span></div>
            <form class="phrase-add" data-phrase-add>
              <label class="sr-only" for="new-phrase">Nueva frase</label>
              <input class="input" id="new-phrase" name="text" maxlength="160" placeholder="Escribe una frase nueva…" autocomplete="off" required />
              <button class="btn btn--lime" type="submit">Añadir</button>
            </form>
            <p class="card__body muted" style="padding-top:0;font-size:14px">Al entrar, cada socio ve una frase activa al azar. También rotan en la pantalla de entrada.</p>
            <ul class="phrases">${phrases
              .map(
                (p) => `<li class="${p.active ? "" : "is-off"}">
                  <label class="switch" title="${p.active ? "Desactivar" : "Activar"}"><input type="checkbox" data-phrase-toggle="${p.id}" ${p.active ? "checked" : ""} /><span></span>
                    <span class="sr-only">${p.active ? "Activa" : "Inactiva"}</span></label>
                  <p class="phrase-text">“${esc(p.text)}”</p>
                  <div class="row-actions">
                    <button class="btn btn--sm" data-action="edit-phrase" data-id="${p.id}">Editar</button>
                    <button class="btn btn--sm btn--danger" data-action="del-phrase" data-id="${p.id}" aria-label="Eliminar frase">×</button>
                  </div>
                </li>`
              )
              .join("")}</ul>
          </section>
        </div>`;
      $("[data-show-streaks]", panel).addEventListener("change", async (e) => {
        try {
          await api("/api/admin/settings", {
            method: "PUT",
            body: { showStreaks: e.target.checked },
          });
          toast(
            e.target.checked
              ? "El ranking se muestra en la entrada"
              : "El ranking ya no se muestra en la entrada"
          );
        } catch (ex) {
          toast(ex.message, true);
          e.target.checked = !e.target.checked;
        }
      });
      $("[data-phrase-add]", panel).addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await api("/api/admin/phrases", { method: "POST", body: { text: e.target.text.value } });
          toast("Frase añadida");
          VIEWS.motivacion();
        } catch (ex) {
          toast(ex.message, true);
        }
      });
      $$("[data-phrase-toggle]", panel).forEach((cb) =>
        cb.addEventListener("change", async () => {
          try {
            await api(`/api/admin/phrases/${cb.dataset.phraseToggle}`, {
              method: "PATCH",
              body: { active: cb.checked },
            });
            VIEWS.motivacion();
          } catch (ex) {
            toast(ex.message, true);
          }
        })
      );
    },

    async tienda() {
      const [products, sales] = await Promise.all([
        api("/api/admin/products"),
        api(`/api/admin/sales?month=${state.month}`),
      ]);
      panel._products = products;
      const total = sales.reduce((a, v) => a + v.total_cents, 0);
      panel.innerHTML = `
        <div class="toolbar">
          <p class="muted">Vende agua, suplementos, ropa o accesorios. Cada venta descuenta existencias y suma a los ingresos del mes.</p>
          <span class="toolbar__spacer"></span>
          <button class="btn" data-action="new-product">+ Producto</button>
        </div>
        ${
          products.length
            ? `<div class="products">${products
                .map(
                  (p) => `<article class="product">
                    <div class="product__top"><h3>${esc(p.name)}</h3>
                      <button class="btn btn--sm" data-action="edit-product" data-id="${p.id}">Editar</button></div>
                    <p class="product__price">${money(p.price_cents)}</p>
                    <p class="product__stock"><span class="pill ${p.stock === 0 ? "pill--vencido" : p.stock <= 3 ? "pill--por_vencer" : "pill--sin_pago"}">${
                      p.stock === 0 ? "Agotado" : `${p.stock} en existencia`
                    }</span></p>
                    <button class="btn btn--lime btn--block" data-action="sell" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>Vender</button>
                  </article>`
                )
                .join("")}</div>`
            : `<div class="card"><p class="empty">Aún no hay productos. Pulsa <strong>+ Producto</strong> para añadir el primero.</p></div>`
        }
        <div class="card" style="margin-top:20px">
          <div class="card__head"><h2>Ventas de ${esc(fmtDate(`${state.month}-01`, { month: "long", year: "numeric" }))}</h2><span class="total">${money(total)}</span></div>
          ${
            sales.length
              ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Producto</th><th class="num">Cant.</th><th>Método</th><th class="num">Total</th></tr></thead>
                <tbody>${sales
                  .map(
                    (
                      v
                    ) => `<tr><td>${fmtDateTime(v.created_at)}</td><td>${esc(v.product_name)}</td><td class="num">${v.qty}</td>
                      <td>${esc(v.method)}</td><td class="num"><strong>${money(v.total_cents)}</strong></td></tr>`
                  )
                  .join("")}</tbody></table></div>`
              : `<p class="empty">Sin ventas este mes.</p>`
          }
        </div>`;
    },

    async cobros() {
      const rows = await api(`/api/admin/payments?month=${state.month}`);
      const total = rows.reduce((a, p) => a + p.amount_cents, 0);
      const byMethod = {};
      rows.forEach((p) => (byMethod[p.method] = (byMethod[p.method] || 0) + p.amount_cents));
      panel.innerHTML = `
        <div class="toolbar">
          <label class="field" style="max-width:200px"><span>Mes</span><input class="input" type="month" value="${state.month}" data-month /></label>
          <span class="toolbar__spacer"></span>
          <div style="text-align:right"><p class="muted">Total del mes · ${rows.length} cobros</p><p class="total">${money(total)}</p>
          <p class="muted" style="font-size:13px">${Object.entries(byMethod)
            .map(([k, v]) => `${esc(k)}: ${money(v)}`)
            .join(" · ")}</p></div>
        </div>
        <div class="card">${
          rows.length
            ? `<div class="table-wrap"><table>
              <thead><tr><th>Fecha</th><th>Socio</th><th>Plan</th><th>Periodo</th><th>Método</th><th class="num">Monto</th></tr></thead>
              <tbody>${rows
                .map(
                  (p) => `<tr><td>${fmtDate(p.paid_on)}</td>
                    <td><button class="link" data-action="detail" data-id="${p.member_id}">${esc(p.member_name)}</button></td>
                    <td>${esc(p.plan_name)}</td><td class="muted">${fmtDate(p.period_start)} → ${fmtDate(p.period_end)}</td>
                    <td>${esc(p.method)}</td><td class="num"><strong>${money(p.amount_cents)}</strong></td></tr>`
                )
                .join("")}</tbody></table></div>`
            : `<p class="empty">No hay cobros registrados en este mes.</p>`
        }</div>`;
      $("[data-month]", panel).addEventListener("change", (e) => {
        if (!e.target.value) return;
        state.month = e.target.value;
        VIEWS.cobros();
      });
    },

    async avisos() {
      const list = await api("/api/admin/reminders");
      panel.innerHTML = `
        <p class="muted" style="margin-bottom:16px">Socios cuya mensualidad vence en los próximos ${esc(state.meta.settings.warnDays)} días o venció hace menos de 30 días.
        Pulsa <strong>Enviar por WhatsApp</strong> para abrir el chat con el mensaje listo.</p>
        <div class="card">${
          list.length
            ? list
                .map((m) => {
                  const text = reminderText(m);
                  const link = waLink(m.phone, text);
                  return `<div class="reminder">
                    <div><p><button class="link" data-action="detail" data-id="${m.id}">${esc(m.name)}</button> ${pill(m)}</p>
                      <p class="muted" style="font-size:14px">${fmtDate(m.end_date)} · ${daysText(m)} · ${esc(m.phone || "sin teléfono")}
                      ${m.reminder_sent_at ? ` · <span style="color:var(--lime)">avisado ${fmtDateTime(m.reminder_sent_at)}</span>` : ""}</p></div>
                    <div class="reminder__actions">
                      ${
                        link
                          ? `<a class="btn btn--sm wa" href="${esc(link)}" target="_blank" rel="noopener" data-action="remind" data-id="${m.id}">Enviar por WhatsApp</a>`
                          : `<button class="btn btn--sm" disabled title="Añade un teléfono al socio">Sin teléfono</button>`
                      }
                      <button class="btn btn--sm" data-action="copy-reminder" data-id="${m.id}">Copiar</button>
                      <button class="btn btn--sm btn--lime" data-action="pay" data-id="${m.id}">Cobrar</button>
                    </div>
                    <p class="reminder__msg">${esc(text)}</p>
                  </div>`;
                })
                .join("")
            : `<p class="empty">No hay avisos pendientes. ¡Todos al día!</p>`
        }</div>`;
      panel._reminders = list;
    },

    async entradas() {
      const rows = await api(`/api/admin/visits?day=${state.day}`);
      const ok = rows.filter((r) => r.allowed).length;
      panel.innerHTML = `
        <div class="toolbar">
          <label class="field" style="max-width:200px"><span>Día</span><input class="input" type="date" value="${state.day}" data-day /></label>
          <span class="toolbar__spacer"></span>
          <p class="muted">${ok} permitidas · ${rows.length - ok} denegadas</p>
        </div>
        <div class="card">${
          rows.length
            ? `<div class="table-wrap"><table>
              <thead><tr><th>Hora</th><th>Socio</th><th>Código</th><th>Resultado</th></tr></thead>
              <tbody>${rows
                .map(
                  (v) => `<tr><td>${fmtTime(v.at)}</td>
                    <td><button class="link" data-action="detail" data-id="${v.member_id}">${esc(v.name)}</button></td>
                    <td class="code">${esc(v.code)}</td>
                    <td><span class="pill ${v.allowed ? "pill--activo" : "pill--vencido"}">${v.allowed ? "Permitida" : "Denegada"}</span></td></tr>`
                )
                .join("")}</tbody></table></div>`
            : `<p class="empty">No hay entradas registradas este día.</p>`
        }</div>`;
      $("[data-day]", panel).addEventListener("change", (e) => {
        if (!e.target.value) return;
        state.day = e.target.value;
        VIEWS.entradas();
      });
    },

    async ajustes() {
      state.meta = await api("/api/admin/meta");
      const s = state.meta.settings;
      const planRow = (p = {}) => `
        <div class="plan-row" data-plan-row data-id="${p.id || ""}">
          <label class="field"><span>Plan</span><input name="name" value="${esc(p.name || "")}" required maxlength="40" /></label>
          <label class="field"><span>Meses</span><input name="months" type="number" min="1" max="36" value="${p.months || 1}" required /></label>
          <label class="field"><span>Precio</span><input name="price" type="number" min="0" step="0.01" value="${p.price_cents !== undefined ? p.price_cents / 100 : ""}" required /></label>
          <button type="button" class="btn btn--icon btn--danger" data-remove-plan aria-label="Quitar plan">×</button>
        </div>`;
      panel.innerHTML = `
        <div class="settings-grid">
          <form class="card" data-settings>
            <div class="card__head"><h2>Gimnasio y avisos</h2></div>
            <div class="card__body stack">
              <div class="form-grid">
                <label class="field full"><span>Nombre del gimnasio</span><input name="gymName" value="${esc(s.gymName)}" required maxlength="60" /></label>
                <label class="field"><span>Moneda</span><input name="currency" value="${esc(s.currency)}" maxlength="4" /></label>
                <label class="field"><span>Código de país (WhatsApp)</span><input name="countryCode" value="${esc(s.countryCode)}" inputmode="numeric" maxlength="4" placeholder="Ej. 52, 57, 34" /></label>
                <label class="field"><span>Avisar con (días de antelación)</span><input name="warnDays" type="number" min="1" max="30" value="${esc(s.warnDays)}" /></label>
                <label class="field full"><span>Mensaje de recordatorio</span><textarea name="reminderTemplate" maxlength="600" rows="4">${esc(s.reminderTemplate)}</textarea>
                  <span class="hint">Variables: {nombre}, {gimnasio}, {fecha}, {estado}, {dias}, {codigo}</span></label>
              </div>
              <div>
                <p class="section-title" style="margin-top:0">Planes y precios</p>
                <div class="plans-editor" data-plans>${state.meta.plans.map(planRow).join("")}</div>
                <button type="button" class="btn btn--sm" style="margin-top:10px" data-add-plan>+ Añadir plan</button>
              </div>
              <div class="modal__foot" style="margin-top:0"><button class="btn btn--lime" type="submit">Guardar cambios</button></div>
            </div>
          </form>
          <div class="stack">
            <form class="card" data-pin-form>
              <div class="card__head"><h2>Cambiar PIN</h2></div>
              <div class="card__body stack">
                <label class="field"><span>PIN actual</span><input name="current" type="password" inputmode="numeric" autocomplete="current-password" required /></label>
                <label class="field"><span>Nuevo PIN (4–12 dígitos)</span><input name="next" type="password" inputmode="numeric" autocomplete="new-password" pattern="\\d{4,12}" required /></label>
                <button class="btn" type="submit">Actualizar PIN</button>
              </div>
            </form>
            <div class="card">
              <div class="card__head"><h2>Datos</h2></div>
              <div class="card__body stack">
                <a class="btn" href="/api/admin/export/members.csv">Exportar socios (CSV)</a>
                <a class="btn" href="/" target="_blank" rel="noopener">Abrir pantalla de entrada ↗</a>
                <button class="btn btn--danger" type="button" data-logout-2>Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>`;
      $("[data-add-plan]", panel).addEventListener("click", () =>
        $("[data-plans]", panel).insertAdjacentHTML("beforeend", planRow())
      );
      $("[data-plans]", panel).addEventListener("click", (e) => {
        if (!e.target.closest("[data-remove-plan]")) return;
        if ($$("[data-plan-row]", panel).length <= 1)
          return toast("Debe haber al menos un plan", true);
        e.target.closest("[data-plan-row]").remove();
      });
      $("[data-logout-2]", panel).addEventListener("click", logout);
      $("[data-settings]", panel).addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        try {
          await api("/api/admin/settings", {
            method: "PUT",
            body: {
              gymName: f.gymName.value,
              currency: f.currency.value,
              countryCode: f.countryCode.value,
              warnDays: f.warnDays.value,
              reminderTemplate: f.reminderTemplate.value,
              plans: $$("[data-plan-row]", f).map((r) => ({
                id: r.dataset.id || undefined,
                name: $("[name=name]", r).value,
                months: $("[name=months]", r).value,
                price: $("[name=price]", r).value,
              })),
            },
          });
          toast("Ajustes guardados");
          VIEWS.ajustes();
        } catch (ex) {
          toast(ex.message, true);
        }
      });
      $("[data-pin-form]", panel).addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await api("/api/admin/pin", {
            method: "POST",
            body: { current: e.target.current.value, next: e.target.next.value },
          });
          e.target.reset();
          toast("PIN actualizado");
        } catch (ex) {
          toast(ex.message, true);
        }
      });
    },
  };

  // ---------- Formularios en modal ----------
  const planOptions = (selected) =>
    state.meta.plans
      .map(
        (p) =>
          `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${esc(p.name)} · ${money(p.price_cents)}</option>`
      )
      .join("");
  const methodOptions = () => state.meta.methods.map((m) => `<option>${esc(m)}</option>`).join("");

  const paymentFields = (member) => `
    <div class="form-grid">
      <label class="field"><span>Plan</span><select name="planId" data-plan-select>${planOptions(member?.plan_id)}</select></label>
      <label class="field"><span>Monto cobrado</span><input name="amount" type="number" min="0" step="0.01" data-amount /></label>
      <label class="field"><span>Método de pago</span><select name="method">${methodOptions()}</select></label>
      <label class="field"><span>Inicio del periodo</span><input name="startDate" type="date" data-start /></label>
      <label class="field full"><span>Nota (opcional)</span><input name="note" maxlength="200" placeholder="Ej. promoción, referencia de transferencia…" /></label>
    </div>
    <p class="preview" data-preview></p>`;

  const wirePaymentPreview = (root, member) => {
    const select = $("[data-plan-select]", root);
    const amount = $("[data-amount]", root);
    const start = $("[data-start]", root);
    const auto = periodFor(member, state.meta.plans[0]).start;
    start.value = auto;
    let userStart = false;
    start.addEventListener("input", () => (userStart = true));
    const update = (fromPlan) => {
      const plan =
        state.meta.plans.find((p) => String(p.id) === select.value) || state.meta.plans[0];
      if (fromPlan) amount.value = plan.price_cents / 100;
      const { start: s, end } = periodFor(member, plan, userStart ? start.value : undefined);
      $("[data-preview]", root).innerHTML = `Periodo: ${fmtDate(s)} → <strong>vence el ${fmtDate(
        end,
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )}</strong>`;
    };
    select.addEventListener("change", () => update(true));
    start.addEventListener("change", () => update(false));
    update(true);
    return () => (userStart ? start.value : undefined);
  };

  // ---------- Importar socios desde CSV ----------
  // Lee CSV separado por comas, punto y coma o tabuladores (Excel en español usa punto y coma).
  function parseCsv(text) {
    text = text.replace(/^\uFEFF/, "");
    const first = text.split(/\r?\n/, 1)[0] || "";
    const delim = [";", ",", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === delim) {
        row.push(cell);
        cell = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  const norm = (h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  // Reconoce las columnas aunque se llamen distinto.
  const COLUMN_RULES = [
    ["name", /^(nombre|nombre completo|socio|cliente|name)$/],
    ["code", /(codigo|pin|clave|numero de socio|id socio|code)/],
    ["phone", /(telefono|celular|whatsapp|movil|tel|phone)/],
    ["email", /(email|correo|mail)/],
    ["tenure", /(antiguedad|tiempo|cuanto tiempo)/],
    ["joinedOn", /(inscripcion|alta|ingreso|socio desde|desde|registro|fecha de inicio|inicio)/],
    ["endDate", /(vence|vencimiento|pagado hasta|hasta|fin|expira|proximo pago)/],
    ["plan", /^(plan|membresia|tipo)$/],
  ];
  const mapColumns = (headers) => {
    const map = {};
    headers.forEach((h, i) => {
      const n = norm(h);
      const hit = COLUMN_RULES.find(([key, re]) => map[key] === undefined && re.test(n));
      if (hit) map[hit[0]] = i;
    });
    return map;
  };
  const LABELS = {
    name: "Nombre",
    code: "Código",
    phone: "Teléfono",
    email: "Email",
    tenure: "Antigüedad",
    joinedOn: "Socio desde",
    endDate: "Vence",
    plan: "Plan",
  };

  // Fechas: 15/03/2024, 15-03-24, 2024-03-15.
  const parseDate = (v) => {
    v = String(v || "").trim();
    if (!v) return null;
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    let y, mo, d;
    if (m) [, y, mo, d] = m.map(Number);
    else if ((m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))) {
      [, d, mo, y] = m.map(Number);
      if (y < 100) y += 2000;
    } else return "invalid";
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? ymd(dt) : "invalid";
  };
  // "2 años", "1 año y 3 meses", "6 meses" → fecha de inscripción aproximada.
  const tenureToDate = (v) => {
    // Conserva los números: "1 año y 2 meses" → "1 ano y 2 meses".
    const t = String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    if (!t) return null;
    const y = Number((t.match(/(\d+) ano/) || [])[1] || 0);
    const mo = Number((t.match(/(\d+) mes/) || [])[1] || 0);
    if (!y && !mo) return "invalid";
    return addMonths(state.meta.today, -(y * 12 + mo));
  };

  function buildImport(rows, existing = new Set()) {
    const [headers, ...body] = rows;
    const map = mapColumns(headers);
    const items = body.map((r, i) => {
      const get = (k) => (map[k] === undefined ? "" : String(r[map[k]] ?? "").trim());
      const errors = [];
      const code = get("code").replace(/\s/g, "");
      const joined = get("joinedOn") ? parseDate(get("joinedOn")) : tenureToDate(get("tenure"));
      const end = parseDate(get("endDate"));
      if (!get("name")) errors.push("Falta el nombre");
      if (!/^\d{4,8}$/.test(code))
        errors.push(code ? `Código "${code}" no válido (4 a 8 dígitos)` : "Falta el código");
      if (joined === "invalid") errors.push("Fecha de inscripción no válida");
      else if (joined && joined > state.meta.today) errors.push("Inscripción en el futuro");
      if (end === "invalid") errors.push("Fecha de vencimiento no válida");
      const plan = get("plan");
      if (plan && !state.meta.plans.some((p) => p.name.toLowerCase() === plan.toLowerCase()))
        errors.push(`Plan "${plan}" no existe`);
      return {
        line: i + 2,
        data: {
          name: get("name"),
          code,
          phone: get("phone"),
          email: get("email"),
          joinedOn: joined && joined !== "invalid" ? joined : null,
          endDate: end && end !== "invalid" ? end : null,
          plan: plan || null,
        },
        errors,
      };
    });
    const counts = {};
    items.forEach((it) => (counts[it.data.code] = (counts[it.data.code] || 0) + 1));
    items.forEach(
      (it) =>
        it.data.code &&
        counts[it.data.code] > 1 &&
        it.errors.push(`Código ${it.data.code} repetido en el archivo`)
    );
    items.forEach(
      (it) =>
        existing.has(it.data.code) &&
        it.errors.push(`El código ${it.data.code} ya pertenece a otro socio`)
    );
    return { map, items };
  }

  function importModal() {
    openModal(`
      <h2>Importar socios</h2>
      <p class="muted" style="font-size:14px">Sube un archivo <strong>CSV</strong> con una fila por socio. Desde Excel: <em>Archivo → Guardar como → CSV</em>.
        Columnas que se reconocen: nombre, código, teléfono, email, fecha de inscripción (o antigüedad, por ejemplo "2 años"), vencimiento y plan.</p>
      <div class="dropzone" data-dropzone>
        <input type="file" id="import-file" accept=".csv,.txt,text/csv" data-import-file />
        <label for="import-file"><strong>Elige el archivo</strong> o arrástralo aquí</label>
      </div>
      <p class="hint"><a href="/api/admin/import/plantilla.csv" data-template>Descargar plantilla de ejemplo</a></p>
      <div data-import-preview></div>`);
    const zone = $("[data-dropzone]", modal);
    const input = $("[data-import-file]", modal);
    const read = (file) => {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024)
        return toast("El archivo es demasiado grande (máximo 2 MB)", true);
      const r = new FileReader();
      r.onload = async () => {
        // Códigos ya registrados, para marcarlos en la vista previa antes de importar.
        const members = await api("/api/admin/members").catch(() => []);
        previewImport(file.name, String(r.result), new Set(members.map((m) => m.code)));
      };
      r.readAsText(file, "utf-8");
    };
    input.addEventListener("change", () => read(input.files[0]));
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("is-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("is-over");
      read(e.dataTransfer.files[0]);
    });
  }

  function previewImport(fileName, text, existing) {
    const box = $("[data-import-preview]", modal);
    const rows = parseCsv(text);
    if (rows.length < 2) {
      box.innerHTML = `<p class="import-error">El archivo no tiene filas de socios.</p>`;
      return;
    }
    const { map, items } = buildImport(rows, existing);
    if (map.name === undefined || map.code === undefined) {
      box.innerHTML = `<p class="import-error">No encontré las columnas de <strong>nombre</strong> y <strong>código</strong>. Revisa que la primera fila tenga los títulos de las columnas.</p>`;
      return;
    }
    const ok = items.filter((it) => !it.errors.length);
    const bad = items.length - ok.length;
    const detected = Object.keys(map)
      .map((k) => `<span class="chip is-active">${LABELS[k]}</span>`)
      .join(" ");
    const noEnd = ok.filter((it) => !it.data.endDate).length;
    box.innerHTML = `
      <p class="section-title">${esc(fileName)} · ${items.length} filas</p>
      <div class="chips" style="margin-bottom:10px">${detected}</div>
      <div class="import-summary">
        <span class="pill pill--activo">${ok.length} listos</span>
        ${bad ? `<span class="pill pill--vencido">${bad} con errores</span>` : ""}
        ${noEnd ? `<span class="pill pill--sin_pago">${noEnd} sin fecha de vencimiento</span>` : ""}
      </div>
      ${noEnd ? `<p class="hint">Los socios sin fecha de vencimiento entran como <em>sin pago</em>: el acceso se les deniega hasta registrar su primer cobro.</p>` : ""}
      <div class="table-wrap import-table"><table class="mini-table">
        <thead><tr><th>Fila</th><th>Nombre</th><th>Código</th><th>Socio desde</th><th>Vence</th><th>Estado</th></tr></thead>
        <tbody>${items
          .slice(0, 200)
          .map(
            (
              it
            ) => `<tr><td class="muted">${it.line}</td><td>${esc(it.data.name || "—")}</td><td class="code" style="font-size:15px">${esc(it.data.code || "—")}</td>
              <td>${it.data.joinedOn ? fmtDate(it.data.joinedOn) : "—"}</td><td>${it.data.endDate ? fmtDate(it.data.endDate) : "—"}</td>
              <td>${it.errors.length ? `<span class="import-error">${esc(it.errors.join(" · "))}</span>` : `<span class="pill pill--activo">Listo</span>`}</td></tr>`
          )
          .join("")}</tbody></table></div>
      ${items.length > 200 ? `<p class="hint">Se muestran las primeras 200 filas.</p>` : ""}
      <div class="modal__foot">
        <button type="button" class="btn" data-close-modal>Cancelar</button>
        <button type="button" class="btn btn--lime" data-do-import ${ok.length ? "" : "disabled"}>Importar ${ok.length} ${ok.length === 1 ? "socio" : "socios"}${bad ? ` (omitir ${bad})` : ""}</button>
      </div>`;
    $("[data-do-import]", box).addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        const r = await api("/api/admin/import", {
          method: "POST",
          body: { rows: ok.map((it) => it.data) },
        });
        closeModal();
        toast(`Se importaron ${r.created} socios`);
        state.filter = "all";
        go("socios");
      } catch (ex) {
        e.target.disabled = false;
        const extra = ex.details
          ? ` Ejemplo: fila ${ok[ex.details[0].row - 1]?.line ?? ex.details[0].row} — ${ex.details[0].message}.`
          : "";
        toast(ex.message + extra, true);
      }
    });
  }

  function newMemberModal() {
    openModal(`
      <h2>Nuevo socio</h2>
      <form data-new-member class="stack">
        <div class="form-grid">
          <label class="field full"><span>Nombre completo</span><input name="name" required maxlength="80" autocomplete="off" /></label>
          <label class="field"><span>Teléfono (WhatsApp)</span><input name="phone" type="tel" maxlength="24" placeholder="+52 55 0000 0000" /></label>
          <label class="field"><span>Email (opcional)</span><input name="email" type="email" maxlength="120" /></label>
          <label class="field"><span>Código de acceso</span><input name="code" inputmode="numeric" maxlength="8" pattern="\\d{4,8}" placeholder="Automático" />
            <span class="hint">Déjalo vacío para generar uno al azar.</span></label>
          <label class="field"><span>Socio desde</span><input name="joinedOn" type="date" value="${state.meta.today}" max="${state.meta.today}" />
            <span class="hint">Cámbiala si ya era socio antes de usar el sistema.</span></label>
          <label class="field full"><span>Notas (opcional)</span><input name="notes" maxlength="500" /></label>
        </div>
        <label class="check"><input type="checkbox" name="withPayment" checked data-with-payment /> Registrar el primer cobro ahora</label>
        <div class="fieldset" data-payment-fields>${paymentFields(null)}</div>
        <div class="modal__foot"><button type="button" class="btn" data-close-modal>Cancelar</button>
          <button class="btn btn--lime" type="submit">Crear socio</button></div>
      </form>`);
    const form = $("[data-new-member]", modal);
    const getStart = wirePaymentPreview(form, null);
    $("[data-with-payment]", form).addEventListener(
      "change",
      (e) => ($("[data-payment-fields]", form).hidden = !e.target.checked)
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const btn = $("button[type=submit]", f);
      btn.disabled = true;
      try {
        const member = await api("/api/admin/members", {
          method: "POST",
          body: {
            name: f.name.value,
            phone: f.phone.value,
            email: f.email.value,
            notes: f.notes.value,
            joinedOn: f.joinedOn.value || undefined,
            code: f.code.value || undefined,
            payment: f.withPayment.checked
              ? {
                  planId: f.planId.value,
                  amount: f.amount.value,
                  method: f.method.value,
                  note: f.note.value,
                  startDate: getStart(),
                }
              : undefined,
          },
        });
        codeModal(member, true);
        render();
      } catch (ex) {
        toast(ex.message, true);
        btn.disabled = false;
      }
    });
  }

  function codeModal(m, isNew) {
    const link = waLink(m.phone, codeText(m));
    openModal(`
      <h2>${isNew ? "Socio creado" : "Código de acceso"}</h2>
      <p class="muted">${esc(m.name)}${m.end_date ? ` · activo hasta el ${fmtDate(m.end_date, { day: "numeric", month: "long", year: "numeric" })}` : " · sin cobro registrado"}</p>
      <div class="code-reveal"><p>Código de acceso</p><strong>${esc(m.code)}</strong></div>
      <p class="muted" style="font-size:14px">Entrégale este código al socio: lo escribirá en la pantalla de entrada cada vez que venga.</p>
      <div class="modal__foot">
        <button type="button" class="btn" data-copy="${esc(codeText(m))}">Copiar mensaje</button>
        ${link ? `<a class="btn wa" href="${esc(link)}" target="_blank" rel="noopener">Enviar código por WhatsApp</a>` : ""}
        <button type="button" class="btn btn--lime" data-close-modal>Listo</button>
      </div>`);
  }

  async function paymentModal(id) {
    const { member } = await api(`/api/admin/members/${id}`);
    openModal(`
      <h2>Registrar cobro</h2>
      <div class="detail-head"><div><p><strong>${esc(member.name)}</strong></p>
        <p class="muted" style="font-size:14px">${member.end_date ? `Vence el ${fmtDate(member.end_date)} · ${daysText(member)}` : "Sin cobros previos"}</p></div>${pill(member)}</div>
      <form data-pay class="stack">
        ${paymentFields(member)}
        <div class="modal__foot"><button type="button" class="btn" data-close-modal>Cancelar</button>
          <button class="btn btn--lime" type="submit">Registrar cobro</button></div>
      </form>`);
    const form = $("[data-pay]", modal);
    const getStart = wirePaymentPreview(form, member);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const btn = $("button[type=submit]", f);
      btn.disabled = true;
      try {
        const updated = await api(`/api/admin/members/${id}/payments`, {
          method: "POST",
          body: {
            planId: f.planId.value,
            amount: f.amount.value,
            method: f.method.value,
            note: f.note.value,
            startDate: getStart(),
          },
        });
        const detail = await api(`/api/admin/members/${id}`);
        receiptModal(updated, detail.payments[0]);
        render();
      } catch (ex) {
        toast(ex.message, true);
        btn.disabled = false;
      }
    });
  }

  async function detailModal(id) {
    const { member: m, payments, visits } = await api(`/api/admin/members/${id}`);
    openModal(`
      <h2>${esc(m.name)}</h2>
      <div class="detail-head">
        <div><p class="muted" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">Código de acceso</p><p class="code">${esc(m.code)}</p>
          ${m.joined_on ? `<p class="muted" style="font-size:13px">Socio desde ${fmtDate(m.joined_on, { day: "numeric", month: "long", year: "numeric" })} · <strong style="color:var(--text)">${esc(tenure(m.joined_on))}</strong></p>` : ""}</div>
        <div style="text-align:right">${pill(m)}<p class="muted" style="font-size:14px;margin-top:6px">${m.end_date ? `Vence el ${fmtDate(m.end_date)} · ${daysText(m)}` : "Sin cobros"}</p></div>
      </div>
      <form data-edit class="stack">
        <div class="form-grid">
          <label class="field full"><span>Nombre</span><input name="name" value="${esc(m.name)}" required maxlength="80" /></label>
          <label class="field"><span>Teléfono</span><input name="phone" type="tel" value="${esc(m.phone)}" maxlength="24" /></label>
          <label class="field"><span>Email</span><input name="email" type="email" value="${esc(m.email)}" maxlength="120" /></label>
          <label class="field"><span>Socio desde</span><input name="joinedOn" type="date" value="${esc(m.joined_on || "")}" max="${state.meta.today}" /></label>
          <label class="field"><span>Notas</span><input name="notes" value="${esc(m.notes)}" maxlength="500" /></label>
        </div>
        <div class="modal__foot" style="margin-top:0;justify-content:space-between">
          <div class="row-actions" style="justify-content:flex-start">
            <button type="button" class="btn btn--sm" data-action="show-code" data-id="${m.id}">Enviar código</button>
            <button type="button" class="btn btn--sm" data-action="regen" data-id="${m.id}">Nuevo código</button>
            <button type="button" class="btn btn--sm btn--danger" data-action="archive" data-id="${m.id}">Dar de baja</button>
          </div>
          <div class="row-actions">
            <button type="submit" class="btn btn--sm">Guardar</button>
            <button type="button" class="btn btn--sm btn--lime" data-action="pay" data-id="${m.id}">Cobrar</button>
          </div>
        </div>
      </form>
      <p class="section-title">Historial de cobros</p>
      ${
        payments.length
          ? `<div class="table-wrap"><table class="mini-table"><thead><tr><th>Fecha</th><th>Plan</th><th>Periodo</th><th>Método</th><th class="num">Monto</th></tr></thead><tbody>
            ${payments
              .map(
                (p) =>
                  `<tr><td>${fmtDate(p.paid_on)}</td><td>${esc(p.plan_name)}</td><td class="muted">${fmtDate(p.period_start)} → ${fmtDate(
                    p.period_end
                  )}</td><td>${esc(p.method)}</td><td class="num">${money(p.amount_cents)}</td></tr>`
              )
              .join("")}</tbody></table></div>`
          : `<p class="muted">Sin cobros registrados.</p>`
      }
      <p class="section-title">Últimas entradas</p>
      ${
        visits.length
          ? `<p class="muted" style="font-size:14px">${visits
              .map((v) => `${fmtDateTime(v.at)}${v.allowed ? "" : " (denegada)"}`)
              .join(" · ")}</p>`
          : `<p class="muted">Sin entradas registradas.</p>`
      }`);
    $("[data-edit]", modal).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await api(`/api/admin/members/${id}`, {
          method: "PATCH",
          body: {
            name: f.name.value,
            phone: f.phone.value,
            email: f.email.value,
            notes: f.notes.value,
            joinedOn: f.joinedOn.value || undefined,
          },
        });
        toast("Datos guardados");
        render();
      } catch (ex) {
        toast(ex.message, true);
      }
    });
  }

  // ---------- Acciones delegadas ----------
  document.addEventListener("click", async (e) => {
    const goto = e.target.closest("[data-goto]");
    if (goto) {
      if (goto.dataset.filter) state.filter = goto.dataset.filter;
      return go(goto.dataset.goto);
    }
    const chip = e.target.closest("[data-filter-chip]");
    if (chip) {
      state.filter = chip.dataset.filterChip;
      return VIEWS.socios();
    }
    if (e.target.closest("[data-close-modal]")) return closeModal();
    const cp = e.target.closest("[data-copy]");
    if (cp) return copy(cp.dataset.copy);

    const el = e.target.closest("[data-action]");
    if (!el) return;
    const id = Number(el.dataset.id);
    try {
      switch (el.dataset.action) {
        case "new-member":
          return newMemberModal();
        case "import":
          return importModal();
        case "pay":
          return await paymentModal(id);
        case "detail":
          return await detailModal(id);
        case "show-code": {
          const { member } = await api(`/api/admin/members/${id}`);
          return codeModal(member, false);
        }
        case "regen": {
          if (!confirm("¿Generar un código nuevo? El código anterior dejará de funcionar.")) return;
          const member = await api(`/api/admin/members/${id}/code`, { method: "POST", body: {} });
          render();
          return codeModal(member, false);
        }
        case "archive": {
          if (
            !confirm(
              "¿Dar de baja a este socio? Su código dejará de funcionar. El historial de cobros se conserva."
            )
          )
            return;
          await api(`/api/admin/members/${id}`, { method: "DELETE" });
          closeModal();
          toast("Socio dado de baja");
          return render();
        }
        case "remind": {
          // El enlace abre WhatsApp; aquí solo se registra que el aviso se envió.
          await api(`/api/admin/members/${id}/reminded`, { method: "POST", body: {} });
          setTimeout(render, 400);
          return;
        }
        case "edit-phrase": {
          const ph = (panel._phrases || []).find((x) => x.id === id);
          openModal(`
            <h2>Editar frase</h2>
            <form data-phrase-edit class="stack">
              <label class="field"><span>Frase</span><textarea name="text" maxlength="160" rows="3" required>${esc(ph.text)}</textarea></label>
              <div class="modal__foot"><button type="button" class="btn" data-close-modal>Cancelar</button>
                <button class="btn btn--lime" type="submit">Guardar</button></div>
            </form>`);
          $("[data-phrase-edit]", modal).addEventListener("submit", async (ev) => {
            ev.preventDefault();
            try {
              await api(`/api/admin/phrases/${id}`, {
                method: "PATCH",
                body: { text: ev.target.text.value },
              });
              closeModal();
              toast("Frase guardada");
              render();
            } catch (ex) {
              toast(ex.message, true);
            }
          });
          return;
        }
        case "del-phrase": {
          if (!confirm("¿Eliminar esta frase?")) return;
          await api(`/api/admin/phrases/${id}`, { method: "DELETE" });
          toast("Frase eliminada");
          return render();
        }
        case "new-promo":
          return promoModal(null);
        case "edit-promo":
          return promoModal((panel._promos || []).find((p) => p.id === id));
        case "toggle-promo": {
          const p = (panel._promos || []).find((x) => x.id === id);
          await api(`/api/admin/promotions/${id}`, {
            method: "PATCH",
            body: { published: !p.published },
          });
          toast(p.published ? "Promoción oculta" : "Promoción publicada");
          return render();
        }
        case "del-promo": {
          if (!confirm("¿Eliminar esta promoción?")) return;
          await api(`/api/admin/promotions/${id}`, { method: "DELETE" });
          closeModal();
          toast("Promoción eliminada");
          return render();
        }
        case "new-instructor":
          return instructorModal(null);
        case "edit-instructor":
          return instructorModal((panel._instructors || []).find((i) => i.id === id));
        case "toggle-instructor": {
          const i = (panel._instructors || []).find((x) => x.id === id);
          await api(`/api/admin/instructors/${id}`, {
            method: "PATCH",
            body: { published: !i.published },
          });
          toast(i.published ? "Instructor oculto" : "Instructor visible");
          return render();
        }
        case "del-instructor": {
          if (!confirm("¿Eliminar a este instructor?")) return;
          await api(`/api/admin/instructors/${id}`, { method: "DELETE" });
          closeModal();
          toast("Instructor eliminado");
          return render();
        }
        case "new-product":
          return productModal(null);
        case "edit-product":
          return productModal((panel._products || []).find((p) => p.id === id));
        case "sell":
          return sellModal((panel._products || []).find((p) => p.id === id));
        case "del-product": {
          if (!confirm("¿Eliminar este producto? El historial de ventas se conserva.")) return;
          await api(`/api/admin/products/${id}`, { method: "DELETE" });
          closeModal();
          toast("Producto eliminado");
          return render();
        }
        case "copy-reminder": {
          const m = (panel._reminders || []).find((r) => r.id === id);
          if (m) copy(reminderText(m));
          return;
        }
      }
    } catch (ex) {
      if (ex.message !== "Sesión expirada") toast(ex.message, true);
    }
  });

  // ---------- Arranque ----------
  api("/api/admin/session")
    .then((s) => (s.authenticated ? showApp() : showLogin()))
    .catch(() => showLogin());
})();
