-- Funciones de "Cartera" en el CRM: historial de actividades, tareas, plantillas de mensajes y ajustes.
-- Todo es SOLO para administradores (RLS con public.is_admin()); el portal de clientes no lo ve.
-- Idempotente: se puede aplicar más de una vez.

create table if not exists public.actividades (
  id            uuid primary key default gen_random_uuid(),
  prospecto_id  text not null references public.prospectos(id) on delete cascade,
  tipo          text not null check (tipo in ('whatsapp','llamada','email','instagram','visita','reunion','nota')),
  texto         text not null check (char_length(texto) between 1 and 4000),
  fecha         timestamptz not null default now(),
  creado        timestamptz not null default now()
);
create index if not exists actividades_prospecto_idx on public.actividades (prospecto_id, fecha desc);
create index if not exists actividades_fecha_idx on public.actividades (fecha desc);

create table if not exists public.tareas (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null check (char_length(titulo) between 1 and 300),
  vence         date,
  prioridad     text not null default 'media' check (prioridad in ('alta','media','baja')),
  prospecto_id  text references public.prospectos(id) on delete cascade,
  hecha         boolean not null default false,
  hecha_en      timestamptz,
  creado        timestamptz not null default now()
);
create index if not exists tareas_pendientes_idx on public.tareas (hecha, vence);

create table if not exists public.plantillas (
  id      uuid primary key default gen_random_uuid(),
  titulo  text not null check (char_length(titulo) between 1 and 120),
  canal   text not null default 'whatsapp' check (canal in ('whatsapp','email','instagram')),
  cuerpo  text not null check (char_length(cuerpo) between 1 and 4000),
  creado  timestamptz not null default now()
);

create table if not exists public.ajustes_crm (
  clave  text primary key check (char_length(clave) between 1 and 60),
  valor  text not null default ''
);

alter table public.actividades enable row level security;
alter table public.tareas      enable row level security;
alter table public.plantillas  enable row level security;
alter table public.ajustes_crm enable row level security;
revoke all on table public.actividades, public.tareas, public.plantillas, public.ajustes_crm from anon;

drop policy if exists "actividades: admin todo" on public.actividades;
create policy "actividades: admin todo" on public.actividades
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "tareas: admin todo" on public.tareas;
create policy "tareas: admin todo" on public.tareas
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "plantillas: admin todo" on public.plantillas;
create policy "plantillas: admin todo" on public.plantillas
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "ajustes_crm: admin todo" on public.ajustes_crm;
create policy "ajustes_crm: admin todo" on public.ajustes_crm
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Plantillas iniciales (adaptadas de Cartera al español de México). Ids fijos para no duplicar.
insert into public.plantillas (id, titulo, canal, cuerpo) values
  ('00000000-0000-4000-8000-000000000001', 'Primer contacto', 'whatsapp',
   E'Hola, buen día. Soy {mi_nombre}. Encontré {negocio} en Google y vi que todavía no tienen página web propia.\n\nHoy la mayoría de la gente busca en el celular antes de elegir a dónde ir. Te puedo preparar un boceto gratis de cómo se vería tu página, con botón de WhatsApp, ubicación y horarios, sin compromiso.\n\n¿Te lo envío?'),
  ('00000000-0000-4000-8000-000000000002', 'Seguimiento', 'whatsapp',
   E'Hola, te escribo de nuevo sobre la página para {negocio}. ¿Pudiste pensarlo?\n\nSi quieres te enseño en 10 minutos cómo quedaría. Saludos, {mi_nombre}'),
  ('00000000-0000-4000-8000-000000000003', 'Envío de boceto', 'whatsapp',
   E'Hola, como te comenté, ya está listo el boceto de la página para {negocio}: {boceto}\n\nRevísalo con calma y dime qué te parece. Es gratis y sin compromiso. Saludos, {mi_nombre}')
on conflict (id) do nothing;
