/**
 * Cabeceras de seguridad y de indexación que agrega proxy.ts según el destino del host.
 * Funciones puras (testeables sin Next).
 *
 * La CSP sólo se aplica a las páginas propias (sitio, CRM, portal): las páginas de clientes y las
 * propuestas son HTML estático de terceros que puede cargar fuentes, mapas o imágenes externas.
 */
import type { Destino } from "@/lib/hosts";

/**
 * CSP sin nonces (guía "Without Nonces" de Next 16): las páginas son estáticas/ISR, así que
 * 'unsafe-inline' es necesario para los <script> de hidratación y el CSS en línea (inlineCss).
 * Todo lo demás (GSAP, Lenis, fuentes, imágenes) se sirve desde el mismo origen; Supabase sólo se
 * llama desde el servidor. En desarrollo React necesita 'unsafe-eval'.
 */
export function construirCsp(dev = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "media-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** ¿La respuesta es una página propia (no un sitio de cliente ni una propuesta)? */
export function esPaginaPropia(destino: Destino, rutaReescrita: string | null): boolean {
  if (rutaReescrita?.startsWith("/sitios/") || rutaReescrita?.startsWith("/propuestas")) return false;
  return destino.tipo === "publico" || destino.tipo === "admin" || destino.tipo === "portal";
}

/**
 * Cabeceras de seguridad para páginas propias.
 * Sin Cross-Origin-Opener-Policy a propósito: medido con Lighthouse 12 móvil (3×3 corridas),
 * COOP same-origin fuerza un cambio de proceso en la navegación y subía el FCP ~50 ms en las tres
 * páginas; el sitio no abre ventanas emergentes que lo justifiquen.
 */
export function cabecerasSeguridad(dev = false): Record<string, string> {
  return {
    "Content-Security-Policy": construirCsp(dev),
    "X-Frame-Options": "DENY",
  };
}

/**
 * X-Robots-Tag por host: CRM, portal, propuestas y despliegues de vista previa (*.vercel.app)
 * nunca se indexan, aunque la ruta no traiga su propia meta robots.
 */
export function robotsPorHost(destino: Destino, host: string | null | undefined): string | null {
  if (destino.tipo === "admin" || destino.tipo === "portal" || destino.tipo === "propuesta") return "noindex, nofollow";
  const h = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  if (h.endsWith(".vercel.app")) return "noindex, nofollow";
  return null;
}

/** www.<root> → <root> (una sola versión canónica del sitio). Devuelve el host destino o null. */
export function hostSinWww(host: string | null | undefined, root: string): string | null {
  const h = (host ?? "").trim().toLowerCase();
  const r = root.trim().toLowerCase();
  return h === `www.${r}` ? r : null;
}
