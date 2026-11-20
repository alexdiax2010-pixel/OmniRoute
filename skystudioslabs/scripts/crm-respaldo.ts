/**
 * npm run crm:respaldo → respaldos/<fecha-hora>/<tabla>.json (respaldos/ está en .gitignore).
 */
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const envLocal = path.join(raiz, ".env.local");
if (existsSync(envLocal)) process.loadEnvFile?.(envLocal);

const { getRepo } = await import("../lib/data");
const repo = await getRepo();
const tablas = await repo.volcarTodo();

const marca = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
const dir = path.join(raiz, "respaldos", marca);
await fs.mkdir(dir, { recursive: true });
for (const [tabla, filas] of Object.entries(tablas)) {
  await fs.writeFile(path.join(dir, `${tabla}.json`), JSON.stringify(filas, null, 2));
  console.log(`• ${tabla}: ${filas.length} filas`);
}
console.log(`✓ Respaldo en ${path.relative(raiz, dir)}/`);
