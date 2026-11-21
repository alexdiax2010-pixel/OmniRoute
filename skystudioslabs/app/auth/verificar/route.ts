import { NextResponse, type NextRequest } from "next/server";
import { consumirEnlaceLocal, modoLocal } from "@/lib/auth";
import { redireccionRelativa } from "@/lib/redireccion";

/** MODO LOCAL: valida el enlace mágico simulado y crea la cookie de sesión. En Supabase → 404. */
export async function GET(request: NextRequest) {
  if (!modoLocal()) return new NextResponse("No encontrado", { status: 404 });
  const destino = await consumirEnlaceLocal(request.nextUrl.searchParams.get("token"));
  if (!destino) {
    const portal = request.nextUrl.searchParams.get("a") === "portal";
    return redireccionRelativa(`${portal ? "/portal" : "/admin"}/login?error=enlace`, 307);
  }
  return redireccionRelativa(destino, 303);
}
