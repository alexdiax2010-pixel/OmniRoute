/**
 * Normaliza los "seeds" de prospección (resultados/crm/seed/<slug>.json de la rama de investigación)
 * al formato que acepta `npm run crm:importar`. Pura y testeable (sin E/S).
 *
 * Reglas:
 *  - id = nombre del archivo sin ".json" (slug estable → reimportar no duplica).
 *  - "no encontrado …" en teléfono, WhatsApp, colonia o dirección → vacío. Si traía detalle
 *    ("no encontrado (formato de celular; verificar)") el detalle pasa a alertas para no perderlo.
 *  - alertas: texto separado por "; " → lista sin duplicados.
 *  - Se OMITEN los campos vacíos o por defecto (etapa "nuevo", seguimiento "", notas [], mensaje "",
 *    top10 false, puntaje null…): así, al reimportar, no se pisan etapas, seguimientos, notas ni
 *    mensajes que ya se editaron en el CRM.
 */

export type SeedRama = Record<string, unknown>;
export type FilaImportable = Record<string, unknown> & { id: string; nombre: string };

const CAMPOS_TEXTO = ["giro", "categoria", "colonia", "direccion", "telefono", "whatsapp", "razon", "mensaje", "guion", "boceto", "fuente"] as const;
const CAMPOS_NO_ENCONTRADO: Record<string, string> = { telefono: "Teléfono", whatsapp: "WhatsApp", colonia: "Colonia", direccion: "Dirección" };
const VACIOS = /^(no encontrad[oa]s?|n\/?a|-+|sin datos?|desconocid[oa]|ningun[oa]?|null|undefined)$/i;

/** "abogados-garcia.json" o "resultados/crm/seed/abogados-garcia.json" → "abogados-garcia". null si no es un slug seguro. */
export function idDeArchivo(ruta: string): string | null {
  const base = ruta.replace(/\\/g, "/").split("/").pop() ?? "";
  const id = base.replace(/\.json$/i, "");
  return /^[a-z0-9][a-z0-9-]{0,119}$/.test(id) ? id : null;
}

/** Devuelve el texto limpio y, si era un "no encontrado (detalle)", el detalle aparte. */
export function limpiarValor(v: unknown): { valor: string; detalle: string | null } {
  if (v == null) return { valor: "", detalle: null };
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s || VACIOS.test(s)) return { valor: "", detalle: null };
  const m = s.match(/^no encontrad[oa](?:\s+con certeza)?\b\s*(.*)$/i);
  if (m) {
    const resto = m[1].trim().replace(/^[(:\-–—]\s*/, "").replace(/\)\s*$/, "").trim();
    return { valor: "", detalle: resto || null };
  }
  return { valor: s, detalle: null };
}

export function dividirAlertas(v: unknown): string[] {
  const arr = Array.isArray(v) ? v.map(String) : String(v ?? "").split(/;\s+|\r?\n/);
  const r: string[] = [];
  for (const a of arr) {
    const t = a.replace(/\s+/g, " ").trim().replace(/[.;]+$/, (x) => (x.includes(".") ? "." : ""));
    if (t && !r.includes(t)) r.push(t);
  }
  return r;
}

export function normalizarSeed(id: string, raw: SeedRama): FilaImportable {
  const nombre = limpiarValor(raw.nombre).valor;
  if (!nombre) throw new Error(`${id}: sin nombre`);
  const fila: FilaImportable = { id, nombre };
  const alertas = dividirAlertas(raw.alertas);

  for (const k of CAMPOS_TEXTO) {
    const { valor, detalle } = limpiarValor(raw[k]);
    if (valor) fila[k] = valor;
    const etiqueta = CAMPOS_NO_ENCONTRADO[k];
    if (etiqueta && detalle) {
      const alerta = `${etiqueta} no encontrado: ${detalle}`;
      if (!alertas.some((a) => a.includes(detalle))) alertas.push(alerta);
    }
  }
  if (typeof raw.puntaje === "number" && Number.isFinite(raw.puntaje)) fila.puntaje = raw.puntaje;
  if (raw.top10 === true) fila.top10 = true;
  if (alertas.length) fila.alertas = alertas;
  if (raw.sesion != null && String(raw.sesion).trim() !== "") fila.sesion = String(raw.sesion).trim();
  const etapa = limpiarValor(raw.etapa).valor;
  if (etapa && etapa.toLowerCase() !== "nuevo") fila.etapa = etapa;
  const seg = limpiarValor(raw.seguimiento).valor;
  if (seg) fila.seguimiento = seg;
  if (Array.isArray(raw.notas) && raw.notas.length) fila.notas = raw.notas;
  return fila;
}

/** Convierte todos los seeds; ordena por puntaje (desc) y nombre. Lanza si hay ids repetidos. */
export function seedsAImportables(archivos: { ruta: string; datos: SeedRama }[]): FilaImportable[] {
  const vistos = new Set<string>();
  const r: FilaImportable[] = [];
  for (const { ruta, datos } of archivos) {
    const id = idDeArchivo(ruta);
    if (!id) throw new Error(`Nombre de archivo inválido: ${ruta}`);
    if (vistos.has(id)) throw new Error(`id repetido: ${id}`);
    vistos.add(id);
    r.push(normalizarSeed(id, datos));
  }
  return r.sort((a, b) => Number(b.puntaje ?? -1) - Number(a.puntaje ?? -1) || a.nombre.localeCompare(b.nombre, "es"));
}
