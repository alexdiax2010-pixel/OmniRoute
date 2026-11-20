/**
 * Lógica compartida para servir los sitios estáticos de /clientes (clientes y propuestas).
 * Las funciones de transformación son puras y testeables; las de disco están al final.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Sitio } from "@/lib/types";

export type EstadoSitio = "ok" | "inactivo" | "expirado" | "no-existe";

/** Zona horaria del negocio: una propuesta que "expira el 2026-12-01" vale todo ese día en Zapopan. */
const ZONA = "America/Mexico_City";

/** Fecha YYYY-MM-DD en la zona del negocio. */
export function fechaLocal(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Suma días a hoy (zona del negocio) y devuelve YYYY-MM-DD. */
export function fechaMasDias(dias: number, desde: Date = new Date()): string {
  return fechaLocal(new Date(desde.getTime() + dias * 86_400_000));
}

export function estadoSitio(sitio: Sitio | null | undefined, now: Date = new Date()): EstadoSitio {
  if (!sitio) return "no-existe";
  if (!sitio.activo) return "inactivo";
  if (sitio.expira) {
    const e = sitio.expira.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(e)) {
      // Fecha sin hora: vale hasta el final de ese día.
      if (fechaLocal(now) > e) return "expirado";
    } else {
      const t = Date.parse(e);
      if (!Number.isNaN(t) && now.getTime() > t) return "expirado";
    }
  }
  return "ok";
}

// ---------------------------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------------------------

/**
 * Resuelve `segments` dentro de `base` de forma estricta. Devuelve la ruta absoluta o null si
 * algún segmento es peligroso (.., nulos, separadores, rutas absolutas, archivos ocultos) o si el
 * resultado escapa de `base`.
 */
export function resolverRutaSegura(base: string, segments: readonly string[]): string | null {
  const raiz = path.resolve(base);
  const limpios: string[] = [];
  for (const s of segments) {
    if (typeof s !== "string") return null;
    if (s === "") continue; // dobles barras
    if (s.includes("\0")) return null;
    if (s.includes("/") || s.includes("\\")) return null;
    if (s.startsWith(".")) return null; // "..", "." y dotfiles (.env, .git…)
    if (s.includes(":")) return null; // C:, flujos alternos de NTFS
    if (path.isAbsolute(s)) return null;
    if (s.length > 255) return null;
    limpios.push(s);
  }
  const final = path.resolve(raiz, ...limpios);
  if (final !== raiz && !final.startsWith(raiz + path.sep)) return null;
  return final;
}

const TIPOS: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  pdf: "application/pdf",
  webmanifest: "application/manifest+json",
};

/** Content-Type por extensión (con o sin punto). null = tipo no permitido (no se sirve). */
export function tipoContenido(ext: string): string | null {
  const e = ext.replace(/^\./, "").toLowerCase();
  return TIPOS[e] ?? null;
}

export function esHtml(ext: string): boolean {
  const e = ext.replace(/^\./, "").toLowerCase();
  return e === "html" || e === "htm";
}

// ---------------------------------------------------------------------------------------------
// Inyecciones HTML
// ---------------------------------------------------------------------------------------------

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** URL pública del dominio raíz (http para localhost en desarrollo). */
export function urlRaiz(root: string): string {
  const r = root.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(r) || r.endsWith(".localhost") || /\.localhost:\d+$/.test(r);
  return `${local ? "http" : "https"}://${r}`;
}

/** Inserta `fragmento` justo después de la etiqueta de apertura <head> (o la crea). */
function enHead(html: string, fragmento: string): string {
  const head = /<head(\s[^>]*)?>/i.exec(html);
  if (head) {
    const i = head.index + head[0].length;
    return html.slice(0, i) + fragmento + html.slice(i);
  }
  const htmlTag = /<html(\s[^>]*)?>/i.exec(html);
  if (htmlTag) {
    const i = htmlTag.index + htmlTag[0].length;
    return html.slice(0, i) + `<head>${fragmento}</head>` + html.slice(i);
  }
  return fragmento + html;
}

/** Inserta antes del ÚLTIMO </body> (o al final). */
function antesDeCierreBody(html: string, fragmento: string): string {
  const i = html.toLowerCase().lastIndexOf("</body>");
  if (i < 0) return html + fragmento;
  return html.slice(0, i) + fragmento + html.slice(i);
}

/** Inserta justo después de la apertura <body> (o al inicio del documento). */
function trasAperturaBody(html: string, fragmento: string): string {
  const b = /<body(\s[^>]*)?>/i.exec(html);
  if (!b) return fragmento + html;
  const i = b.index + b[0].length;
  return html.slice(0, i) + fragmento + html.slice(i);
}

const MARCA_PIE = "data-sky-pie";

