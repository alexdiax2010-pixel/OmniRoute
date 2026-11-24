/**
 * npx tsx scripts/crm-desde-rama.ts [--rama <ref>] [--salida <archivo.json>]
 *
 * Arma data/crm-prospectos.json (NO se commitea: está en .gitignore) a partir de los seeds de
 * prospección de la rama de investigación (resultados/crm/seed/*.json), leyéndolos con `git show`
 * sin cambiar de rama. Después: `npm run crm:importar` (o `-- --solo-nuevos` para no tocar los que ya existen).
 *
 * Solo LEE git y escribe un archivo local. No toca Supabase.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seedsAImportables, type SeedRama } from "../lib/crm/seed-rama";

const args = process.argv.slice(2);
const opcion = (n: string, def: string) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const rama = opcion("--rama", "origin/claude/brave-fermi-leic62");
const salida = path.resolve(process.cwd(), opcion("--salida", "data/crm-prospectos.json"));
const DIR = "resultados/crm/seed/";

if (!/^[A-Za-z0-9._/-]{1,200}$/.test(rama) || rama.startsWith("-")) {
  console.error("✗ Nombre de rama inválido.");
  process.exit(1);
}

const git = (a: string[]) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

let rutas: string[];
try {
  rutas = git(["ls-tree", "-r", "--full-tree", "--name-only", rama, "--", DIR])
    .split("\n")
    .filter((r) => r.endsWith(".json"));
} catch {
  console.error(`✗ No se pudo leer la rama "${rama}". ¿Hiciste git fetch?`);
  process.exit(1);
}
if (!rutas.length) {
  console.error(`✗ La rama "${rama}" no tiene archivos en ${DIR}`);
  process.exit(1);
}

const archivos = rutas.map((ruta) => {
  try {
    return { ruta, datos: JSON.parse(git(["show", `${rama}:${ruta}`])) as SeedRama };
  } catch {
    console.error(`✗ ${ruta} no es JSON válido.`);
    process.exit(1);
  }
});

const filas = seedsAImportables(archivos);
mkdirSync(path.dirname(salida), { recursive: true });
writeFileSync(salida, `${JSON.stringify(filas, null, 2)}\n`);

// Aviso si el archivo de salida quedaría dentro del repo sin estar ignorado.
try {
  execFileSync("git", ["check-ignore", "-q", salida]);
} catch {
  if (salida.startsWith(path.resolve(git(["rev-parse", "--show-toplevel"]).trim())))
    console.warn(`⚠ ${path.relative(process.cwd(), salida)} NO está en .gitignore: no lo subas (datos de prospectos).`);
}

const top = filas.filter((f) => f.top10).length;
const sinTel = filas.filter((f) => !f.telefono && !f.whatsapp).length;
console.log(`✓ ${filas.length} prospectos → ${path.relative(process.cwd(), salida)} (${top} top 10, ${sinTel} sin teléfono).`);
console.log("  Siguiente paso: npm run crm:importar   (o con -- --solo-nuevos; para probar sin Supabase: -- --local)");
