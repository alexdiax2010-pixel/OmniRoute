import type { Metadata } from "next";
import { SITIO } from "@/config/sitio";
import { obtenerPagina, type PaginaSEO } from "./paginas";
import { breadcrumb, faqPage, service, type JsonLdObjeto } from "./schema";
import { siteUrl } from "./url";

/** Metadata única por página SEO (title, description, canonical, Open Graph). */
export function metadataSEO(slug: string): Metadata {
  const p = obtenerPagina(slug);
  const ruta = `/${p.slug}`;
  return {
    title: p.titulo,
    description: p.descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: SITIO.nombre,
      url: ruta,
      title: `${p.titulo} | ${SITIO.nombre}`,
      description: p.descripcion,
    },
  };
}

/** JSON-LD de una página SEO: Service + FAQPage + BreadcrumbList. */
export function schemasPagina(p: PaginaSEO, base: string = siteUrl()): JsonLdObjeto[] {
  const ruta = `/${p.slug}`;
  return [
    service(p.servicio.nombre, p.servicio.descripcion, ruta, base),
    faqPage(p.faqs),
    breadcrumb([{ nombre: p.titulo, ruta }], base),
  ];
}
