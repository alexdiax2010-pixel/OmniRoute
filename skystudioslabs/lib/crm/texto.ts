/** Utilidades de texto puras. */

/** Quita acentos y pasa a minúsculas. */
export function plano(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** "Taller Ramírez & Hijos" → "taller-ramirez-hijos" (máx 50 caracteres). */
export function slugify(s: string): string {
  const base = plano(s)
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return base || "sitio";
}

/** Primer slug libre: base, base-2, base-3… */
export function slugUnico(base: string, ocupados: Iterable<string>, reservados: readonly string[] = []): string {
  const set = new Set(ocupados);
  for (const r of reservados) set.add(r);
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) {
    const c = `${base}-${i}`;
    if (!set.has(c)) return c;
  }
}

/** Solo dígitos del WhatsApp; agrega 52 si son 10 dígitos (México). null si no es válido. */
export function numeroWhatsApp(numero: string | null | undefined): string | null {
  const d = (numero ?? "").replace(/\D/g, "");
  if (d.length === 10) return `52${d}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

export function linkWa(numero: string | null | undefined, mensaje: string): string | null {
  const n = numeroWhatsApp(numero);
  if (!n) return null;
  return `https://wa.me/${n}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;
}

/**
 * Nombre de carpeta del boceto: acepta "taller-ramirez", "clientes/taller-ramirez",
 * "clientes/taller-ramirez/index.html" o "./taller-ramirez/". Devuelve null si no es seguro.
 */
export function carpetaDeBoceto(boceto: string | null | undefined): string | null {
  let s = (boceto ?? "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!s || /^[a-z]+:\/\//i.test(s)) return null;
  s = s.replace(/^\/+/, "").replace(/^clientes\//, "");
  const seg = s.split("/").filter(Boolean)[0];
  if (!seg || seg === "." || seg === ".." || /\.html?$/i.test(seg)) return null;
  return /^[a-zA-Z0-9._-]{1,80}$/.test(seg) ? seg : null;
}
