/**
 * npm run crm:importar [-- archivo.json | carpeta/]
 * Importa prospectos al CRM (por defecto data/crm-prospectos.json). Idempotente: upsert por id.
 * Acepta un arreglo JSON, un objeto suelto o una carpeta con un .json por prospecto (el id sale
 * del nombre del archivo cuando la fila no trae "id").
 */
import { existsSync } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const envLocal = path.join(raiz, ".env.local");
if (existsSync(envLocal)) process.loadEnvFile?.(envLocal);

const arg = process.argv.slice(2).find((a) => !a.startsWith("-"));
const archivo = path.resolve(raiz, arg ?? "data/crm-prospectos.json");

if (!existsSync(archivo)) {
  console.error(`✗ No existe ${path.relative(raiz, archivo)}.`);
  console.error("  Exporta tu lista de prospectos a ese archivo (un arreglo JSON), o prueba con el ejemplo:");
  console.error("  npm run crm:importar -- data/crm-prospectos.ejemplo.json");
  process.exit(1);
}

const { leerEntrada } = await import("../lib/crm/archivos");
let datos: unknown;
try {
  const entrada = leerEntrada(archivo);
  if (entrada.errores.length) {
    for (const e of entrada.errores) console.error(`✗ ${e}`);
    console.error("\n✗ Hay archivos que no son JSON válido. No se importó nada.");
    process.exit(1);
  }
  datos = entrada.datos;
} catch {
  console.error(`✗ ${path.relative(raiz, archivo)} no es JSON válido.`);
  process.exit(1);
}

const { getRepo } = await import("../lib/data");
const { importarProspectos } = await import("../lib/crm/importar");
const repo = await getRepo();
const r = await importarProspectos(repo, datos);

for (const a of r.avisos) console.warn(`⚠ ${a}`);
for (const d of r.duplicados) console.warn(`↷ Fila ${d.indice} (${d.id}): omitida, duplicado de "${d.de}" (${d.motivo})`);
if (r.errores.length) {
  for (const e of r.errores) console.error(`✗ ${e.mensaje}`);
  console.error(`\n✗ ${r.errores.length} fila(s) con errores. No se importó nada; corrige el archivo y vuelve a intentar.`);
  process.exit(1);
}
console.log(`\n✓ ${path.relative(raiz, archivo)}: ${r.total} prospectos — ${r.insertados} nuevos, ${r.actualizados} actualizados${r.duplicados.length ? `, ${r.duplicados.length} duplicado(s) omitido(s)` : ""}${r.avisos.length ? `, ${r.avisos.length} aviso(s)` : ""}.`);
