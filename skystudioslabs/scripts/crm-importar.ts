/**
 * npm run crm:importar [-- archivo.json]
 * Importa prospectos al CRM (por defecto data/crm-prospectos.json). Idempotente: upsert por id.
 * --local: fuerza el almacén local aunque .env.local tenga claves de Supabase (para probar).
 * --solo-nuevos: agrega solo los ids que no existen (no pisa ediciones hechas en el CRM).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const envLocal = path.join(raiz, ".env.local");
// --local: NO usa Supabase aunque .env.local lo tenga (escribe en SKY_DATA_FILE o .data/db.json).
const local = process.argv.includes("--local");
if (local) {
  for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"]) delete process.env[k];
} else if (existsSync(envLocal)) process.loadEnvFile?.(envLocal);

const arg = process.argv.slice(2).find((a) => !a.startsWith("-"));
const archivo = path.resolve(raiz, arg ?? "data/crm-prospectos.json");

if (!existsSync(archivo)) {
  console.error(`✗ No existe ${path.relative(raiz, archivo)}.`);
  console.error("  Exporta tu lista de prospectos a ese archivo (un arreglo JSON), o prueba con el ejemplo:");
  console.error("  npm run crm:importar -- data/crm-prospectos.ejemplo.json");
  process.exit(1);
}

let datos: unknown;
try {
  datos = JSON.parse(readFileSync(archivo, "utf8"));
} catch {
  console.error(`✗ ${path.relative(raiz, archivo)} no es JSON válido.`);
  process.exit(1);
}

const { getRepo, supabaseConfigurado } = await import("../lib/data");
console.log(supabaseConfigurado() ? "→ Destino: Supabase (producción si .env.local apunta ahí)" : `→ Destino: modo local (${process.env.SKY_DATA_FILE ?? ".data/db.json"})`);
const { importarProspectos } = await import("../lib/crm/importar");
const repo = await getRepo();
const soloNuevos = process.argv.includes("--solo-nuevos");
const r = await importarProspectos(repo, datos, { soloNuevos });

for (const a of r.avisos) console.warn(`⚠ ${a}`);
if (r.errores.length) {
  for (const e of r.errores) console.error(`✗ ${e.mensaje}`);
  console.error(`\n✗ ${r.errores.length} fila(s) con errores. No se importó nada; corrige el archivo y vuelve a intentar.`);
  process.exit(1);
}
console.log(`\n✓ ${path.relative(raiz, archivo)}: ${r.total} prospectos — ${r.insertados} nuevos, ${r.actualizados} actualizados${r.omitidos ? `, ${r.omitidos} ya existían (sin tocar)` : ""}${r.avisos.length ? `, ${r.avisos.length} aviso(s)` : ""}.`);
