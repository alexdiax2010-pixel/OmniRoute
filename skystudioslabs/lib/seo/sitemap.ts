/**
 * Helpers puros para sitemap.xml y robots.txt (testeables sin Next).
 */
import type { MetadataRoute } from "next";
import type { Sitio } from "@/lib/types";
import { resolverHost } from "@/lib/hosts";
import { RUTAS_SEO } from "./paginas";
import { urlSubdominio } from "./url";

/** Rutas que nunca deben rastrearse en el dominio principal. */
export const RUTAS_PRIVADAS = ["/admin", "/portal", "/api", "/propuestas", "/sitios", "/c/", "/prototipo"];

/** Sólo sitios de clientes activos (nunca propuestas). */
export function sitiosIndexables(sitios: Sitio[]): Sitio[] {
  return sitios.filter((s) => s.tipo === "cliente" && s.activo);
}

/**
 * @param sitios  todos los sitios del repo (se filtran aquí)
 * @param siteUrl URL del sitio principal, ej. https://skystudioslabs.com
 * @param root    dominio raíz de subdominios, ej. skystudioslabs.com
 */
export function construirSitemap(sitios: Sitio[], siteUrl: string, root: string, ahora: Date = new Date()): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/+$/, "");
  const entradas: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: ahora, changeFrequency: "weekly", priority: 1 },
    ...RUTAS_SEO.map((ruta) => ({
      url: `${base}${ruta}`,
      lastModified: ahora,
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
    entradas.push({ url, lastModified: new Date(s.creado || ahora), changeFrequency: "monthly", priority: 0.5 });
  }
  return entradas;
}

/** robots.txt según el host: propuesta./admin./portal. (y reservados) no se indexan nunca. */
export function construirRobots(host: string | null | undefined, root: string, siteUrl: string): MetadataRoute.Robots {
  const destino = resolverHost(host, root);
  if (destino.tipo === "propuesta" || destino.tipo === "admin" || destino.tipo === "portal" || destino.tipo === "reservado") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: RUTAS_PRIVADAS },
    sitemap: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
