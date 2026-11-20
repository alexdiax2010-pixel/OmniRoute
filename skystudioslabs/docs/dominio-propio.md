# Conectar el dominio propio de un cliente

Todos los sitios de clientes viven en **el mismo proyecto de Vercel** que skystudioslabs.com. Un
cliente puede usar su propio dominio (ej. `tallerramirez.mx`) sin desplegar nada nuevo: solo se
agrega el dominio al proyecto, se apuntan los DNS y se registra en el sitio.

> Es un **servicio extra con costo** (configuración + renovación anual del dominio si lo
> administramos nosotros). El subdominio `<slug>.skystudioslabs.com` sigue incluido en todos los
> paquetes.

## Requisito previo: el comodín `*.skystudioslabs.com`

Los subdominios de clientes (`taller-ramirez.skystudioslabs.com`) dependen del dominio comodín
`*.skystudioslabs.com` agregado al proyecto de Vercel. **Vercel solo emite el certificado SSL de un
comodín si el dominio usa los nameservers de Vercel** (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).
Por eso `skystudioslabs.com` debe tener sus nameservers apuntando a Vercel. Esto se hace una sola
vez y no afecta a los dominios propios de los clientes, que pueden quedarse con su proveedor de DNS.

## Paso a paso

### 1. Agregar el dominio en Vercel

1. Vercel → proyecto de Sky Studios Labs → **Settings → Domains → Add Domain**.
2. Escribe el dominio del cliente. Recomendado: agregar ambos, `tallerramirez.mx` y
   `www.tallerramirez.mx`, y elegir cuál redirige al otro (normalmente el apex redirige a `www`,
   o al revés; lo importante es que haya uno solo como principal).
3. Vercel mostrará los registros DNS que faltan y marcará el dominio como "Invalid Configuration"
   hasta que existan.

### 2. Crear los registros DNS (en el proveedor del cliente)

En el panel donde está el dominio (GoDaddy, Namecheap, Cloudflare, Akky, etc.):

| Tipo  | Nombre / Host | Valor                  | Para                  |
| ----- | ------------- | ---------------------- | --------------------- |
| A     | `@`           | `76.76.21.21`          | dominio raíz (apex)   |
| CNAME | `www`         | `cname.vercel-dns.com` | subdominio `www`      |

> **Confirma los valores en la pantalla de Vercel.** Los de arriba son los valores generales que
> Vercel ha publicado por años, pero Vercel puede mostrar valores específicos para el proyecto
> (por ejemplo, un CNAME del tipo `xxxx.vercel-dns-0xx.com` o una IP distinta). Si la pantalla
> de Domains dice otra cosa, usa lo que diga Vercel.

Notas:

- Borra cualquier otro registro `A`/`AAAA` del apex y cualquier `CNAME` previo de `www`, o habrá
  conflictos.
- Si el DNS está en **Cloudflare**, deja los registros en modo "DNS only" (nube gris) para que
  Vercel pueda emitir el certificado.
- La propagación suele tardar minutos, pero puede llegar a 24–48 h.
- Alternativa: cambiar los nameservers del dominio del cliente a los de Vercel. Funciona, pero
  entonces todo su DNS (correo incluido: registros MX) se administra en Vercel. Solo hazlo si
  sabes migrar esos registros.

### 3. Registrar el dominio en el sitio

El proxy necesita saber qué sitio corresponde a ese dominio. Se guarda en el campo
`dominio_propio` del registro del sitio, **sin `https://` ni `/` y en minúsculas**, exactamente
como llega en la cabecera `Host` (si agregaste `www` y apex, registra el que quedó como
principal; el otro solo redirige en Vercel).

- Al crear el sitio:

  ```bash
  npm run sitio:nuevo -- taller-ramirez ./bocetos/taller-ramirez --dominio www.tallerramirez.mx
  ```

- Para un sitio existente: edítalo desde el CRM (campo de dominio propio del sitio), o vuelve a
  correr `sitio:nuevo` con `--forzar` y `--dominio`.

### 4. Verificar

1. En Vercel → Domains, el dominio debe aparecer como **Valid Configuration** con el candado de
   SSL emitido (es automático, Let's Encrypt; no hay que comprar certificado).
2. Abre `https://www.tallerramirez.mx/`: debe verse el sitio con el pie "Hecho por Sky Studios
   Labs".
3. La etiqueta `<link rel="canonical">` de la página apunta al dominio propio en cuanto
   `dominio_propio` está registrado, así que Google tomará ese dominio como el principal (el
   subdominio y el respaldo `/c/<slug>` siguen funcionando).

## Cómo lo resuelve el proxy

1. `proxy.ts` lee el host de la petición y llama a `resolverHost()` (`lib/hosts.ts`).
2. Cualquier host que no sea `skystudioslabs.com`, uno de sus subdominios ni un despliegue
   `*.vercel.app` se considera **dominio propio** y se reescribe internamente a
   `/sitios/_d/<host>/<ruta>`.
3. La ruta `app/sitios/[slug]/[[...path]]/route.ts` busca el sitio con
   `obtenerSitioPorDominio(host)` y sirve los archivos de `clientes/<carpeta>/`.
4. Si el dominio no está registrado en ningún sitio, responde una página 404 neutral. Si el sitio
   está inactivo, responde "Sitio en mantenimiento" (no se borra nada).

## Precio y cobro

- Conexión de dominio propio: cargo único por configuración (consulta la tabla de precios vigente).
- Si nosotros compramos y renovamos el dominio, la renovación anual se cobra aparte.
- Si el cliente ya tiene su dominio, solo necesita darnos acceso a su DNS o crear los registros
  siguiendo esta guía.
