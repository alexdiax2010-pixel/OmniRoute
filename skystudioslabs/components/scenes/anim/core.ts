/**
 * Utilidades compartidas por los constructores de escena.
 * Reglas del sistema de animación:
 *  1) Máscara: textos importantes salen de una máscara (SplitText lines+words, mask:"lines").
 *  2) Encadenado: cada movimiento empieza cuando termina el anterior, con traslape "-=0.2".
 *  3) Cámara: cada escena se fija (pin) y un contenedor [data-cam] hace zoom/paneo (solo transform).
 *  4) Sincronía: todo va atado al scroll con scrub 0.8.
 */
import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerT } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextT } from "gsap/SplitText";

export type Mode = "desktop" | "mobile";

export interface Kit {
  gsap: typeof Gsap;
  ScrollTrigger: typeof ScrollTriggerT;
  SplitText: typeof SplitTextT;
  mode: Mode;
  /** Zoom máximo permitido de la cámara (móvil: 1.15). */
  maxScale: number;
  /** Funciones a ejecutar al revertir (restaurar textos que no maneja GSAP, destruir canvas…). */
  cleanups: Array<() => void>;
  /** Avisar cambio de escena (golpe de sonido sincronizado). */
  onScene: (name: string) => void;
}

/** Traslape estándar entre movimientos encadenados. */
export const CHAIN = "-=0.2";

export function $<T extends Element = HTMLElement>(root: ParentNode, sel: string): T | null {
  return root.querySelector<T>(sel);
}
export function $$<T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** Timeline de escena: fija el [data-stage] (si cabe en pantalla) y lo ata al scroll. */
export function sceneTimeline(kit: Kit, section: HTMLElement, length = 160): gsap.core.Timeline {
  const stage = $(section, "[data-stage]") ?? section;
  const fits = stage.offsetHeight <= window.innerHeight * 1.04;
  const len = kit.mode === "mobile" ? Math.round(length * 0.6) : length;
  const name = section.dataset.scene ?? "";
  return kit.gsap.timeline({
    defaults: { ease: "power2.out", duration: 1 },
    scrollTrigger: fits
      ? {
          trigger: stage,
          start: "top top",
          end: `+=${len}%`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => self.isActive && kit.onScene(name),
        }
      : {
          // Escena más alta que la pantalla (móvil o contenido largo): sin pin, mismo scrub.
          trigger: stage,
          start: "top 85%",
          end: "top 20%",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onToggle: (self) => self.isActive && kit.onScene(name),
        },
  });
}

/**
 * Revelado con máscara (regla 1). Parte en líneas y palabras; cada línea dentro de un
 * contenedor overflow:hidden; las líneas suben de yPercent 110 → 0. Los títulos display
 * además se barren con clip-path inset(). Las palabras .hl cambian de color al final.
 */
export function maskReveal(kit: Kit, el: HTMLElement): gsap.core.Timeline {
  const { gsap, SplitText } = kit;
  const split = SplitText.create(el, {
    type: "lines,words",
    mask: "lines",
    linesClass: "sl",
    wordsClass: "sw",
  });
  const tl = gsap.timeline();
  gsap.set(split.lines, { yPercent: 110 });
  tl.to(split.lines, { yPercent: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" });
  if (el.dataset.split === "display") {
    gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
    tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.inOut" }, 0);
  }
  const hls = $$(el, ".hl");
  if (hls.length) {
    gsap.set(hls, { filter: "grayscale(1) brightness(1.7)" });
    tl.to(hls, { filter: "grayscale(0) brightness(1)", duration: 0.5, ease: "none" }, CHAIN);
  }
  return tl;
}

/** Aparición de elementos secundarios: sube desde abajo con escala (no un fade plano). */
export function rise(kit: Kit, els: Element | Element[], y = 60): gsap.core.Tween {
  kit.gsap.set(els, { y, autoAlpha: 0, scale: 0.96 });
  return kit.gsap.to(els, { y: 0, autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" });
}

/** Posición de `el` dentro de `ancestor` sin contar transforms (offsets de layout). */
export function offsetWithin(el: HTMLElement, ancestor: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== ancestor) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  if (n !== ancestor) {
    const a = ancestor.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return { x: b.left - a.left, y: b.top - a.top };
  }
  return { x, y };
}

/**
 * Cámara (regla 3): zoom + paneo hacia el protagonista. Solo transform (scale/x/y).
 * Un punto a distancia d del centro termina en x + s·d; queremos que quede en d·(1-k).
 */
export function cameraIn(
  kit: Kit,
  tl: gsap.core.Timeline,
  camera: HTMLElement,
  target: HTMLElement | null,
  scale: number,
  position: gsap.Position = CHAIN,
  k = 0.6
): void {
  if (!target) return;
  const s = Math.min(scale, kit.maxScale);
  const delta = () => {
    const o = offsetWithin(target, camera);
    return {
      dx: o.x + target.offsetWidth / 2 - camera.offsetWidth / 2,
      dy: o.y + target.offsetHeight / 2 - camera.offsetHeight / 2,
    };
  };
  tl.to(
    camera,
    {
      scale: s,
      x: () => delta().dx * (1 - k - s),
      y: () => delta().dy * (1 - k - s),
      duration: 1.2,
      ease: "power2.inOut",
    },
    position
  );
}

export function cameraOut(tl: gsap.core.Timeline, camera: HTMLElement, position: gsap.Position = CHAIN): void {
  tl.to(camera, { scale: 1, x: 0, y: 0, duration: 1, ease: "power2.inOut" }, position);
}

/** Contador que corre con el scroll. El HTML del servidor ya trae el valor final (SEO). */
export function counter(kit: Kit, tl: gsap.core.Timeline, el: HTMLElement, position: gsap.Position = CHAIN): void {
  const to = Number(el.dataset.count ?? el.textContent ?? 0) || 0;
  const original = el.textContent ?? String(to);
  const proxy = { v: 0 };
  el.textContent = "0";
  kit.cleanups.push(() => {
    el.textContent = original;
  });
  tl.fromTo(
    proxy,
    { v: 0 },
    {
      v: to,
      duration: 1,
      ease: "power1.out",
      immediateRender: false,
      onUpdate: () => {
        el.textContent = String(Math.round(proxy.v));
      },
    },
    position
  );
}

/** Brillo que "se enciende" al inicio de cada escena. */
export function glowOn(kit: Kit, tl: gsap.core.Timeline, section: HTMLElement): void {
  const glows = $$(section, "[data-glow]");
  if (!glows.length) return;
  kit.gsap.set(glows, { autoAlpha: 0, scale: 0.6 });
  tl.to(glows, { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.1 });
}

/** Revela todos los [data-split] y [data-anim] de un contenedor en cadena (útil para extras). */
export function revealAll(kit: Kit, tl: gsap.core.Timeline, root: HTMLElement, position: gsap.Position = CHAIN): void {
  for (const el of $$(root, "[data-split]")) tl.add(maskReveal(kit, el), position);
  const items = $$(root, "[data-anim]");
  if (items.length) tl.add(rise(kit, items), position);
}
