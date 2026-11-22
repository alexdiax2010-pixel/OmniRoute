import "server-only";
import webpush from "web-push";
import { getRepo } from "@/lib/data";

/**
 * Notificaciones push al teléfono del dueño (Web Push estándar, sin servicios de terceros).
 * Variables de entorno:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  → llave pública (la usa el navegador para suscribirse)
 *   VAPID_PRIVATE_KEY             → llave privada (secreta, solo servidor)
 */
export function pushConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export type AvisoPush = { titulo: string; cuerpo: string; url: string; etiqueta?: string };

export function avisoNuevoCliente(lead: { nombre: string; negocio: string; origen: string }): AvisoPush {
  return {
    titulo: `Nuevo cliente: ${lead.negocio}`,
    cuerpo: `${lead.nombre} pidió su boceto gratis (${lead.origen}). Toca para verlo en el CRM.`,
    url: "/admin",
    etiqueta: "nuevo-cliente",
  };
}

let configurado = false;
function configurar() {
  if (configurado) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "https://skystudioslabs.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim()
  );
  configurado = true;
}

/** Envía el aviso a todos los teléfonos suscritos. Borra suscripciones vencidas. Nunca lanza. */
export async function enviarAvisoPush(aviso: AvisoPush): Promise<{ enviados: number; fallidos: number }> {
  let enviados = 0;
  let fallidos = 0;
  if (!pushConfigurado()) return { enviados, fallidos };
  try {
    configurar();
    const repo = await getRepo();
    const subs = await repo.listarSuscripcionesPush();
    const payload = JSON.stringify(aviso);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
            TTL: 24 * 3600,
            urgency: "high",
            timeout: 8000,
          });
          enviados++;
        } catch (e) {
          fallidos++;
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await repo.borrarSuscripcionPush(s.endpoint).catch(() => {});
          else console.error("[push] envío falló", code ?? "");
        }
      })
    );
  } catch (e) {
    console.error("[push] no se pudo enviar", e instanceof Error ? e.message : "");
  }
  return { enviados, fallidos };
}
