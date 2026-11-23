/**
 * URLs públicas del sitio. Funciones puras (testeables) + lectores de variables de entorno.
 */
export const DOMINIO_RAIZ_DEFECTO = "skystudioslabs.com";

/** URL pública del sitio principal, sin "/" final. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${DOMINIO_RAIZ_DEFECTO}`).replace(/\/+$/, "");
}

/** Dominio raíz para subdominios de clientes (puede traer puerto en local). */
export function rootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || DOMINIO_RAIZ_DEFECTO;
}

/** https, salvo en desarrollo local (localhost) → http. */
export function protocoloPara(root: string): "http" | "https" {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(root.trim()) || root.trim().toLowerCase().startsWith("localhost")
    ? "http"
    : "https";
}

/** URL absoluta de un subdominio de cliente: https://<slug>.<root> */
export function urlSubdominio(slug: string, root: string): string {
  return `${protocoloPara(root)}://${slug}.${root}`;
}

/** Imagen OG por defecto (app/opengraph-image.tsx). Se declara explícita porque un openGraph
 *  definido en un layout/página reemplaza la imagen heredada del archivo. */
export const IMAGEN_OG = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Sky Studios Labs — Páginas que venden, en todo México",
};
