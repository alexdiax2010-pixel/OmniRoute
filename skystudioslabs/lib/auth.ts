import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Sesion } from "@/lib/types";
import { getRepo, supabaseConfigurado } from "@/lib/data";
import {
  DURACION_ENLACE_MS,
  DURACION_SESION_MS,
  esEmailAdmin,
  firmarToken,
  verificarToken,
  type PayloadToken,
} from "@/lib/auth-token";
import { normalizarHost } from "@/lib/hosts";

/**
 * Autenticación.
 *  - Modo Supabase: enlace mágico de Supabase (signInWithOtp) + /auth/callback. Admin = correo en
 *    ADMIN_EMAILS **y** en la tabla admins (RLS). Cliente = fila en clientes_portal.
 *  - Modo local (sin Supabase; solo dev o SKY_ALLOW_LOCAL_STORE=1): enlace mágico simulado
 *    (token HMAC de 15 min) y cookie de sesión firmada `sky_sesion`.
 */

export const COOKIE_SESION = "sky_sesion";

export function modoLocal(): boolean {
  if (supabaseConfigurado()) return false;
  return process.env.NODE_ENV !== "production" || process.env.SKY_ALLOW_LOCAL_STORE === "1";
}

/** Secreto para firmar (modo local) y hashear IPs. En producción es obligatorio y largo. */
export function secreto(): string {
  const s = process.env.SKY_SECRET ?? "";
  if (s.length >= 16 && s !== "cambia-esto-por-un-valor-largo-y-aleatorio") return s;
  if (process.env.NODE_ENV === "production") throw new Error("SKY_SECRET no está configurado (mínimo 16 caracteres).");
  return s || "sky-dev-secreto-inseguro-solo-local";
}

export function esAdminPermitido(email: string | null | undefined): boolean {
  return esEmailAdmin(email, process.env.ADMIN_EMAILS);
}

/** Origen confiable para construir enlaces (evita inyección por cabecera Host). */
export async function origenConfiable(): Promise<string> {
  const h = await headers();
  const host = normalizarHost(h.get("x-forwarded-host") ?? h.get("host"));
  const root = normalizarHost(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skystudioslabs.com");
  const rawHost = (h.get("x-forwarded-host") ?? h.get("host") ?? "").trim().toLowerCase();
  const permitido =
    host === root || host === `admin.${root}` || host === `portal.${root}` || host === `www.${root}` || host === "localhost" || host === "127.0.0.1";
  if (permitido && /^[a-z0-9.:-]+$/.test(rawHost)) {
    const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() === "https" || process.env.NODE_ENV === "production" ? "https" : "http";
    return `${proto}://${rawHost}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${root}`).replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

async function sesionLocal(): Promise<Sesion | null> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  const p = verificarToken(token, secreto(), "sesion");
  if (!p) return null;
  if (p.r === "admin") return esAdminPermitido(p.e) ? { rol: "admin", email: p.e } : null;
  // Cliente: el correo debe seguir ligado al mismo prospecto.
  const repo = await getRepo();
  const id = await repo.prospectoIdPorEmail(p.e);
  if (!id || id !== p.p) return null;
  return { rol: "cliente", email: p.e, prospectoId: id };
}

async function sesionSupabase(): Promise<Sesion | null> {
  const { clienteSesion } = await import("@/lib/supabase/servidor");
  const db = await clienteSesion();
  // getUser() valida el JWT contra Supabase (no confía solo en la cookie).
  const { data, error } = await db.auth.getUser();
  const user = data?.user;
  if (error || !user?.email) return null;
  const email = user.email.toLowerCase();
  if (esAdminPermitido(email)) {
    const { data: esAdmin } = await db.rpc("is_admin");
    if (esAdmin === true) return { rol: "admin", email };
  }
  const { data: fila } = await db.from("clientes_portal").select("prospecto_id").eq("user_id", user.id).maybeSingle();
  if (fila?.prospecto_id) return { rol: "cliente", email, prospectoId: String(fila.prospecto_id) };
  return null;
}

/** Sesión actual (memoizada por petición). */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  try {
    if (supabaseConfigurado()) return await sesionSupabase();
    if (modoLocal()) return await sesionLocal();
    return null;
  } catch (e) {
    console.error("[auth] no se pudo leer la sesión", e instanceof Error ? e.message : "");
    return null;
  }
});

export async function requerirAdmin(): Promise<Extract<Sesion, { rol: "admin" }>> {
  const s = await obtenerSesion();
  if (s?.rol !== "admin") redirect("/admin/login");
  return s;
}

export async function requerirCliente(): Promise<Extract<Sesion, { rol: "cliente" }>> {
  const s = await obtenerSesion();
  if (s?.rol !== "cliente") redirect("/portal/login");
  return s;
}

// ---------------------------------------------------------------------------
// Enlaces mágicos
// ---------------------------------------------------------------------------

export const MENSAJE_ENLACE = "Si tu correo está registrado, te llegará un enlace para entrar. Revisa tu bandeja (y spam).";

export type ResultadoEnlace = { mensaje: string; enlaceLocal?: string };

/** Crea el enlace del modo local (también lo usa "Invitar al portal" en modo local). */
export async function enlaceLocal(datos: { e: string; r: "admin" | "cliente"; p?: string }): Promise<string> {
  const token = firmarToken({ k: "enlace", ...datos }, secreto(), DURACION_ENLACE_MS);
  return `${await origenConfiable()}/auth/verificar?token=${encodeURIComponent(token)}${datos.r === "cliente" ? "&a=portal" : ""}`;
}

