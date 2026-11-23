/**
 * Validación del formulario de lead en el navegador. Es un espejo ligero de lib/lead.ts
 * (que importa node:crypto y no puede ir al cliente): mismas reglas y mismos mensajes, para
 * avisar antes de enviar. El servidor sigue validando; si responde con otros errores, ganan los suyos.
 * La paridad con lib/lead.ts la revisa tests/unit/contenido-formulario.test.ts.
 */
export type CampoLead = "nombre" | "negocio" | "whatsapp";

export const CAMPOS_LEAD: readonly CampoLead[] = ["nombre", "negocio", "whatsapp"];

export const MENSAJES_LEAD: Record<CampoLead, string> = {
  nombre: "Escribe tu nombre",
  negocio: "Escribe el nombre de tu negocio",
  whatsapp: "Escribe tu WhatsApp a 10 dígitos",
};

/** Igual que normalizarWhatsAppMX de lib/lead.ts: 10 dígitos, acepta +52 / 521 / espacios. */
export function whatsappValido(v: string): boolean {
  let d = v.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  else if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  return /^\d{10}$/.test(d);
}

const limpio = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Errores por campo (vacío = todo bien). */
export function validarLead(datos: Record<string, unknown>): Partial<Record<CampoLead, string>> {
  const errores: Partial<Record<CampoLead, string>> = {};
  const nombre = limpio(datos.nombre);
  const negocio = limpio(datos.negocio);
  if (nombre.length < 2) errores.nombre = MENSAJES_LEAD.nombre;
  else if (nombre.length > 80) errores.nombre = "Máximo 80 caracteres";
  if (negocio.length < 2) errores.negocio = MENSAJES_LEAD.negocio;
  else if (negocio.length > 120) errores.negocio = "Máximo 120 caracteres";
  if (!whatsappValido(String(datos.whatsapp ?? ""))) errores.whatsapp = MENSAJES_LEAD.whatsapp;
  return errores;
}

/** Lee ?lead=ok|error que deja /api/prospectos cuando el formulario se envió sin JavaScript. */
export function resultadoSinJs(search: string): "ok" | "error" | null {
  const v = new URLSearchParams(search).get("lead");
  return v === "ok" || v === "error" ? v : null;
}
