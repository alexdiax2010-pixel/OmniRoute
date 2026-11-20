-- Datos iniciales. Cambia el correo por el tuyo (en minúsculas) y agrégalo también a ADMIN_EMAILS.
-- Un correo debe estar en AMBOS lugares para entrar al CRM:
--   * public.admins → lo usa RLS (is_admin()) para dar acceso a los datos.
--   * ADMIN_EMAILS  → lo usa la app para permitir el login por enlace mágico.
insert into public.admins (email) values ('tu-correo@ejemplo.com') on conflict (email) do nothing;
