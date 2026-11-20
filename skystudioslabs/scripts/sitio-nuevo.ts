/**
 * npm run sitio:nuevo -- <slug> <carpeta-origen> [--tipo propuesta|cliente] [--expira YYYY-MM-DD]
 *                        [--prospecto <id>] [--dominio <host>] [--forzar]
 *
 * Copia la carpeta del boceto a clientes/<slug>/, valida imágenes (≤300 KB) e index.html,
 * y registra el sitio (activo). Las propuestas caducan por defecto en 30 días.
 */
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { esSlugValido, normalizarHost, SUBDOMINIOS_RESERVADOS } from "../lib/hosts";
import { buscarImagenesPesadas, formatearKB, LIMITE_IMAGEN } from "../lib/sitios/imagenes";
import { fechaMasDias, urlRaiz } from "../lib/sitios/servir";
import type { TipoSitio } from "../lib/types";

function salir(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const USO =
  "Uso: npm run sitio:nuevo -- <slug> <carpeta> [--tipo propuesta|cliente] [--expira YYYY-MM-DD] " +
  "[--prospecto <id>] [--dominio <host>] [--forzar]";

const posicionales: string[] = [];
const opciones: Record<string, string | true> = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=", 2);
    if (k === "forzar") opciones.forzar = true;
    else if (v !== undefined) opciones[k] = v;
    else {
      const sig = argv[++i];
      if (sig === undefined || sig.startsWith("--")) salir(`Falta el valor de --${k}\n${USO}`);
      opciones[k] = sig;
    }
  } else posicionales.push(a);
}

const [slug, origenArg] = posicionales;
if (!slug || !origenArg) salir(USO);
for (const k of Object.keys(opciones)) {
  if (!["tipo", "expira", "prospecto", "dominio", "forzar"].includes(k)) salir(`Opción desconocida --${k}\n${USO}`);
}

if (!esSlugValido(slug)) salir(`Slug inválido "${slug}": usa minúsculas, números y guiones (máx. 63).`);
if ((SUBDOMINIOS_RESERVADOS as readonly string[]).includes(slug) || slug === "_d") salir(`"${slug}" es un subdominio reservado.`);

const tipo = (opciones.tipo ?? "cliente") as TipoSitio;
if (tipo !== "cliente" && tipo !== "propuesta") salir(`--tipo debe ser "propuesta" o "cliente".`);

let expira: string | null = null;
if (typeof opciones.expira === "string") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opciones.expira) || Number.isNaN(Date.parse(opciones.expira))) {
    salir("--expira debe tener el formato YYYY-MM-DD.");
  }
  expira = opciones.expira;
} else if (tipo === "propuesta") {
  expira = fechaMasDias(30);
}

let dominio: string | null = null;
if (typeof opciones.dominio === "string") {
  dominio = normalizarHost(opciones.dominio.replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(dominio)) salir(`Dominio inválido "${opciones.dominio}".`);
}
const prospecto = typeof opciones.prospecto === "string" ? opciones.prospecto : null;

const raiz = process.cwd();
const origen = path.resolve(raiz, origenArg);
const destino = path.join(raiz, "clientes", slug);

const st = await fs.stat(origen).catch(() => null);
if (!st?.isDirectory()) salir(`La carpeta de origen no existe: ${origenArg}`);
if (!existsSync(path.join(origen, "index.html"))) salir(`La carpeta de origen debe tener un index.html.`);

if (path.resolve(origen) !== path.resolve(destino)) {
  if (existsSync(destino)) {
    if (!opciones.forzar) salir(`clientes/${slug}/ ya existe. Usa --forzar para reemplazarla.`);
    await fs.rm(destino, { recursive: true, force: true });
  }
  await fs.mkdir(path.dirname(destino), { recursive: true });
  try {
    await fs.cp(origen, destino, {
      recursive: true,
      // Sin archivos ocultos (.git, .DS_Store, .env) ni node_modules: no se servirían de todos modos.
      filter: (src) => {
        const nombre = path.basename(src);
        return src === origen || (!nombre.startsWith(".") && nombre !== "node_modules");
      },
    });
  } catch (e) {
    await fs.rm(destino, { recursive: true, force: true });
    salir(`No se pudo copiar la carpeta: ${(e as Error).message}`);
  }
}

const pesadas = await buscarImagenesPesadas([destino]);
if (pesadas.length) {
  if (path.resolve(origen) !== path.resolve(destino)) await fs.rm(destino, { recursive: true, force: true });
  console.error(`✗ ${pesadas.length} imagen(es) superan ${formatearKB(LIMITE_IMAGEN)} (no se registró nada):`);
  for (const p of pesadas) console.error(`  - ${path.relative(destino, p.ruta)}  (${formatearKB(p.bytes)})`);
  process.exit(1);
}

// Variables de entorno ANTES de importar la capa de datos (decide local vs. Supabase).
const envLocal = path.join(raiz, ".env.local");
if (existsSync(envLocal)) process.loadEnvFile?.(envLocal);
const { getRepo } = await import("../lib/data");
const repo = await getRepo();

const sitio = await repo.guardarSitio({
  slug,
  tipo,
  prospecto_id: prospecto,
  carpeta: slug,
  dominio_propio: dominio,
  activo: true,
  expira,
});

const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skystudioslabs.com";
console.log(`✓ Sitio "${sitio.slug}" registrado (${sitio.tipo}${sitio.expira ? `, expira ${sitio.expira}` : ""}).`);
console.log(
  tipo === "propuesta"
    ? `  URL: ${urlRaiz(`propuesta.${root}`)}/${slug}`
    : `  URL: ${urlRaiz(`${slug}.${root}`)}/  (respaldo: ${urlRaiz(root)}/c/${slug})`
);
if (dominio) console.log(`  Dominio propio: https://${dominio}/ — ver docs/dominio-propio.md`);
