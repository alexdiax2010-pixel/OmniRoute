"use server";

import { z } from "zod";
import { requerirCliente, secreto } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { hashIp } from "@/lib/lead";
import { validarFoto } from "@/lib/portal/imagen";
import { guardarFoto } from "@/lib/portal/fotos";

export type EstadoCambio = { ok: boolean; mensaje: string } | null;

const esquema = z.object({
  texto: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(5, "Describe el cambio (mínimo 5 caracteres).").max(1500, "Máximo 1500 caracteres.")),
});
const LIMITE_HORA = 10;

/** Pedir un cambio. Siempre con el prospectoId de la SESIÓN (nunca del formulario). */
export async function pedirCambio(_prev: EstadoCambio, formData: FormData): Promise<EstadoCambio> {
  const sesion = await requerirCliente();
  const r = esquema.safeParse({ texto: formData.get("texto") ?? "" });
  if (!r.success) return { ok: false, mensaje: r.error.issues[0]?.message ?? "Revisa el texto." };

  const archivo = formData.get("foto");
  let bytes: Uint8Array | null = null;
  let tipo: string = "";
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 300 * 1024) return { ok: false, mensaje: "La foto pesa más de 300 KB. Reduce su tamaño e inténtalo de nuevo." };
    bytes = new Uint8Array(await archivo.arrayBuffer());
    const v = validarFoto(bytes, archivo.type);
    if (!v.ok) return { ok: false, mensaje: v.error };
    tipo = v.tipo;
  }

  try {
    const repo = await getRepo();
    const n = await repo.registrarEnvio(hashIp(`portal:${sesion.prospectoId}`, secreto()), new Date(Date.now() - 3600_000).toISOString());
    if (n > LIMITE_HORA) return { ok: false, mensaje: "Has enviado muchas solicitudes. Inténtalo más tarde o escríbenos por WhatsApp." };
    const foto = bytes ? await guardarFoto(sesion.prospectoId, bytes, tipo as Parameters<typeof guardarFoto>[2]) : null;
    await repo.crearSolicitudCambio({ prospecto_id: sesion.prospectoId, texto: r.data.texto, foto });
    return { ok: true, mensaje: "¡Listo! Recibimos tu solicitud y te avisamos cuando esté hecha." };
  } catch (e) {
    console.error("[portal] pedirCambio falló", e instanceof Error ? e.message : "");
    return { ok: false, mensaje: "No se pudo enviar. Inténtalo de nuevo en unos minutos." };
  }
}
