-- =============================================================================
-- Sky Studios Labs — esquema inicial
--
-- Modelo de seguridad (RLS en TODAS las tablas):
--   * admins (correo en public.admins)  → acceso total al CRM.
--   * clientes del portal (auth.users ligados en public.clientes_portal)
--       → SELECT solo de la parte "de cliente" de SU prospecto (public.prospectos) y SUS sitios.
--         Los datos internos de venta (teléfono, WhatsApp, puntaje, razón, alertas, etapa,
--         seguimiento, mensaje, guion, notas, boceto, fuente, sesión) viven en
--         public.prospectos_internos, que SOLO los admins pueden leer; INSERT de solicitudes_cambio solo
--         para su propio prospecto; subir fotos solo a la carpeta cambios/<su prospecto>/.
--   * anon → NINGÚN acceso a tablas. Lo único público es contar_sitios_activos() (un número).
--   * Los leads del formulario público y el antispam (envios) se escriben en el servidor con
--     la service role key (después de Zod + honeypot + rate limit). La service role ignora RLS,
--     por eso esa llave vive SOLO en el servidor (nunca NEXT_PUBLIC_*).
--
-- Para dar de alta un admin: insert into public.admins(email) values ('tu@correo.com');
-- y además agrégalo a ADMIN_EMAILS en las variables de entorno (se exigen ambas cosas).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

-- Parte del prospecto que el cliente puede ver en el portal (sus propios datos de contrato).
create table if not exists public.prospectos (
  id            text primary key,
  nombre        text not null,
  giro          text not null default '',
  categoria     text not null default '',
  colonia       text not null default '',
  direccion     text not null default '',
  paquete       text,
  monto         numeric check (monto is null or monto >= 0),
  mensualidad   numeric check (mensualidad is null or mensualidad >= 0),
  dia_cobro     smallint check (dia_cobro between 1 and 31),
  servicios     text[] not null default '{}',
  fecha_ganado  date,
  email         text check (email is null or email = lower(email)),
  creado        timestamptz not null default now(),
  actualizado   timestamptz not null default now()
);
create index if not exists prospectos_email_idx on public.prospectos (email);

-- Datos internos de venta: SOLO admins (ninguna política para clientes del portal).
create table if not exists public.prospectos_internos (
  id            text primary key references public.prospectos(id) on delete cascade,
  telefono      text not null default '',
  whatsapp      text not null default '',
  puntaje       numeric not null default 0,
  razon         text not null default '',
  alertas       text[] not null default '{}',
  top10         boolean not null default false,
  etapa         text not null default 'Nuevo'
                check (etapa in ('Nuevo','Contactado','Boceto enviado','Negociando','Ganado','Perdido')),
  seguimiento   date,
  mensaje       text not null default '',
  guion         text not null default '',
  notas         jsonb not null default '[]'::jsonb check (jsonb_typeof(notas) = 'array'),
  boceto        text not null default '',
  fuente        text not null default '',
  sesion        text not null default ''
);
create index if not exists prospectos_internos_etapa_idx on public.prospectos_internos (etapa);
create index if not exists prospectos_internos_seguimiento_idx on public.prospectos_internos (seguimiento);

-- Vista de lectura para el CRM. security_invoker: aplica el RLS de AMBAS tablas a quien consulta,
-- así que un cliente del portal solo ve su fila con las columnas internas en NULL.
create or replace view public.prospectos_completo with (security_invoker = true) as
  select p.id, p.nombre, p.giro, p.categoria, p.colonia, p.direccion,
         i.telefono, i.whatsapp, i.puntaje, i.razon, i.alertas, i.top10, i.etapa, i.seguimiento,
         i.mensaje, i.guion, i.notas, i.boceto, i.fuente, i.sesion,
         p.paquete, p.monto, p.mensualidad, p.dia_cobro, p.servicios, p.fecha_ganado, p.email,
         p.creado, p.actualizado
    from public.prospectos p
    left join public.prospectos_internos i on i.id = p.id;

create table if not exists public.sitios (
  slug            text primary key check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'),
  tipo            text not null check (tipo in ('propuesta','cliente')),
  prospecto_id    text references public.prospectos(id) on delete set null,
  carpeta         text not null,
  dominio_propio  text unique,
  activo          boolean not null default true,
  expira          date,
  creado          timestamptz not null default now()
);
create index if not exists sitios_prospecto_idx on public.sitios (prospecto_id);

