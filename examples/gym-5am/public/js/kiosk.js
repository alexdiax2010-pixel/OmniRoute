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
  // También trae las promociones vigentes y los instructores que el dueño publicó.
  const loadKiosk = () =>
    fetch("/api/kiosk")
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => {
        if (cfg.hasPhoto) document.body.classList.add("has-photo");
        phrases = cfg.phrases || [];
        renderBoard(cfg.promotions || [], cfg.instructors || [], cfg.streaks || [], phrases);
      })
      .catch(() => {});

  // ---------- Promociones e instructores ----------
  const board = document.querySelector("[data-board]");
  let slides = [];
  let slideIdx = 0;
  let slideTimer;
  const escB = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  const untilText = (d) =>
    d
      ? `Válida hasta el ${new Date(`${d}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "long" })}`
      : "";
  const showSlide = (i) => {
    if (!slides.length) return;
    slideIdx = (i + slides.length) % slides.length;
    const el = board.querySelector("[data-board-slide]");
    el.innerHTML = slides[slideIdx];
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    board
      .querySelectorAll("[data-board-dots] span")
      .forEach((d, j) => d.classList.toggle("is-on", j === slideIdx));
  };
  let phrases = [];
  function renderBoard(promos, coaches, streaks = [], quotes = []) {
    slides = [
      ...promos.map(
        (p) => `<span class="board__tag">Promoción</span>
          <h2 class="board__title">${escB(p.title)}</h2>
          ${p.price_text ? `<p class="board__price">${escB(p.price_text)}</p>` : ""}
          ${p.description ? `<p class="board__text">${escB(p.description)}</p>` : ""}
          ${p.ends_on ? `<p class="board__meta">${escB(untilText(p.ends_on))}</p>` : ""}`
      ),
      ...coaches.map(
        (c) => `<span class="board__tag board__tag--coach">Instructor</span>
          <h2 class="board__title">${escB(c.name)}</h2>
          ${c.specialty ? `<p class="board__text">${escB(c.specialty)}</p>` : ""}
          ${c.schedule ? `<p class="board__meta">${escB(c.schedule)}</p>` : ""}`
      ),
      ...(streaks.length
        ? [
            `<span class="board__tag">Rachas</span>
          <h2 class="board__title">Los más constantes</h2>
          <ol class="board__rank">${streaks
            .map((m, i) => `<li><span>${i + 1}</span>${escB(m.name)}<b>${m.streak} días</b></li>`)
            .join("")}</ol>`,
          ]
        : []),
      ...quotes
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(
          (q) => `<span class="board__tag board__tag--coach">Frase del día</span>
          <p class="board__quote">“${escB(q)}”</p>`
        ),
    ];
    board.hidden = !slides.length;
    board.querySelector("[data-board-dots]").innerHTML =
      slides.length > 1 ? slides.map(() => "<span></span>").join("") : "";
    clearInterval(slideTimer);
    showSlide(0);
    if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      slideTimer = setInterval(() => showSlide(slideIdx + 1), 7000);
    }
  }
  loadKiosk();
  // La pantalla de entrada se queda abierta todo el día: refresca lo publicado cada 10 minutos.
  setInterval(loadKiosk, 10 * 60 * 1000);

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

  // Sonido corto de confirmación (Web Audio, sin archivos). Se activa tras la primera pulsación.
  let audio;
  const beep = (tone) => {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const notes = tone === "ok" ? [660, 990] : tone === "warn" ? [660, 660] : [220, 165];
      notes.forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const t = audio.currentTime + i * 0.14;
        osc.type = tone === "deny" ? "square" : "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch {
      /* sin audio disponible: la pantalla funciona igual */
    }
  };

  // Antigüedad legible para el socio: "1 año y 3 meses".
  const tenureText = (from) => {
    if (!from) return "";
    const now = new Date();
    const [y, m, d] = from.split("-").map(Number);
    let months =
      (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < d ? 1 : 0);
    if (months < 1) return "";
    const yy = Math.floor(months / 12);
    months %= 12;
    return [
      yy ? `${yy} ${yy === 1 ? "año" : "años"}` : "",
      months ? `${months} ${months === 1 ? "mes" : "meses"}` : "",
    ]
      .filter(Boolean)
      .join(" y ");
  };
  const statsFor = (data) => {
    const out = [];
    if (data.visitsThisMonth)
      out.push(
        `<li><b>${data.visitsThisMonth}</b> ${data.visitsThisMonth === 1 ? "visita" : "visitas"} este mes</li>`
      );
    if (data.streak >= 2) out.push(`<li>Racha de <b>${data.streak}</b> días seguidos</li>`);
    const t = tenureText(data.joinedOn);
    if (t) out.push(`<li>Socio desde hace <b>${t}</b></li>`);
    else if (data.joinedOn) out.push(`<li><b>¡Bienvenido!</b> Tu primer mes con nosotros</li>`);
    return out.join("");
  };

  const randomPhrase = () =>
    phrases.length ? phrases[Math.floor(Math.random() * phrases.length)] : "";

  const show = ({ tone, icon, kicker, title, detail, daysLeft, stats = "", quote = "" }) => {
    beep(tone);
    result.className = `result result--${tone}`;
    result.style.setProperty("--result-ms", `${RESULT_MS}ms`);
    const iconEl = $("[data-result-icon]");
    const hasDays = Number.isInteger(daysLeft) && daysLeft >= 0;
    iconEl.classList.toggle("result__icon--days", hasDays);
    iconEl.textContent = hasDays ? daysLeft : icon;
    $("[data-result-days]").textContent = hasDays
      ? daysLeft === 1
        ? "día restante"
        : "días restantes"
      : "";
    $("[data-result-kicker]").textContent = kicker;
    $("[data-result-title]").textContent = title;
    $("[data-result-detail]").innerHTML = detail;
    $("[data-result-stats]").innerHTML = stats;
    $("[data-result-quote]").textContent = quote ? `“${quote}”` : "";
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
          daysLeft: data.daysLeft,
          stats: statsFor(data),
          quote: randomPhrase(),
          kicker: "Acceso permitido",
          title: `¡Vamos, ${data.firstName}!`,
          detail: `Tu mensualidad está activa hasta el <strong>${fmtDate(data.endDate)}</strong>.`,
        });
      } else if (data.status === "por_vencer") {
        show({
          tone: "warn",
          icon: "!",
          daysLeft: data.daysLeft,
          stats: statsFor(data),
          quote: randomPhrase(),
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
