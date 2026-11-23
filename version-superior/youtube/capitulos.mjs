#!/usr/bin/env node
// capitulos.mjs — Capítulos APROXIMADOS para las descripciones de YouTube (Versión Superior).
//
// Método (el mismo reparto que hace cortar_voz.ps1): la duración total del audio clonado se reparte
// entre los bloques del guion en proporción a sus palabras. Cada capítulo empieza donde empieza su
// bloque: inicio(i) = duración_total × (palabras de los bloques anteriores / palabras totales).
// Las marcas se redondean HACIA ABAJO al segundo (mejor que el capítulo arranque un poco antes).
//
// Uso (desde esta carpeta o cualquier otra; solo necesita Node, sin dependencias):
//   node capitulos.mjs                    -> capítulos de los videos 2 a 5
//   node capitulos.mjs 3                  -> solo el video 3
//   node capitulos.mjs 3 --total 498.4    -> otra duración total (p. ej. la del video final con ffprobe)
//   node capitulos.mjs 3 --duraciones 52.1,48.0,...  -> duración REAL de cada bloque, en orden
//                                            (sale exacto; ver README para sacarlas con ffprobe)
//   node capitulos.mjs 3 --desfase 2.5    -> suma N segundos a todos los capítulos menos el 00:00
//                                            (si el montaje añade una tarjeta o pausa al inicio)
//   node capitulos.mjs 3 --tarjeta 2.4    -> suma N segundos ANTES de cada punto (#N) de forma acumulada,
//                                            por si el montaje mete una tarjeta/transición por punto
//   node capitulos.mjs --validar          -> prueba el método con el video 1 contra sus capítulos reales
//                                            y calcula qué --tarjeta lo ajusta mejor
//   node capitulos.mjs 3 --detalle        -> muestra palabras y segundos por bloque
//
// Los guiones se leen de ../guiones/originales/: videoNN.txt (bloques separados por una línea en
// blanco) o video01.json (campo "x" de cada bloque).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const GUIONES = join(AQUI, "..", "guiones", "originales");

// Duración total del audio clonado (segundos) y título de capítulo de cada bloque, en orden.
const VIDEOS = {
  1: {
    total: 517, // 8:37 del video final; el guion de video01.json NO es el texto final exacto
    archivo: "video01.json",
    titulos: [
      "Por qué te ven descuidado",
      "#10 Ropa que no es de tu talla",
      "#9 Tenis sucios",
      "#8 Uñas largas o sucias",
      "#7 Labios partidos",
      "#6 Cejas y vello sin control",
      "#5 Ropa arrugada",
      "#4 Mal aliento",
      "#3 Cabello sin forma",
      "#2 Postura encorvada",
      "#1 Tu olor",
      "Cierre",
    ],
    // Capítulos publicados en video01-original.txt (medidos sobre el video final), para --validar.
    reales: [0, 47, 104, 154, 196, 239, 281, 323, 368, 406, 454, 501],
  },
  2: {
    total: 515,
    archivo: "video02.txt",
    titulos: [
      "Por qué te ven mayor",
      "#12 Lentes pasados de moda",
      "#11 Colores apagados",
      "#10 El peinado de la secundaria",
      "#9 Vestirte como señor",
      "#8 Barba sin control",
      "#7 Caminar lento",
      "#6 Quejarte de todo",
      "#5 Ceño fruncido",
      "#4 Pantalla hasta la madrugada",
      "#3 Poca agua y puro antojo",
      "#2 Fumar o vapear",
      "#1 No usar bloqueador solar",
      "Repaso y cierre",
    ],
  },
  3: {
    total: 502.1,
    archivo: "video03.txt",
    titulos: [
      "Oler caro no depende del precio",
      "#10 Piel limpia y neutra",
      "#9 Hidrata antes del perfume",
      "#8 Puntos de calor (sin frotar)",
      "#7 Cuánto aplicar",
      "#6 Capas de aroma",
      "#5 Que tu ropa guarde el olor",
      "#4 Dónde guardar el frasco",
      "#3 Aroma según clima y ocasión",
      "#2 Prueba antes de comprar",
      "#1 Decants, miniaturas y testers",
      "Repaso y reto",
    ],
  },
  4: {
    total: 516,
    archivo: "video04.txt",
    titulos: [
      "Por qué amaneces sin confianza",
      "#9 Posponer la alarma",
      "#8 Dejar la cama sin tender",
      "#7 Salir sin agua ni comida",
      "#6 Quedarte en pijama",
      "#5 Empezar el día a las carreras",
      "#4 Compararte en redes",
      "#3 El celular al abrir los ojos",
      "#2 Hablarte mal en el espejo",
      "#1 Romper tus propias promesas",
      "Repaso y cierre",
    ],
  },
  5: {
    total: 511.6,
    archivo: "video05.txt",
    titulos: [
      "Por qué tu piel está así",
      "#7 Conoce tu tipo de piel",
      "#6 Agua tibia, nunca caliente",
      "#5 Limpiador suave",
      "#4 Hidratante ligera",
      "#3 Funda y toalla limpias",
      "#2 No te revientes los granos",
      "#1 Bloqueador solar diario",
      "Tu rutina completa",
    ],
  },
};

