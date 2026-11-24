# Sky Studios Labs

Sitio de la agencia + hosting de páginas de clientes + CRM privado + portal de clientes, en **un solo
proyecto Next.js** y **un solo dominio** (`skystudioslabs.com`).

| Dirección | Qué es |
| --- | --- |
| `skystudioslabs.com` | Sitio público (experiencia cinematográfica + páginas SEO) |
| `<cliente>.skystudioslabs.com` | Página de un cliente (HTML estático en `clientes/<carpeta>/`) |
| `skystudioslabs.com/c/<cliente>` | Respaldo de la misma página (con `noindex`; la canónica es el subdominio) |
| `propuesta.skystudioslabs.com/<negocio>` | Boceto para un prospecto (`noindex`, franja "boceto no oficial", expira) |
| `admin.skystudioslabs.com` o `/admin` | CRM (solo correos permitidos) |
| `portal.skystudioslabs.com` o `/portal` | Portal de clientes (cada cliente ve solo lo suyo) |
| Dominio propio del cliente | Ver [`docs/dominio-propio.md`](docs/dominio-propio.md) |

Subdominios reservados que nunca son clientes: `www`, `admin`, `app`, `api`, `propuesta`, `portal`.

---

## 1. Correrlo en tu computadora

Requisitos: Node.js 22 o superior.

```bash
npm install
cp .env.example .env.local     # y edita los valores
npm run sembrar:demo            # crea 3 sitios de ejemplo (taller-demo, propuesta-demo, inactivo-demo)
npm run crm:importar -- data/crm-prospectos.ejemplo.json   # 3 prospectos FICTICIOS de prueba
npm run dev
```

- Sitio: <http://localhost:3000>
- Cliente de ejemplo: <http://taller-demo.localhost:3000> (Chrome y Firefox resuelven `*.localhost` solos)
- Propuesta de ejemplo: <http://propuesta.localhost:3000/propuesta-demo>
- CRM: <http://localhost:3000/admin> → entra con un correo de `ADMIN_EMAILS`.

**Modo local:** si no hay claves de Supabase, la app guarda todo en `.data/db.json` y el "enlace mágico"
aparece en pantalla (recuadro "Modo local: enlace de prueba") y en la consola. Ese modo **se niega a
arrancar en producción** a menos que pongas `SKY_ALLOW_LOCAL_STORE=1` (solo para pruebas).

### Comandos

