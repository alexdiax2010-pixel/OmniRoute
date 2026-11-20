import { randomUUID } from "node:crypto";
import type { NuevoProspecto } from "./repo";
import type { Prospecto } from "@/lib/types";

/** Completa un prospecto con valores por defecto. Pura (sin E/S): la usan local.ts, supabase.ts y crm:importar. */
export function prospectoBase(p: NuevoProspecto): Prospecto {
  const t = new Date().toISOString();
  return {
    id: p.id ?? randomUUID(),
    nombre: p.nombre,
    giro: p.giro ?? "",
    categoria: p.categoria ?? "",
    colonia: p.colonia ?? "",
    direccion: p.direccion ?? "",
    telefono: p.telefono ?? "",
    whatsapp: p.whatsapp ?? "",
    puntaje: p.puntaje ?? 0,
    razon: p.razon ?? "",
    alertas: p.alertas ?? [],
    top10: p.top10 ?? false,
    etapa: p.etapa ?? "Nuevo",
    seguimiento: p.seguimiento ?? null,
    mensaje: p.mensaje ?? "",
    guion: p.guion ?? "",
    notas: p.notas ?? [],
    boceto: p.boceto ?? "",
    fuente: p.fuente ?? "",
    sesion: p.sesion ?? "",
    paquete: p.paquete ?? null,
    monto: p.monto ?? null,
    mensualidad: p.mensualidad ?? null,
    diaCobro: p.diaCobro ?? null,
    servicios: p.servicios ?? [],
    fechaGanado: p.fechaGanado ?? null,
    email: p.email ?? null,
    creado: p.creado ?? t,
    actualizado: t,
  };
}
