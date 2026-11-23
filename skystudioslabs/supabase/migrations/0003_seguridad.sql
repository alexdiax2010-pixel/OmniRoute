-- Endurecimiento de RLS / datos (idempotente).
--
-- 1) solicitudes_cambio.foto: un cliente puede insertar solicitudes directo por la API de Supabase
--    (con su sesión y la anon key), saltándose la validación de la app. Sin esta restricción podría
--    apuntar "foto" a la carpeta de OTRO cliente y el CRM mostraría esa foto en su ficha.
--    Ahora la ruta debe ser <su prospecto_id>/<uuid>.<webp|jpg|png> (el mismo formato que
--    lib/portal/fotos.ts).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'solicitudes_foto_propia' and conrelid = 'public.solicitudes_cambio'::regclass
  ) then
    alter table public.solicitudes_cambio
      add constraint solicitudes_foto_propia check (
        foto is null
        or (
          foto ~ '^[A-Za-z0-9_.-]{1,120}/[0-9a-f-]{36}\.(webp|jpg|png)$'
          and split_part(foto, '/', 1) = prospecto_id
        )
      ) not valid;
  end if;
end
$$;