/** Pie discreto "Hecho por Sky Studios Labs". Idempotente. */
export function inyectarPie(html: string, root: string): string {
  if (html.includes(MARCA_PIE)) return html;
  const url = escAttr(urlRaiz(root));
  const pie =
    `<div ${MARCA_PIE}="1" class="skysl-pie" style="all:initial;display:block;box-sizing:border-box;width:100%;` +
    `padding:10px 16px;text-align:center;font:12px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;` +
    `color:#6b7280;background:transparent;clear:both;position:relative;z-index:1">` +
    `<a class="skysl-pie__link" href="${url}" target="_blank" rel="noopener" ` +
    `style="all:initial;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px;opacity:.85">` +
    `Hecho por Sky Studios Labs</a></div>`;
  return antesDeCierreBody(html, pie);
}

/** Franja fija superior para propuestas. Idempotente. Empuja el contenido con padding-top. */
export function inyectarFranja(html: string): string {
  if (html.includes('data-testid="franja-propuesta"')) return html;
  const alto = 36;
  const estilo =
    `<style data-skysl-franja>` +
    `html{scroll-padding-top:${alto}px}` +
    `body{padding-top:${alto}px!important}` +
    `@media print{.skysl-franja{display:none!important}body{padding-top:0!important}}` +
    `</style>`;
  const franja =
    `<div data-testid="franja-propuesta" class="skysl-franja" role="note" ` +
    `style="all:initial;position:fixed;top:0;left:0;right:0;z-index:2147483647;box-sizing:border-box;height:${alto}px;` +
    `display:flex;align-items:center;justify-content:center;padding:0 12px;background:#111827;color:#fde047;` +
    `font:600 13px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.02em;` +
    `box-shadow:0 1px 0 rgba(0,0,0,.25);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">` +
    `Propuesta de diseño — boceto no oficial</div>`;
  return trasAperturaBody(enHead(html, estilo), franja);
}

