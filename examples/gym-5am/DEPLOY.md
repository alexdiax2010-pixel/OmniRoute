# Publicar Wellness Fitness 5AM con dominio propio

Al terminar tendrás, por ejemplo:

- `https://entrada.tugimnasio.com` → pantalla de entrada (para la tableta de recepción)
- `https://entrada.tugimnasio.com/admin` → panel del dueño

Hay dos caminos. **Recomendado: Fly.io** (opción A), porque no hay que mantener un servidor. La
opción B es para quien ya tiene o prefiere un servidor propio (VPS).

> El sistema guarda todo en una base de datos SQLite dentro de un **disco persistente**. Por eso
> funciona con **una sola máquina** encendida todo el tiempo. Los servicios gratuitos que apagan la
> app o borran el disco en cada despliegue no sirven.

## 1. Compra el dominio

Cómpralo en cualquier registrador (Cloudflare, Namecheap, GoDaddy; para `.mx`, Akky u otro
registrador autorizado). Te recomiendo usar un **subdominio** para el sistema, por ejemplo
`entrada.tugimnasio.com`, y dejar `tugimnasio.com` libre para una futura página web.

Solo necesitarás entrar al panel de **DNS** del registrador para añadir uno o dos registros.

## 2A. Publicar en Fly.io (recomendado)

Necesitas una cuenta en <https://fly.io> con un método de pago registrado. El costo depende del
tamaño de la máquina y del disco; con la configuración incluida (la máquina más pequeña y 1 GB de
disco) suele ser de pocos dólares al mes. Consulta el precio actual en su página de precios.

1. **Instala la herramienta de Fly** en tu computadora: <https://fly.io/docs/flyctl/install/> y
   ejecuta `fly auth login`.

2. **Entra en la carpeta del sistema:**

   ```bash
   cd examples/gym-5am
   ```

3. **Elige el nombre de la app.** Abre `fly.toml` y cambia `app = "wellness-fitness-5am"` por un
   nombre libre (si está ocupado, Fly te avisará en el paso siguiente).

4. **Crea la app sin desplegarla todavía:**

   ```bash
   fly launch --no-deploy --copy-config
   ```

   La región configurada es `qro` (Querétaro, México). Si Fly dice que no está disponible, consulta
   las regiones con `fly platform regions` y cambia `primary_region` en `fly.toml` (por ejemplo,
   `dfw`, Dallas).

5. **Crea el disco persistente** para la base de datos (en la misma región):

   ```bash
   fly volumes create gym_data --region qro --size 1
   ```

6. **Define el acceso del dueño**: un código especial de 4 a 8 dígitos (el que escribirá en el
   teclado de la entrada) y una contraseña de al menos 6 caracteres. No uses los de la demo:

   ```bash
   fly secrets set ADMIN_CODE=xxxxxx ADMIN_PASSWORD='tu-contraseña'
   ```

7. **Despliega:**

   ```bash
   fly deploy
   ```

   Al terminar, el sistema ya funciona en `https://<nombre-de-la-app>.fly.dev`.

8. **Conecta tu dominio:**

   ```bash
   fly certs add entrada.tugimnasio.com
   ```

   Fly te mostrará los registros DNS que debes crear en tu registrador (normalmente un `CNAME` que
   apunta a `<nombre-de-la-app>.fly.dev` para un subdominio). Créalos, espera unos minutos y
   comprueba con `fly certs show entrada.tugimnasio.com`. El certificado HTTPS se emite y renueva
   solo.

**Actualizar a una versión nueva:** `fly deploy` desde la misma carpeta. Los datos se conservan.

**Descargar una copia de seguridad:** el sistema guarda una copia diaria en `/data/backups`.

```bash
fly ssh sftp get /data/backups/gym-AAAA-MM-DD.db
```

## 2B. Publicar en un servidor propio (VPS)

Sirve cualquier VPS con Ubuntu o Debian (DigitalOcean, Hetzner, Vultr, Linode…), con al menos
512 MB de RAM.

1. **Apunta el dominio al servidor:** en el DNS de tu registrador crea un registro `A` para
   `entrada.tugimnasio.com` con la IP pública del VPS.

2. **Instala Docker** en el servidor: <https://docs.docker.com/engine/install/>.

3. **Copia el sistema al servidor** (clonando el repositorio o subiendo la carpeta
   `examples/gym-5am`) y entra en `deploy/`:

   ```bash
   cd examples/gym-5am/deploy
   cp .env.example .env
   nano .env        # escribe tu DOMINIO, tu ADMIN_CODE y tu ADMIN_PASSWORD
   ```

4. **Arranca:**

   ```bash
   docker compose up -d --build
   ```

   Caddy obtiene el certificado HTTPS automáticamente. Los puertos 80 y 443 del servidor deben estar
   abiertos.

**Actualizar:** sube la versión nueva y repite `docker compose up -d --build`.

**Copias de seguridad:** están dentro del volumen `gym_data`, en `/data/backups`:

```bash
docker compose cp app:/data/backups ./backups
```

## 3. Después de publicar

1. Escribe tu código especial en el teclado de la pantalla de entrada, pon tu contraseña y revisa
   **Ajustes**: nombre del gimnasio, plan Mensual de $549,
   código de país `52` y texto del recordatorio.
2. Da de alta a los socios (o pásame el archivo con nombres, códigos y fechas para importarlo).
3. En la tableta de recepción abre la dirección del sistema y ponla en pantalla completa (modo
   quiosco del navegador).
4. Guarda periódicamente una copia de seguridad fuera del servidor.

## Qué incluye la configuración

| Archivo                     | Para qué sirve                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `Dockerfile`                | Imagen de producción: Node 22, usuario sin privilegios, hora de México, HTTPS        |
| `fly.toml`                  | Fly.io: una máquina siempre encendida, disco en `/data`, HTTPS forzado, chequeo      |
| `deploy/docker-compose.yml` | VPS: la app más Caddy con certificado HTTPS automático                               |
| `deploy/Caddyfile`          | Proxy HTTPS hacia la app                                                             |
| `deploy/.env.example`       | Plantilla con `DOMINIO`, `ADMIN_CODE` y `ADMIN_PASSWORD` (el `.env` real no se sube) |

La imagen expone `/api/health` para los chequeos del hosting y cierra la base de datos de forma
ordenada al reiniciarse o desplegar una versión nueva.
