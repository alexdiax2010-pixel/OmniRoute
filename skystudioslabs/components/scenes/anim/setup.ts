/**
 * Arranque del sistema de animación (solo cliente), pensado para no bloquear el hilo principal:
 *  1. GSAP / ScrollTrigger / SplitText / Lenis se cargan con import() dinámico (el orquestador
 *     además espera a `load` + requestIdleCallback antes de llamar aquí).
 *  2. "Preparar": en una sola pasada se LEEN todas las alturas (sin escrituras intercaladas) y luego
 *     se crean los ScrollTrigger con pin de las 11 escenas, con timelines vacíos. Es barato y fija
 *     la longitud final de la página (los pins nunca cambian después → sin saltos).
 *  3. "Llenar": el contenido de cada timeline (SplitText, tweens) se construye de forma perezosa,
 *     cuando la escena se acerca al viewport, una escena por tarea y cediendo el hilo entre escenas.
 */
import type { Kit } from "./core";
import { $, sceneTimeline } from "./core";
import { buildCierre, buildConstelacion, buildPrecios, buildProceso, buildReduced } from "./final";
import { buildIntro, buildProblema, buildTachado } from "./narrativa";
import { buildChatbot, buildMaps, buildRedes, buildWeb } from "./servicios";

declare global {
  interface Window {
    /** Progreso maestro del scroll del home (0..1). Lo leen las pruebas e2e. */
    __skyProgress?: number;
  }
}

type Builder = (kit: Kit, section: HTMLElement, tl: gsap.core.Timeline) => void;

/** Constructor + longitud del pin (% de viewport) por escena. */
const SCENES: Record<string, { build: Builder; length: (mobile: boolean) => number }> = {
  intro: { build: buildIntro, length: () => 120 },
  problema: { build: buildProblema, length: () => 200 },
  tachado: { build: buildTachado, length: () => 200 },
  web: { build: buildWeb, length: () => 170 },
  maps: { build: buildMaps, length: () => 200 },
  redes: { build: buildRedes, length: () => 170 },
  chatbot: { build: buildChatbot, length: () => 190 },
  proceso: { build: buildProceso, length: (m) => (m ? 420 : 340) },
  constelacion: { build: buildConstelacion, length: () => 180 },
  precios: { build: buildPrecios, length: () => 140 },
  cierre: { build: buildCierre, length: () => 130 },
};

/** Cede el hilo principal (scheduler.yield si existe; si no, un macrotask). */
function yieldToMain(): Promise<void> {
  const sched = (globalThis as unknown as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sched?.yield) return sched.yield();
  return new Promise((r) => setTimeout(r, 0));
}

/** Instancia activa: evita que la limpieza de una instancia vieja (StrictMode) borre las marcas de la nueva. */
let activeToken = 0;

export async function setupScenes(
  root: HTMLElement,
  onScene: (name: string) => void,
  isCancelled: () => boolean = () => false
): Promise<() => void> {
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
  if (isCancelled()) return () => {};
  await yieldToMain(); // la evaluación de los chunks queda en su propia tarea
  if (isCancelled()) return () => {};
  const token = ++activeToken;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const html = document.documentElement;
  html.classList.add("js-anim");
  window.__skyProgress = 0;

  let markReady: () => void = () => {};
  const ready = new Promise<void>((r) => {
    markReady = r;
  });

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
      let alive = true;
      kit.cleanups.push(() => {
        alive = false;
      });

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

        const sections = Array.from(root.querySelectorAll<HTMLElement>("section[data-scene]")).filter(
          (s) => SCENES[s.dataset.scene ?? ""]
        );

        // --- Preparar: primero escrituras de layout, luego TODAS las lecturas, luego los pins. ---
        const proceso = sections.find((s) => s.dataset.scene === "proceso");
        if (proceso) {
          // Pista horizontal SOLO con JS + movimiento permitido (sin JS es una cuadrícula).
          proceso.dataset.enhanced = "1";
          kit.cleanups.push(() => {
            delete proceso.dataset.enhanced;
          });
        }
        const vh = window.innerHeight;
        const measured = sections.map((section) => {
          const stage = $(section, "[data-stage]") ?? section;
          return { section, stage, fits: stage.offsetHeight <= vh * 1.04 };
        });
        const scenes = measured.map(({ section, stage, fits }) => ({
          section,
          stage,
          fits,
          def: SCENES[section.dataset.scene ?? ""],
          tl: null as gsap.core.Timeline | null,
          filled: false,
        }));

        // --- Llenar de forma perezosa, en orden, una escena por tarea. ---
        let pending = 0; // índice hasta el que hay que llenar (exclusivo)
        let running = false;
        const fillUpTo = async (index: number) => {
          pending = Math.max(pending, index + 1);
          if (running) return;
          running = true;
          for (let i = 0; i < pending && alive; i++) {
            const sc = scenes[i];
            if (sc.filled || !sc.tl) continue;
            const tl = sc.tl;
            sc.filled = true;
            context.add(() => {
              sc.def.build(kit, sc.section, tl);
              // Sincroniza con la posición actual (por si se llegó saltando).
              const st = tl.scrollTrigger;
              if (st) tl.progress(st.progress);
            });
            await yieldToMain();
          }
          running = false;
        };

        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              const i = scenes.findIndex((s) => s.section === e.target);
              if (i >= 0) void fillUpTo(i);
            }
          },
          { rootMargin: "100% 0px 100% 0px" }
        );
        kit.cleanups.push(() => io.disconnect());

        // Pins en orden de documento, uno por tarea (cada uno mide con los anteriores ya puestos).
        void (async () => {
          for (const sc of scenes) {
            await yieldToMain();
            if (!alive) return;
            context.add(() => {
              sc.tl = sceneTimeline(kit, sc.section, sc.stage, sc.def.length(!!mobile), sc.fits);
            });
          }
          if (!alive) return;
          context.add(createMaster);
          for (const sc of scenes) io.observe(sc.section);
          if (scenes.length) void fillUpTo(0); // la escena visible al cargar
          markReady();
        })();
      }
      if (reduce) {
        createMaster();
        markReady();
      }

      return () => {
        for (const fn of kit.cleanups.splice(0).reverse()) fn();
      };
    },
    root
  );

  await ready;

  /** Progreso maestro (0..1) de todo el home; se crea al final, cuando la página ya tiene su alto. */
  function createMaster() {
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
  }

  html.dataset.animReady = "1";

  // Si cambia la altura del home (formulario que carga después, fuentes), recalcular pins.
  let lastH = root.offsetHeight;
  const ro = new ResizeObserver(() => {
    const h = root.offsetHeight;
    if (Math.abs(h - lastH) > 4) {
      lastH = h;
      ScrollTrigger.refresh();
    }
  });
  ro.observe(root);

  return () => {
    ro.disconnect();
    mm.revert();
    if (token === activeToken) {
      html.classList.remove("js-anim");
      delete html.dataset.animReady;
    }
  };
}
