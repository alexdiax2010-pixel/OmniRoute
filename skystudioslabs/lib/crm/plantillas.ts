import type { Plantilla, Prospecto } from "@/lib/types";

/** Plantillas iniciales (las mismas que siembra supabase/migrations/0004_cartera.sql). */
export const PLANTILLAS_INICIALES: Omit<Plantilla, "creado">[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    titulo: "Primer contacto",
    canal: "whatsapp",
    cuerpo:
      "Hola, buen día. Soy {mi_nombre}. Encontré {negocio} en Google y vi que todavía no tienen página web propia.\n\nHoy la mayoría de la gente busca en el celular antes de elegir a dónde ir. Te puedo preparar un boceto gratis de cómo se vería tu página, con botón de WhatsApp, ubicación y horarios, sin compromiso.\n\n¿Te lo envío?",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    titulo: "Seguimiento",
    canal: "whatsapp",
    cuerpo: "Hola, te escribo de nuevo sobre la página para {negocio}. ¿Pudiste pensarlo?\n\nSi quieres te enseño en 10 minutos cómo quedaría. Saludos, {mi_nombre}",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    titulo: "Envío de boceto",
    canal: "whatsapp",
    cuerpo: "Hola, como te comenté, ya está listo el boceto de la página para {negocio}: {boceto}\n\nRevísalo con calma y dime qué te parece. Es gratis y sin compromiso. Saludos, {mi_nombre}",
  },
];

export const VARIABLES_PLANTILLA = ["negocio", "giro", "colonia", "boceto", "mi_nombre"] as const;

/**
 * Rellena {negocio}, {giro}, {colonia}, {boceto} y {mi_nombre}. Las variables desconocidas se dejan
 * tal cual para que se note que falta algo; las conocidas sin dato quedan vacías.
 */
export function rellenarPlantilla(
  cuerpo: string,
  p: Pick<Prospecto, "nombre" | "giro" | "colonia">,
  extra: { miNombre?: string; boceto?: string } = {}
): string {
  const mapa: Record<string, string> = {
    negocio: p.nombre ?? "",
    giro: (p.giro ?? "").toLowerCase(),
    colonia: p.colonia ?? "",
    boceto: extra.boceto ?? "",
    mi_nombre: extra.miNombre ?? "",
  };
  return String(cuerpo ?? "")
    .replace(/\{(\w+)\}/g, (m, k: string) => (k in mapa ? mapa[k] : m))
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Primer número móvil de México que se pueda usar en wa.me (52 + 10 dígitos), o null. */
export function numeroWhatsApp(...candidatos: (string | null | undefined)[]): string | null {
  for (const c of candidatos) {
    const d = String(c ?? "").replace(/\D/g, "");
    if (/^52\d{10}$/.test(d)) return d;
    if (/^521\d{10}$/.test(d)) return "52" + d.slice(3);
    if (/^\d{10}$/.test(d)) return "52" + d;
  }
  return null;
}
