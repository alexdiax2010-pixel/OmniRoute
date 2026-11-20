import "server-only";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

/** ¿Existe clientes/<carpeta>/ en disco? (el nombre ya viene validado por carpetaDeBoceto/slugify) */
export function carpetaExiste(carpeta: string): boolean {
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(carpeta) || carpeta === "." || carpeta === "..") return false;
  const p = path.join(process.cwd(), "clientes", carpeta);
  try {
    return existsSync(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
}
