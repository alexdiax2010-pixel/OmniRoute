/**
 * Aplica las migraciones de supabase/migrations/*.sql a la base de datos de Supabase.
 * Se ejecuta en cada despliegue de Vercel (script "vercel-build") ANTES de compilar.
 *
 * - Solo corre si hay una cadena de conexión directa (POSTGRES_URL_NON_POOLING, la crea la
 *   integración Supabase de Vercel, o DATABASE_URL). Sin ella, no hace nada.
 * - Cada archivo se aplica una sola vez (tabla public._migraciones) dentro de una transacción.
 * - Da de alta como administradores los correos de ADMIN_EMAILS (idempotente).
 * - Nunca imprime la cadena de conexión ni credenciales.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrar] Sin POSTGRES_URL_NON_POOLING/DATABASE_URL: se omiten las migraciones.");
  process.exit(0);
}

const dir = path.join(process.cwd(), "supabase", "migrations");
const archivos = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

// Supabase exige TLS; su certificado lo firma la CA de Supabase (no está en el almacén de Node).
const conexion = url.replace(/[?&]sslmode=[^&]*/g, "");
const cliente = new pg.Client({ connectionString: conexion, ssl: { rejectUnauthorized: false } });

try {
  await cliente.connect();
  await cliente.query(`create table if not exists public._migraciones (nombre text primary key, aplicada timestamptz not null default now());
    alter table public._migraciones enable row level security;
    revoke all on table public._migraciones from anon, authenticated;`);
  const { rows } = await cliente.query("select nombre from public._migraciones");
  const hechas = new Set(rows.map((r) => r.nombre));
  for (const f of archivos) {
    if (hechas.has(f)) continue;
    console.log(`[migrar] Aplicando ${f}…`);
    await cliente.query("begin");
    try {
      await cliente.query(readFileSync(path.join(dir, f), "utf8"));
      await cliente.query("insert into public._migraciones(nombre) values ($1)", [f]);
      await cliente.query("commit");
    } catch (e) {
      await cliente.query("rollback");
      throw e;
    }
  }
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const email of admins) {
    await cliente.query("insert into public.admins(email) values ($1) on conflict do nothing", [email]);
  }
  console.log(`[migrar] Listo. Migraciones: ${archivos.length}. Administradores registrados: ${admins.length}.`);
} catch (e) {
  console.error("[migrar] Falló la migración:", e instanceof Error ? e.message.replace(/postgres(ql)?:\/\/\S+/g, "[url]") : "error");
  process.exit(1);
} finally {
  await cliente.end().catch(() => {});
}