/**
 * Envía (o simula) el enlace mágico. Nunca revela si el correo existe: el mensaje es siempre el mismo.
 * En modo local devuelve además el enlace para mostrarlo en pantalla.
 */
export async function solicitarEnlace(emailCrudo: string, contexto: "admin" | "portal"): Promise<ResultadoEnlace> {
  const email = emailCrudo.trim().toLowerCase();
  const repo = await getRepo();

  if (modoLocal()) {
    let enlace: string | undefined;
    if (contexto === "admin" && esAdminPermitido(email)) {
      enlace = await enlaceLocal({ e: email, r: "admin" });
    } else if (contexto === "portal") {
      const id = await repo.prospectoIdPorEmail(email);
      if (id) enlace = await enlaceLocal({ e: email, r: "cliente", p: id });
    }
    if (enlace) console.info(`\n[auth] Modo local — enlace mágico para ${email}:\n${enlace}\n`);
    return { mensaje: MENSAJE_ENLACE, enlaceLocal: enlace };
  }

  if (supabaseConfigurado()) {
    const { clienteSesion } = await import("@/lib/supabase/servidor");
    const db = await clienteSesion();
    const next = contexto === "admin" ? "/admin" : "/portal";
    const emailRedirectTo = `${await origenConfiable()}/auth/callback?next=${encodeURIComponent(next)}`;
    // Admin: solo se manda si está en la lista blanca (y se permite crear su usuario la primera vez).
    // Portal: los clientes se crean por invitación desde el CRM → shouldCreateUser: false.
    if (contexto === "admin" ? esAdminPermitido(email) : true) {
      const { error } = await db.auth.signInWithOtp({
        email,
        options: { emailRedirectTo, shouldCreateUser: contexto === "admin" },
      });
      if (error && contexto === "admin") console.error("[auth] signInWithOtp falló", error.status ?? "");
    }
  }
  return { mensaje: MENSAJE_ENLACE };
}

// Nonces de enlaces ya usados (modo local, en memoria): un enlace sirve una sola vez.
const g = globalThis as unknown as { __skyNoncesUsados?: Map<string, number> };
const usados = (g.__skyNoncesUsados ??= new Map());

/** Modo local: valida el token del enlace y crea la cookie de sesión. Devuelve a dónde redirigir. */
export async function consumirEnlaceLocal(token: string | null): Promise<string | null> {
  if (!modoLocal()) return null;
  const p = verificarToken(token, secreto(), "enlace");
  if (!p) return null;
  const ahora = Date.now();
  for (const [n, x] of usados) if (x < ahora) usados.delete(n);
  if (usados.has(p.n)) return null;
  usados.set(p.n, p.x);
  if (p.r === "admin" && !esAdminPermitido(p.e)) return null;
  if (p.r === "cliente") {
    const id = await (await getRepo()).prospectoIdPorEmail(p.e);
    if (!id || id !== p.p) return null;
  }
  await crearCookieSesion(p);
  return p.r === "admin" ? "/admin" : "/portal";
}

async function crearCookieSesion(p: PayloadToken): Promise<void> {
  const token = firmarToken({ k: "sesion", e: p.e, r: p.r, p: p.p }, secreto(), DURACION_SESION_MS);
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(DURACION_SESION_MS / 1000),
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
  if (supabaseConfigurado()) {
    try {
      const { clienteSesion } = await import("@/lib/supabase/servidor");
      await (await clienteSesion()).auth.signOut();
    } catch {
      // sin sesión de Supabase: nada que cerrar
    }
  }
}

// ---------------------------------------------------------------------------
// Invitación al portal
// ---------------------------------------------------------------------------

export type ResultadoInvitacion = { ok: boolean; mensaje: string; enlaceLocal?: string };

/** Llamar SOLO después de requerirAdmin(). */
export async function invitarAlPortal(prospectoId: string, email: string): Promise<ResultadoInvitacion> {
  const e = email.trim().toLowerCase();
  if (modoLocal()) {
    const enlace = await enlaceLocal({ e, r: "cliente", p: prospectoId });
    console.info(`\n[auth] Modo local — invitación al portal para ${e}:\n${enlace}\n`);
    return { ok: true, mensaje: "Modo local: comparte este enlace de prueba con el cliente (vence en 15 min).", enlaceLocal: enlace };
  }
  if (!supabaseConfigurado()) return { ok: false, mensaje: "El portal no está configurado." };
  const { clienteServicio } = await import("@/lib/supabase/servidor");
  const db = clienteServicio();
  const redirectTo = `${await origenConfiable()}/auth/callback?next=/portal`;
  let userId: string | null = null;
  const inv = await db.auth.admin.inviteUserByEmail(e, { redirectTo });
  if (inv.data?.user?.id) userId = inv.data.user.id;
  else {
    // ¿Ya existía? Búscalo (agencia pequeña: pocas páginas).
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) break;
      userId = data.users.find((u) => u.email?.toLowerCase() === e)?.id ?? null;
      if (data.users.length < 200) break;
    }
    if (userId) {
      await db.auth.signInWithOtp({ email: e, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
    }
  }
  if (!userId) {
    console.error("[auth] inviteUserByEmail falló", inv.error?.status ?? "");
    return { ok: false, mensaje: "No se pudo enviar la invitación. Revisa el correo e inténtalo de nuevo." };
  }
  const { error } = await db.from("clientes_portal").upsert({ user_id: userId, prospecto_id: prospectoId, email: e }, { onConflict: "user_id" });
  if (error) {
    console.error("[auth] clientes_portal upsert falló", error.code ?? "");
    return { ok: false, mensaje: "No se pudo ligar el correo al cliente." };
  }
  return { ok: true, mensaje: `Invitación enviada a ${e}.` };
}
