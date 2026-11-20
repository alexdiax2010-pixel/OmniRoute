"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirAdmin, invitarAlPortal } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { ETAPAS, type Prospecto, type Sitio } from "@/lib/types";
import { PAQUETES, SERVICIOS, type Servicio } from "@/config/precios";
import { cambiarEtapa } from "@/lib/crm/reglas";
import { hoyMX, sumarDias, esFechaISO } from "@/lib/crm/fechas";
import { carpetaDeBoceto, slugify, slugUnico } from "@/lib/crm/texto";
import { mensajeConEnlace, urlCliente, urlPropuesta } from "@/lib/crm/enlaces";
import { carpetaExiste } from "@/lib/crm/carpetas";
import { SUBDOMINIOS_RESERVADOS, esSlugValido } from "@/lib/hosts";

/**
 * Server Actions del CRM. CADA una llama requerirAdmin() primero (las acciones son endpoints
 * públicos: no basta con que la página esté protegida). Todas las entradas pasan por Zod.
 * Nunca devolvemos mensajes de error crudos.
 */

export type Resultado = { ok: boolean; mensaje: string; enlace?: string; comando?: string } | null;

const id = z.string().trim().min(1).max(120);
const etapa = z.enum(ETAPAS);

function refrescar(prospectoId?: string) {
  revalidatePath("/admin", "layout");
  if (prospectoId) revalidatePath(`/admin/prospectos/${prospectoId}`);
}

async function moverA(prospectoId: string, nueva: (typeof ETAPAS)[number]) {
  const repo = await getRepo();
  const p = await repo.obtenerProspecto(prospectoId);
  if (!p) return false;
  const { cambios, nota } = cambiarEtapa(p, nueva);
  if (!nota) return true;
  await repo.actualizarProspecto(prospectoId, { ...cambios, notas: [...p.notas, nota] });
  return true;
}

/** Form action (tablero sin JS, detalle). */
export async function moverEtapa(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z.object({ id, etapa }).safeParse({ id: formData.get("id"), etapa: formData.get("etapa") });
  if (!r.success) return;
  await moverA(r.data.id, r.data.etapa);
  refrescar(r.data.id);
}

/** Llamada directa desde el drag & drop. */
export async function moverEtapaDirecto(prospectoId: string, nueva: string): Promise<{ ok: boolean }> {
  await requerirAdmin();
  const r = z.object({ id, etapa }).safeParse({ id: prospectoId, etapa: nueva });
  if (!r.success) return { ok: false };
  try {
    const ok = await moverA(r.data.id, r.data.etapa);
    refrescar(r.data.id);
    return { ok };
  } catch {
    return { ok: false };
  }
}

const texto = (max: number) => z.string().max(max).transform((s) => s.trim());
const fechaOpcional = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s === "" || esFechaISO(s), "Fecha inválida")
  .transform((s) => s || null);
const numeroOpcional = (min: number, max: number, entero = false) =>
  z
    .string()
    .transform((s) => s.replace(/[$,\s]/g, ""))
    .refine((s) => s === "" || (Number.isFinite(Number(s)) && Number(s) >= min && Number(s) <= max && (!entero || Number.isInteger(Number(s)))), "Número inválido")
    .transform((s) => (s === "" ? null : Number(s)));

const esquemaDatos = z.object({
  id,
  nombre: texto(160).pipe(z.string().min(1, "El nombre es obligatorio")),
  giro: texto(120),
  categoria: texto(120),
  colonia: texto(120),
  direccion: texto(300),
  telefono: texto(40),
  whatsapp: texto(40),
  puntaje: numeroOpcional(-1000, 1000),
  razon: texto(2000),
  alertas: texto(4000),
  seguimiento: fechaOpcional,
  mensaje: texto(4000),
  guion: texto(8000),
  boceto: texto(300),
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .refine((s) => s === "" || z.email().safeParse(s).success, "Correo inválido")
    .transform((s) => s || null),
});

function campos(formData: FormData, nombres: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const n of nombres) o[n] = String(formData.get(n) ?? "");
  return o;
}

