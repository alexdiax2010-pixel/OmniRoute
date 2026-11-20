/**
 * Sonido 100% procedural con Web Audio API: no hay archivos de audio descargados,
 * así que es libre de regalías por construcción (ver CREDITOS.md).
 *  - Ambiente: drone grave (3 osciladores desafinados + LFO) y un soplo de ruido filtrado.
 *  - Golpe: caída de tono senoidal + ráfaga corta de ruido, en cada cambio de escena.
 */
export interface AudioEngine {
  start(): void;
  stop(): void;
  hit(): void;
  dispose(): void;
}

type AudioCtor = typeof AudioContext;

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // Ruido "café" suave (integración de ruido blanco), menos áspero que el blanco.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

export function createAudioEngine(): AudioEngine | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // --- Ambiente ---
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 420;
  lowpass.connect(master);

  const pad = ctx.createGain();
  pad.gain.value = 0.05;
  pad.connect(lowpass);

  const oscs: OscillatorNode[] = [];
  const notes: Array<[number, OscillatorType, number]> = [
    [55, "sine", 0],
    [82.41, "triangle", 4],
    [110, "sine", -6],
  ];
  for (const [freq, type, detune] of notes) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(pad);
    o.start();
    oscs.push(o);
  }

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain).connect(pad.gain);
  lfo.start();
  oscs.push(lfo);

  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(ctx, 3);
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "lowpass";
  airFilter.frequency.value = 900;
  const airGain = ctx.createGain();
  airGain.gain.value = 0.025;
  air.connect(airFilter).connect(airGain).connect(master);
  air.start();

  const hitNoise = noiseBuffer(ctx, 0.4);
  let suspendTimer: number | undefined;
  void ctx.suspend();

  return {
    start() {
      window.clearTimeout(suspendTimer);
      void ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.7, ctx.currentTime, 0.8);
    },
    stop() {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      suspendTimer = window.setTimeout(() => void ctx.suspend(), 1500);
    },
    hit() {
      if (ctx.state !== "running") return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.55);

      const n = ctx.createBufferSource();
      n.buffer = hitNoise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1400;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.12, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      n.connect(bp).connect(ng).connect(master);
      n.start(t);
      n.stop(t + 0.2);
    },
    dispose() {
      window.clearTimeout(suspendTimer);
      for (const o of oscs) {
        try {
          o.stop();
        } catch {
          /* ya detenido */
        }
      }
      void ctx.close();
    },
  };
}
