import type { Prospecto, Sitio, SolicitudCambio } from "@/lib/types";

/**
 * Lo ÚNICO que el portal del cliente puede recibir de su prospecto. Los datos internos de venta
 * (teléfono, WhatsApp, puntaje, razón, alertas, etapa, seguimiento, mensaje, guion, notas, boceto,
 * fuente, sesión) nunca salen de aquí, aunque el repo los traiga (modo local / código de admin).
 */
export type VistaPortal = Pick<Prospecto, "id" | "nombre" | "giro" | "paquete" | "mensualidad" | "diaCobro" | "servicios">;
export type SolicitudPortal = Pick<SolicitudCambio, "id" | "texto" | "creado"> & { conFoto: boolean };

export function vistaPortal(p: Prospecto): VistaPortal {
  return { id: p.id, nombre: p.nombre, giro: p.giro, paquete: p.paquete, mensualidad: p.mensualidad, diaCobro: p.diaCobro, servicios: [...p.servicios] };
}

/** ¿Tiene un plan registrado? (para el estado vacío). */
export function tienePlan(v: VistaPortal): boolean {
  return Boolean(v.paquete || v.mensualidad != null || v.servicios.length);
}

/** Su sitio publicado (solo de su prospecto, tipo cliente y activo). */
export function sitioDelCliente(sitios: Sitio[], prospectoId: string): Sitio | null {
  return sitios.find((x) => x.prospecto_id === prospectoId && x.tipo === "cliente" && x.activo) ?? null;
}

/** Solicitudes del cliente sin rutas de fotos internas, y solo las de SU prospecto. */
export function solicitudesPortal(lista: SolicitudCambio[], prospectoId: string): SolicitudPortal[] {
  return lista
    .filter((x) => x.prospecto_id === prospectoId)
    .map((x) => ({ id: x.id, texto: x.texto, creado: x.creado, conFoto: Boolean(x.foto) }));
}
