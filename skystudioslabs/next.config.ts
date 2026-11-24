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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
        // admin./portal./propuesta. se reescriben internamente: la regla por ruta no los cubre.
        source: "/:path*",
        has: [{ type: "host", value: "(admin|portal|propuesta)\\..*" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
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
