import "server-only";
import type { Lead } from "@/lib/lead";

/**
 * Aviso a tu WhatsApp cuando llega un prospecto nuevo desde el sitio.
 * Usa CallMeBot (gratis, uso personal). Se activa solo si existen estas variables de entorno:
 *   CALLMEBOT_APIKEY  → la llave que CallMeBot te envía al activar el servicio (secreta).
 *   AVISO_WHATSAPP    → tu número con lada de país, solo dígitos (ej. 524492889487).
 *   CALLMEBOT_URL     → opcional; por defecto https://api.callmebot.com/whatsapp.php
 * Nunca se registra la llave ni el contenido del prospecto en los logs.
 */
export function avisoConfigurado(): boolean {
  return Boolean(process.env.CALLMEBOT_APIKEY?.trim() && /^\d{10,15}$/.test(process.env.AVISO_WHATSAPP?.trim() ?? ""));
}

export function mensajeAviso(lead: Pick<Lead, "nombre" | "negocio" | "whatsapp" | "origen">, sitio: string): string {
  return [
    "🔔 Nuevo prospecto en Sky Studios Labs",
    `Nombre: ${lead.nombre}`,
    `Negocio: ${lead.negocio}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Desde: ${lead.origen}`,
    `CRM: ${sitio.replace(/\/$/, "")}/admin`,
  ].join("\n");
}

export function urlAviso(texto: string, env = process.env): string {
  const base = env.CALLMEBOT_URL?.trim() || "https://api.callmebot.com/whatsapp.php";
  const u = new URL(base);
  u.searchParams.set("phone", `+${env.AVISO_WHATSAPP?.trim() ?? ""}`);
  u.searchParams.set("text", texto);
  u.searchParams.set("apikey", env.CALLMEBOT_APIKEY?.trim() ?? "");
  return u.toString();
}

/** Envía el aviso. No lanza errores: si falla, solo se registra el código de estado. */
export async function avisarNuevoProspecto(lead: Pick<Lead, "nombre" | "negocio" | "whatsapp" | "origen">): Promise<void> {
  if (!avisoConfigurado()) return;
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skystudioslabs.com";
  try {
    const res = await fetch(urlAviso(mensajeAviso(lead, sitio)), { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) console.error("[aviso] CallMeBot respondió", res.status);
  } catch (e) {
    console.error("[aviso] no se pudo enviar el aviso", e instanceof Error ? e.name : "");
  }
}
