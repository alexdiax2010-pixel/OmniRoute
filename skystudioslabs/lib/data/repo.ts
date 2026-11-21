import type { Prospecto, Sitio, SolicitudCambio, Nota } from "@/lib/types";

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

  // Antispam: registra un envío y devuelve cuántos hubo desde `desde` (ISO) para esa IP (hash).
  registrarEnvio(ipHash: string, desde: string): Promise<number>;

  // Respaldo
  volcarTodo(): Promise<Record<string, unknown[]>>;
}
