import { z } from "zod";
import { ETAPAS, type Etapa, type Nota, type Prospecto } from "@/lib/types";
import { PAQUETES, SERVICIOS, type Servicio } from "@/config/precios";
import { prospectoBase } from "@/lib/data/base";
import { esFechaISO } from "./fechas";
import { plano } from "./texto";
import { normalizarCategoria, normalizarGiro } from "./giros";
import { limpiarDireccion, limpiarTelefono } from "./contacto";

/**
 * Normalización de prospectos para crm:importar (pura, testeable).
 * Solo se devuelven los campos PRESENTES en el JSON: así, al fusionar con lo que ya hay
 * en el CRM, las ediciones hechas en el CRM a campos ausentes se conservan.
 */

export type ProspectoParcial = Partial<Prospecto> & Pick<Prospecto, "id" | "nombre">;
export type FilaNormalizada = { indice: number; parcial: ProspectoParcial; avisos: string[] };
export type ErrorFila = { indice: number; mensaje: string };

const ETAPA_POR_CLAVE = new Map<string, Etapa>(ETAPAS.map((e) => [plano(e), e]));
// Sinónimos frecuentes en hojas de cálculo
ETAPA_POR_CLAVE.set("boceto", "Boceto enviado");
ETAPA_POR_CLAVE.set("negociacion", "Negociando");
ETAPA_POR_CLAVE.set("ganada", "Ganado");
ETAPA_POR_CLAVE.set("perdida", "Perdido");

export function normalizarEtapa(v: unknown): { etapa: Etapa; aviso?: string } {
  if (v == null || v === "") return { etapa: "Nuevo" };
  const clave = plano(String(v)).replace(/\s+/g, " ");
  const etapa = ETAPA_POR_CLAVE.get(clave);
  if (etapa) return { etapa };
  return { etapa: "Nuevo", aviso: `etapa desconocida "${String(v)}" → Nuevo` };
}

/** Acepta YYYY-MM-DD, ISO con hora, DD/MM/YYYY, DD-MM-YYYY o timestamp. Devuelve YYYY-MM-DD o null. */
export function normalizarFecha(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const f = new Date(v);
    return Number.isNaN(f.getTime()) ? null : f.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (esFechaISO(s)) return s;
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})[T ]/);
  if (iso && esFechaISO(iso[1])) return iso[1];
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const r = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    return esFechaISO(r) ? r : null;
  }
  return null;
}

/** "1,500" / "$1,500.00" / 1500 → 1500. Vacío o inválido → null. */
export function normalizarNumero(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[$\s,]/g, "").replace(/mxn/i, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizarBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return ["1", "true", "si", "sí", "x", "yes"].includes(plano(String(v ?? "")));
}

function normalizarAlertas(v: unknown): string[] {
  if (v == null || v === "") return [];
  // Las listas de prospección separan las alertas con "; " (también saltos de línea o " | ").
  const arr = Array.isArray(v) ? v : String(v).split(/\r?\n|\s\|\s|;\s+/);
  return [...new Set(arr.map((a) => String(a ?? "").trim()).filter(Boolean))];
}

