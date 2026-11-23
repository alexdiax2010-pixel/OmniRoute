import { plano } from "./texto";

/**
 * Limpieza de teléfono / WhatsApp / dirección al importar (pura).
 * Las listas de prospección traen textos como "no encontrado", "+52 33 1234 5678 (verificar en
 * Maps)", "(33) 1234 5678 / (33) 8765 4321" o "posible +52 … (VERIFICAR)". El CRM necesita un número
 * limpio para el botón de WhatsApp; el texto original NUNCA se pierde: va a las alertas.
 */

export type DatoLimpio = { valor: string; alerta?: string };

/** Señales de que el dato no está confirmado: no se usa como número (no inventamos contacto). */
const SIN_CONFIRMAR = /^(wa\s+)?no encontrad|^posible|dudos|no confirmad|no se puede atribuir|sin confirmar/;

/** 10 dígitos MX → "33 1234 5678" (CDMX/GDL/MTY) o "312 345 6789". */
export function formatoTelefonoMX(d: string): string {
  if (/^(33|55|56|81)/.test(d)) return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Dígitos de un número MX a 10 dígitos (quita +52 / 521). null si no son 10. */
export function digitosMX(s: string): string | null {
  let d = s.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  else if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  return /^\d{10}$/.test(d) ? d : null;
}

/**
 * Teléfono o WhatsApp crudo → número limpio. `etiqueta` se usa en el texto de la alerta.
 * - vacío → ""
 * - "no encontrado…", "posible…", "(asignación dudosa)" → "" + alerta con el texto original
 * - texto con un número: el PRIMER número de 10 dígitos; si había más texto, alerta con el original
 */
export function limpiarTelefono(crudo: unknown, etiqueta: string): DatoLimpio {
  if (crudo == null) return { valor: "" };
  const raw = String(crudo).trim();
  if (!raw) return { valor: "" };
  const sinPrefijo = raw.replace(/^wa\s*:?\s+/i, "");
  if (SIN_CONFIRMAR.test(plano(raw))) return { valor: "", alerta: `${etiqueta} sin confirmar: ${raw}` };
  const candidatos = sinPrefijo.match(/\+?\d[\d\s().-]{6,}\d/g) ?? [];
  for (const c of candidatos) {
    const d = digitosMX(c);
    if (!d) continue;
    // Limpio = no queda texto ni otros dígitos fuera del número (solo signos como "(", ")", "-").
    const limpio = !/[\p{L}\p{N}]/u.test(sinPrefijo.replace(c, ""));
    return limpio ? { valor: formatoTelefonoMX(d) } : { valor: formatoTelefonoMX(d), alerta: `${etiqueta} (dato original): ${raw}` };
  }
  return { valor: "", alerta: `${etiqueta} no reconocido: ${raw}` };
}

/** "no encontrado (verificar en Maps)" → "" + alerta. Una dirección real se deja igual. */
export function limpiarDireccion(crudo: unknown): DatoLimpio {
  if (crudo == null) return { valor: "" };
  const raw = String(crudo).trim();
  if (!raw) return { valor: "" };
  if (/^no encontrad/.test(plano(raw))) return { valor: "", alerta: `Dirección sin confirmar: ${raw}` };
  return { valor: raw };
}
