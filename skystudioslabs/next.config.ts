import type { NextConfig } from "next";
import path from "node:path";

// Este proyecto vive dentro de otro repositorio: fija la raíz para que Turbopack y el trazado de
// archivos no tomen el lockfile/instrumentation del repo padre.
const raiz = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
