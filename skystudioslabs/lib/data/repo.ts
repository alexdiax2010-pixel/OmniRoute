import type { Prospecto, Sitio, SolicitudCambio, Nota, SuscripcionPush, Actividad, Tarea, Plantilla } from "@/lib/types";

export type NuevoProspecto = Pick<Prospecto, "nombre" | "giro" | "whatsapp"> & Partial<Prospecto>;

/**
 * Capa de datos. Dos implementaciones:
 *  - local.ts    → archivo JSON (.data/db.json). Solo desarrollo y pruebas.
 *  - supabase.ts → Supabase (producción). Las lecturas del CRM/portal van con la sesión del
 *                  usuario para que RLS aplique; el service role solo se usa en el servidor.
 * Todas las funciones son SOLO servidor. Nunca importes esto desde un componente "use client".
 */
export interface Repo {
  // Prospectos (solo admin)
  listarProspectos(): Promise<Prospecto[]>;
  obtenerProspecto(id: string): Promise<Prospecto | null>;
  /** upsert por id — idempotente (crm:importar). Devuelve {insertados, actualizados}. */
  upsertProspectos(lista: Prospecto[]): Promise<{ insertados: number; actualizados: number }>;
  crearProspecto(p: NuevoProspecto): Promise<Prospecto>;
  actualizarProspecto(id: string, cambios: Partial<Prospecto>): Promise<Prospecto>;
  agregarNota(id: string, nota: Nota): Promise<void>;

  // Sitios
  listarSitios(): Promise<Sitio[]>;
  obtenerSitio(slug: string): Promise<Sitio | null>;
  obtenerSitioPorDominio(host: string): Promise<Sitio | null>;
  guardarSitio(s: Omit<Sitio, "creado"> & { creado?: string }): Promise<Sitio>;
  /** Público: sitios de clientes activos (para el sitemap). Sin datos del prospecto. */
  listarSitiosPublicos(): Promise<Sitio[]>;
  /** Público: solo un número, nunca filas. */
  contarSitiosActivos(): Promise<number>;

  // Portal
  prospectoIdPorEmail(email: string): Promise<string | null>;
  crearSolicitudCambio(s: Omit<SolicitudCambio, "id" | "creado">): Promise<SolicitudCambio>;
  /** Solicitudes de UN prospecto, de la más reciente a la más vieja (el portal pasa el id de la sesión). */
  listarSolicitudes(prospectoId: string): Promise<SolicitudCambio[]>;

  // Antispam: registra un envío y devuelve cuántos hubo desde `desde` (ISO) para esa IP (hash).
  registrarEnvio(ipHash: string, desde: string): Promise<number>;
  /** Solo cuenta (sin registrar) los envíos de esa clave desde `desde`. */
  contarEnvios(ipHash: string, desde: string): Promise<number>;

  // Notificaciones push del CRM (solo servidor)
  guardarSuscripcionPush(s: SuscripcionPush): Promise<void>;
  listarSuscripcionesPush(): Promise<SuscripcionPush[]>;
  borrarSuscripcionPush(endpoint: string): Promise<void>;

  // Cartera (solo admin): historial, tareas, plantillas y ajustes
  /** Actividades de un prospecto (o las más recientes de todos), de la más nueva a la más vieja. */
  listarActividades(prospectoId?: string, limite?: number): Promise<Actividad[]>;
  crearActividad(a: Omit<Actividad, "id" | "creado">): Promise<Actividad>;
  listarTareas(): Promise<Tarea[]>;
  crearTarea(t: Omit<Tarea, "id" | "creado" | "hecha" | "hecha_en">): Promise<Tarea>;
  actualizarTarea(id: string, cambios: Partial<Omit<Tarea, "id" | "creado">>): Promise<void>;
  borrarTarea(id: string): Promise<void>;
  listarPlantillas(): Promise<Plantilla[]>;
  guardarPlantilla(p: Omit<Plantilla, "id" | "creado"> & { id?: string }): Promise<Plantilla>;
  borrarPlantilla(id: string): Promise<void>;
  obtenerAjuste(clave: string): Promise<string | null>;
  guardarAjuste(clave: string, valor: string): Promise<void>;

  // Respaldo
  volcarTodo(): Promise<Record<string, unknown[]>>;
}
