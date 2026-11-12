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
    if (!res.ok) throw new Error(data.error || "Error inesperado");
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
    if (!startDate && member?.end_date && member.end_date >= today)
      start = addDays(member.end_date, 1);
    return { start, end: addDays(addMonths(start, plan.months), -1) };
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
      <td class="muted">${m.last_visit ? fmtDateTime(m.last_visit) : "—"}</td>
      <td><div class="row-actions">
        <button class="btn btn--sm btn--lime" data-action="pay" data-id="${m.id}">Cobrar</button>
        <button class="btn btn--sm" data-action="detail" data-id="${m.id}">Ver</button>
      </div></td>
    </tr>`;
  const membersTable = (rows) =>
    rows.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Código</th><th>Socio</th><th>Plan</th><th>Vence</th><th>Estado</th><th>Última entrada</th><th></th></tr></thead>
          <tbody>${rows.map(memberRow).join("")}</tbody></table></div>`
      : `<p class="empty">No hay socios que mostrar.</p>`;

  // ---------- Vistas ----------
  const VIEWS = {
    async resumen() {
      const [s, rem, visits] = await Promise.all([
        api("/api/admin/summary"),
        api("/api/admin/reminders"),
        api(`/api/admin/visits?day=${state.meta.today}`),
      ]);
      panel.innerHTML = `
        <div class="kpis">
          <button class="kpi kpi--feature" data-goto="cobros"><span class="kpi__label">Ingresos del mes</span><span class="kpi__value">${money(s.ingresosMes)}</span></button>
          <button class="kpi kpi--lime" data-goto="socios" data-filter="activo"><span class="kpi__label">Activos</span><span class="kpi__value">${s.activos}</span></button>
          <button class="kpi kpi--amber" data-goto="socios" data-filter="por_vencer"><span class="kpi__label">Por vencer</span><span class="kpi__value">${s.porVencer}</span></button>
          <button class="kpi kpi--red" data-goto="socios" data-filter="vencido"><span class="kpi__label">Vencidos</span><span class="kpi__value">${s.vencidos}</span></button>
          <button class="kpi" data-goto="entradas"><span class="kpi__label">Entradas hoy</span><span class="kpi__value">${s.entradasHoy}</span></button>
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
          <label class="field"><span>Notas (opcional)</span><input name="notes" maxlength="500" /></label>
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
        closeModal();
        toast(
          `Cobro registrado. ${updated.name.split(/\s+/)[0]} queda activo/a hasta el ${fmtDate(updated.end_date)}.`
        );
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
        <div><p class="muted" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">Código de acceso</p><p class="code">${esc(m.code)}</p></div>
        <div style="text-align:right">${pill(m)}<p class="muted" style="font-size:14px;margin-top:6px">${m.end_date ? `Vence el ${fmtDate(m.end_date)} · ${daysText(m)}` : "Sin cobros"}</p></div>
      </div>
      <form data-edit class="stack">
        <div class="form-grid">
          <label class="field full"><span>Nombre</span><input name="name" value="${esc(m.name)}" required maxlength="80" /></label>
          <label class="field"><span>Teléfono</span><input name="phone" type="tel" value="${esc(m.phone)}" maxlength="24" /></label>
          <label class="field"><span>Email</span><input name="email" type="email" value="${esc(m.email)}" maxlength="120" /></label>
          <label class="field full"><span>Notas</span><input name="notes" value="${esc(m.notes)}" maxlength="500" /></label>
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
