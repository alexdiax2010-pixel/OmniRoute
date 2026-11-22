import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { firmarToken, listaAdmins, verificarToken } from "@/lib/auth-token";

/**
 * Acceso al CRM con código especial (alternativa al enlace mágico por correo).
 *  - El código vive SOLO en la variable de entorno ADMIN_CODIGO (mínimo 8 caracteres).
 *  - La comparación es en tiempo constante (HMAC + timingSafeEqual).
 *  - Al acertar se crea la cookie de sesión firmada `sky_sesion` (12 h) con la marca p="codigo".
 *  - Con esa sesión el servidor usa la service role para leer/escribir el CRM (no hay sesión de
 *    Supabase); por eso CADA acción del CRM sigue verificando la sesión con requerirAdmin().
 */
export const COOKIE_SESION = "sky_sesion";
export const MARCA_CODIGO = "codigo";
export const DURACION_SESION_CODIGO_MS = 12 * 60 * 60 * 1000;

export function secretoFirma(): string {
  const s = process.env.SKY_SECRET ?? "";
  if (s.length >= 16 && s !== "cambia-esto-por-un-valor-largo-y-aleatorio") return s;
  if (process.env.NODE_ENV === "production") throw new Error("SKY_SECRET no está configurado (mínimo 16 caracteres).");
  return s || "sky-dev-secreto-inseguro-solo-local";
}

export function codigoAdminConfigurado(): boolean {
  return (process.env.ADMIN_CODIGO ?? "").trim().length >= 8;
}

/** Compara el intento con ADMIN_CODIGO sin filtrar información por tiempos. Función pura sobre env. */
export function codigoCorrecto(intento: string, codigo = process.env.ADMIN_CODIGO ?? "", secreto = secretoFirma()): boolean {
  const real = codigo.trim();
  if (real.length < 8 || !intento) return false;
  const h = (v: string) => createHmac("sha256", secreto).update(v).digest();
  return timingSafeEqual(h(intento.trim()), h(real));
}

/** Correo con el que se identifica la sesión por código (el primero de ADMIN_EMAILS). */
export function correoAdminCodigo(): string | null {
  return listaAdmins(process.env.ADMIN_EMAILS)[0] ?? null;
}

export async function crearSesionCodigo(): Promise<void> {
  const email = correoAdminCodigo();
  if (!email) throw new Error("ADMIN_EMAILS vacío");
  const token = firmarToken({ k: "sesion", e: email, r: "admin", p: MARCA_CODIGO }, secretoFirma(), DURACION_SESION_CODIGO_MS);
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(DURACION_SESION_CODIGO_MS / 1000),
  });
}

/** Devuelve el correo admin si la petición trae una sesión válida iniciada con código. */
export async function adminPorCodigo(): Promise<string | null> {
  if (!codigoAdminConfigurado()) return null;
  let token: string | undefined;
  try {
    token = (await cookies()).get(COOKIE_SESION)?.value;
  } catch {
    return null; // fuera de una petición (scripts)
  }
  const p = verificarToken(token, secretoFirma(), "sesion");
  if (!p || p.r !== "admin" || p.p !== MARCA_CODIGO) return null;
  return listaAdmins(process.env.ADMIN_EMAILS).includes(p.e) ? p.e : null;
}
