import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { leerFoto } from "@/lib/portal/fotos";

/** Foto de una solicitud de cambio. SOLO admin. */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (sesion?.rol !== "admin") return new NextResponse("No autorizado", { status: 401 });
  const foto = await leerFoto(request.nextUrl.searchParams.get("ruta") ?? "");
  if (!foto) return new NextResponse("No encontrado", { status: 404 });
  if ("url" in foto) return NextResponse.redirect(foto.url);
  return new NextResponse(new Uint8Array(foto.bytes), {
    headers: {
      "Content-Type": foto.tipo,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
