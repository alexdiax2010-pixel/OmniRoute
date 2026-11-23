/**
 * Generadores de JSON-LD (schema.org). Devuelven objetos planos; se pintan con <JsonLd />.
 */
import { NUMEROS, SITIO, whatsappConfigurado } from "@/config/sitio";
import { siteUrl as leerSiteUrl } from "./url";

export type JsonLdObjeto = Record<string, unknown>;
export type FAQ = { pregunta: string; respuesta: string };
export type Miga = { nombre: string; ruta: string };

const zona = () => ({ "@type": "Country", name: SITIO.area });

/** true si el valor de config/sitio.ts sigue siendo un marcador ("[MI_CORREO]") o está vacío. */
export function esMarcador(valor: string | null | undefined): boolean {
  const v = (valor ?? "").trim();
  return !v || /^\[.*\]$/.test(v);
}

/** Perfiles públicos reales (schema.org sameAs). Los marcadores sin llenar se omiten. */
export function perfilesSociales(): string[] {
  const { instagram, facebook } = SITIO.redes;
  const lista: string[] = [];
  if (!esMarcador(instagram)) lista.push(`https://www.instagram.com/${instagram.replace(/^@/, "")}`);
  if (!esMarcador(facebook)) lista.push(`https://www.facebook.com/${facebook.replace(/^@/, "")}`);
  return lista;
}

function absoluta(ruta: string, base: string): string {
  if (/^https?:\/\//.test(ruta)) return ruta;
  return `${base}${ruta.startsWith("/") ? "" : "/"}${ruta === "/" ? "" : ruta}`.replace(/\/$/, "") || base;
}

/** Identificador estable del negocio para enlazar Service.provider, etc. */
export function idNegocio(base: string = leerSiteUrl()): string {
  return `${base}/#negocio`;
}

/** schema.org ProfessionalService de Sky Studios Labs. El teléfono sólo si ya está configurado. */
export function professionalService(base: string = leerSiteUrl()): JsonLdObjeto {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": idNegocio(base),
    name: SITIO.nombre,
    url: `${base}/`,
    image: `${base}/opengraph-image`,
    // Google pide un logo raster de al menos 112×112 px (no SVG).
    logo: `${base}/icons/icon-512.png`,
    description:
      "Agencia de páginas web, alta en Google Maps, redes sociales y chatbots de WhatsApp para negocios de todo México.",
    areaServed: zona(),
    address: {
      "@type": "PostalAddress",
      addressCountry: SITIO.pais,
    },
    sameAs: perfilesSociales(),
    knowsAbout: ["Diseño de páginas web", "Google Maps", "SEO local", "Redes sociales", "Chatbots de WhatsApp"],
    knowsLanguage: "es-MX",
    telephone: `+${SITIO.telefono}`,
    ...(esMarcador(SITIO.correo) ? {} : { email: SITIO.correo }),
    ...(whatsappConfigurado
      ? { contactPoint: NUMEROS.map((n) => ({ "@type": "ContactPoint", contactType: "sales", telephone: `+${n}`, areaServed: "MX", availableLanguage: "es" })) }
      : {}),
  };
}

/** schema.org WebSite: nombre del sitio en resultados de Google, publicado por el negocio. */
export function webSite(base: string = leerSiteUrl()): JsonLdObjeto {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#sitio`,
    name: SITIO.nombre,
    url: `${base}/`,
    inLanguage: "es-MX",
    publisher: { "@id": idNegocio(base) },
  };
}

/** schema.org FAQPage. */
export function faqPage(faqs: FAQ[]): JsonLdObjeto {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: { "@type": "Answer", text: f.respuesta },
    })),
  };
}

/** schema.org Service ofrecido por Sky Studios Labs. */
export function service(name: string, description: string, ruta?: string, base: string = leerSiteUrl()): JsonLdObjeto {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    ...(ruta ? { url: absoluta(ruta, base) } : {}),
    serviceType: name,
    provider: { "@type": "ProfessionalService", "@id": idNegocio(base), name: SITIO.nombre },
    areaServed: zona(),
  };
}

/** schema.org BreadcrumbList. Sin argumentos devuelve sólo "Inicio". */
export function breadcrumb(migas: Miga[] = [], base: string = leerSiteUrl()): JsonLdObjeto {
  const todas: Miga[] = [{ nombre: "Inicio", ruta: "/" }, ...migas];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: todas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: m.ruta === "/" ? `${base}/` : absoluta(m.ruta, base),
    })),
  };
}

/** Serializa JSON-LD de forma segura para incrustarlo en <script>. */
export function serializarJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
