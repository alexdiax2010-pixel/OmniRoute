import type { NextRequest } from "next/server";
import { getRepo } from "@/lib/data";
import { esSlugValido } from "@/lib/hosts";
import {
  estadoSitio,
  inyectarFranja,
  inyectarNoindex,
  respuestaExpirada,
  respuestaMantenimiento,
  respuestaNoEncontrado,
  rootDominio,
  servirArchivo,
} from "@/lib/sitios/servir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; path?: string[] }> };

/**
 * Propuestas (bocetos para prospectos): propuesta.ROOT/<slug>/... → /propuestas/<slug>/...
 * Siempre noindex, con franja "boceto no oficial" y caducidad.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { slug, path: segmentos = [] } = await params;
  // Solo se sirven a través del subdominio propuesta.* (no abiertas en el dominio raíz).
  if (request.headers.get("x-sky-destino") !== "propuesta") return respuestaNoEncontrado();
  if (!esSlugValido(slug)) return respuestaNoEncontrado();

  const root = rootDominio();
  const sitio = await (await getRepo()).obtenerSitio(slug);
  if (!sitio || sitio.tipo !== "propuesta") return respuestaNoEncontrado();

  const estado = estadoSitio(sitio);
  if (estado === "inactivo") return respuestaMantenimiento();
  if (estado === "expirado") return respuestaExpirada(root);
  if (estado !== "ok") return respuestaNoEncontrado();

  return servirArchivo({
    carpeta: sitio.carpeta,
    segmentos,
    prefijo: `/${sitio.slug}/`,
    root,
    transformarHtml: (html) => inyectarFranja(inyectarNoindex(html)),
    cabecerasExtra: { "x-robots-tag": "noindex, nofollow" },
  });
}