function texto(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

const notaSchema = z.object({ t: z.union([z.string(), z.number()]).optional(), txt: z.string() });
const filaSchema = z
  .object({
    id: z.union([z.string().trim().min(1), z.number().finite()], { error: "id requerido (texto o número)" }),
    nombre: z.string({ error: "nombre requerido" }).trim().min(1, "nombre requerido"),
    notas: z.union([z.array(notaSchema), z.string()]).optional().nullable(),
    servicios: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  })
  .passthrough();

const CAMPOS_TEXTO = ["giro", "categoria", "colonia", "direccion", "telefono", "whatsapp", "razon", "mensaje", "guion", "boceto", "fuente", "sesion"] as const;

function presente(o: Record<string, unknown>, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined;
}

/** Normaliza una fila. Lanza Error con el índice si no pasa la validación. */
export function normalizarFila(raw: unknown, indice: number): FilaNormalizada {
  const r = filaSchema.safeParse(raw);
  if (!r.success) {
    const detalle = r.error.issues.map((i) => `${i.path.join(".") || "fila"}: ${i.message}`).join("; ");
    throw new Error(`Fila ${indice}: ${detalle}`);
  }
  const o = r.data as Record<string, unknown>;
  const avisos: string[] = [];
  const parcial: ProspectoParcial = { id: String(r.data.id).trim(), nombre: r.data.nombre };

  for (const k of CAMPOS_TEXTO) if (presente(o, k)) parcial[k] = texto(o[k]);

  // Giro y categoría canónicos (para filtrar y contar). El giro original queda en una nota.
  const notasExtra: Nota[] = [];
  if (presente(o, "giro")) {
    const original = texto(o.giro);
    parcial.giro = normalizarGiro(original, r.data.nombre);
    if (original && plano(original) !== plano(parcial.giro)) notasExtra.push({ t: "", txt: `Giro original: ${original}` });
  }
  if (presente(o, "categoria")) parcial.categoria = normalizarCategoria(texto(o.categoria));

  // Teléfono / WhatsApp / dirección: número limpio; el texto original va a las alertas.
  const alertasExtra: string[] = [];
  for (const [k, etiqueta] of [["telefono", "Teléfono"], ["whatsapp", "WhatsApp"]] as const) {
    if (!presente(o, k)) continue;
    const r = limpiarTelefono(o[k], etiqueta);
    parcial[k] = r.valor;
    if (r.alerta) alertasExtra.push(r.alerta);
  }
  if (presente(o, "direccion")) {
    const r = limpiarDireccion(o.direccion);
    parcial.direccion = r.valor;
    if (r.alerta) alertasExtra.push(r.alerta);
  }

  if (presente(o, "puntaje")) parcial.puntaje = normalizarNumero(o.puntaje) ?? 0;
  if (presente(o, "alertas") || alertasExtra.length) {
    parcial.alertas = [...new Set([...normalizarAlertas(o.alertas), ...alertasExtra])];
  }
  if (presente(o, "top10")) parcial.top10 = normalizarBool(o.top10);
  if (presente(o, "etapa")) {
    const { etapa, aviso } = normalizarEtapa(o.etapa);
    parcial.etapa = etapa;
    if (aviso) avisos.push(aviso);
  }
  for (const k of ["seguimiento", "fechaGanado"] as const) {
    if (!presente(o, k)) continue;
    const f = normalizarFecha(o[k]);
    if (o[k] != null && o[k] !== "" && !f) avisos.push(`${k} inválido "${String(o[k])}" → vacío`);
    parcial[k] = f;
  }
  if (presente(o, "notas")) {
    const n = r.data.notas;
    const notas: Nota[] = typeof n === "string" ? (n.trim() ? [{ t: "", txt: n.trim() }] : []) : (n ?? []).map((x) => ({ t: x.t == null ? "" : String(x.t), txt: x.txt }));
    parcial.notas = notas.filter((x) => x.txt.trim());
  }
  if (notasExtra.length) parcial.notas = unirNotas(parcial.notas ?? [], notasExtra);
  if (presente(o, "paquete")) {
    const v = texto(o.paquete);
    if (!v) parcial.paquete = null;
    else {
      const p = PAQUETES.find((x) => x.id === plano(v) || plano(x.nombre) === plano(v));
      if (!p) avisos.push(`paquete desconocido "${v}" (se guarda tal cual)`);
      parcial.paquete = p ? p.id : v;
    }
  }
  for (const k of ["monto", "mensualidad"] as const) {
    if (!presente(o, k)) continue;
    const n = normalizarNumero(o[k]);
    if (o[k] != null && o[k] !== "" && n == null) avisos.push(`${k} no es número "${String(o[k])}"`);
    parcial[k] = n != null && n >= 0 ? n : null;
  }
  if (presente(o, "diaCobro")) {
    const n = normalizarNumero(o.diaCobro);
    const ok = n != null && Number.isInteger(n) && n >= 1 && n <= 31;
    if (n != null && !ok) avisos.push(`diaCobro fuera de rango "${String(o.diaCobro)}"`);
    parcial.diaCobro = ok ? n : null;
  }
  if (presente(o, "servicios")) {
    const lista = typeof r.data.servicios === "string" ? r.data.servicios.split(/[,;|]/) : (r.data.servicios ?? []);
    const servicios: Servicio[] = [];
    for (const s of lista) {
      const c = plano(String(s)).replace(/[\s_-]+/g, "");
      if (!c) continue;
      if ((SERVICIOS as readonly string[]).includes(c)) {
        if (!servicios.includes(c as Servicio)) servicios.push(c as Servicio);
      } else avisos.push(`servicio desconocido "${s}"`);
    }
    parcial.servicios = servicios;
  }
  if (presente(o, "email")) {
    const e = texto(o.email).toLowerCase();
    if (e && !z.email().safeParse(e).success) avisos.push(`email inválido "${e}"`);
    parcial.email = e && z.email().safeParse(e).success ? e : null;
  }
  return { indice, parcial, avisos };
}

export function normalizarLista(raw: unknown): { filas: FilaNormalizada[]; errores: ErrorFila[] } {
  if (!Array.isArray(raw)) {
    // Acepta { prospectos: [...] }
    const lista = raw && typeof raw === "object" ? (raw as Record<string, unknown>).prospectos : undefined;
    if (!Array.isArray(lista)) return { filas: [], errores: [{ indice: -1, mensaje: "El archivo debe ser un arreglo JSON de prospectos (o { \"prospectos\": [...] })." }] };
    raw = lista;
  }
  const filas: FilaNormalizada[] = [];
  const errores: ErrorFila[] = [];
  const vistos = new Map<string, number>();
  (raw as unknown[]).forEach((fila, i) => {
    try {
      const n = normalizarFila(fila, i);
      const previo = vistos.get(n.parcial.id);
      if (previo != null) {
        errores.push({ indice: i, mensaje: `Fila ${i}: id "${n.parcial.id}" repetido (también en fila ${previo})` });
        return;
      }
      vistos.set(n.parcial.id, i);
      filas.push(n);
    } catch (e) {
      errores.push({ indice: i, mensaje: e instanceof Error ? e.message : `Fila ${i}: inválida` });
    }
  });
  return { filas, errores };
}

/** Une notas sin duplicar (mismo t + txt). Conserva el orden: primero las existentes. */
export function unirNotas(a: Nota[], b: Nota[]): Nota[] {
  const clave = (n: Nota) => `${n.t}\u0000${n.txt}`;
  const vistas = new Set(a.map(clave));
  const r = [...a];
  for (const n of b) if (!vistas.has(clave(n))) {
    vistas.add(clave(n));
    r.push(n);
  }
  return r;
}

/**
 * Fusiona lo importado con lo existente: los campos presentes en el JSON ganan, los ausentes
 * se conservan, y las notas se unen (las notas del CRM nunca se pierden).
 */
export function fusionar(existente: Prospecto | null, parcial: ProspectoParcial): Prospecto {
  if (!existente) return prospectoBase({ ...parcial, giro: parcial.giro ?? "", whatsapp: parcial.whatsapp ?? "" });
  const r: Prospecto = { ...existente, ...parcial, id: existente.id, creado: existente.creado };
  if (parcial.notas) r.notas = unirNotas(existente.notas, parcial.notas);
  return r;
}
