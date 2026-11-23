import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Lee la entrada de crm:importar (solo scripts, usa el disco). Acepta:
 *  - un archivo con un arreglo JSON (o { "prospectos": [...] }),
 *  - un archivo con UN prospecto (objeto suelto),
 *  - una carpeta con un .json por prospecto (formato de las listas de prospección: sin "id").
 * A un objeto suelto sin "id" se le asigna el nombre de su archivo (sin .json) como id: es estable,
 * así que volver a importar la misma carpeta actualiza en vez de duplicar.
 */
export type EntradaImportacion = { datos: unknown; archivos: number; errores: string[] };

const esObjeto = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

function conIdDeArchivo(v: unknown, archivo: string): unknown {
  if (!esObjeto(v) || "prospectos" in v) return v;
  if (v.id != null && v.id !== "") return v;
  return { ...v, id: path.basename(archivo, path.extname(archivo)) };
}

export function leerEntrada(ruta: string): EntradaImportacion {
  if (statSync(ruta).isDirectory()) {
    const nombres = readdirSync(ruta).filter((f) => f.toLowerCase().endsWith(".json")).sort();
    const datos: unknown[] = [];
    const errores: string[] = [];
    for (const f of nombres) {
      try {
        const v = JSON.parse(readFileSync(path.join(ruta, f), "utf8"));
        if (Array.isArray(v)) datos.push(...v);
        else datos.push(conIdDeArchivo(v, f));
      } catch {
        errores.push(`${f}: no es JSON válido`);
      }
    }
    return { datos, archivos: nombres.length, errores };
  }
  const v = JSON.parse(readFileSync(ruta, "utf8"));
  return { datos: Array.isArray(v) || (esObjeto(v) && "prospectos" in v) ? v : [conIdDeArchivo(v, ruta)], archivos: 1, errores: [] };
}
