/** Fechas del CRM: siempre en hora de Ciudad de México y como YYYY-MM-DD. Funciones puras. */
export const ZONA = "America/Mexico_City";

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** Fecha de hoy (YYYY-MM-DD) en Ciudad de México. */
export function hoyMX(ahora: Date = new Date()): string {
  return fmt.format(ahora);
}

export function esFechaISO(s: unknown): boolean {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

export function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

export function diasDelMes(anio: number, mes1a12: number): number {
  return new Date(Date.UTC(anio, mes1a12, 0)).getUTCDate();
}

/** "2026-11-20" → "20 nov 2026" */
export function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  const fecha = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: iso.length === 10 ? "UTC" : ZONA,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fecha);
}

/** Fecha y hora legible en CDMX para notas. */
export function fechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso || "—";
  return new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, dateStyle: "medium", timeStyle: "short" }).format(fecha);
}
