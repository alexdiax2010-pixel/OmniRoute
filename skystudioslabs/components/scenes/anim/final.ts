/** Escenas 5–8: proceso, constelación, precios, cierre (+ bloques "after" sin pin). */
import { $, $$, CHAIN, type Kit, cameraIn, cameraOut, counter, glowOn, maskReveal, offsetWithin, revealAll, rise } from "./core";

/** 5. Proceso: la cámara viaja de paso en paso por una pista horizontal. */
export function buildProceso(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const stage = $(section, "[data-stage]");
  const track = $(section, "[data-track]");
  const steps = $$(section, "[data-step]");
  if (!stage || !track || !steps.length) return;

  const centerX = (i: number) => {
    const o = offsetWithin(steps[i], stage);
    return stage.clientWidth / 2 - (o.x + steps[i].offsetWidth / 2);
  };
  const progress = $(section, "[data-progress]");

  gsap.set(track, { x: centerX(0) });
  tl.set(track, { x: () => centerX(0) }, 0);
  if (progress) gsap.set(progress, { scaleX: 0 });
  // Entrada: brillo → título → paso 1 completo (antes del pin).
  glowOn(kit, entry, section);
  const label = $(section, ".t-body[data-anim]");
  if (label) entry.add(rise(kit, label, 20), CHAIN);
  const title = $(section, "h2[data-split]");
  if (title) entry.add(maskReveal(kit, title), CHAIN);

  steps.forEach((step, i) => {
    const num = $(step, "[data-step-num]");
    const h3 = $(step, "h3[data-split]");
    const p = $(step, "p[data-anim]");
    const tl0 = i === 0 ? entry : tl;
    if (i > 0) tl.to(track, { x: () => centerX(i), duration: 1.1, ease: "power2.inOut" }, i === 1 ? 0.2 : CHAIN);
    if (progress) tl0.to(progress, { scaleX: (i + 1) / steps.length, duration: 0.8, ease: "none" }, i === 0 ? CHAIN : "<");
    if (i === 0) {
      if (num) {
        gsap.set(num, { scale: 0.4, autoAlpha: 0 });
        entry.to(num, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }, "<");
      }
      if (h3) entry.add(maskReveal(kit, h3), "<");
      if (p) entry.add(rise(kit, p, 30), CHAIN);
      return;
    }
    if (num) {
      gsap.set(num, { scale: 0.4, autoAlpha: 0 });
      // Zoom al protagonista (el número) y regreso.
      tl.to(num, { scale: Math.min(1.25, kit.maxScale + 0.1), autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }, CHAIN);
      tl.to(num, { scale: 1, duration: 0.4 }, CHAIN);
    }
    if (h3) tl.add(maskReveal(kit, h3), "<");
    if (p) tl.add(rise(kit, p, 30), CHAIN);
  });
  tl.to({}, { duration: 0.4 });
}

/** 6. Constelación: las estrellas (una por sitio publicado) se conectan; contador real. */
export function buildConstelacion(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const stars = $$<SVGCircleElement>(section, "[data-star]");
  const links = $$<SVGLineElement>(section, "[data-link]");
  const countBox = $(section, "[data-cam-target]");
  const num = $(section, "[data-count]");
  const desc = countBox ? $(countBox, "[data-anim]") : null;

  // Entrada: brillo → título → aparecen las estrellas → el contador real (antes del pin).
  glowOn(kit, entry, section);
  const title = $(section, "h2[data-split]");
  if (title) entry.add(maskReveal(kit, title), CHAIN);
  if (stars.length) {
    gsap.set(stars, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
    entry.to(stars, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: { amount: 0.6 }, ease: "back.out(3)" }, CHAIN);
  }
  if (countBox) {
    gsap.set(countBox, { y: 40, autoAlpha: 0 });
    entry.to(countBox, { y: 0, autoAlpha: 1, duration: 0.6 }, CHAIN);
  }
  if (num) counter(kit, entry, num, CHAIN);
  // Fijada: las estrellas se conectan → la cámara va al número y regresa.
  if (links.length) {
    gsap.set(links, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.to(links, { strokeDashoffset: 0, duration: 0.6, stagger: { amount: 0.9 }, ease: "none" }, 0);
  }
  cameraIn(kit, tl, camera, countBox, 1.2);
  if (desc) tl.add(rise(kit, desc, 20), "<0.2");
  cameraOut(tl, camera, "+=0.2");

  buildAfter(kit, section);
}

/** 7. Precios: tarjetas suben en cadena; la cámara se acerca al paquete recomendado. */
export function buildPrecios(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const plans = $$(section, "[data-plan]");
  const featured = $(section, "[data-cam-target]");

  glowOn(kit, entry, section);
  const label = $(section, ".t-body[data-anim]");
  if (label) entry.add(rise(kit, label, 20), CHAIN);
  const title = $(section, "h2[data-split]");
  if (title) entry.add(maskReveal(kit, title), CHAIN);
  const copy = $(section, "h2 ~ p[data-anim]");
  if (copy) entry.add(rise(kit, copy, 30), CHAIN);
  if (plans.length) entry.add(rise(kit, plans, 90), CHAIN);
  cameraIn(kit, tl, camera, featured, 1.06, 0);
  cameraOut(tl, camera);
}

/** 8. Cierre: "¿Sigues solo en esto?" → botón grande de WhatsApp con la cámara encima. */
export function buildCierre(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const wa = $(section, "[data-wa]");

  // Entrada: brillo → pregunta → texto → botón de WhatsApp (todo completo antes del pin).
  glowOn(kit, entry, section);
  const title = $(section, "h2[data-split]");
  if (title) entry.add(maskReveal(kit, title), CHAIN);
  const copy = $(section, "h2 ~ p[data-anim]");
  if (copy) entry.add(rise(kit, copy, 30), CHAIN);
  if (wa) {
    gsap.set(wa, { scale: 0.6, autoAlpha: 0, y: 40 });
    entry.to(wa, { scale: 1, autoAlpha: 1, y: 0, duration: 0.7, ease: "back.out(1.8)" }, CHAIN);
  }
  // Fijada: la cámara se acerca al botón, pulso, y regresa (el botón nunca se oculta).
  cameraIn(kit, tl, camera, wa, 1.2, 0);
  if (wa) {
    tl.to(
      wa,
      { boxShadow: "0 0 0 24px rgba(37, 211, 102, 0), 0 30px 90px -20px rgba(37, 211, 102, 0.8)", duration: 0.6 },
      CHAIN
    );
  }
  cameraOut(tl, camera);

  buildAfter(kit, section);
}

/** Bloques fuera del escenario fijado (reseñas, formulario): revelado con scrub, sin pin. */
function buildAfter(kit: Kit, section: HTMLElement): void {
  const after = Array.from(section.children).find(
    (c): c is HTMLElement => c instanceof HTMLElement && !c.hasAttribute("data-stage")
  );
  if (!after) return;
  // Se reproduce completo (por tiempo) al asomar: nunca queda un título a medio enmascarar en reposo.
  const tl = kit.gsap.timeline({
    paused: true,
    scrollTrigger: { trigger: after, start: "top 92%", toggleActions: "play none none none" },
  });
  revealAll(kit, tl, after, CHAIN);
  tl.timeScale(1.4);
}

/** prefers-reduced-motion: sin pin, sin zoom, sin partículas. Textos: fade corto 0.3s. */
export function buildReduced(kit: Kit, root: HTMLElement): void {
  for (const el of $$(root, "[data-split], [data-anim], [data-plan]")) {
    kit.gsap.from(el, {
      opacity: 0,
      duration: 0.3,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none none" },
    });
  }
}
