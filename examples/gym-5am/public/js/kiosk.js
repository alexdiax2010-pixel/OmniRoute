/* Pantalla de entrada: el socio escribe su código y ve si tiene acceso. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const input = $("[data-code]");
  const display = $("[data-display]");
  const pad = $(".pad");
  const result = $("[data-result]");
  const MIN = 4;
  const MAX = 8;
  const RESULT_MS = 5000;
  let busy = false;
  let resetTimer;

  // Foto opcional: si existe public/img/kiosk.jpg, el servidor lo indica y sustituye la composición SVG.
  fetch("/api/kiosk")
    .then((r) => (r.ok ? r.json() : {}))
    .then((cfg) => cfg.hasPhoto && document.body.classList.add("has-photo"))
    .catch(() => {});

  // ---------- Reloj ----------
  const clock = $("[data-clock]");
  const date = $("[data-date]");
  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    date.textContent = now.toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };
  tick();
  setInterval(tick, 10_000);

  // ---------- Código ----------
  const render = () => {
    const v = input.value;
    const slots = Math.max(MIN, Math.min(MAX, v.length + (v.length < MAX ? 1 : 0)));
    display.innerHTML = "";
    for (let i = 0; i < slots; i++) {
      const s = document.createElement("span");
      s.className = "pad__slot";
      if (i < v.length) {
        s.classList.add("is-filled");
        s.textContent = "•";
      } else if (i === v.length) s.classList.add("is-next");
      display.appendChild(s);
    }
  };
  const setValue = (v) => {
    input.value = v.replace(/\D/g, "").slice(0, MAX);
    render();
  };
  const press = (key) => {
    if (busy) return;
    if (key === "del") setValue(input.value.slice(0, -1));
    else if (key === "enter") submit();
    else setValue(input.value + key);
  };
  const flash = (key) => {
    const el = document.querySelector(key === "enter" ? ".key--go" : `[data-key="${key}"]`);
    if (!el) return;
    el.classList.add("is-pressed");
    setTimeout(() => el.classList.remove("is-pressed"), 120);
  };

  document
    .querySelectorAll("[data-key]")
    .forEach((btn) => btn.addEventListener("click", () => press(btn.dataset.key)));
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!result.hidden && (e.key === "Enter" || e.key === "Escape")) {
      e.preventDefault();
      return reset();
    }
    let key = null;
    if (/^\d$/.test(e.key)) key = e.key;
    else if (e.key === "Backspace" || e.key === "Delete") key = "del";
    else if (e.key === "Enter") key = "enter";
    else if (e.key === "Escape") return setValue("");
    if (!key) return;
    e.preventDefault();
    flash(key);
    press(key);
  });
  $("[data-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  const shake = () => {
    pad.classList.remove("is-shake");
    void pad.offsetWidth;
    pad.classList.add("is-shake");
  };

  // ---------- Resultado ----------
  const fmtDate = (s) =>
    new Date(`${s}T12:00:00`).toLocaleDateString("es", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const days = (n) => (n === 1 ? "1 día" : `${n} días`);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const show = ({ tone, icon, kicker, title, detail }) => {
    result.className = `result result--${tone}`;
    result.style.setProperty("--result-ms", `${RESULT_MS}ms`);
    $("[data-result-icon]").textContent = icon;
    $("[data-result-kicker]").textContent = kicker;
    $("[data-result-title]").textContent = title;
    $("[data-result-detail]").innerHTML = detail;
    result.hidden = false;
    // reinicia la animación de la barra
    const bar = result.querySelector(".result__bar span");
    bar.style.animation = "none";
    void bar.offsetWidth;
    bar.style.animation = "";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(reset, RESULT_MS);
  };

  const reset = () => {
    clearTimeout(resetTimer);
    result.hidden = true;
    busy = false;
    setValue("");
  };
  result.addEventListener("click", reset);

  async function submit() {
    if (busy) return;
    const code = input.value;
    if (code.length < MIN) return shake();
    busy = true;
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 || res.status === 400) {
          show({
            tone: "deny",
            icon: "?",
            kicker: "Código no encontrado",
            title: "Inténtalo de nuevo",
            detail: "Revisa tu código o pide ayuda en recepción.",
          });
        } else {
          show({
            tone: "deny",
            icon: "!",
            kicker: res.status === 429 ? "Demasiados intentos" : "Sin conexión",
            title: "Espera un momento",
            detail: esc(data.error || "No pudimos verificar tu código. Pide ayuda en recepción."),
          });
        }
        return;
      }
      const name = esc(data.firstName);
      if (data.status === "activo") {
        show({
          tone: "ok",
          icon: "↗",
          kicker: "Acceso permitido",
          title: `¡Vamos, ${data.firstName}!`,
          detail: `Tu mensualidad está activa hasta el <strong>${fmtDate(data.endDate)}</strong>.`,
        });
      } else if (data.status === "por_vencer") {
        show({
          tone: "warn",
          icon: "!",
          kicker: "Acceso permitido · Renueva pronto",
          title: `Hola, ${data.firstName}`,
          detail:
            data.daysLeft === 0
              ? `Tu mensualidad <strong>vence hoy</strong>. Renuévala en recepción para seguir entrenando.`
              : `Tu mensualidad vence en <strong>${days(data.daysLeft)}</strong> (${fmtDate(data.endDate)}). Renuévala en recepción.`,
        });
      } else {
        show({
          tone: "deny",
          icon: "×",
          kicker: "Acceso denegado",
          title: `${data.firstName}, renueva tu plan`,
          detail: data.endDate
            ? `Tu mensualidad venció el <strong>${fmtDate(data.endDate)}</strong>. Pasa por recepción para renovarla.`
            : `Aún no tienes una mensualidad activa. Pasa por recepción, ${name}.`,
        });
      }
    } catch {
      show({
        tone: "deny",
        icon: "!",
        kicker: "Sin conexión",
        title: "Espera un momento",
        detail: "No pudimos verificar tu código. Pide ayuda en recepción.",
      });
    }
  }

  render();
  // Mantiene el foco para lectores de código o teclados físicos.
  input.focus({ preventScroll: true });
})();
