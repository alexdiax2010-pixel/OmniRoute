import type { NextRequest } from "next/server";
import { getRepo } from "@/lib/data";
import { normalizarHost } from "@/lib/hosts";
import {
  estadoSitio,
  inyectarCanonical,
  respuestaMantenimiento,
  respuestaNoEncontrado,
  rootDominio,
  rutaCanonica,
  servirArchivo,
  urlRaiz,
} from "@/lib/sitios/servir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; path?: string[] }> };

/**
 * Sitios de clientes (HTML estático en /clientes/<carpeta>). Llega aquí por reescritura del proxy:
 *   <slug>.ROOT/...        (x-sky-destino: cliente)        → prefijo "/"
 *   ROOT/c/<slug>/...      (x-sky-destino: publico)        → prefijo "/c/<slug>/", noindex
 *   dominio propio         (x-sky-destino: dominio-propio) → slug "_d", primer segmento = host
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { slug, path: ruta = [] } = await params;
  const destino = request.headers.get("x-sky-destino") ?? "cliente";
  const root = rootDominio();
  const repo = await getRepo();

  let segmentos = ruta;
  let sitio;
  if (slug === "_d") {
    if (destino !== "dominio-propio" || !ruta[0]) return respuestaNoEncontrado();
    sitio = await repo.obtenerSitioPorDominio(normalizarHost(ruta[0]));
    segmentos = ruta.slice(1);
  } else {
    sitio = await repo.obtenerSitio(slug);
  }

  if (!sitio || sitio.tipo !== "cliente") return respuestaNoEncontrado();
  const estado = estadoSitio(sitio);
  if (estado === "inactivo") return respuestaMantenimiento();
  if (estado !== "ok") return respuestaNoEncontrado();

  const porRespaldo = destino === "publico";
  const prefijo = porRespaldo ? `/c/${sitio.slug}/` : "/";
  const origenCanonico = sitio.dominio_propio
    ? `https://${sitio.dominio_propio}`
    : urlRaiz(`${sitio.slug}.${root.replace(/^https?:\/\//, "")}`);

  return servirArchivo({
    carpeta: sitio.carpeta,
    segmentos,
    prefijo,
    root,
    transformarHtml: (html, rel) => inyectarCanonical(html, `${origenCanonico}/${rutaCanonica(rel)}`),
    cabecerasExtra: porRespaldo ? { "x-robots-tag": "noindex" } : undefined,
  });
}