/** Meta robots noindex,nofollow (reemplaza cualquier meta robots previa). */
export function inyectarNoindex(html: string): string {
  const sin = html.replace(/<meta\s+[^>]*name\s*=\s*["']?robots["']?[^>]*>/gi, "");
  return enHead(sin, `<meta name="robots" content="noindex, nofollow">`);
}

/** <link rel="canonical"> si la página no trae uno. */
export function inyectarCanonical(html: string, href: string): string {
  if (/<link\s+[^>]*rel\s*=\s*["']?canonical/i.test(html)) return html;
  return enHead(html, `<link rel="canonical" href="${escAttr(href)}">`);
}

/**
 * <base href> para que las rutas relativas del boceto ("img/foto.webp", "./styles.css") resuelvan
 * igual en `slug.ROOT/`, `ROOT/c/slug` (sin barra final: Next la quita) y `propuesta.ROOT/slug`.
 * Como <base> también afecta a los enlaces "#ancla", se añade un script mínimo que los mantiene
 * en la misma página. No hace nada si la página ya define su propio <base>.
 */
export function inyectarBase(html: string, href: string): string {
  if (/<base\s/i.test(html)) return html;
  const script =
    `<script data-skysl-anclas>document.addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;` +
    `var a=e.target&&e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.target)return;var h=a.getAttribute("href");e.preventDefault();` +
    `var u=location.pathname+location.search;if(h==="#"){history.pushState(null,"",u);window.scrollTo(0,0);return}` +
    `var t=document.getElementById(decodeURIComponent(h.slice(1)))||document.getElementsByName(decodeURIComponent(h.slice(1)))[0];` +
    `history.pushState(null,"",u+h);if(t)t.scrollIntoView()});</script>`;
  return enHead(html, `<base href="${escAttr(href)}">${script}`);
}

/**
 * Calcula el <base href> necesario, o null si el navegador ya resolvería bien las rutas relativas.
 * @param prefijo  prefijo público del sitio, terminado en "/" (ej. "/", "/c/demo/", "/demo/")
 * @param segmentos segmentos pedidos (tras el slug)
 * @param rel      archivo servido relativo a la carpeta del sitio (ej. "index.html", "blog/index.html")
 */
export function calcularBase(prefijo: string, segmentos: readonly string[], rel: string): string | null {
  const segs = segmentos.filter(Boolean);
  // URL que ve el navegador (Next elimina la barra final, salvo en "/").
  const pedida = segs.length ? prefijo + segs.join("/") : prefijo === "/" ? "/" : prefijo.replace(/\/$/, "");
  const dirNavegador = pedida.slice(0, pedida.lastIndexOf("/") + 1);
  const dirRel = path.posix.dirname(rel.split(path.sep).join("/"));
  const necesaria = prefijo + (dirRel === "." ? "" : dirRel + "/");
  return dirNavegador === necesaria ? null : necesaria;
}

// ---------------------------------------------------------------------------------------------
// Páginas neutrales (sin marca del cliente)
// ---------------------------------------------------------------------------------------------

export function paginaNeutral(titulo: string, mensaje: string, extra = ""): string {
  const t = escAttr(titulo);
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${t}</title>
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f8fafc;color:#1f2937;
font:16px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:24px;box-sizing:border-box}
main{max-width:30rem;text-align:center}h1{font-size:1.4rem;margin:0 0 .5rem}p{margin:0 0 1rem;color:#4b5563}
a{color:#1d4ed8}@media (prefers-color-scheme:dark){body{background:#0f172a;color:#e5e7eb}p{color:#9ca3af}a{color:#93c5fd}}</style>
</head><body><main><h1>${t}</h1><p>${mensaje}</p>${extra}</main></body></html>`;
}

const CABECERAS_NEUTRAS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

export function respuestaNoEncontrado(): Response {
  return new Response(paginaNeutral("Página no encontrada", "La dirección que buscas no existe o ya no está disponible."), {
    status: 404,
    headers: CABECERAS_NEUTRAS,
  });
}

export function respuestaMantenimiento(): Response {
  return new Response(paginaNeutral("Sitio en mantenimiento", "Estamos haciendo ajustes. Vuelve a intentarlo más tarde."), {
    status: 503,
    headers: { ...CABECERAS_NEUTRAS, "retry-after": "3600" },
  });
}

export function respuestaExpirada(root: string): Response {
  const url = escAttr(urlRaiz(root));
  return new Response(
    paginaNeutral(
      "Esta propuesta expiró",
      "Esta propuesta expiró. Escríbenos para renovarla.",
      `<p><a href="${url}">Ir a Sky Studios Labs</a></p>`
    ),
    { status: 410, headers: CABECERAS_NEUTRAS }
  );
}

// ---------------------------------------------------------------------------------------------
// Disco
// ---------------------------------------------------------------------------------------------

export function directorioClientes(): string {
  return path.join(process.cwd(), "clientes");
}

export type ArchivoEncontrado = { ruta: string; rel: string; ext: string };

async function esArchivo(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isFile();
  } catch {
    return false;
  }
}

/**
 * Busca el archivo a servir dentro de `base`: directorio → index.html, sin extensión → .html.
 * Verifica también el destino real (enlaces simbólicos) para que no escape de `base`.
 */
export async function buscarArchivo(base: string, segments: readonly string[]): Promise<ArchivoEncontrado | null> {
  const ruta = resolverRutaSegura(base, segments);
  if (!ruta) return null;

  const candidatos: string[] = [];
  let st: import("node:fs").Stats | null = null;
  try {
    st = await fs.stat(ruta);
  } catch {
    st = null;
  }
  if (st?.isDirectory()) candidatos.push(path.join(ruta, "index.html"));
  else if (st?.isFile()) candidatos.push(ruta);
  else if (!path.extname(ruta)) candidatos.push(`${ruta}.html`);

  let raizReal: string;
  try {
    raizReal = await fs.realpath(base);
  } catch {
    return null;
  }
  for (const c of candidatos) {
    if (!(await esArchivo(c))) continue;
    const real = await fs.realpath(c);
    if (real !== raizReal && !real.startsWith(raizReal + path.sep)) return null;
    const ext = path.extname(c).slice(1).toLowerCase();
    return { ruta: real, rel: path.relative(path.resolve(base), c), ext };
  }
  return null;
}

export type OpcionesServir = {
  /** carpeta del sitio (relativa a /clientes) */
  carpeta: string;
  segmentos: string[];
  /** prefijo público terminado en "/" */
  prefijo: string;
  root: string;
  /** transformación HTML adicional (franja, noindex, canonical…) */
  transformarHtml?: (html: string, rel: string) => string;
  cabecerasExtra?: Record<string, string>;
};

export const CACHE_HTML = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
export const CACHE_ASSET = "public, max-age=86400";

/** Sirve un archivo de /clientes/<carpeta>. Devuelve 404 neutral si no existe o no se permite. */
export async function servirArchivo(op: OpcionesServir): Promise<Response> {
  const base = resolverRutaSegura(directorioClientes(), [op.carpeta]);
  if (!base || base === directorioClientes()) return respuestaNoEncontrado();

  const archivo = await buscarArchivo(base, op.segmentos);
  if (!archivo) return respuestaNoEncontrado();
  const tipo = tipoContenido(archivo.ext);
  if (!tipo) return respuestaNoEncontrado();

  const extra = op.cabecerasExtra ?? {};
  if (esHtml(archivo.ext)) {
    let html = await fs.readFile(archivo.ruta, "utf8");
    const base = calcularBase(op.prefijo, op.segmentos, archivo.rel);
    if (base) html = inyectarBase(html, base);
    if (op.transformarHtml) html = op.transformarHtml(html, archivo.rel);
    html = inyectarPie(html, op.root);
    return new Response(html, {
      status: 200,
      headers: { "content-type": tipo, "cache-control": CACHE_HTML, ...extra },
    });
  }

  const buf = await fs.readFile(archivo.ruta);
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": tipo,
      "content-length": String(buf.byteLength),
      "cache-control": CACHE_ASSET,
      ...extra,
    },
  });
}

/** Dominio raíz configurado. */
export function rootDominio(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skystudioslabs.com";
}

/** Ruta pública (sin index.html) de un archivo relativo, para el canonical. */
export function rutaCanonica(rel: string): string {
  const r = rel.split(path.sep).join("/");
  if (r === "index.html") return "";
  if (r.endsWith("/index.html")) return r.slice(0, -"index.html".length);
  return r.replace(/\.html?$/, "");
}