function leerBloques(archivo) {
  const ruta = join(GUIONES, archivo);
  const texto = readFileSync(ruta, "utf8").replace(/^﻿/, "");
  if (archivo.endsWith(".json")) return JSON.parse(texto).map((b) => b.x);
  return texto
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

const contarPalabras = (t) => t.split(/\s+/).filter(Boolean).length;

function mmss(seg) {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${String(m).padStart(2, "0")}:${r}`;
}

function calcular(n, opciones = {}) {
  const v = VIDEOS[n];
  if (!v) throw new Error(`No hay datos del video ${n}`);
  const bloques = leerBloques(v.archivo);
  if (bloques.length !== v.titulos.length) {
    throw new Error(
      `video ${n}: el guion tiene ${bloques.length} bloques y hay ${v.titulos.length} títulos`
    );
  }
  const palabras = bloques.map(contarPalabras);
  const totalPalabras = palabras.reduce((a, b) => a + b, 0);

  let duraciones;
  if (opciones.duraciones) {
    if (opciones.duraciones.length !== bloques.length) {
      throw new Error(
        `--duraciones trae ${opciones.duraciones.length} valores; el video ${n} tiene ${bloques.length} bloques`
      );
    }
    duraciones = opciones.duraciones;
  } else {
    const total = opciones.total ?? v.total;
    duraciones = palabras.map((p) => (total * p) / totalPalabras);
  }

  const desfase = opciones.desfase ?? 0;
  const tarjeta = opciones.tarjeta ?? 0;
  let acumulado = 0;
  const capitulos = v.titulos.map((titulo, i) => {
    // Las tarjetas van antes de cada punto (bloques 1..n-2); el cierre no lleva tarjeta.
    const tarjetas = Math.min(i, v.titulos.length - 2);
    const inicio = i === 0 ? 0 : acumulado + desfase + tarjeta * tarjetas;
    acumulado += duraciones[i];
    return { titulo, inicio, palabras: palabras[i], segundos: duraciones[i] };
  });
  return { capitulos, totalPalabras, total: acumulado };
}

function validarYouTube(capitulos) {
  const avisos = [];
  if (capitulos.length < 3) avisos.push("YouTube pide al menos 3 capítulos");
  if (Math.floor(capitulos[0].inicio) !== 0) avisos.push("el primer capítulo debe ser 00:00");
  for (let i = 1; i < capitulos.length; i++) {
    const dur = Math.floor(capitulos[i].inicio) - Math.floor(capitulos[i - 1].inicio);
    if (dur < 10) avisos.push(`"${capitulos[i - 1].titulo}" dura menos de 10 s`);
  }
  return avisos;
}

function imprimir(n, opciones) {
  const { capitulos, totalPalabras, total } = calcular(n, opciones);
  const modo = opciones.duraciones
    ? "duraciones reales por bloque"
    : `reparto proporcional a palabras (${totalPalabras} palabras, ${total.toFixed(1)} s)`;
  console.log(`== Video ${n} — ${modo}`);
  if (!opciones.duraciones)
    console.log("⏱️ Capítulos (APROXIMADOS: verificar contra el video final)");
  for (const c of capitulos) {
    const extra = opciones.detalle ? `   [${c.palabras} palabras, ${c.segundos.toFixed(1)} s]` : "";
    console.log(`${mmss(c.inicio)} ${c.titulo}${extra}`);
  }
  for (const a of validarYouTube(capitulos)) console.log(`AVISO: ${a}`);
  console.log("");
}

function validarVideo1() {
  const { capitulos } = calcular(1, { tarjeta: opciones.tarjeta });
  const reales = VIDEOS[1].reales;
  console.log(
    "== Prueba del método con el video 1 (guion del 14-nov vs. capítulos del video final)"
  );
  console.log(
    "Ojo: el texto final del video 1 se editó después; la diferencia incluye esa edición."
  );
  let maxDif = 0;
  capitulos.forEach((c, i) => {
    const est = Math.floor(c.inicio);
    const dif = est - reales[i];
    maxDif = Math.max(maxDif, Math.abs(dif));
    console.log(
      `${mmss(est)} estimado | ${mmss(reales[i])} real | ${dif >= 0 ? "+" : ""}${dif} s  ${c.titulo}`
    );
  });
  console.log(`Diferencia máxima: ${maxDif} s`);
  // Mejor --tarjeta por mínimos cuadrados (sin término independiente) sobre las diferencias.
  const base = calcular(1).capitulos;
  let num = 0;
  let den = 0;
  base.forEach((c, i) => {
    const k = Math.min(i, base.length - 2);
    num += k * (reales[i] - c.inicio);
    den += k * k;
  });
  const mejor = den ? num / den : 0;
  console.log(
    `--tarjeta que mejor ajusta el video 1: ${mejor.toFixed(1)} s por punto (hipótesis)\n`
  );
}

// --- CLI ---
const args = process.argv.slice(2);
const opciones = {};
const videos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--total") opciones.total = Number(args[++i]);
  else if (a === "--desfase") opciones.desfase = Number(args[++i]);
  else if (a === "--tarjeta") opciones.tarjeta = Number(args[++i]);
  else if (a === "--duraciones") opciones.duraciones = args[++i].split(",").map(Number);
  else if (a === "--detalle") opciones.detalle = true;
  else if (a === "--validar") opciones.validar = true;
  else if (/^\d+$/.test(a)) videos.push(Number(a));
  else {
    console.error(`Argumento no reconocido: ${a}`);
    process.exit(1);
  }
}
for (const k of ["total", "desfase", "tarjeta"]) {
  if (k in opciones && !Number.isFinite(opciones[k])) {
    console.error(`--${k} necesita un número`);
    process.exit(1);
  }
}
if (opciones.duraciones?.some((d) => !Number.isFinite(d) || d <= 0)) {
  console.error("--duraciones necesita números positivos separados por comas");
  process.exit(1);
}

try {
  if (opciones.validar) validarVideo1();
  const lista = videos.length ? videos : opciones.validar ? [] : [2, 3, 4, 5];
  for (const n of lista) imprimir(n, opciones);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
