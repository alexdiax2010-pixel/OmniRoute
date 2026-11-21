import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey, supabaseServiceKey } from "@/lib/supabase/env";

/**
 * Clientes de Supabase (SOLO servidor).
 *  - clienteSesion(): ligado a las cookies del usuario → RLS aplica (CRM y portal).
 *  - clienteServicio(): service role → IGNORA RLS. Solo para operaciones públicas ya
 *    validadas en el servidor (leads, antispam, conteo, servir sitios), invitaciones y scripts.
 */

function url(): string {
  const u = supabaseUrl();
  if (!u) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  return u;
}

let servicio: SupabaseClient | null = null;

export function clienteServicio(): SupabaseClient {
  const key = supabaseServiceKey();
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (solo servidor)");
  servicio ??= createClient(url(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return servicio;
}

/** Cliente con la sesión del usuario (cookies). Crear uno por petición. */
export async function clienteSesion(): Promise<SupabaseClient> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const anon = supabaseAnonKey();
  if (!anon) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createServerClient(url(), anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) store.set(name, value, options);
        } catch {
          // En un Server Component no se pueden escribir cookies; proxy.ts refresca la sesión.
        }
      },
    },
  });
}

/**
 * Cliente con sesión si hay petición HTTP; si no (scripts como crm:importar), service role.
 * Así RLS protege todo lo que viene del navegador.
 */
export async function clienteSesionOServicio(): Promise<SupabaseClient> {
  try {
    const { cookies } = await import("next/headers");
    await cookies(); // lanza fuera de una petición
  } catch {
    return clienteServicio();
  }
  return clienteSesion();
}
