/**
 * npm run sembrar:demo — registra los sitios de demostración (idempotente):
 *   taller-demo   → cliente, activo
 *   propuesta-demo → propuesta (carpeta taller-demo), expira en 30 días
 *   inactivo-demo  → cliente (carpeta taller-demo), inactivo → "Sitio en mantenimiento"
 */
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { estadoSitio, fechaMasDias } from "../lib/sitios/servir";

const raiz = process.cwd();
const origen = path.join(raiz, "bocetos-ejemplo", "taller-demo");
const destino = path.join(raiz, "clientes", "taller-demo");

if (!existsSync(path.join(destino, "index.html"))) {
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.cp(origen, destino, { recursive: true });
  console.log("• Copiado bocetos-ejemplo/taller-demo → clientes/taller-demo");
}

const envLocal = path.join(raiz, ".env.local");
if (existsSync(envLocal)) process.loadEnvFile?.(envLocal);
const { getRepo } = await import("../lib/data");
const repo = await getRepo();

// Conserva la caducidad de la propuesta si sigue vigente (re-ejecutar no la mueve).
const previa = await repo.obtenerSitio("propuesta-demo");
const expira = previa?.expira && estadoSitio({ ...previa, activo: true }) === "ok" ? previa.expira : fechaMasDias(30);

const sitios = [
  { slug: "taller-demo", tipo: "cliente", carpeta: "taller-demo", activo: true, expira: null },
  { slug: "propuesta-demo", tipo: "propuesta", carpeta: "taller-demo", activo: true, expira },
  { slug: "inactivo-demo", tipo: "cliente", carpeta: "taller-demo", activo: false, expira: null },
] as const;

for (const s of sitios) {
  await repo.guardarSitio({ ...s, prospecto_id: null, dominio_propio: null });
  console.log(`✓ ${s.slug} (${s.tipo}${s.activo ? "" : ", inactivo"}${s.expira ? `, expira ${s.expira}` : ""})`);
}
