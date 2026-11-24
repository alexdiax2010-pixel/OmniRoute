import type { Metadata } from "next";
import { SITIO } from "@/config/sitio";
import { obtenerPagina, type PaginaSEO } from "./paginas";
import { breadcrumb, faqPage, service, type JsonLdObjeto } from "./schema";
import { IMAGEN_OG, siteUrl } from "./url";

/** Idioma/región del sitio (hreflang). Un solo idioma: es-MX + x-default apuntan a la misma URL. */
export const IDIOMA = "es-MX";

/** Título y descripción de la portada: los usan <title>, Open Graph y Twitter (deben coincidir). */
export const INICIO = {
  titulo: "Sky Studios Labs — Páginas web, Google Maps y chatbots en todo México",
  descripcion:
    "Páginas que venden, presencia en Google Maps, redes que trabajan por ti y un chatbot que responde a las 3 AM. Negocios de todo México: pide tu boceto gratis.",
} as const;

/** canonical + hreflang (es-MX y x-default) para una ruta relativa. */
export function alternatesPara(ruta: string): NonNullable<Metadata["alternates"]> {
  return { canonical: ruta, languages: { [IDIOMA]: ruta, "x-default": ruta } };
}

/** Open Graph + Twitter coherentes para una ruta. */
export function compartirPara(ruta: string, titulo: string, descripcion: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: SITIO.nombre,
      url: ruta,
      title: titulo,
      description: descripcion,
      images: [IMAGEN_OG],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion, images: [IMAGEN_OG] },
  };
}

/** Metadata única por página SEO (title, description, canonical, hreflang, Open Graph, Twitter). */
export function metadataSEO(slug: string): Metadata {
  const p = obtenerPagina(slug);
  const ruta = `/${p.slug}`;
  return {
    title: p.titulo,
    description: p.descripcion,
    alternates: alternatesPara(ruta),
    ...compartirPara(ruta, `${p.titulo} | ${SITIO.nombre}`, p.descripcion),
  };
}

/** JSON-LD de una página SEO: Service + FAQPage + BreadcrumbList (miga = texto visible del menú). */
export function schemasPagina(p: PaginaSEO, base: string = siteUrl()): JsonLdObjeto[] {
  const ruta = `/${p.slug}`;
  return [
    service(p.servicio.nombre, p.servicio.descripcion, ruta, base),
    faqPage(p.faqs),
    breadcrumb([{ nombre: p.menu, ruta }], base),
  ];
}
