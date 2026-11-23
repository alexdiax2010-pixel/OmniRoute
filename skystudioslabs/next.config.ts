import type { NextConfig } from "next";
import path from "node:path";

// Este proyecto vive dentro de otro repositorio: fija la raíz para que Turbopack y el trazado de
// archivos no tomen el lockfile/instrumentation del repo padre.
const raiz = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // CSS en <style> dentro del HTML: elimina las hojas que bloquean el render (el CSS total es pequeño).
  experimental: { inlineCss: true },
  turbopack: { root: raiz },
  outputFileTracingRoot: raiz,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Las páginas de clientes son HTML estático en /clientes: hay que incluirlas en el bundle de Vercel.
  outputFileTracingIncludes: {
    "/sitios/[slug]/[[...path]]": ["./clientes/**/*"],
    "/propuestas/[slug]/[[...path]]": ["./clientes/**/*"],
  },
  // La página de Zapopan pasó a cubrir todo México: el enlace viejo sigue funcionando.
  async redirects() {
    return [{ source: "/paginas-web-zapopan", destination: "/paginas-web-mexico", permanent: true }];
  },
  // Navegadores y bots piden /favicon.ico aunque la página declare icon.svg (y el CRM, al
  // declarar sólo el ícono de Apple, no publica <link rel="icon">): se sirve el mismo SVG.
  // Sólo en hosts propios (raíz, www, admin, portal): un sitio de cliente no debe heredar el logo.
  async rewrites() {
    const raizHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "skystudioslabs.com").replace(/:\d+$/, "");
    const hostsPropios = `(?:www\\.|admin\\.|portal\\.)?${raizHost.replace(/\./g, "\\.")}`;
    return [{ source: "/favicon.ico", has: [{ type: "host" as const, value: hostsPropios }], destination: "/icon.svg" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          // HTTPS obligatorio 2 años en el dominio y todos los subdominios (Vercel emite el
          // certificado wildcard). Sin "preload": eso es un compromiso que decide el dueño.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/(admin|portal)(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
