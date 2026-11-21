import "server-only";
import type { Repo } from "./repo";
import { localRepo } from "./local";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";

export function supabaseConfigurado(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

/**
 * Devuelve el repositorio activo. Sin Supabase configurado usa el almacén local,
 * pero NUNCA en producción (para no perder datos ni exponer un modo inseguro).
 */
export async function getRepo(): Promise<Repo> {
  if (supabaseConfigurado()) {
    const { supabaseRepo } = await import("./supabase");
    return supabaseRepo();
  }
  if (process.env.NODE_ENV === "production" && process.env.SKY_ALLOW_LOCAL_STORE !== "1") {
    throw new Error("Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return localRepo;
}
