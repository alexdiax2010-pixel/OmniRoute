import type { NextRequest } from "next/server";
import { supabaseConfigurado } from "@/lib/data";
import { siguienteSeguro } from "@/lib/auth-token";
import { redireccionRelativa } from "@/lib/redireccion";

/** Supabase: intercambia el código del enlace mágico por la sesión (PKCE) y redirige. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = siguienteSeguro(url.searchParams.get("next"), "/admin");
  const login = next.startsWith("/portal") ? "/portal/login" : "/admin/login";
  if (!supabaseConfigurado()) return redireccionRelativa(login, 307);

  const code = url.searchParams.get("code");
  if (code) {
    const { clienteSesion } = await import("@/lib/supabase/servidor");
    const db = await clienteSesion();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return redireccionRelativa(next, 303);
    console.error("[auth] exchangeCodeForSession falló", error.status ?? "");
  }
  return redireccionRelativa(`${login}?error=enlace`, 307);
}
