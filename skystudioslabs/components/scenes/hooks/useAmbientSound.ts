"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type AudioEngine, createAudioEngine } from "./audioEngine";

/** Sonido ambiente opcional: APAGADO por defecto; el AudioContext se crea con el clic del usuario. */
export function useAmbientSound() {
  const [on, setOn] = useState(false);
  const onRef = useRef(false);
  const engine = useRef<AudioEngine | null>(null);
  const lastHit = useRef(0);

  const toggle = useCallback(() => {
    const next = !onRef.current;
    onRef.current = next;
    setOn(next);
    if (next) {
      engine.current ??= createAudioEngine();
      engine.current?.start();
    } else {
      engine.current?.stop();
    }
  }, []);

  /** Golpe suave sincronizado con el cambio de escena (con antirrebote). */
  const hit = useCallback(() => {
    if (!onRef.current) return;
    const now = performance.now();
    if (now - lastHit.current < 450) return;
    lastHit.current = now;
    engine.current?.hit();
  }, []);

  useEffect(
    () => () => {
      engine.current?.dispose();
      engine.current = null;
    },
    []
  );

  return { on, toggle, hit };
}
