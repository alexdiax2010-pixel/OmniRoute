import type { Etapa, Nota, Prospecto } from "@/lib/types";
import { hoyMX, sumarDias } from "./fechas";

/** Etapas que programan un seguimiento automático a 3 días. */
export const ETAPAS_CON_SEGUIMIENTO: readonly Etapa[] = ["Contactado", "Boceto enviado", "Negociando"];
export const ETAPAS_CERRADAS: readonly Etapa[] = ["Ganado", "Perdido"];
export const DIAS_SEGUIMIENTO = 3;

export type CambioEtapa = {
  cambios: Pick<Prospecto, "etapa" | "seguimiento" | "fechaGanado">;
  nota: Nota | null;
};

/**
 * Reglas al mover un prospecto de etapa (pura):
 *  - Contactado / Boceto enviado / Negociando → seguimiento = hoy + 3 días.
 *  - Ganado → fechaGanado = hoy (si estaba vacía). Ganado y Perdido limpian el seguimiento.
 *  - Nuevo → conserva el seguimiento que tuviera.
 *  - Siempre agrega la nota automática "Etapa: X → Y" (si de verdad cambió).
 * Las fechas se calculan en hora de Ciudad de México.
 */
export function cambiarEtapa(
  p: Pick<Prospecto, "etapa" | "seguimiento" | "fechaGanado">,
  nueva: Etapa,
  ahora: Date = new Date(),
): CambioEtapa {
  if (p.etapa === nueva) {
    return { cambios: { etapa: p.etapa, seguimiento: p.seguimiento, fechaGanado: p.fechaGanado }, nota: null };
  }
  const hoy = hoyMX(ahora);
  let seguimiento = p.seguimiento;
  let fechaGanado = p.fechaGanado;
  if (ETAPAS_CON_SEGUIMIENTO.includes(nueva)) seguimiento = sumarDias(hoy, DIAS_SEGUIMIENTO);
  if (ETAPAS_CERRADAS.includes(nueva)) seguimiento = null;
  if (nueva === "Ganado" && !fechaGanado) fechaGanado = hoy;
  return {
    cambios: { etapa: nueva, seguimiento, fechaGanado },
    nota: { t: ahora.toISOString(), txt: `Etapa: ${p.etapa} → ${nueva}` },
  };
}

/** Seguimientos de hoy o vencidos (excluye cerrados), del más antiguo al más reciente. */
export function seguimientosPendientes<T extends Pick<Prospecto, "etapa" | "seguimiento">>(lista: T[], hoy: string): T[] {
  return lista
    .filter((p) => p.seguimiento && p.seguimiento <= hoy && !ETAPAS_CERRADAS.includes(p.etapa))
    .sort((a, b) => (a.seguimiento! < b.seguimiento! ? -1 : a.seguimiento! > b.seguimiento! ? 1 : 0));
}

export function estadoSeguimiento(seguimiento: string | null, hoy: string): "vencido" | "hoy" | "futuro" | "sin" {
  if (!seguimiento) return "sin";
  if (seguimiento < hoy) return "vencido";
  if (seguimiento === hoy) return "hoy";
  return "futuro";
}
