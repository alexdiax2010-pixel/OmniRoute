// Valida un guion.json de Versión Superior.
// Uso: node validar-guion.mjs nuevos/video06.json [otro.json ...]
// Sale con código 1 si encuentra errores. Las advertencias no detienen nada.
import { readFileSync } from "node:fs";

const MIN = 1550;
const MAX = 1650;
const TROZO = 3000;
const CAMPOS = ["id", "n", "t", "i1", "i2", "q", "x"];
const palabras = (s) => s.split(/\s+/).filter(Boolean).length;

let fallo = false;
for (const ruta of process.argv.slice(2)) {
  const errores = [];
  const avisos = [];
  let g;
  try {
    g = JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    console.log(`${ruta}: JSON inválido (${e.message})`);
    fallo = true;
    continue;
  }
  if (!Array.isArray(g)) errores.push("el guion debe ser un array");
  const ids = g.map((b) => b.id);
  if (ids[0] !== "00") errores.push("el primer bloque debe tener id 00");
  if (ids[ids.length - 1] !== "99") errores.push("el último bloque debe tener id 99");

  let total = 0;
  for (const b of g) {
    for (const c of CAMPOS) {
      if (c in b) continue;
      // video01.json (ya montado) no trae i1/i2: se tolera fuera de la intro.
      if ((c === "i1" || c === "i2") && b.id !== "00") avisos.push(`${b.id}: falta el campo ${c}`);
      else errores.push(`${b.id}: falta el campo ${c}`);
    }
    const x = b.x || "";
    const w = palabras(x);
    total += w;
    if (b.id !== "00" && b.id !== "99") {
      const num = String(parseInt(b.id, 10));
      if (b.n !== `#${num}`) errores.push(`${b.id}: n debería ser #${num}`);
      if (!b.t || b.t.length > 22) errores.push(`${b.id}: t vacío o mayor a 22 caracteres (${(b.t || "").length})`);
      if (b.t !== b.t.toUpperCase()) errores.push(`${b.id}: t debe ir en MAYÚSCULAS`);
      if (w > 200) avisos.push(`${b.id}: punto largo (${w} palabras)`);
    }
    if (b.id === "00") {
      for (const c of ["i1", "i2"]) {
        if (!b[c] || b[c].length > 18) errores.push(`00: ${c} vacío o mayor a 18 caracteres (${(b[c] || "").length})`);
        else if (b[c] !== b[c].toUpperCase()) errores.push(`00: ${c} debe ir en MAYÚSCULAS`);
      }
      if (w > 110) avisos.push(`00: intro de ${w} palabras (máximo recomendado: 110)`);
    }
    if (!Array.isArray(b.q) || b.q.length !== 4) errores.push(`${b.id}: q debe tener 4 búsquedas`);
    else for (const s of b.q) if (!/^[a-z]+(-[a-z]+)*$/.test(s)) errores.push(`${b.id}: búsqueda no es slug: ${s}`);
    if (/\d/.test(x)) errores.push(`${b.id}: hay dígitos en x (escríbelos con palabras)`);
    if (/["“”()%$#&/+*@<>\[\]{}=_|~^]/.test(x)) errores.push(`${b.id}: hay símbolos, paréntesis o comillas dobles en x`);
    if (/\.\.\.|…/.test(x)) avisos.push(`${b.id}: puntos suspensivos`);
    if (/\b(etc|aprox|min|seg)\./i.test(x)) avisos.push(`${b.id}: abreviatura que la voz puede leer mal`);
    if (x.length > TROZO) avisos.push(`${b.id}: bloque de ${x.length} caracteres (supera un trozo de ${TROZO})`);
  }
  const chars = g.map((b) => b.x).join("\n\n").length;
  if (total < MIN || total > MAX) errores.push(`total de ${total} palabras (fuera de ${MIN}–${MAX})`);
  console.log(`${ruta}: ${total} palabras, ${chars} caracteres, ${g.length} bloques, unos ${Math.ceil(chars / TROZO)} trozos para ElevenLabs`);
  for (const b of g) console.log(`   ${b.id.padEnd(3)} ${String(palabras(b.x)).padStart(4)} palabras  ${b.t || b.i1 + " / " + b.i2}`);
  for (const a of avisos) console.log(`   AVISO: ${a}`);
  for (const e of errores) console.log(`   ERROR: ${e}`);
  if (errores.length) fallo = true;
  else console.log("   OK");
}
process.exit(fallo ? 1 : 0);
