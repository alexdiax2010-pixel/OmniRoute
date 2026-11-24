import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { supabaseConfigurado } from "@/lib/data";
import { EXT_FOTO, type TipoFoto } from "./imagen";

/**
 * Fotos de solicitudes de cambio.
 *  - Supabase: bucket privado "cambios", ruta <prospectoId>/<uuid>.<ext>, subida con la sesión
 *    del cliente (la política de Storage solo le deja escribir en SU carpeta).
 *  - Local: .data/cambios/<prospectoId>/<uuid>.<ext>
 * La ruta guardada es siempre "<prospectoId>/<archivo>".
 */

const RUTA_RE = /^([A-Za-z0-9_.-]{1,120})\/([0-9a-f-]{36}\.(?:webp|jpg|png))$/;

function dirLocal(): string {
  return path.join(process.cwd(), ".data", "cambios");
}

export function rutaValida(ruta: string): boolean {
  const m = ruta.match(RUTA_RE);
  return Boolean(m && m[1] !== "." && m[1] !== "..");
}

export async function guardarFoto(prospectoId: string, bytes: Uint8Array, tipo: TipoFoto): Promise<string> {
  const ruta = `${prospectoId}/${randomUUID()}.${EXT_FOTO[tipo]}`;
  if (!rutaValida(ruta)) throw new Error("Ruta de foto inválida");
  if (supabaseConfigurado()) {
    const { clienteSesion } = await import("@/lib/supabase/servidor");
    const db = await clienteSesion();
    const { error } = await db.storage.from("cambios").upload(ruta, bytes, { contentType: tipo, upsert: false });
    if (error) {
      console.error("[portal] subida de foto falló", error.message);
      throw new Error("No se pudo subir la foto");
    }
    return ruta;
  }
  const destino = path.join(dirLocal(), ruta);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, bytes);
  return ruta;
}

/** Solo admin (el llamador ya verificó). Supabase → URL firmada 5 min; local → bytes. */
export async function leerFoto(ruta: string): Promise<{ url: string } | { bytes: Buffer; tipo: string } | null> {
  if (!rutaValida(ruta)) return null;
  if (supabaseConfigurado()) {
    const { clienteSesion, clienteServicio } = await import("@/lib/supabase/servidor");
    // Admin que entró con código especial: no hay sesión de Supabase (RLS la rechazaría) → service role.
    // El llamador (app/admin/foto) ya exigió rol admin.
    const { adminPorCodigo } = await import("@/lib/auth-codigo");
    const db = (await adminPorCodigo()) ? clienteServicio() : await clienteSesion();
    const { data, error } = await db.storage.from("cambios").createSignedUrl(ruta, 300);
    return error || !data ? null : { url: data.signedUrl };
  }
  try {
    const bytes = await fs.readFile(path.join(dirLocal(), ruta));
    const ext = path.extname(ruta).slice(1);
    return { bytes, tipo: ext === "jpg" ? "image/jpeg" : `image/${ext}` };
  } catch {
    return null;
  }
}