create table if not exists public.solicitudes_cambio (
  id            uuid primary key default gen_random_uuid(),
  prospecto_id  text not null references public.prospectos(id) on delete cascade,
  texto         text not null check (char_length(texto) between 1 and 2000),
  foto          text,             -- ruta dentro del bucket "cambios": <prospecto_id>/<archivo>
  creado        timestamptz not null default now()
);
create index if not exists solicitudes_prospecto_idx on public.solicitudes_cambio (prospecto_id);

-- Antispam del formulario público: hash HMAC de la IP (nunca la IP en claro).
create table if not exists public.envios (
  id       bigint generated always as identity primary key,
  ip_hash  text not null,
  t        timestamptz not null default now()
);
create index if not exists envios_ip_t_idx on public.envios (ip_hash, t);

-- Usuarios del portal (auth.users) ↔ prospecto. Lo llena el CRM al "Invitar al portal".
create table if not exists public.clientes_portal (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  prospecto_id  text not null references public.prospectos(id) on delete cascade,
  email         text not null check (email = lower(email)),
  creado        timestamptz not null default now()
);
create index if not exists clientes_portal_prospecto_idx on public.clientes_portal (prospecto_id);

-- -----------------------------------------------------------------------------
-- RLS en TODAS las tablas. Sin política = sin acceso (salvo service role).
-- -----------------------------------------------------------------------------
alter table public.admins              enable row level security;
alter table public.prospectos          enable row level security;
alter table public.prospectos_internos enable row level security;
alter table public.sitios              enable row level security;
alter table public.solicitudes_cambio  enable row level security;
alter table public.envios              enable row level security;
alter table public.clientes_portal     enable row level security;

-- Defensa en profundidad: anon no tiene privilegios sobre ninguna tabla.
revoke all on table public.admins, public.prospectos, public.prospectos_internos, public.sitios, public.solicitudes_cambio,
  public.envios, public.clientes_portal from anon;
revoke all on public.prospectos_completo from anon;
-- envios solo lo usa el servidor (service role).
revoke all on table public.envios from authenticated;
-- admins se administra por SQL; los usuarios autenticados solo pueden leer (si son admin).
revoke insert, update, delete on table public.admins from authenticated;

-- -----------------------------------------------------------------------------
-- Funciones auxiliares (security definer: leen tablas protegidas sin abrirlas)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.mi_prospecto_id()
returns text
language sql stable security definer
set search_path = ''
as $$
  select cp.prospecto_id from public.clientes_portal cp where cp.user_id = auth.uid() limit 1;
$$;

-- Público: solo un número (sitios de clientes activos). Nunca filas.
create or replace function public.contar_sitios_activos()
returns int
language sql stable security definer
set search_path = ''
as $$
  select count(*)::int from public.sitios s where s.tipo = 'cliente' and s.activo;
$$;

-- Agregar nota de forma atómica (security invoker: respeta RLS → solo admins).
create or replace function public.agregar_nota(p_id text, p_nota jsonb)
returns void
language sql security invoker
set search_path = ''
as $$
  update public.prospectos_internos set notas = notas || jsonb_build_array(p_nota) where id = p_id;
$$;

revoke execute on function public.is_admin(), public.mi_prospecto_id(), public.agregar_nota(text, jsonb) from public, anon;
grant execute on function public.is_admin(), public.mi_prospecto_id(), public.agregar_nota(text, jsonb) to authenticated;
revoke execute on function public.contar_sitios_activos() from public;
grant execute on function public.contar_sitios_activos() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
create or replace function public.tocar_actualizado()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado := now();
  return new;
end;
$$;
drop trigger if exists prospectos_actualizado on public.prospectos;
create trigger prospectos_actualizado before update on public.prospectos
  for each row execute function public.tocar_actualizado();

-- Un cambio en los datos internos también marca el prospecto como actualizado.
create or replace function public.tocar_prospecto_padre()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.prospectos set actualizado = now() where id = new.id;
  return new;
end;
$$;
revoke execute on function public.tocar_prospecto_padre() from public, anon, authenticated;
drop trigger if exists prospectos_internos_actualizado on public.prospectos_internos;
create trigger prospectos_internos_actualizado after update on public.prospectos_internos
  for each row execute function public.tocar_prospecto_padre();

