-- Suscripciones a notificaciones push del CRM (teléfonos/navegadores del dueño).
-- Solo el servidor (service role) las lee y escribe: RLS activo y sin políticas.
create table if not exists public.push_suscripciones (
  endpoint  text primary key,
  p256dh    text not null,
  auth      text not null,
  etiqueta  text not null default '',
  creado    timestamptz not null default now()
);
alter table public.push_suscripciones enable row level security;
revoke all on table public.push_suscripciones from anon, authenticated;
