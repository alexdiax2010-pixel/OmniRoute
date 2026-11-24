import type { Tarea } from "@/lib/types";

const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 } as const;

export type GruposTareas = { vencidas: Tarea[]; hoy: Tarea[]; proximas: Tarea[]; sinFecha: Tarea[]; hechas: Tarea[] };

/** Agrupa como Cartera: Vencidas · Hoy · Próximas · Sin fecha (+ completadas, la más reciente primero). */
export function agruparTareas(tareas: Tarea[], hoy: string): GruposTareas {
  const pendientes = tareas
    .filter((t) => !t.hecha)
    .sort((a, b) => (a.vence ?? "9999").localeCompare(b.vence ?? "9999") || ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad]);
  return {
    vencidas: pendientes.filter((t) => t.vence && t.vence < hoy),
    hoy: pendientes.filter((t) => t.vence === hoy),
    proximas: pendientes.filter((t) => t.vence && t.vence > hoy),
    sinFecha: pendientes.filter((t) => !t.vence),
    hechas: tareas.filter((t) => t.hecha).sort((a, b) => (b.hecha_en ?? "").localeCompare(a.hecha_en ?? "")),
  };
}

export const contarVencidas = (tareas: Tarea[], hoy: string) => tareas.filter((t) => !t.hecha && t.vence && t.vence < hoy).length;
