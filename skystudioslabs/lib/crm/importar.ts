import type { Repo } from "@/lib/data/repo";
import { fusionar, normalizarLista, type ErrorFila } from "./normalizar";

export type ResumenImportacion = {
  total: number;
  insertados: number;
  actualizados: number;
  avisos: string[];
  errores: ErrorFila[];
};

/**
 * Importa (upsert por id, idempotente). Si hay errores de validación NO escribe nada.
 * Los campos ausentes en el JSON conservan lo editado en el CRM; las notas se unen sin duplicar.
 */
export async function importarProspectos(repo: Repo, datos: unknown): Promise<ResumenImportacion> {
  const { filas, errores } = normalizarLista(datos);
  const avisos = filas.flatMap((f) => f.avisos.map((a) => `Fila ${f.indice} (${f.parcial.id}): ${a}`));
  if (errores.length) return { total: filas.length + errores.length, insertados: 0, actualizados: 0, avisos, errores };
  const existentes = new Map((await repo.listarProspectos()).map((p) => [p.id, p]));
  const lista = filas.map((f) => fusionar(existentes.get(f.parcial.id) ?? null, f.parcial));
  const { insertados, actualizados } = await repo.upsertProspectos(lista);
  return { total: filas.length, insertados, actualizados, avisos, errores };
}
