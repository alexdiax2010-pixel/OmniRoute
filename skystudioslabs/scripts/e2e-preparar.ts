/**
 * npm run e2e:preparar — deja el almacén local de pruebas E2E en un estado conocido:
 *   1. borra SKY_DATA_FILE (por defecto .data/e2e.json)
 *   2. npm run sembrar:demo
 *   3. npm run crm:importar -- data/crm-prospectos.ejemplo.json
 *   4. liga el prospecto Ganado (cliente@sky.test) al sitio taller-demo (prospecto_id), para el portal
 * Después, el script de package.json corre `next build`.
 * Sólo toca el almacén local; nunca corre con Supabase configurado.
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
process.env.SKY_DATA_FILE ??= ".data/e2e.json";
const archivo = path.resolve(raiz, process.env.SKY_DATA_FILE);

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("✗ e2e:preparar sólo funciona con el almacén local (quita las variables de Supabase).");
  process.exit(1);
}

rmSync(archivo, { force: true });
console.log(`• Borrado ${path.relative(raiz, archivo)}`);

function npm(...args: string[]) {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", ...args], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`✗ npm run ${args.join(" ")} falló`);
    process.exit(r.status ?? 1);
  }
}

npm("sembrar:demo");
npm("crm:importar", "--", "data/crm-prospectos.ejemplo.json");

const { getRepo } = await import("../lib/data");
const repo = await getRepo();
const idCliente = await repo.prospectoIdPorEmail("cliente@sky.test");
const sitio = await repo.obtenerSitio("taller-demo");
if (!idCliente || !sitio) {
  console.error("✗ No se encontró el prospecto cliente@sky.test o el sitio taller-demo.");
  process.exit(1);
}
await repo.guardarSitio({ ...sitio, prospecto_id: idCliente });
console.log(`✓ taller-demo ligado al prospecto ${idCliente} (cliente@sky.test)`);
