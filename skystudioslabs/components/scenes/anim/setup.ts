/**
 * Arranque del sistema de animación (solo cliente). Carga GSAP, ScrollTrigger, SplitText y
 * Lenis con import() dinámico para no inflar el JS inicial del home.
 */
import type { Kit } from "./core";
import { buildCierre, buildConstelacion, buildPrecios, buildProceso, buildReduced } from "./final";
import { buildIntro, buildProblema, buildTachado } from "./narrativa";
import { buildChatbot, buildMaps, buildRedes, buildWeb } from "./servicios";

declare global {
  interface Window {
    /** Progreso maestro del scroll del home (0..1). Lo leen las pruebas e2e. */
    __skyProgress?: number;
  }
}

const BUILDERS: Record<string, (kit: Kit, section: HTMLElement) => void> = {
  intro: buildIntro,
  problema: buildProblema,
  tachado: buildTachado,
  web: buildWeb,
  maps: buildMaps,
  redes: buildRedes,
  chatbot: buildChatbot,
  proceso: buildProceso,
  constelacion: buildConstelacion,
  precios: buildPrecios,
  cierre: buildCierre,
};

export async function setupScenes(root: HTMLElement, onScene: (name: string) => void): Promise<() => void> {
  const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
    import("lenis"),
  ]);
  // Partir texto con la tipografía final ya cargada (si no, las líneas se miden mal).
  try {
    await document.fonts?.ready;
  } catch {
    /* sin Font Loading API: seguimos */
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const html = document.documentElement;
  html.classList.add("js-anim");
  window.__skyProgress = 0;

  const mm = gsap.matchMedia();
  mm.add(
    {
      reduce: "(prefers-reduced-motion: reduce)",
      mobile: "(max-width: 767px)",
      desktop: "(min-width: 768px)",
    },
    (context) => {
      const { reduce, mobile } = (context.conditions ?? {}) as Record<string, boolean>;
      const kit: Kit = {
        gsap,
        ScrollTrigger,
        SplitText,
        mode: mobile ? "mobile" : "desktop",
        maxScale: mobile ? 1.15 : 1.6,
        cleanups: [],
        onScene,
      };

      if (reduce) {
        buildReduced(kit, root);
      } else {
        // Regla 4: Lenis + ScrollTrigger en el mismo reloj (ticker de GSAP).
        const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: mobile ? 0.14 : 0.1 });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        kit.cleanups.push(() => {
          gsap.ticker.remove(raf);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        });

        // Se construyen en orden de documento para que los pins se calculen bien.
        for (const section of Array.from(root.querySelectorAll<HTMLElement>("section[data-scene]"))) {
          const build = BUILDERS[section.dataset.scene ?? ""];
          if (build) build(kit, section);
        }
      }

      // Progreso maestro (0..1) de todo el home.
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          window.__skyProgress = self.progress;
        },
        onRefresh: (self) => {
          window.__skyProgress = self.progress;
        },
      });

      return () => {
        for (const fn of kit.cleanups.splice(0).reverse()) fn();
      };
    },
    root
  );

  ScrollTrigger.refresh();
  html.dataset.animReady = "1";

  // Si cambia el layout por carga tardía (imágenes, formulario), recalcular pins.
  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  let first = true;
  const roTarget = root;
  const roWrap = new ResizeObserver(() => {
    if (first) {
      first = false;
      return;
    }
    ro.disconnect();
  });
  roWrap.disconnect();

  return () => {
    ro.disconnect();
    mm.revert();
    html.classList.remove("js-anim");
    delete html.dataset.animReady;
    void roTarget;
  };
}
