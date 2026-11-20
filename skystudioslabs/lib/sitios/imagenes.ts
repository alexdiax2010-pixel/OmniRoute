/**
 * Verificación de peso de imágenes (sin dependencias de Next; la usan scripts y pruebas).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export const LIMITE_IMAGEN = 300 * 1024;
export const EXT_IMAGEN = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"] as const;
const OMITIR = new Set(["node_modules", ".git", ".next"]);

export type ImagenPesada = { ruta: string; bytes: number };

export function esImagen(archivo: string): boolean {
  return (EXT_IMAGEN as readonly string[]).includes(path.extname(archivo).toLowerCase());
}

async function* recorrer(dir: string): AsyncGenerator<string> {
  let entradas: import("node:fs").Dirent[];
  try {
    entradas = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // carpeta inexistente → nada que revisar
  }
  for (const e of entradas) {
    if (OMITIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* recorrer(p);
    else if (e.isFile()) yield p;
  }
}

/** Lista las imágenes de `dirs` que superan `limite` bytes (ordenadas de mayor a menor). */
export async function buscarImagenesPesadas(dirs: readonly string[], limite = LIMITE_IMAGEN): Promise<ImagenPesada[]> {
  const pesadas: ImagenPesada[] = [];
  for (const d of dirs) {
    for await (const archivo of recorrer(d)) {
      if (!esImagen(archivo)) continue;
      const { size } = await fs.stat(archivo);
      if (size > limite) pesadas.push({ ruta: archivo, bytes: size });
    }
  }
  return pesadas.sort((a, b) => b.bytes - a.bytes);
}

export function formatearKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
