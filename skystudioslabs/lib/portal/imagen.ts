/** Validación de fotos del portal (pura): tamaño, tipo declarado y "magic bytes" reales. */
export const MAX_FOTO_BYTES = 300 * 1024;
export const TIPOS_FOTO = ["image/webp", "image/jpeg", "image/png"] as const;
export type TipoFoto = (typeof TIPOS_FOTO)[number];
export const EXT_FOTO: Record<TipoFoto, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** Detecta el tipo por la firma del archivo. */
export function tipoPorFirma(b: Uint8Array): TipoFoto | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  if (
    b.length >= 12 &&
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP"
  )
    return "image/webp";
  return null;
}

export function validarFoto(bytes: Uint8Array, tipoDeclarado: string): { ok: true; tipo: TipoFoto } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: "La foto está vacía." };
  if (bytes.length > MAX_FOTO_BYTES) return { ok: false, error: "La foto pesa más de 300 KB. Reduce su tamaño e inténtalo de nuevo." };
  if (!(TIPOS_FOTO as readonly string[]).includes(tipoDeclarado)) return { ok: false, error: "Solo se aceptan fotos JPG, PNG o WEBP." };
  const real = tipoPorFirma(bytes);
  if (!real || real !== tipoDeclarado) return { ok: false, error: "El archivo no parece una imagen válida." };
  return { ok: true, tipo: real };
}
