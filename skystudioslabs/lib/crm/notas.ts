/** Formato de las notas que llegan desde el portal del cliente. Debe coincidir con el trigger SQL. */
export const PREFIJO_PORTAL = "[Portal] ";
export const SEPARADOR_FOTO = " — foto: ";

export function notaPortal(texto: string, foto: string | null): string {
  return `${PREFIJO_PORTAL}${texto}${foto ? `${SEPARADOR_FOTO}${foto}` : ""}`;
}

/** Separa el texto y la ruta de foto de una nota del portal (si lo es). */
export function leerNotaPortal(txt: string): { texto: string; foto: string | null } | null {
  if (!txt.startsWith(PREFIJO_PORTAL)) return null;
  const cuerpo = txt.slice(PREFIJO_PORTAL.length);
  const i = cuerpo.lastIndexOf(SEPARADOR_FOTO);
  if (i < 0) return { texto: cuerpo, foto: null };
  return { texto: cuerpo.slice(0, i), foto: cuerpo.slice(i + SEPARADOR_FOTO.length).trim() || null };
}
