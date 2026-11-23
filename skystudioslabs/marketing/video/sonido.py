"""Sintetiza la pista del anuncio: ritmo + efectos sincronizados con la animación.

Uso: python3 sonido.py eventos.json salida.wav [voz.wav]
eventos.json = {"duracion": s, "cortes": [...], "sonidos": [{"t", "tipo", "vol"}]}
Todo se genera aquí (sin samples externos), así que no hay derechos de autor de por medio.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def env(n, ataque=0.002, caida=0.2):
    t = np.arange(n) / SR
    a = np.clip(t / max(ataque, 1e-4), 0, 1)
    return a * np.exp(-t / caida)


def pasa_bajos(x, corte):
    """Filtro de un polo; `corte` puede ser un número o un arreglo (barrido)."""
    corte = np.broadcast_to(np.asarray(corte, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def bombo(dur=0.45):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)


def platillo(dur=0.07):
    n = int(SR * dur)
    r = rng.standard_normal(n)
    return np.diff(r, prepend=0) * env(n, 0.0005, 0.018) * 0.35


def palmada(dur=0.25):
    n = int(SR * dur)
    r = rng.standard_normal(n)
    r = np.diff(pasa_bajos(r, 2500), prepend=0) * 4
    e = env(n, 0.001, 0.07)
    return r * e * 0.55


def bajo(freq, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    onda = 2 * ((t * freq) % 1) - 1  # diente de sierra
    onda = pasa_bajos(onda, 220 + 500 * np.exp(-t / 0.08))
    return onda * env(n, 0.005, dur * 0.7) * 0.9


def impacto():
    n = int(SR * 1.0)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t / 0.06)) / SR) * env(n, 0.001, 0.35)
    ruido = pasa_bajos(rng.standard_normal(n), 1800) * env(n, 0.001, 0.08) * 1.4
    return (sub + ruido) * 0.9


def whoosh(dur=0.45):
    n = int(SR * dur)
    t = np.arange(n) / SR
    forma = np.sin(np.pi * t / dur) ** 2
    corte = 300 + 5000 * forma
    return pasa_bajos(rng.standard_normal(n), corte) * forma * 0.7


def subida(dur=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    corte = 200 + 6000 * (t / dur) ** 2
    ruido = pasa_bajos(rng.standard_normal(n), corte) * (t / dur) ** 2
    tono = np.sin(2 * np.pi * np.cumsum(200 + 600 * (t / dur) ** 2) / SR) * (t / dur) ** 2 * 0.25
    return (ruido * 0.6 + tono)


def ding():
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1760 * t) * (t > 0.09)
    return s * env(n, 0.001, 0.25) * 0.35


def pop():
    n = int(SR * 0.09)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t / 0.03) + 250
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.0005, 0.025) * 0.6


def tecla():
    n = int(SR * 0.03)
    r = rng.standard_normal(n)
    return np.diff(r, prepend=0) * env(n, 0.0002, 0.006) * 0.5


def burbuja():
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    f = 500 + 900 * (t / 0.12)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04) * 0.5


EFECTOS = {"impacto": impacto, "whoosh": whoosh, "subida": subida, "ding": ding, "pop": pop, "tecla": tecla, "burbuja": burbuja}


def poner(pista, sonido, t, vol=1.0):
    i = int(t * SR)
    if i >= len(pista):
        return
    fin = min(len(pista), i + len(sonido))
    pista[i:fin] += sonido[: fin - i] * vol


def main():
    datos = json.load(open(sys.argv[1]))
    dur = datos["duracion"] + 0.6
    cortes = datos["cortes"]
    musica = np.zeros(int(SR * dur))
    efectos = np.zeros_like(musica)

    bpm = 124
    beat = 60 / bpm
    # A menor: La – Fa – Do – Sol (un compás cada uno)
    notas = [55.0, 43.65, 65.41, 49.0]
    entra_ritmo = cortes[1]      # tras el gancho
    entra_todo = cortes[2]       # "Páginas que venden": suelta todo
    fin_musica = datos["duracion"] - 0.2
    b = bombo()
    t = entra_ritmo
    k = 0
    while t < fin_musica:
        todo = t >= entra_todo - 1e-6
        poner(musica, b, t, 1.0 if todo else 0.8)
        poner(musica, platillo(), t + beat / 2, 0.9 if todo else 0.5)
        if todo:
            if k % 2 == 1:
                poner(musica, palmada(), t, 0.9)
            poner(musica, platillo(), t + beat / 4, 0.3)
            poner(musica, bajo(notas[(k // 4) % 4], beat * 0.9), t, 0.55)
            poner(musica, bajo(notas[(k // 4) % 4] * 2, beat * 0.4), t + beat / 2, 0.25)
        t += beat
        k += 1
    # dron grave durante el gancho para que no empiece en silencio
    n = int(SR * entra_ritmo)
    tt = np.arange(n) / SR
    dron = (np.sin(2 * np.pi * 55 * tt) + 0.5 * np.sin(2 * np.pi * 82.4 * tt)) * np.clip(tt / 0.3, 0, 1) * 0.18
    musica[:n] += dron

    for ev in datos["sonidos"]:
        poner(efectos, EFECTOS[ev["tipo"]](), ev["t"], ev.get("vol", 1))

    # "ducking": la música baja un poco cuando suena un impacto
    sidechain = np.ones_like(musica)
    for ev in datos["sonidos"]:
        if ev["tipo"] == "impacto":
            i = int(ev["t"] * SR)
            m = int(0.25 * SR)
            seg = 1 - 0.5 * np.exp(-np.arange(m) / (0.08 * SR))
            fin = min(len(sidechain), i + m)
            sidechain[i:fin] = np.minimum(sidechain[i:fin], seg[: fin - i])
    voz = None
    if len(sys.argv) > 3:
        with wave.open(sys.argv[3]) as w:
            v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
            if w.getnchannels() == 2:
                v = v.reshape(-1, 2).mean(1)
        voz = np.zeros_like(musica)
        voz[: min(len(v), len(voz))] = v[: len(voz)]
        voz /= np.max(np.abs(voz)) + 1e-9
        # la música baja mientras habla la voz (envolvente suavizada de ~150 ms)
        ventana = int(0.15 * SR)
        env_voz = np.convolve(np.abs(voz), np.ones(ventana) / ventana, "same")
        env_voz = np.clip(env_voz / (np.percentile(env_voz, 95) + 1e-9), 0, 1)
        sidechain = sidechain * (1 - 0.6 * env_voz)
    mezcla = musica * 0.75 * sidechain + efectos * 0.9
    if voz is not None:
        mezcla = mezcla * 0.55 + voz * 0.95
    # salida suave
    cola = int(0.8 * SR)
    mezcla[-cola:] *= np.linspace(1, 0, cola)
    mezcla = np.tanh(mezcla * 1.2)  # saturación suave, evita picos
    mezcla /= np.max(np.abs(mezcla)) / 0.8
    estereo = np.stack([mezcla, mezcla], axis=1)
    pcm = (estereo * 32767).astype(np.int16)
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main()
