/** Escenas 4a–4d: web, maps, redes, chatbot. */
import { $, $$, CHAIN, type Kit, cameraIn, cameraOut, glowOn, maskReveal, rise } from "./core";

/** Título + textos de la columna de copy, en cadena. */
function intro(kit: Kit, tl: gsap.core.Timeline, section: HTMLElement) {
  glowOn(kit, tl, section);
  const label = $(section, "p[data-anim]");
  if (label) tl.add(rise(kit, label, 20), CHAIN);
  const title = $(section, "h2[data-split]");
  if (title) tl.add(maskReveal(kit, title), CHAIN);
  const copy = $$(section, "h2 ~ p[data-anim]");
  if (copy.length) tl.add(rise(kit, copy, 30), CHAIN);
}

/** "Páginas que venden": navegador → la cámara entra → el mini-sitio se arma pieza por pieza. */
export function buildWeb(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const browser = $(section, "[data-cam-target]");
  const parts = $$(section, "[data-mini]");
  const btn = $(section, "[data-mini-btn]");

  intro(kit, entry, section);
  if (browser) {
    gsap.set(browser, { y: 120, scale: 0.85, autoAlpha: 0, rotationX: 18, transformPerspective: 900 });
    entry.to(browser, { y: 0, scale: 1, autoAlpha: 1, rotationX: 0, duration: 1 }, CHAIN);
  }
  if (parts.length) {
    gsap.set(parts, { y: 40, autoAlpha: 0 });
    entry.to(parts, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.18 }, CHAIN);
  }
  cameraIn(kit, tl, camera, browser, 1.1, 0);
  if (btn) {
    gsap.set(btn, { scale: 0 });
    tl.to(btn, { scale: 1, duration: 0.5, ease: "back.out(2.2)" }, CHAIN);
  }
  cameraOut(tl, camera);
}

/** "Que te encuentren en Google Maps": calles se dibujan → cae el pin → zoom → órbita "+1". */
export function buildMaps(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const map = $(section, "[data-street]")?.closest<HTMLElement>("div") ?? null;
  const streets = $$<SVGPathElement>(section, "[data-street]");
  const pin = $(section, "[data-pin]");
  const pinLabel = $(section, "[data-pin-label]");
  const orbit = $(section, "[data-orbit]");
  const ring = $(section, "[data-orbit-ring]");
  const dots = $$(section, "[data-orbit-dot]");
  const core = $(section, "[data-orbit-core]");
  const orbitText = $(section, "p[data-split]");

  intro(kit, entry, section);
  if (map) entry.add(rise(kit, map, 60), CHAIN);
  if (streets.length) {
    gsap.set(streets, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.to(streets, { strokeDashoffset: 0, duration: 0.8, stagger: 0.1, ease: "power2.inOut" }, CHAIN);
  }
  if (pin) {
    gsap.set(pin, { yPercent: -260, autoAlpha: 0 });
    tl.to(pin, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "bounce.out" }, CHAIN);
  }
  if (pinLabel) {
    gsap.set(pinLabel, { scale: 0 });
    tl.to(pinLabel, { scale: 1, duration: 0.4, ease: "back.out(2)" }, CHAIN);
  }
  cameraIn(kit, tl, camera, pin, 1.12, CHAIN, 0.7);
  cameraOut(tl, camera, "+=0.1");

  // Órbita "+1": el núcleo aparece, los puntos se encienden y giran con el scroll.
  if (orbit && core) {
    gsap.set(core, { scale: 0 });
    tl.to(core, { scale: 1, duration: 0.6, ease: "back.out(2)" }, CHAIN);
  }
  if (dots.length) {
    gsap.set(dots, { autoAlpha: 0 });
    tl.to(dots, { autoAlpha: 1, duration: 0.3, stagger: 0.08 }, CHAIN);
  }
  if (ring) tl.to(ring, { rotation: 240, duration: 1.6, ease: "none" }, "<");
  if (orbitText) tl.add(maskReveal(kit, orbitText), "<0.2");
}

/** "Redes que trabajan por ti": posts dispersos se acomodan en cuadrícula → barras crecen. */
export function buildRedes(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const grid = $(section, "[data-cam-target]");
  const posts = $$(section, "[data-post]");
  const chart = $(section, "figure[data-anim]");
  const bars = $$(section, "[data-bar]");

  intro(kit, entry, section);

  if (posts.length) {
    const spread = kit.mode === "mobile" ? 120 : 320;
    gsap.set(posts, {
      x: () => gsap.utils.random(-spread, spread),
      y: () => gsap.utils.random(-spread, spread),
      rotation: () => gsap.utils.random(-35, 35),
      scale: 0.5,
      autoAlpha: 0,
    });
    tl.to(posts, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 1, stagger: { each: 0.06, from: "random" } }, 0);
  }
  cameraIn(kit, tl, camera, grid, 1.1);
  cameraOut(tl, camera);
  if (chart) tl.add(rise(kit, chart, 30), CHAIN);
  if (bars.length) {
    gsap.set(bars, { scaleY: 0 });
    tl.to(bars, { scaleY: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }, CHAIN);
  }
}

/** "Un chatbot que responde a las 3 AM": el reloj corre hasta las 03:00 → burbujas de chat. */
export function buildChatbot(kit: Kit, section: HTMLElement, tl: gsap.core.Timeline, entry: gsap.core.Timeline): void {
  const { gsap } = kit;
  const camera = $(section, "[data-cam]");
  if (!camera) return;
  const clock = $(section, "[data-cam-target]");
  const digital = $(section, "[data-clock]");
  const hourHand = $(section, "[data-hand-hour]");
  const minHand = $(section, "[data-hand-min]");
  const bubbles = $$(section, "[data-bubble]");

  intro(kit, entry, section);
  if (clock) entry.add(rise(kit, clock, 40), CHAIN);
  cameraIn(kit, tl, camera, clock, 1.12, 0);

  // 21:00 → 03:00 (360 minutos) atado al scroll.
  const START = 21 * 60;
  const END = 27 * 60;
  const proxy = { m: START };
  const pad = (n: number) => String(n).padStart(2, "0");
  const render = () => {
    const m = Math.round(proxy.m);
    if (digital) digital.textContent = `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  };
  if (digital) {
    const original = digital.textContent ?? "03:00";
    render();
    kit.cleanups.push(() => {
      digital.textContent = original;
    });
  }
  tl.fromTo(proxy, { m: START }, { m: END, duration: 1.6, ease: "power1.inOut", immediateRender: false, onUpdate: render }, CHAIN);
  if (minHand) tl.fromTo(minHand, { rotation: START * 6, svgOrigin: "50 50" }, { rotation: END * 6, svgOrigin: "50 50", duration: 1.6, ease: "power1.inOut" }, "<");
  if (hourHand) tl.fromTo(hourHand, { rotation: START * 0.5, svgOrigin: "50 50" }, { rotation: END * 0.5, svgOrigin: "50 50", duration: 1.6, ease: "power1.inOut" }, "<");
  if (clock) tl.to(clock, { filter: "drop-shadow(0 0 30px rgba(47,107,255,0.9))", duration: 0.4 }, CHAIN);
  cameraOut(tl, camera);

  if (bubbles.length) {
    gsap.set(bubbles, { y: 30, scale: 0.8, autoAlpha: 0, transformOrigin: (i: number) => (i % 2 ? "100% 100%" : "0% 100%") });
    tl.to(bubbles, { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.35, ease: "back.out(1.8)" }, CHAIN);
  }
}
