import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigurado } from "@/lib/data";
import { siguienteSeguro } from "@/lib/auth-token";

/** Supabase: intercambia el código del enlace mágico por la sesión (PKCE) y redirige. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = siguienteSeguro(url.searchParams.get("next"), "/admin");
  const login = next.startsWith("/portal") ? "/portal/login" : "/admin/login";
  if (!supabaseConfigurado()) return NextResponse.redirect(new URL(login, url));

  const code = url.searchParams.get("code");
  if (code) {
    const { clienteSesion } = await import("@/lib/supabase/servidor");
    const db = await clienteSesion();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url));
    console.error("[auth] exchangeCodeForSession falló", error.status ?? "");
  }
  return NextResponse.redirect(new URL(`${login}?error=enlace`, url));
}
