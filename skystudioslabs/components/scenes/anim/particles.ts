/**
 * Texto que se arma con partículas (solo escritorio).
 * - Se inicializa perezosamente cuando el canvas entra en pantalla (IntersectionObserver).
 * - No tiene bucle propio: solo dibuja cuando cambia el progreso (lo mueve el scroll) y
 *   el canvas está visible, así que fuera de pantalla queda en pausa por construcción.
 */
import { offsetWithin, tokenColor } from "./core";

export interface ParticleText {
  setProgress(p: number): void;
  destroy(): void;
}

export function createParticleText(
  canvas: HTMLCanvasElement,
  source: HTMLElement,
  getWords: () => HTMLElement[],
  { step = 5 }: { step?: number } = {}
): ParticleText {
  let ready = false;
  let visible = false;
  let progress = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;
  // x0, y0, x1, y1, delay por partícula
  let data = new Float32Array(0);
  let count = 0;
  const ctx = canvas.getContext("2d");
  const colorA = tokenColor("--c-ember", "#ff4a1c");
  const colorB = tokenColor("--c-orange", "#ff8a2a");

  function init() {
    if (!ctx) return;
    const wrap = canvas.parentElement as HTMLElement;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // 1) Dibuja el texto en un canvas fuera de pantalla, palabra por palabra en su posición real.
    const off = document.createElement("canvas");
    off.width = Math.round(w);
    off.height = Math.round(h);
    const o = off.getContext("2d");
    if (!o) return;
    const cs = getComputedStyle(source);
    o.fillStyle = "#fff";
    o.textBaseline = "top";
    o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const origin = offsetWithin(canvas, wrap);
    const words = getWords();
    const list = words.length ? words : [source];
    for (const word of list) {
      const p = offsetWithin(word, wrap);
      const txt = (word.textContent ?? "").toUpperCase();
      o.fillText(txt, p.x - origin.x, p.y - origin.y + word.offsetHeight * 0.08);
    }

    // 2) Muestrea píxeles encendidos → destinos de partículas.
    const img = o.getImageData(0, 0, off.width, off.height).data;
    const pts: number[] = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (img[(y * off.width + x) * 4 + 3] > 128) pts.push(x, y);
      }
    }
    count = pts.length / 2;
    data = new Float32Array(count * 5);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.max(w, h) * (0.4 + Math.random() * 0.6);
      data[i * 5] = w / 2 + Math.cos(a) * r;
      data[i * 5 + 1] = h / 2 + Math.sin(a) * r * 0.6;
      data[i * 5 + 2] = pts[i * 2];
      data[i * 5 + 3] = pts[i * 2 + 1];
      data[i * 5 + 4] = Math.random() * 0.35;
    }
    ready = true;
  }

  function draw() {
    if (!ctx || !ready || !visible) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (progress <= 0) return;
    for (let i = 0; i < count; i++) {
      const j = i * 5;
      const local = Math.min(Math.max((progress - data[j + 4]) / 0.65, 0), 1);
      if (local <= 0) continue;
      const e = 1 - Math.pow(1 - local, 3);
      const x = data[j] + (data[j + 2] - data[j]) * e;
      const y = data[j + 1] + (data[j + 3] - data[j + 1]) * e;
      ctx.fillStyle = x / w < 0.5 ? colorA : colorB;
      ctx.globalAlpha = 0.35 + 0.65 * e;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !ready) init();
      draw();
    },
    { rootMargin: "100px" }
  );
  io.observe(canvas);

  return {
    setProgress(p: number) {
      if (p === progress) return;
      progress = p;
      draw();
    },
    destroy() {
      io.disconnect();
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      data = new Float32Array(0);
      ready = false;
    },
  };
}
