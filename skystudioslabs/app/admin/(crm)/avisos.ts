"use server";

import { z } from "zod";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { enviarAvisoPush, pushConfigurado } from "@/lib/push";

const esquemaSub = z.object({
  endpoint: z.url().max(1000).refine((u) => u.startsWith("https://"), "endpoint inválido"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
  etiqueta: z.string().max(80).optional(),
});

export type ResultadoAviso = { ok: boolean; mensaje: string };

/** Guarda la suscripción de este teléfono para recibir avisos de clientes nuevos. */
export async function activarAvisos(datos: unknown): Promise<ResultadoAviso> {
  await requerirAdmin();
  if (!pushConfigurado()) return { ok: false, mensaje: "Los avisos no están configurados en el servidor." };
  const r = esquemaSub.safeParse(datos);
  if (!r.success) return { ok: false, mensaje: "No se pudo activar en este teléfono." };
  try {
    await (await getRepo()).guardarSuscripcionPush({
      endpoint: r.data.endpoint,
      p256dh: r.data.keys.p256dh,
      auth: r.data.keys.auth,
      etiqueta: r.data.etiqueta ?? "",
    });
    return { ok: true, mensaje: "Listo: este teléfono recibirá un aviso con cada cliente nuevo." };
  } catch {
    return { ok: false, mensaje: "No se pudo guardar. Inténtalo de nuevo." };
  }
}

export async function desactivarAvisos(endpoint: string): Promise<ResultadoAviso> {
  await requerirAdmin();
  if (typeof endpoint !== "string" || endpoint.length > 1000) return { ok: false, mensaje: "Dato inválido." };
  try {
    await (await getRepo()).borrarSuscripcionPush(endpoint);
    return { ok: true, mensaje: "Avisos desactivados en este teléfono." };
  } catch {
    return { ok: false, mensaje: "No se pudo desactivar." };
  }
}

export async function probarAviso(): Promise<ResultadoAviso> {
  await requerirAdmin();
  const r = await enviarAvisoPush({
    titulo: "Prueba de aviso",
    cuerpo: "Así te llegará cada cliente nuevo de Sky Studios Labs.",
    url: "/admin",
    etiqueta: "prueba",
  });
  if (r.enviados > 0) return { ok: true, mensaje: `Aviso de prueba enviado a ${r.enviados} teléfono(s).` };
  return { ok: false, mensaje: "No hay teléfonos con avisos activos todavía." };
}
