import type { Prospecto } from "@/lib/types";
import { SERVICIOS, NOMBRE_SERVICIO, type Servicio } from "@/config/precios";
import { diasDelMes } from "./fechas";

export type Metricas = {
  vendidoMes: number;
  recurrenteMensual: number;
  enNegociacion: number;
  /** 0..1, o null si no hay cerrados (Ganado + Perdido = 0). */
  tasaCierre: number | null;
  ganados: number;
  perdidos: number;
};

type ParaMetricas = Pick<Prospecto, "etapa" | "monto" | "mensualidad" | "fechaGanado">;

/** Métricas del tablero (pura). `hoy` = YYYY-MM-DD en CDMX. */
export function calcularMetricas(lista: ParaMetricas[], hoy: string): Metricas {
  const mes = hoy.slice(0, 7);
  let vendidoMes = 0;
  let recurrenteMensual = 0;
  let enNegociacion = 0;
  let ganados = 0;
  let perdidos = 0;
  for (const p of lista) {
    if (p.etapa === "Ganado") {
      ganados++;
      recurrenteMensual += p.mensualidad ?? 0;
      if (p.fechaGanado?.slice(0, 7) === mes) vendidoMes += p.monto ?? 0;
    } else if (p.etapa === "Perdido") {
      perdidos++;
    } else if (p.etapa === "Negociando") {
      enNegociacion += p.monto ?? 0;
    }
  }
  const cerrados = ganados + perdidos;
  return { vendidoMes, recurrenteMensual, enNegociacion, tasaCierre: cerrados ? ganados / cerrados : null, ganados, perdidos };
}

export function formatoTasa(tasa: number | null): string {
  return tasa == null ? "—" : `${Math.round(tasa * 100)}%`;
}

export function formatoMXN(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

/**
 * Próxima fecha de cobro (YYYY-MM-DD) para un día de cobro 1–31, a partir de `hoy` (incluido).
 * Si el mes no tiene ese día, se usa el último día del mes (31 → 30 de abril, 28/29 de febrero).
 */
export function proximoCobro(diaCobro: number | null, hoy: string): string | null {
  if (diaCobro == null || !Number.isInteger(diaCobro) || diaCobro < 1 || diaCobro > 31) return null;
  let [y, m] = hoy.split("-").map(Number);
  const d = Number(hoy.slice(8, 10));
  const dia = (anio: number, mes: number) => Math.min(diaCobro, diasDelMes(anio, mes));
  if (dia(y, m) < d) {
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(dia(y, m)).padStart(2, "0")}`;
}

/** Servicios que aún no contrata (para "Puedes ofrecerle"), como nombres. */
export function serviciosPorOfrecer(contratados: readonly string[]): string[] {
  return SERVICIOS.filter((s) => !contratados.includes(s)).map((s) => NOMBRE_SERVICIO[s as Servicio]);
}