export async function guardarDatos(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await requerirAdmin();
  const r = esquemaDatos.safeParse(campos(formData, Object.keys(esquemaDatos.shape)));
  if (!r.success) return { ok: false, mensaje: r.error.issues[0]?.message ?? "Revisa los datos." };
  const { id: pid, alertas, puntaje, ...resto } = r.data;
  try {
    const repo = await getRepo();
    await repo.actualizarProspecto(pid, {
      ...resto,
      puntaje: puntaje ?? 0,
      top10: formData.get("top10") === "on",
      alertas: alertas.split(/\r?\n/).map((a) => a.trim()).filter(Boolean),
    });
  } catch {
    return { ok: false, mensaje: "No se pudo guardar. Inténtalo de nuevo." };
  }
  refrescar(pid);
  return { ok: true, mensaje: "Guardado." };
}

const esquemaVenta = z.object({
  id,
  paquete: z.union([z.literal(""), z.enum(PAQUETES.map((p) => p.id) as [string, ...string[]])]),
  monto: numeroOpcional(0, 10_000_000),
  mensualidad: numeroOpcional(0, 1_000_000),
  diaCobro: numeroOpcional(1, 31, true),
  servicios: z.array(z.enum(SERVICIOS)).max(SERVICIOS.length),
});

export async function guardarVenta(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await requerirAdmin();
  const r = esquemaVenta.safeParse({
    ...campos(formData, ["id", "paquete", "monto", "mensualidad", "diaCobro"]),
    servicios: formData.getAll("servicios").map(String),
  });
  if (!r.success) return { ok: false, mensaje: "Revisa los datos de la venta (montos y día de cobro 1–31)." };
  const { id: pid, paquete, servicios, ...resto } = r.data;
  try {
    await (await getRepo()).actualizarProspecto(pid, { ...resto, paquete: paquete || null, servicios: [...new Set(servicios)] as Servicio[] });
  } catch {
    return { ok: false, mensaje: "No se pudo guardar la venta." };
  }
  refrescar(pid);
  return { ok: true, mensaje: "Venta guardada." };
}

export async function agregarNotaAccion(formData: FormData): Promise<void> {
  await requerirAdmin();
  const r = z.object({ id, txt: texto(2000).pipe(z.string().min(1)) }).safeParse({ id: formData.get("id"), txt: formData.get("txt") });
  if (!r.success) return;
  await (await getRepo()).agregarNota(r.data.id, { t: new Date().toISOString(), txt: r.data.txt });
  refrescar(r.data.id);
}

function slugLibre(base: string, sitios: Sitio[]): string {
  let b = slugify(base);
  if (!esSlugValido(b)) b = "sitio";
  return slugUnico(b, sitios.map((s) => s.slug), SUBDOMINIOS_RESERVADOS);
}

function comandoSitio(slug: string, carpeta: string, tipo: "propuesta" | "cliente") {
  return `npm run sitio:nuevo -- ${slug} ${carpeta} --tipo ${tipo}`;
}

export async function crearPropuesta(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await requerirAdmin();
  const r = id.safeParse(formData.get("id"));
  if (!r.success) return { ok: false, mensaje: "Prospecto inválido." };
  try {
    const repo = await getRepo();
    const p = await repo.obtenerProspecto(r.data);
    if (!p) return { ok: false, mensaje: "Prospecto no encontrado." };
    const sitios = await repo.listarSitios();
    const previo = sitios.find((s) => s.prospecto_id === p.id && s.tipo === "propuesta");
    const slug = previo?.slug ?? slugLibre(p.nombre, sitios);
    const deBoceto = carpetaDeBoceto(p.boceto);
    const carpeta = previo?.carpeta ?? (deBoceto && carpetaExiste(deBoceto) ? deBoceto : slug);
    await repo.guardarSitio({
      slug,
      tipo: "propuesta",
      prospecto_id: p.id,
      carpeta,
      dominio_propio: previo?.dominio_propio ?? null,
      activo: true,
      expira: sumarDias(hoyMX(), 30),
      creado: previo?.creado,
    });
    const enlace = urlPropuesta(slug);
    await repo.actualizarProspecto(p.id, {
      mensaje: mensajeConEnlace(p.mensaje, enlace),
      notas: [...p.notas, { t: new Date().toISOString(), txt: `Propuesta ${previo ? "renovada" : "creada"}: ${enlace} (vence en 30 días)` }],
    });
    refrescar(p.id);
    const existe = carpetaExiste(carpeta);
    return {
      ok: true,
      mensaje: existe
        ? "Propuesta lista. El enlace ya está en el mensaje de WhatsApp."
        : `Propuesta registrada, pero la carpeta clientes/${carpeta} no existe todavía. Créala con:`,
      enlace,
      comando: existe ? undefined : comandoSitio(slug, carpeta, "propuesta"),
    };
  } catch {
    return { ok: false, mensaje: "No se pudo crear la propuesta." };
  }
}

