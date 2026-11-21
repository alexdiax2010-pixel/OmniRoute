/** Escenas 1–3: intro, problema, tachado. */
import { $, $$, CHAIN, type Kit, cameraIn, cameraOut, counter, glowOn, maskReveal, rise } from "./core";
import { createParticleText } from "./particles";

/**
 * 1. Intro. La entrada (brasas → horizonte → sol que sale → máscara del lema → CTA) es CSS puro y
 * corre desde el primer frame, sin esperar a JS; el h1 (elemento LCP) se pinta completo desde el
 * servidor y solo lo cruza un destello decorativo. Aquí va la parte atada al scroll: el sol termina
 * de salir, la cámara viaja al círculo "boceto gratis" y regresa.
 */
export function buildIntro(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline): void {
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const sun = $(section, "[data-sun]");
  const badge = $(section, "[data-cam-target]");
  const content = $(section, "[data-intro-content]");

  if (sun) tl.to(sun, { yPercent: -45, scale: 1.25, duration: 1.4, ease: "power1.inOut" });
  cameraIn(kit, tl, camera, badge, 1.35, CHAIN, 0.55);
  if (badge) tl.to(badge, { rotation: 120, duration: 1.2, ease: "none" }, "<");
  cameraOut(tl, camera);
  if (content) tl.to(content, { yPercent: -18, autoAlpha: 0.25, duration: 0.8 }, CHAIN);
}

/** 2. Problema: título → buscador escribe → resultados pasan volando → "¿Y tu negocio? No aparece." */
export function buildProblema(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const title = $(section, "h2[data-split]");
  const search = $(section, "[data-cam-target]");
  const typed = $(section, "[data-typed]");
  const copy = $$(section, "p[data-anim]");
  const groupA = $$(section, '[data-result="a"]');
  const groupB = $$(section, '[data-result="b"]');
  const you = $(section, '[data-result="you"]');

  glowOn(kit, tl, section);
  if (title) tl.add(maskReveal(kit, title), CHAIN);
  if (copy.length) tl.add(rise(kit, copy, 30), CHAIN);
  if (search) tl.add(rise(kit, search, 40), CHAIN);
  cameraIn(kit, tl, camera, search, 1.25);

  // Escritura atada al scroll: t 0→1 escribe q1, 1→2 la borra, 2→3 escribe q2.
  if (typed) {
    let queries: string[] = [];
    try {
      queries = JSON.parse(typed.dataset.queries ?? "[]") as string[];
    } catch {
      queries = [typed.textContent ?? ""];
    }
    const [q1 = "", q2 = q1] = queries;
    const original = typed.textContent ?? q1;
    const state = { t: 0 };
    const render = () => {
      const t = state.t;
      typed.textContent =
        t <= 1 ? q1.slice(0, Math.round(t * q1.length)) : t <= 2 ? q1.slice(0, Math.round((2 - t) * q1.length)) : q2.slice(0, Math.round((t - 2) * q2.length));
    };
    render();
    kit.cleanups.push(() => {
      typed.textContent = original;
    });
    const typeTo = (from: number, to: number, pos: gsap.Position) =>
      tl.fromTo(state, { t: from }, { t: to, duration: 0.9, ease: "none", immediateRender: false, onUpdate: render }, pos);

    const flyPast = (items: HTMLElement[]) => {
      if (!items.length) return;
      gsap.set(items, { y: 140, autoAlpha: 0, rotation: () => gsap.utils.random(-6, 6) });
      tl.to(items, { y: 0, autoAlpha: 1, rotation: 0, duration: 0.6, stagger: 0.12 }, CHAIN);
      tl.to(items, { y: -160, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: "power2.in" }, CHAIN);
    };

    typeTo(0, 1, CHAIN);
    flyPast(groupA);
    typeTo(1, 2, CHAIN);
    typeTo(2, 3, CHAIN);
    flyPast(groupB);
  }
  if (you) {
    gsap.set(you, { y: 120, autoAlpha: 0, scale: 0.9 });
    tl.to(you, { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.7)" }, CHAIN);
  }
  cameraOut(tl, camera);
}

/** 3. Tachado: "SIN PÁGINA. SIN GOOGLE MAPS." → línea roja → partículas → "CON SKY STUDIOS LABS" → contadores. */
export function buildTachado(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const lines = $$(section, "[data-strike-line]");
  const withText = $(section, "[data-particle-source]");
  const canvas = $<HTMLCanvasElement>(section, "canvas[data-particles]");
  const countersBox = $(section, "[data-cam-target]");
  const counterItems = $$(section, "[data-anim]");
  const nums = $$(section, "[data-count]");

  glowOn(kit, tl, section);

  for (const line of lines) {
    const txt = $(line, "[data-split]");
    if (txt) tl.add(maskReveal(kit, txt), CHAIN);
  }
  for (const line of lines) {
    const path = $<SVGPathElement>(line, "[data-strike]");
    if (!path) continue;
    gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.to(path, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, CHAIN);
  }
  const strikeTexts = lines.map((l) => $(l, "[data-split]")).filter((x): x is HTMLElement => !!x);
  if (strikeTexts.length) tl.to(strikeTexts, { autoAlpha: 0.35, duration: 0.4 }, CHAIN);

  // Partículas (solo escritorio): se arman y luego ceden el lugar al texto real.
  if (withText && canvas && kit.mode === "desktop") {
    canvas.style.display = "block";
    const pt = createParticleText(canvas, withText, () => $$(withText, ".sw"));
    kit.cleanups.push(() => {
      pt.destroy();
      canvas.style.display = "";
    });
    const proxy = { p: 0 };
    tl.fromTo(
      proxy,
      { p: 0 },
      { p: 1, duration: 1.2, ease: "none", immediateRender: false, onUpdate: () => pt.setProgress(proxy.p) },
      CHAIN
    );
    if (withText) tl.add(maskReveal(kit, withText), "-=0.3");
    tl.to(canvas, { autoAlpha: 0, duration: 0.4 }, "-=0.5");
  } else if (withText) {
    tl.add(maskReveal(kit, withText), CHAIN);
  }

  if (counterItems.length) tl.add(rise(kit, counterItems, 40), CHAIN);
  cameraIn(kit, tl, camera, countersBox, 1.3);
  nums.forEach((n, i) => counter(kit, tl, n, i === 0 ? CHAIN : "<0.1"));
  cameraOut(tl, camera, "+=0.2");
}
