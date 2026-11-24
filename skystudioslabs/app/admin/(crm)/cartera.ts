"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { CANALES, PRIORIDADES, TIPOS_ACTIVIDAD } from "@/lib/types";
import { esFechaISO, hoyMX } from "@/lib/crm/fechas";

/**
 * Server Actions de las funciones de "Cartera" (historial, tareas, plantillas, ajustes).
 * Igual que acciones.ts: CADA una llama requerirAdmin() primero y valida con Zod.
 */

const id = z.string().trim().min(1).max(120);
const texto = (max: number) => z.string().trim().max(max);
const fechaOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && esFechaISO(v) ? v : null));

function refrescar(prospectoId?: string | null) {
  revalidatePath("/admin", "layout");
  if (prospectoId) revalidatePath(`/admin/prospectos/${prospectoId}`);
}

/** Registra una interacción (WhatsApp, llamada, visita…) en el historial de un prospecto. */
export async function registrarActividad(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z
    .object({ prospecto: id, tipo: z.enum(TIPOS_ACTIVIDAD), texto: texto(4000).pipe(z.string().min(1)), fecha: fechaOpcional })
    .safeParse({ prospecto: formData.get("prospecto"), tipo: formData.get("tipo"), texto: formData.get("texto"), fecha: formData.get("fecha") ?? undefined });
  if (!r.success) return;
  const hoy = hoyMX();
  // Una fecha pasada se guarda a mediodía de ese día; hoy (o futura) usa la hora actual.
  const fecha = r.data.fecha && r.data.fecha < hoy ? new Date(`${r.data.fecha}T18:00:00Z`).toISOString() : new Date().toISOString();
  await (await getRepo()).crearActividad({ prospecto_id: r.data.prospecto, tipo: r.data.tipo, texto: r.data.texto, fecha });
  refrescar(r.data.prospecto);
}

export async function crearTareaAccion(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z
    .object({
      titulo: texto(300).pipe(z.string().min(1)),
      vence: fechaOpcional,
      prioridad: z.enum(PRIORIDADES).catch("media"),
      prospecto: z.string().trim().max(120).optional().transform((v) => v || null),
    })
    .safeParse({ titulo: formData.get("titulo"), vence: formData.get("vence") ?? undefined, prioridad: formData.get("prioridad"), prospecto: formData.get("prospecto") ?? undefined });
  if (!r.success) return;
  await (await getRepo()).crearTarea({ titulo: r.data.titulo, vence: r.data.vence, prioridad: r.data.prioridad, prospecto_id: r.data.prospecto });
  refrescar(r.data.prospecto);
}

export async function alternarTarea(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z.object({ id, hecha: z.enum(["1", "0"]), prospecto: z.string().max(120).optional() }).safeParse({
    id: formData.get("id"), hecha: formData.get("hecha"), prospecto: formData.get("prospecto") ?? undefined,
  });
  if (!r.success) return;
  const hecha = r.data.hecha === "1";
  await (await getRepo()).actualizarTarea(r.data.id, { hecha, hecha_en: hecha ? new Date().toISOString() : null });
  refrescar(r.data.prospecto || null);
}

export async function borrarTareaAccion(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z.object({ id }).safeParse({ id: formData.get("id") });
  if (!r.success) return;
  await (await getRepo()).borrarTarea(r.data.id);
  refrescar();
}

export async function guardarPlantillaAccion(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z
    .object({
      id: z.string().trim().max(120).optional().transform((v) => v || undefined),
      titulo: texto(120).pipe(z.string().min(1)),
      canal: z.enum(CANALES).catch("whatsapp"),
      cuerpo: texto(4000).pipe(z.string().min(1)),
    })
    .safeParse({ id: formData.get("id") ?? undefined, titulo: formData.get("titulo"), canal: formData.get("canal"), cuerpo: formData.get("cuerpo") });
  if (!r.success) return;
  await (await getRepo()).guardarPlantilla(r.data);
  refrescar();
}

export async function borrarPlantillaAccion(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z.object({ id }).safeParse({ id: formData.get("id") });
  if (!r.success) return;
  await (await getRepo()).borrarPlantilla(r.data.id);
  refrescar();
}

export async function guardarMiNombre(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = texto(80).safeParse(formData.get("nombre"));
  if (!r.success) return;
  await (await getRepo()).guardarAjuste("mi_nombre", r.data);
  refrescar();
}
