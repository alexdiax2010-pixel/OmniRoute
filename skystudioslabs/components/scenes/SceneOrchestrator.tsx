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

    // Diferir: la intro ya se anima con CSS desde el primer frame, así que el motor (GSAP, Lenis,
    // escenas) arranca con la primera intención del usuario (rueda, toque, tecla, scroll) o, si no
    // la hay, ~3 s después de `load` en un momento ocioso. Así no compite con la hidratación.
    const INTENT = ["wheel", "touchstart", "pointerdown", "keydown", "scroll"] as const;
    let stopListening = () => {};
    const whenIdle = () =>
      new Promise<void>((resolve) => {
        let done = false;
        let timer: number | undefined;
        const go = () => {
          if (done) return;
          done = true;
          stopListening();
          resolve();
        };
        const opts: AddEventListenerOptions = { passive: true, once: true };
        for (const ev of INTENT) window.addEventListener(ev, go, opts);
        const afterLoad = () => {
          timer = window.setTimeout(() => {
            const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
              .requestIdleCallback;
            if (ric) ric(go, { timeout: 1000 });
            else go();
          }, 3000);
        };
        if (document.readyState === "complete") afterLoad();
        else window.addEventListener("load", afterLoad, { once: true });
        stopListening = () => {
          for (const ev of INTENT) window.removeEventListener(ev, go);
          window.removeEventListener("load", afterLoad);
          window.clearTimeout(timer);
        };
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
      stopListening();
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
