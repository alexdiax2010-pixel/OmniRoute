/* AURUM Athletic Club — interacciones (JavaScript sin dependencias). */
(() => {
  "use strict";

  document.documentElement.classList.add("js");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: fondo al hacer scroll + menú móvil ---------- */
  const nav = $("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-mobile-menu]");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Cerrar menú" : "Abrir menú";
    menu.hidden = !open;
    nav.classList.toggle("is-scrolled", open || window.scrollY > 24);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });
  window
    .matchMedia("(min-width: 1081px)")
    .addEventListener("change", (e) => e.matches && setMenu(false));

  /* ---------- Enlace activo según la sección visible ---------- */
  const navLinks = $$(".nav__links a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.classList.toggle("is-current", a.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navLinks.forEach((a) => {
    const target = $(a.getAttribute("href"));
    if (target) sectionObserver.observe(target);
  });

  /* ---------- Aparición escalonada al hacer scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  $$(".reveal").forEach((el) => {
    const siblings = $$(":scope > .reveal", el.parentElement);
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
    revealObserver.observe(el);
  });

  /* ---------- Contadores del hero ---------- */
  const fmt = new Intl.NumberFormat("es-ES");
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const end = Number(el.dataset.count);
      if (reduceMotion) return;
      const start = performance.now();
      const dur = 1800;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt.format(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
  $$("[data-count]").forEach((el) => countObserver.observe(el));

  /* ---------- Membresías: mensual / anual ---------- */
  const billingButtons = $$("[data-billing]");
  billingButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const mode = btn.dataset.billing;
      billingButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      $$("[data-price-monthly]").forEach((el) => {
        el.classList.add("is-swapping");
        setTimeout(() => {
          el.textContent = mode === "annual" ? el.dataset.priceAnnual : el.dataset.priceMonthly;
          el.classList.remove("is-swapping");
        }, 200);
      });
    })
  );

  /* Al elegir un plan, se preselecciona en el formulario. */
  $$("[data-plan]").forEach((a) =>
    a.addEventListener("click", () => {
      const select = $("#f-plan");
      if (select) select.value = a.dataset.plan;
    })
  );

  /* ---------- Horarios (datos de muestra) ---------- */
  const SCHEDULE = {
    Lun: [
      ["06:30", "Strength Foundations", "Elena Márquez", "Sala de fuerza", "Todos", 60],
      ["08:00", "Reformer Flow", "Lucía Serrano", "Studio", "Todos", 50],
      ["13:00", "Engine 45", "Diego Ramos", "Performance lab", "Medio", 45],
      ["19:00", "Boxing Technique", "Mateo Vidal", "Ring", "Todos", 60],
    ],
    Mar: [
      ["07:00", "Olympic Lifting", "Elena Márquez", "Plataformas", "Alto", 75],
      ["12:30", "Mobility Reset", "Lucía Serrano", "Studio", "Todos", 40],
      ["18:30", "Hyrox Prep", "Diego Ramos", "Performance lab", "Alto", 60],
      ["20:00", "Recovery Ritual", "Equipo AURUM", "Recovery lounge", "Todos", 45],
    ],
    Mié: [
      ["06:30", "Strength Foundations", "Elena Márquez", "Sala de fuerza", "Todos", 60],
      ["09:00", "Reformer Sculpt", "Lucía Serrano", "Studio", "Medio", 50],
      ["13:00", "Engine 45", "Diego Ramos", "Performance lab", "Medio", 45],
      ["19:30", "Boxing Conditioning", "Mateo Vidal", "Ring", "Alto", 60],
    ],
    Jue: [
      ["07:00", "Power & Speed", "Diego Ramos", "Performance lab", "Alto", 60],
      ["12:30", "Reformer Flow", "Lucía Serrano", "Studio", "Todos", 50],
      ["18:00", "Strength Hypertrophy", "Elena Márquez", "Sala de fuerza", "Medio", 60],
      ["20:00", "Recovery Ritual", "Equipo AURUM", "Recovery lounge", "Todos", 45],
    ],
    Vie: [
      ["06:30", "Engine 45", "Diego Ramos", "Performance lab", "Medio", 45],
      ["08:00", "Reformer Sculpt", "Lucía Serrano", "Studio", "Medio", 50],
      ["18:30", "Fight Night Drills", "Mateo Vidal", "Ring", "Alto", 75],
    ],
    Sáb: [
      ["09:00", "Team Workout", "Equipo AURUM", "Sala de fuerza", "Todos", 75],
      ["11:00", "Reformer Flow", "Lucía Serrano", "Studio", "Todos", 50],
      ["12:30", "Sauna & Cold Social", "Equipo AURUM", "Recovery lounge", "Todos", 60],
    ],
    Dom: [
      ["10:00", "Long Mobility", "Lucía Serrano", "Studio", "Todos", 60],
      ["11:30", "Open Gym con coach", "Equipo AURUM", "Sala de fuerza", "Todos", 120],
    ],
  };

  const tabs = $("[data-tabs]");
  const schedule = $("[data-schedule]");
  const days = Object.keys(SCHEDULE);
  const todayIndex = (new Date().getDay() + 6) % 7;

  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const renderDay = (day) => {
    schedule.setAttribute("aria-labelledby", `tab-${day}`);
    schedule.innerHTML = SCHEDULE[day]
      .map(
        ([time, name, coach, room, level, mins], i) => `
        <div class="slot" style="animation-delay:${i * 0.06}s">
          <p class="slot__time">${esc(time)}<small>${esc(mins)} min</small></p>
          <p class="slot__name">${esc(name)}</p>
          <p class="slot__coach">${esc(coach)}</p>
          <p class="slot__room">${esc(room)}</p>
          <span class="slot__level ${level === "Alto" ? "slot__level--alto" : ""}">${esc(level)}</span>
        </div>`
      )
      .join("");
  };

  const selectTab = (btn, focus) => {
    $$(".tab", tabs).forEach((t) => {
      const on = t === btn;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) btn.focus();
    renderDay(btn.dataset.day);
  };

  days.forEach((day, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.id = `tab-${day}`;
    btn.role = "tab";
    btn.dataset.day = day;
    btn.textContent = day;
    btn.addEventListener("click", () => selectTab(btn));
    btn.addEventListener("keydown", (e) => {
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const all = $$(".tab", tabs);
      selectTab(all[(all.indexOf(btn) + dir + all.length) % all.length], true);
    });
    tabs.appendChild(btn);
    if (i === todayIndex) selectTab(btn);
  });

  /* ---------- Testimonios ---------- */
  const slider = $("[data-slider]");
  if (slider) {
    const quotes = $$(".quote", slider);
    const dots = $$(".quote-slider__nav button", slider);
    let current = 0;
    let timer;
    const show = (i) => {
      current = i;
      quotes.forEach((q, j) => q.classList.toggle("is-active", j === i));
      dots.forEach((d, j) => {
        d.classList.toggle("is-active", j === i);
        d.setAttribute("aria-current", j === i ? "true" : "false");
      });
    };
    const start = () => {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => show((current + 1) % quotes.length), 6500);
    };
    dots.forEach((d, i) =>
      d.addEventListener("click", () => {
        show(i);
        start();
      })
    );
    slider.addEventListener("mouseenter", () => clearInterval(timer));
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  /* ---------- FAQ: un solo elemento abierto a la vez ---------- */
  const faqItems = $$(".faq details");
  faqItems.forEach((d) =>
    d.addEventListener("toggle", () => {
      if (d.open) faqItems.forEach((o) => o !== d && (o.open = false));
    })
  );

  /* ---------- Formulario de prueba privada ---------- */
  const form = $("[data-form]");
  if (form) {
    const rules = {
      name: (v) => (v.trim().length >= 3 ? "" : "Indica tu nombre completo."),
      phone: (v) => (/^[+\d][\d\s().-]{6,}$/.test(v.trim()) ? "" : "Introduce un teléfono válido."),
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Introduce un email válido.",
    };
    const validateField = (input) => {
      const msg = rules[input.name] ? rules[input.name](input.value) : "";
      const field = input.closest(".field");
      field.classList.toggle("is-invalid", Boolean(msg));
      input.setAttribute("aria-invalid", String(Boolean(msg)));
      $(".field__error", field).textContent = msg;
      return !msg;
    };
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener(
        "input",
        () => input.closest(".field").classList.contains("is-invalid") && validateField(input)
      );
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fieldsOk = Object.keys(rules)
        .map((n) => validateField(form.elements[n]))
        .every(Boolean);
      const consentOk = form.elements.consent.checked;
      $("[data-consent-error]").textContent = consentOk
        ? ""
        : "Necesitamos tu consentimiento para contactarte.";
      if (!fieldsOk || !consentOk) {
        const firstInvalid = form.querySelector("[aria-invalid='true']") || form.elements.consent;
        firstInvalid.focus();
        return;
      }
      /* Punto de integración: enviar los datos al CRM o al backend del gimnasio.
       * Ejemplo: fetch("/api/leads", { method: "POST", body: new FormData(form) }) */
      $("[data-success-name]").textContent = form.elements.name.value.trim().split(" ")[0];
      $("[data-success]").hidden = false;
    });
  }

  /* ---------- Fotografía real (opcional) ----------
   * Para usar fotos, añade data-photo-src="ruta/imagen.jpg" a cualquier elemento con data-photo. */
  $$("[data-photo-src]").forEach((el) => {
    el.style.backgroundImage = `url("${el.dataset.photoSrc}")`;
  });

  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
