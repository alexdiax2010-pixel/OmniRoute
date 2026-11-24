-- =============================================================================
-- PENDIENTE DE APROBACIÓN DEL DUEÑO — no aplicada en Supabase.
--
-- Endurece is_admin(): además de que el correo del JWT esté en public.admins, exige que el
-- usuario exista en auth.users con ese correo CONFIRMADO. Así, si algún día se activa el registro
-- con contraseña sin confirmación (o un proveedor que no verifica correos), nadie puede hacerse
-- pasar por admin creando una cuenta con el correo del dueño.
--
-- No cambia nada para el uso normal: el enlace mágico confirma el correo al entrar. El acceso con
-- código especial (ADMIN_CODIGO) no pasa por aquí (usa la service role en el servidor).
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.admins a
      join auth.users u on lower(u.email) = a.email
     where u.id = auth.uid()
       and u.email_confirmed_at is not null
       and a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
