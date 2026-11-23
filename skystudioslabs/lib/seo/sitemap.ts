/**
 * Helpers puros para sitemap.xml y robots.txt (testeables sin Next).
 */
import type { MetadataRoute } from "next";
import type { Sitio } from "@/lib/types";
import { resolverHost } from "@/lib/hosts";
import { RUTAS_SEO } from "./paginas";
import { urlSubdominio } from "./url";

/**
 * Rutas que nunca deben rastrearse en el dominio principal. /auth/ tiene GET con efectos
 * (verificar enlace, cerrar sesión). /c/ NO va aquí: es un respaldo con noindex y canonical al
 * subdominio, y Google sólo ve el noindex si puede rastrear la página.
 */
export const RUTAS_PRIVADAS = ["/admin", "/portal", "/api", "/auth/", "/propuestas", "/sitios"];

/** Sólo sitios de clientes activos (nunca propuestas). */
export function sitiosIndexables(sitios: Sitio[]): Sitio[] {
  return sitios.filter((s) => s.tipo === "cliente" && s.activo);
}

/**
 * @param sitios  todos los sitios del repo (se filtran aquí)
 * @param siteUrl URL del sitio principal, ej. https://skystudioslabs.com
 * @param root    dominio raíz de subdominios, ej. skystudioslabs.com
 */
export function construirSitemap(sitios: Sitio[], siteUrl: string, root: string): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/+$/, "");
  // Sin lastModified en las páginas propias: una fecha "de ahora" que cambia cada hora no es real
  // y Google deja de confiar en el <lastmod> del sitemap. Los clientes usan su fecha de alta.
  const entradas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...RUTAS_SEO.map((ruta) => ({
      url: `${base}${ruta}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
  const vistos = new Set(entradas.map((e) => e.url));
  for (const s of sitiosIndexables(sitios)) {
    // Si el cliente tiene dominio propio, ésa es la URL canónica; el subdominio sería un duplicado.
    const url = s.dominio_propio ? `https://${s.dominio_propio.replace(/\/+$/, "")}/` : `${urlSubdominio(s.slug, root)}/`;
    if (vistos.has(url)) continue;
    vistos.add(url);
    const alta = s.creado ? new Date(s.creado) : null;
    entradas.push({
      url,
      ...(alta && !Number.isNaN(alta.getTime()) ? { lastModified: alta } : {}),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }
  return entradas;
}

/**
 * robots.txt según el host.
 * - admin./portal./reservados: Disallow total (login y GET con efectos; nada que indexar).
 * - propuesta.: se permite rastrear para que Google VEA el noindex (meta + X-Robots-Tag); con
 *   Disallow, un enlace compartido podría indexarse como URL "sin información".
 * - cliente / dominio propio: todo permitido; el sitemap sólo se anuncia en subdominios (la
 *   propiedad de dominio de Search Console los cubre; un dominio propio no).
 */
export function construirRobots(host: string | null | undefined, root: string, siteUrl: string): MetadataRoute.Robots {
  const destino = resolverHost(host, root);
  const mapa = `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`;
  if (destino.tipo === "admin" || destino.tipo === "portal" || destino.tipo === "reservado") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  if (destino.tipo === "propuesta") return { rules: { userAgent: "*", allow: "/" } };
  if (destino.tipo === "cliente") return { rules: { userAgent: "*", allow: "/" }, sitemap: mapa };
  if (destino.tipo === "dominio-propio") return { rules: { userAgent: "*", allow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: RUTAS_PRIVADAS },
    sitemap: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
