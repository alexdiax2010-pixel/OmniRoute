import { NextResponse } from "next/server";

/**
 * Redirección con `Location` relativa (RFC 9110). El navegador la resuelve contra el host
 * en el que está (admin., portal. o el dominio raíz). `new URL(ruta, request.nextUrl)` no sirve
 * para esto: con `next start` el host de nextUrl es el del servidor (localhost), no el de la
 * petición, y la cookie de sesión (host-only) se pierde al saltar de admin.dominio a dominio/admin.
 */
export function redireccionRelativa(ruta: string, status: 302 | 303 | 307 = 303): NextResponse {
  const segura = ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.includes("\\") ? ruta : "/";
  return new NextResponse(null, { status, headers: { Location: segura, "Cache-Control": "no-store" } });
}
