-- Prueba de RLS: un cliente del portal no puede ver ni escribir prospectos_internos.
-- Uso (PostgreSQL local vacío): psql -f 00_stubs_supabase.sql; psql -f ../migrations/0001_inicial.sql;
--   psql -f ../migrations/0003_seguridad.sql; psql -f rls.sql
\set ON_ERROR_STOP 0
insert into public.admins values ('admin@sky.test');
insert into auth.users values ('11111111-1111-1111-1111-111111111111','cliente@sky.test');
insert into public.prospectos(id,nombre,paquete,mensualidad,servicios,email) values ('1','Cliente Uno','estandar',500,'{web,maps}','cliente@sky.test'),('2','Otro Negocio',null,null,'{}',null);
insert into public.prospectos_internos(id,telefono,whatsapp,razon,guion,notas,etapa) values ('1','3300000001','3300000001','razón secreta','guion secreto','[{"t":"x","txt":"nota secreta"}]','Ganado'),('2','3300000002','3300000002','otra','g','[]','Nuevo');
insert into public.clientes_portal values ('11111111-1111-1111-1111-111111111111','1','cliente@sky.test');
insert into public.solicitudes_cambio(prospecto_id,texto) values ('1','cambia el logo');
\echo '--- trigger: nota [Portal] en internos'
select notas from public.prospectos_internos where id='1';

\echo '=== CLIENTE (portal) ==='
set role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","email":"cliente@sky.test"}',false);
\echo '--- prospectos (debe ver solo su fila)'
select id,nombre,paquete,servicios from public.prospectos;
\echo '--- prospectos_internos (debe ser 0 filas)'
select count(*) as internos_visibles from public.prospectos_internos;
\echo '--- vista (su fila con internos en NULL)'
select id,nombre,telefono,razon,guion,notas,etapa from public.prospectos_completo;
\echo '--- intento de escribir internos (debe fallar / 0 filas)'
update public.prospectos_internos set razon='hack' where id='1';
insert into public.prospectos_internos(id) values ('1');
\echo '--- solicitud con foto de OTRO cliente (debe fallar: solicitudes_foto_propia)'
insert into public.solicitudes_cambio(prospecto_id,texto,foto) values ('1','foto ajena','2/00000000-0000-0000-0000-000000000000.png');
\echo '--- solicitud para OTRO prospecto (debe fallar por RLS)'
insert into public.solicitudes_cambio(prospecto_id,texto) values ('2','no es mío');
\echo '--- solicitud propia con foto propia (debe funcionar)'
insert into public.solicitudes_cambio(prospecto_id,texto,foto) values ('1','foto propia','1/00000000-0000-0000-0000-000000000000.png');
\echo '--- agregar_nota como cliente (no debe cambiar nada)'
select public.agregar_nota('1','{"t":"y","txt":"inyectada"}');
reset role;
select count(*) as notas_inyectadas from public.prospectos_internos where notas::text like '%inyectada%';

\echo '=== ADMIN ==='
set role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","email":"admin@sky.test"}',false);
select id,nombre,telefono,razon,etapa from public.prospectos_completo order by id;
update public.prospectos_internos set etapa='Contactado' where id='2';
select public.agregar_nota('2','{"t":"z","txt":"nota admin"}');
select id,etapa,notas from public.prospectos_internos where id='2';
reset role;

\echo '=== ANON ==='
set role anon;
select set_config('request.jwt.claims','',false);
select * from public.prospectos;
select * from public.prospectos_internos;
select * from public.prospectos_completo;
select public.contar_sitios_activos() as conteo_publico;
reset role;
