/** Escenas 5–8: proceso, constelación, precios, cierre (+ bloques "after" sin pin). */
import { $, $$, CHAIN, type Kit, cameraIn, cameraOut, counter, glowOn, maskReveal, offsetWithin, revealAll, rise, sceneTimeline } from "./core";

/** 5. Proceso: la cámara viaja de paso en paso por una pista horizontal. */
export function buildProceso(kit: Kit, section: HTMLElement): void {
  const { gsap } = kit;
  const stage = $(section, "[data-stage]");
  const track = $(section, "[data-track]");
  const steps = $$(section, "[data-step]");
  if (!stage || !track || !steps.length) return;

  // Cambia la cuadrícula a pista horizontal SOLO con JS + movimiento permitido.
  section.dataset.enhanced = "1";
  kit.cleanups.push(() => {
    delete section.dataset.enhanced;
  });

  const centerX = (i: number) => {
    const o = offsetWithin(steps[i], stage);
    return stage.clientWidth / 2 - (o.x + steps[i].offsetWidth / 2);
  };
  const progress = $(section, "[data-progress]");

  const tl = sceneTimeline(kit, section, kit.mode === "mobile" ? 420 : 340);
  gsap.set(track, { x: centerX(0) });
  tl.set(track, { x: () => centerX(0) }, 0);
  if (progress) gsap.set(progress, { scaleX: 0 });
  glowOn(kit, tl, section);
  const label = $(section, ".t-body[data-anim]");
  if (label) tl.add(rise(kit, label, 20), CHAIN);
  const title = $(section, "h2[data-split]");
  if (title) tl.add(maskReveal(kit, title), CHAIN);

  steps.forEach((step, i) => {
    const num = $(step, "[data-step-num]");
    const h3 = $(step, "h3[data-split]");
    const p = $(step, "p[data-anim]");
    if (i > 0) tl.to(track, { x: () => centerX(i), duration: 1.1, ease: "power2.inOut" }, CHAIN);
    if (progress) tl.to(progress, { scaleX: (i + 1) / steps.length, duration: 0.8, ease: "none" }, "<");
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
export function buildConstelacion(kit: Kit, section: HTMLElement): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const stars = $$<SVGCircleElement>(section, "[data-star]");
  const links = $$<SVGLineElement>(section, "[data-link]");
  const countBox = $(section, "[data-cam-target]");
  const num = $(section, "[data-count]");
  const desc = countBox ? $(countBox, "[data-anim]") : null;

  const tl = sceneTimeline(kit, section, 180);
  glowOn(kit, tl, section);
  const title = $(section, "h2[data-split]");
  if (title) tl.add(maskReveal(kit, title), CHAIN);
  if (stars.length) {
    gsap.set(stars, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
    tl.to(stars, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: { amount: 0.8 }, ease: "back.out(3)" }, CHAIN);
  }
  if (links.length) {
    gsap.set(links, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.to(links, { strokeDashoffset: 0, duration: 0.5, stagger: { amount: 0.9 }, ease: "none" }, CHAIN);
  }
  if (countBox) {
    gsap.set(countBox, { y: 40, autoAlpha: 0 });
    tl.to(countBox, { y: 0, autoAlpha: 1, duration: 0.6 }, CHAIN);
  }
  cameraIn(kit, tl, camera, countBox, 1.4);
  if (num) counter(kit, tl, num, CHAIN);
  if (desc) tl.add(rise(kit, desc, 20), CHAIN);
  cameraOut(tl, camera, "+=0.2");

  buildAfter(kit, section);
}

/** 7. Precios: tarjetas suben en cadena; la cámara se acerca al paquete recomendado. */
export function buildPrecios(kit: Kit, section: HTMLElement): void {
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const plans = $$(section, "[data-plan]");
  const featured = $(section, "[data-cam-target]");

  const tl = sceneTimeline(kit, section, 140);
  glowOn(kit, tl, section);
  const label = $(section, ".t-body[data-anim]");
  if (label) tl.add(rise(kit, label, 20), CHAIN);
  const title = $(section, "h2[data-split]");
  if (title) tl.add(maskReveal(kit, title), CHAIN);
  const copy = $(section, "h2 ~ p[data-anim]");
  if (copy) tl.add(rise(kit, copy, 30), CHAIN);
  if (plans.length) tl.add(rise(kit, plans, 90), CHAIN);
  cameraIn(kit, tl, camera, featured, 1.12);
  cameraOut(tl, camera);
}

/** 8. Cierre: "¿Sigues solo en esto?" → botón grande de WhatsApp con la cámara encima. */
export function buildCierre(kit: Kit, section: HTMLElement): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const wa = $(section, "[data-wa]");

  const tl = sceneTimeline(kit, section, 130);
  glowOn(kit, tl, section);
  const title = $(section, "h2[data-split]");
  if (title) tl.add(maskReveal(kit, title), CHAIN);
  const copy = $(section, "h2 ~ p[data-anim]");
  if (copy) tl.add(rise(kit, copy, 30), CHAIN);
  if (wa) {
    gsap.set(wa, { scale: 0.6, autoAlpha: 0, y: 40 });
    tl.to(wa, { scale: 1, autoAlpha: 1, y: 0, duration: 0.7, ease: "back.out(1.8)" }, CHAIN);
  }
  cameraIn(kit, tl, camera, wa, 1.3);
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
  const tl = kit.gsap.timeline({
    scrollTrigger: { trigger: after, start: "top 85%", end: "top 35%", scrub: 0.8 },
  });
  revealAll(kit, tl, after, CHAIN);
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