-- Una solicitud del portal aparece como nota "[Portal] ..." en el prospecto
-- (mismo formato que lib/crm/notas.ts). Security definer: el cliente no puede editar prospectos.
create or replace function public.solicitud_a_nota()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.prospectos_internos
     set notas = notas || jsonb_build_array(jsonb_build_object(
           't', to_char(new.creado at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
           'txt', '[Portal] ' || new.texto || coalesce(' — foto: ' || new.foto, '')))
   where id = new.prospecto_id;
  return new;
end;
$$;
revoke execute on function public.solicitud_a_nota() from public, anon, authenticated;
drop trigger if exists solicitudes_nota on public.solicitudes_cambio;
create trigger solicitudes_nota after insert on public.solicitudes_cambio
  for each row execute function public.solicitud_a_nota();

-- -----------------------------------------------------------------------------
-- Políticas
-- -----------------------------------------------------------------------------
-- admins: un admin puede ver la lista (no hay políticas de escritura).
drop policy if exists "admins: lectura admin" on public.admins;
create policy "admins: lectura admin" on public.admins
  for select to authenticated using ((select public.is_admin()));

-- prospectos
drop policy if exists "prospectos: admin todo" on public.prospectos;
create policy "prospectos: admin todo" on public.prospectos
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- El cliente puede leer SU fila: solo nombre, giro, dirección y datos de su contrato.
drop policy if exists "prospectos: cliente lee el suyo" on public.prospectos;
create policy "prospectos: cliente lee el suyo" on public.prospectos
  for select to authenticated using (id = (select public.mi_prospecto_id()));

-- prospectos_internos: SOLO admins. Sin política para clientes → el portal nunca los ve.
drop policy if exists "prospectos_internos: admin todo" on public.prospectos_internos;
create policy "prospectos_internos: admin todo" on public.prospectos_internos
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- sitios
drop policy if exists "sitios: admin todo" on public.sitios;
create policy "sitios: admin todo" on public.sitios
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "sitios: cliente lee los suyos" on public.sitios;
create policy "sitios: cliente lee los suyos" on public.sitios
  for select to authenticated using (prospecto_id = (select public.mi_prospecto_id()));

-- solicitudes_cambio
drop policy if exists "solicitudes: admin todo" on public.solicitudes_cambio;
create policy "solicitudes: admin todo" on public.solicitudes_cambio
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "solicitudes: cliente crea las suyas" on public.solicitudes_cambio;
create policy "solicitudes: cliente crea las suyas" on public.solicitudes_cambio
  for insert to authenticated with check (prospecto_id = (select public.mi_prospecto_id()));
drop policy if exists "solicitudes: cliente lee las suyas" on public.solicitudes_cambio;
create policy "solicitudes: cliente lee las suyas" on public.solicitudes_cambio
  for select to authenticated using (prospecto_id = (select public.mi_prospecto_id()));

-- clientes_portal
drop policy if exists "clientes_portal: admin todo" on public.clientes_portal;
create policy "clientes_portal: admin todo" on public.clientes_portal
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "clientes_portal: cliente lee el suyo" on public.clientes_portal;
create policy "clientes_portal: cliente lee el suyo" on public.clientes_portal
  for select to authenticated using (user_id = (select auth.uid()));

-- envios: SIN políticas → solo la service role (servidor) puede leer/escribir.

-- -----------------------------------------------------------------------------
-- Storage: bucket privado "cambios" (fotos de solicitudes de cambio, máx 300 KB)
-- Ruta: cambios/<prospecto_id>/<archivo>
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cambios', 'cambios', false, 307200, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cambios: cliente sube a su carpeta" on storage.objects;
create policy "cambios: cliente sube a su carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cambios'
    and (storage.foldername(name))[1] = (select public.mi_prospecto_id())
  );

drop policy if exists "cambios: admin lee" on storage.objects;
create policy "cambios: admin lee" on storage.objects
  for select to authenticated
  using (bucket_id = 'cambios' and (select public.is_admin()));

drop policy if exists "cambios: admin borra" on storage.objects;
create policy "cambios: admin borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cambios' and (select public.is_admin()));
