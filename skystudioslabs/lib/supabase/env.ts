/**
 * Lee la configuración de Supabase aceptando los nombres que usamos (.env.example) y los que crea
 * la integración de Supabase en Vercel (Storage → Supabase). Solo se usa en el servidor.
 */
const primero = (...nombres: string[]): string | undefined => {
  for (const n of nombres) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
};

export const supabaseUrl = () => primero("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
export const supabaseAnonKey = () =>
  primero("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");
export const supabaseServiceKey = () => primero("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