export async function publicarSitio(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await requerirAdmin();
  const r = id.safeParse(formData.get("id"));
  if (!r.success) return { ok: false, mensaje: "Prospecto inválido." };
  try {
    const repo = await getRepo();
    const p = await repo.obtenerProspecto(r.data);
    if (!p) return { ok: false, mensaje: "Prospecto no encontrado." };
    if (p.etapa !== "Ganado") return { ok: false, mensaje: "Solo se publica cuando el prospecto está en Ganado." };
    const sitios = await repo.listarSitios();
    // Reusa su sitio de cliente o convierte su propuesta (mismo slug); si no, uno nuevo.
    const previo =
      sitios.find((s) => s.prospecto_id === p.id && s.tipo === "cliente") ??
      sitios.find((s) => s.prospecto_id === p.id && s.tipo === "propuesta");
    const slug = previo?.slug ?? slugLibre(p.nombre, sitios);
    const deBoceto = carpetaDeBoceto(p.boceto);
    const carpeta = previo?.carpeta ?? (deBoceto && carpetaExiste(deBoceto) ? deBoceto : slug);
    await repo.guardarSitio({
      slug,
      tipo: "cliente",
      prospecto_id: p.id,
      carpeta,
      dominio_propio: previo?.dominio_propio ?? null,
      activo: true,
      expira: null,
      creado: previo?.creado,
    });
    const enlace = urlCliente(slug);
    await repo.agregarNota(p.id, { t: new Date().toISOString(), txt: `Sitio publicado: ${enlace}` });
    refrescar(p.id);
    const existe = carpetaExiste(carpeta);
    return {
      ok: true,
      mensaje: existe ? "Sitio publicado." : `Sitio registrado, pero falta la carpeta clientes/${carpeta}. Créala con:`,
      enlace,
      comando: existe ? undefined : comandoSitio(slug, carpeta, "cliente"),
    };
  } catch {
    return { ok: false, mensaje: "No se pudo publicar el sitio." };
  }
}

export async function invitarPortal(_prev: Resultado, formData: FormData): Promise<Resultado> {
  await requerirAdmin();
  const r = z
    .object({ id, email: z.string().trim().toLowerCase().pipe(z.email("Escribe el correo del cliente")) })
    .safeParse({ id: formData.get("id"), email: formData.get("email") });
  if (!r.success) return { ok: false, mensaje: r.error.issues[0]?.message ?? "Datos inválidos." };
  try {
    const repo = await getRepo();
    const p = await repo.obtenerProspecto(r.data.id);
    if (!p) return { ok: false, mensaje: "Prospecto no encontrado." };
    if (p.etapa !== "Ganado") return { ok: false, mensaje: "Solo se invita al portal a clientes en Ganado." };
    const otro = await repo.prospectoIdPorEmail(r.data.email);
    if (otro && otro !== p.id) return { ok: false, mensaje: "Ese correo ya está ligado a otro cliente." };
    const cambios: Partial<Prospecto> = { email: r.data.email };
    await repo.actualizarProspecto(p.id, cambios);
    const inv = await invitarAlPortal(p.id, r.data.email);
    if (inv.ok) await repo.agregarNota(p.id, { t: new Date().toISOString(), txt: `Invitado al portal: ${r.data.email}` });
    refrescar(p.id);
    return { ok: inv.ok, mensaje: inv.mensaje, enlace: inv.enlaceLocal };
  } catch {
    return { ok: false, mensaje: "No se pudo invitar al portal." };
  }
}
