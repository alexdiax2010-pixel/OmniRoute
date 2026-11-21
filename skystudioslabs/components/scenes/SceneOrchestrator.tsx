"use client";

import { useEffect, useRef } from "react";
import { useAmbientSound } from "./hooks/useAmbientSound";
import s from "./scenes.module.css";

/**
 * Orquestador de escenas: mejora progresiva. El HTML de cada escena ya viene completo del
 * servidor; este componente solo carga GSAP/Lenis dinámicamente y anima encima.
 */
export function SceneOrchestrator() {
  const { on, toggle, hit } = useAmbientSound();
  const hitRef = useRef(hit);

  useEffect(() => {
    hitRef.current = hit;
  }, [hit]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-home]");
    if (!root) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Diferir: después de `load` y en un momento ocioso (con tope), para no competir con el LCP.
    const whenIdle = () =>
      new Promise<void>((resolve) => {
        const go = () => {
          const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
            .requestIdleCallback;
          if (ric) ric(() => resolve(), { timeout: 1500 });
          else setTimeout(resolve, 300);
        };
        if (document.readyState === "complete") go();
        else window.addEventListener("load", go, { once: true });
      });

    whenIdle()
      .then(() => (cancelled ? Promise.reject(new Error("cancelado")) : import("./anim/setup")))
      .then(({ setupScenes }) => setupScenes(root, () => hitRef.current(), () => cancelled))
      .then((fn) => {
        if (cancelled) fn();
        else cleanup = fn;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Si falla la animación, el contenido sigue visible (todo viene del servidor).
        console.error("[escenas] no se pudo iniciar la animación", err);
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <button
      type="button"
      className={s.soundBtn}
      aria-pressed={on}
      aria-label={on ? "Desactivar sonido ambiente" : "Activar sonido ambiente"}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {on ? (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
      <span>Sonido</span>
    </button>
  );
}
