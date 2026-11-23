import type { Repo } from "@/lib/data/repo";
import type { Prospecto } from "@/lib/types";
import { fusionar, normalizarLista, type ErrorFila, type ProspectoParcial } from "./normalizar";
import { plano } from "./texto";
import { digitosMX } from "./contacto";

export type Duplicado = { indice: number; id: string; de: string; motivo: string };

export type ResumenImportacion = {
  total: number;
  insertados: number;
  actualizados: number;
  /** Filas nuevas que NO se importaron porque ya existe el mismo negocio con otro id. */
  duplicados: Duplicado[];
  avisos: string[];
  errores: ErrorFila[];
};

/** Nombre comparable: sin acentos, signos ni sufijos legales ("S.A. de C.V.", "S.C.", "A.C."). */
export function claveNombre(nombre: string): string {
  return plano(nombre)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(s a de c v|sa de cv|s de rl de cv|s c|sc|a c|ac)\s*$/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function telefonos(p: Pick<Prospecto, "telefono" | "whatsapp"> | ProspectoParcial): string[] {
  return [p.telefono, p.whatsapp].map((t) => digitosMX(t ?? "")).filter((t): t is string => Boolean(t));
}

/**
 * Importa (upsert por id, idempotente). Si hay errores de validación NO escribe nada.
 * Los campos ausentes en el JSON conservan lo editado en el CRM; las notas se unen sin duplicar.
 * Una fila con id NUEVO cuyo nombre ya existe en el CRM (o antes en el mismo archivo) se omite
 * como duplicado. Compartir teléfono solo genera un aviso (dos negocios pueden compartirlo).
 */
export async function importarProspectos(repo: Repo, datos: unknown): Promise<ResumenImportacion> {
  const { filas, errores } = normalizarLista(datos);
  const avisos = filas.flatMap((f) => f.avisos.map((a) => `Fila ${f.indice} (${f.parcial.id}): ${a}`));
  if (errores.length) return { total: filas.length + errores.length, insertados: 0, actualizados: 0, duplicados: [], avisos, errores };

  const actuales = await repo.listarProspectos();
  const existentes = new Map(actuales.map((p) => [p.id, p]));
  const porNombre = new Map<string, string>();
  const porTelefono = new Map<string, string>();
  const registrar = (id: string, p: Pick<Prospecto, "nombre" | "telefono" | "whatsapp"> | ProspectoParcial) => {
    const k = claveNombre(p.nombre);
    if (k && !porNombre.has(k)) porNombre.set(k, id);
    for (const t of telefonos(p)) if (!porTelefono.has(t)) porTelefono.set(t, id);
  };
  for (const p of actuales) registrar(p.id, p);

  const duplicados: Duplicado[] = [];
  const lista: Prospecto[] = [];
  for (const f of filas) {
    const { id } = f.parcial;
    if (!existentes.has(id)) {
      const mismoNombre = porNombre.get(claveNombre(f.parcial.nombre));
      if (mismoNombre && mismoNombre !== id) {
        duplicados.push({ indice: f.indice, id, de: mismoNombre, motivo: "mismo nombre" });
        continue;
      }
      const mismoTel = telefonos(f.parcial).map((t) => porTelefono.get(t)).find((x) => x && x !== id);
      if (mismoTel) avisos.push(`Fila ${f.indice} (${id}): comparte teléfono con "${mismoTel}" (¿mismo negocio? revísalo)`);
    }
    registrar(id, f.parcial);
    lista.push(fusionar(existentes.get(id) ?? null, f.parcial));
  }
  const { insertados, actualizados } = await repo.upsertProspectos(lista);
  return { total: filas.length, insertados, actualizados, duplicados, avisos, errores };
}
