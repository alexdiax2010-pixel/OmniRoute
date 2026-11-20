import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Tokens firmados (HMAC-SHA256) para el MODO LOCAL: enlaces mágicos simulados y la cookie de sesión.
 * Formato: base64url(JSON payload) + "." + base64url(firma). Funciones puras (el secreto se pasa).
 */

export type Proposito = "enlace" | "sesion";
export type RolToken = "admin" | "cliente";

export type PayloadToken = {
  /** propósito: un enlace no sirve como sesión ni al revés */
  k: Proposito;
  /** correo (minúsculas) */
  e: string;
  r: RolToken;
  /** prospectoId (solo clientes) */
  p?: string;
  /** expiración en ms epoch */
  x: number;
  /** nonce (un solo uso para enlaces) */
  n: string;
};

export const DURACION_ENLACE_MS = 15 * 60 * 1000;
export const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000;

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function firma(datos: string, secreto: string): Buffer {
  return createHmac("sha256", secreto).update(datos).digest();
}

export function firmarToken(
  datos: { k: Proposito; e: string; r: RolToken; p?: string },
  secreto: string,
  duracionMs: number,
  ahora: number = Date.now(),
): string {
  if (!secreto) throw new Error("Falta el secreto para firmar");
  const payload: PayloadToken = { ...datos, e: datos.e.trim().toLowerCase(), x: ahora + duracionMs, n: randomBytes(9).toString("base64url") };
  const cuerpo = b64(JSON.stringify(payload));
  return `${cuerpo}.${b64(firma(cuerpo, secreto))}`;
}

/** Verifica firma (en tiempo constante), propósito y expiración. Devuelve el payload o null. */
export function verificarToken(token: string | null | undefined, secreto: string, proposito: Proposito, ahora: number = Date.now()): PayloadToken | null {
  if (!token || !secreto || token.length > 2048) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [cuerpo, sig] = partes;
  let recibida: Buffer;
  try {
    recibida = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  const esperada = firma(cuerpo, secreto);
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  let p: PayloadToken;
  try {
    p = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!p || typeof p !== "object" || p.k !== proposito || typeof p.e !== "string" || typeof p.x !== "number" || typeof p.n !== "string") return null;
  if (p.r !== "admin" && p.r !== "cliente") return null;
  if (p.r === "cliente" && (typeof p.p !== "string" || !p.p)) return null;
  if (ahora >= p.x) return null;
  return p;
}

/** Lista de correos admin (env ADMIN_EMAILS, separados por coma), en minúsculas. */
export function listaAdmins(env: string | undefined): string[] {
  return (env ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function esEmailAdmin(email: string | null | undefined, env: string | undefined): boolean {
  if (!email) return false;
  return listaAdmins(env).includes(email.trim().toLowerCase());
}

/** Solo rutas internas de admin/portal (evita redirecciones abiertas). */
export function siguienteSeguro(next: string | null | undefined, porDefecto: string): string {
  if (!next || typeof next !== "string") return porDefecto;
  if (!/^\/(admin|portal)(\/|$|\?)/.test(next) || next.startsWith("//") || next.includes("\\")) return porDefecto;
  if (/^\/(admin|portal)\/login/.test(next)) return porDefecto;
  return next;
}
