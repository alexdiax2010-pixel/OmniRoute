import { createHmac } from "node:crypto";
import { z } from "zod";
import type { NuevoProspecto } from "@/lib/data/repo";

/** Lógica pura del formulario público de contacto (validación, honeypot, mapeo). */

export const CAMPO_TRAMPA = "sitio_web";
export const LIMITE_ENVIOS_HORA = 5;

/** Normaliza un WhatsApp mexicano a 10 dígitos (quita +52 / 521 / espacios). null si no son 10. */
export function normalizarWhatsAppMX(v: string): string | null {
  let d = v.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  else if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  return /^\d{10}$/.test(d) ? d : null;
}

const limpio = (max: number, min: number, msg: string) =>
  z
    .string({ error: msg })
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min, msg).max(max, `Máximo ${max} caracteres`));

export const esquemaLead = z.object({
  nombre: limpio(80, 2, "Escribe tu nombre"),
  negocio: limpio(120, 2, "Escribe el nombre de tu negocio"),
  whatsapp: z
    .string({ error: "Escribe tu WhatsApp a 10 dígitos" })
    .transform((s, ctx) => {
      const n = normalizarWhatsAppMX(s);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Escribe tu WhatsApp a 10 dígitos" });
        return z.NEVER;
      }
      return n;
    }),
  origen: z
    .string()
    .optional()
    .transform((s) => (s ?? "").replace(/[^\p{L}\p{N} _/.:-]/gu, "").slice(0, 60).trim() || "sitio"),
});

export type Lead = z.infer<typeof esquemaLead>;

/** true si el campo trampa trae algo → es un bot. Se responde "éxito" pero no se guarda. */
export function esSpam(datos: Record<string, unknown>): boolean {
  const v = datos[CAMPO_TRAMPA];
  return typeof v === "string" ? v.trim().length > 0 : v != null && v !== "";
}

export type ResultadoLead =
  | { tipo: "spam" }
  | { tipo: "invalido"; campos: Record<string, string> }
  | { tipo: "ok"; lead: Lead };

export function evaluarLead(datos: Record<string, unknown>): ResultadoLead {
  if (esSpam(datos)) return { tipo: "spam" };
  const r = esquemaLead.safeParse(datos);
  if (!r.success) {
    const campos: Record<string, string> = {};
    for (const i of r.error.issues) {
      const k = String(i.path[0] ?? "form");
      campos[k] ??= i.message;
    }
    return { tipo: "invalido", campos };
  }
  return { tipo: "ok", lead: r.data };
}

export function prospectoDesdeLead(lead: Lead, ahora: Date = new Date()): NuevoProspecto {
  return {
    nombre: lead.negocio,
    giro: "",
    whatsapp: lead.whatsapp,
    fuente: "web",
    etapa: "Nuevo",
    notas: [{ t: ahora.toISOString(), txt: `Formulario web (${lead.origen}): contacto ${lead.nombre}` }],
  };
}

/** Hash de IP con secreto (no guardamos IPs en claro). */
export function hashIp(ip: string, secreto: string): string {
  return createHmac("sha256", secreto).update(ip).digest("hex");
}

/** Primera IP de x-forwarded-for, o x-real-ip. */
export function ipDeCabeceras(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "desconocida";
  return h.get("x-real-ip")?.trim() || "desconocida";
}