| Comando | Para qué |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run test:e2e` | Pruebas de punta a punta (Playwright, 1440px, 375px y reduced-motion) |
| `npm run typecheck` | Revisión de TypeScript |
| `npm run check:images` | Falla si alguna imagen de `public/` o `clientes/` pesa más de 300 KB |
| `npm run crm:importar [-- archivo.json]` | Importa prospectos (por defecto `data/crm-prospectos.json`). Se puede correr varias veces sin duplicar |
| `npm run crm:desde-rama` | Arma `data/crm-prospectos.json` (171 prospectos reales) desde la rama de prospección, sin cambiar de rama. El archivo está en `.gitignore` |
| `npm run crm:importar -- --local` / `--solo-nuevos` | `--local` importa al almacén local (pruebas); `--solo-nuevos` agrega solo los que no existen. Sin `--local` escribe en el Supabase de `.env.local` y avisa el destino antes |
| `npm run crm:respaldo` | Exporta todas las tablas a `respaldos/<fecha>/*.json` |
| `npm run sitio:nuevo -- <slug> <carpeta> [opciones]` | Copia un boceto a `clientes/<slug>/`, valida imágenes y registra el sitio |
| `npm run sembrar:demo` | Registra los sitios de ejemplo |

---

## 2. Configurar Supabase

1. Crea un proyecto en <https://supabase.com> (región cercana, por ejemplo `us-east`/`us-west`).
2. En **SQL Editor** pega y ejecuta [`supabase/migrations/0001_inicial.sql`](supabase/migrations/0001_inicial.sql)
   (crea tablas, RLS en todas, funciones y el bucket privado `cambios`).
3. Edita [`supabase/seed.sql`](supabase/seed.sql) con **tu correo** y ejecútalo (te da acceso al CRM).
4. En **Project Settings → API** copia a `.env.local` (y luego a Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**secreta**: solo servidor, nunca con prefijo `NEXT_PUBLIC_`)
5. En **Authentication → URL Configuration**:
   - Site URL: `https://skystudioslabs.com`
   - Redirect URLs: `https://skystudioslabs.com/auth/callback`, `https://admin.skystudioslabs.com/auth/callback`,
     `https://portal.skystudioslabs.com/auth/callback` (y `http://localhost:3000/auth/callback` para desarrollo).
6. En **Authentication → Providers → Email** deja activado "Email" (enlace mágico). Para producción
   configura un SMTP propio (Supabase limita los correos del SMTP de prueba).
7. Pon tu correo también en `ADMIN_EMAILS` (el CRM exige estar en ambas listas).
8. Importa tus prospectos: copia tu archivo a `data/crm-prospectos.json` y corre `npm run crm:importar`.

> Datos internos: teléfono, WhatsApp, puntaje, razón, alertas, etapa, seguimiento, mensaje,
> guion, notas, boceto, fuente y sesión viven en `prospectos_internos`, que **solo los admins**
> pueden leer. El cliente del portal solo ve nombre, giro, dirección y su contrato. La prueba
> `supabase/pruebas/rls.sql` lo verifica en un PostgreSQL local.
>
> Seguridad: el sitio público nunca lee filas de prospectos. Solo llama a la función
> `contar_sitios_activos()` (un número). Los formularios públicos se guardan desde el servidor
> tras validar con Zod, campo trampa y límite de 5 envíos por IP por hora.

---

## 3. Publicar en Vercel (con dominio wildcard)

1. Sube este proyecto a su propio repositorio de GitHub e impórtalo en <https://vercel.com/new>.
   Si sigue dentro de otro repo, en **Root Directory** elige `skystudioslabs`.
2. **Settings → Environment Variables**: copia las de `.env.example` con valores reales y además
   `NEXT_PUBLIC_ROOT_DOMAIN=skystudioslabs.com` y `NEXT_PUBLIC_SITE_URL=https://skystudioslabs.com`.
3. **Settings → Domains**: agrega `skystudioslabs.com`, `www.skystudioslabs.com` y **`*.skystudioslabs.com`**.
4. El wildcard **exige que el dominio use los nameservers de Vercel** (`ns1.vercel-dns.com`,
   `ns2.vercel-dns.com`). Cámbialos en tu registrador (donde compraste el dominio). Vercel emite
   los certificados SSL automáticamente, incluido el wildcard.
5. Haz un nuevo deploy. Prueba `https://taller-demo.skystudioslabs.com` (si sembraste el demo en
   Supabase) y `https://admin.skystudioslabs.com`.

### ¿Aún no compras el dominio?

1. Cómpralo en cualquier registrador (por ejemplo directamente en Vercel → Domains → Buy, o
   Namecheap / Cloudflare / GoDaddy).
2. Si lo compras en Vercel, los nameservers ya quedan listos. Si no, cambia los nameservers en el
   registrador a los de Vercel (paso 4) y espera la propagación (minutos a 48 h).

---

## 4. Agregar un cliente

```bash
# 1. Copia el boceto (debe tener index.html y rutas relativas) y regístralo
npm run sitio:nuevo -- taller-ramirez bocetos-zapopan/taller-ramirez --tipo cliente --prospecto <id-del-crm>

# 2. Sube los archivos (las páginas viven en el repositorio)
git add clientes/taller-ramirez && git commit -m "Cliente: taller-ramirez" && git push
```

Vercel vuelve a publicar y la página queda en `https://taller-ramirez.skystudioslabs.com`.
También puedes hacerlo desde el CRM: en la ficha de un prospecto **Ganado**, botón **Publicar sitio**
(registra el sitio e invita al cliente al portal). Si la carpeta aún no existe, el CRM te muestra el
comando exacto.

- **Cliente que dejó de pagar:** desactívalo (campo `activo` en la tabla `sitios`). Verá "Sitio en
  mantenimiento"; no se borra nada.
- Cada página lleva automáticamente un pie discreto "Hecho por Sky Studios Labs".

## 5. Crear una propuesta para un prospecto

- **Desde el CRM:** ficha del prospecto → **Crear propuesta**. Registra
  `https://propuesta.skystudioslabs.com/<slug>` y lo agrega al mensaje de WhatsApp.
- **Desde la terminal:**

```bash
npm run sitio:nuevo -- barberia-luna bocetos-zapopan/barberia-luna --tipo propuesta --expira 2026-12-31
```

Las propuestas llevan `noindex`, la franja "Propuesta de diseño — boceto no oficial" y caducan en la
fecha indicada (30 días por defecto).

---

## 6. Dar de alta el sitio en Google Search Console

1. Entra a <https://search.google.com/search-console> → **Agregar propiedad** → tipo **Dominio** →
   `skystudioslabs.com` (cubre todos los subdominios de clientes).
2. Copia el registro **TXT** que te da Google y agrégalo en **Vercel → Domains → skystudioslabs.com →
   DNS Records** (tipo TXT, nombre `@`).
3. Pulsa **Verificar** (puede tardar unos minutos).
4. En **Sitemaps** envía `https://skystudioslabs.com/sitemap.xml`. Incluye la portada, las 8 páginas
   SEO y los sitios de clientes activos; excluye propuestas, CRM y portal.
5. Recomendado: crea tu **Perfil de Negocio de Google** (Google Maps) para Sky Studios Labs con
   área de servicio en todo México.

---

## Entrar al CRM con código especial

En `/admin` (o `admin.skystudioslabs.com`) escribe el código guardado en la variable `ADMIN_CODIGO`
de Vercel. Son 5 intentos por hora por conexión y la sesión dura 12 horas. Para cambiar el código,
edita `ADMIN_CODIGO` en Vercel → Settings → Environment Variables y vuelve a publicar.

## Notificación en tu teléfono cuando llega un cliente

1. Abre el CRM en tu teléfono (`skystudioslabs.com/admin`) y entra.
   - **iPhone**: primero toca Compartir → **Agregar a pantalla de inicio** y abre "CRM Sky" desde ese ícono
     (Apple solo permite avisos en apps instaladas).
2. Toca **Activar avisos en este teléfono** y acepta el permiso. Pulsa **Enviar prueba** para comprobarlo.
3. Cada formulario nuevo del sitio te llega como notificación: "Nuevo cliente: [negocio]". Al tocarla abre el CRM.

Usa Web Push estándar (llaves `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` en Vercel). Puedes activarlo
en varios teléfonos o computadoras.

## Estructura

```
app/(sitio)/          sitio público: portada cinematográfica + 8 páginas SEO
app/sitios/           sirve páginas de clientes (subdominio, /c/ y dominio propio)
app/propuestas/       sirve propuestas (noindex + franja + expiración)
app/admin/            CRM          app/portal/   portal de clientes
app/api/prospectos/   formulario público → prospecto nuevo (fuente "web")
components/scenes/    escenas GSAP (ScrollTrigger + SplitText) + Lenis
config/precios.ts     ← EDITA tus precios       config/sitio.ts  ← EDITA WhatsApp, correo, redes
lib/hosts.ts + proxy.ts  enrutado por subdominio
lib/data/             capa de datos (Supabase o local)
supabase/             esquema SQL con RLS
clientes/             páginas HTML de clientes y propuestas
```

Tipografía: **Anton** (display, condensada y muy gruesa, ideal para títulos enormes) + **Inter**
(texto, muy legible a 18px y con buen soporte de acentos). Solo 3 tamaños: display
`clamp(64px, 12vw, 168px)`, título 44px (32px en celular) y texto 18px; una prueba lo vigila.

Créditos de recursos: [`CREDITOS.md`](CREDITOS.md).
