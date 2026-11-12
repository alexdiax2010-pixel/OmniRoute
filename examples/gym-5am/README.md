# Wellness Fitness 5AM — entrada con código, cobros y vencimientos

Sistema para la recepción del gimnasio:

- **Pantalla de entrada** (`/`): el socio escribe su código y ve al instante si puede pasar,
  cuántos días le quedan y cuándo vence su mensualidad. Cada intento queda registrado.
- **Administración** (`/admin`, protegida con PIN): alta de socios con código de acceso,
  registro de cobros que renuevan la mensualidad automáticamente, avisos de vencimiento por
  WhatsApp, historial de entradas, ingresos del mes y exportación a CSV.

No tiene dependencias: solo necesita **Node.js 22.5 o superior** (usa el SQLite integrado de Node).

> **¿Quieres publicarlo en internet con tu propio dominio?** Sigue la guía [`DEPLOY.md`](DEPLOY.md)
> (Fly.io o servidor propio con HTTPS automático).

## Puesta en marcha

```bash
cd examples/gym-5am
ADMIN_PIN=123456 npm start        # elige tu propio PIN
```

- Pantalla de entrada: `http://localhost:5050`
- Administración: `http://localhost:5050/admin`

Si no defines `ADMIN_PIN` la primera vez, el servidor genera un PIN aleatorio y lo muestra en la
consola. Puedes cambiarlo después en **Administración → Ajustes**.

### En el gimnasio

1. Ejecuta el servidor en el ordenador de recepción.
2. En la tableta de entrada, abre `http://<IP-del-ordenador>:5050` en pantalla completa
   (modo quiosco del navegador). Funciona con el teclado táctil, un teclado físico o un lector
   que escriba el código y pulse Enter.
3. Desde ese ordenador (u otro de la misma red) entra en `/admin` para gestionar socios y cobros.

## Cómo funciona

| Acción                 | Resultado                                                                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nuevo socio**        | Se genera un código único de 4 dígitos (o uno elegido de 4 a 8 dígitos). Puedes enviárselo por WhatsApp desde el mismo panel.                                                                                                                               |
| **Cobrar**             | Registra el monto, el método y el plan. La mensualidad vence el mismo día del mes siguiente (pago el 11 nov → vence el 11 dic). Si se renueva antes de vencer, el nuevo periodo parte del vencimiento actual y conserva ese día; si ya venció, empieza hoy. |
| **Entrada con código** | _Activo_: pasa. _Por vencer_ (5 días o menos, configurable): pasa y se le avisa. _Vencido_ o _sin pago_: acceso denegado.                                                                                                                                   |
| **Avisos**             | Lista de quienes vencen pronto o vencieron hace menos de 30 días, con el mensaje listo para WhatsApp. Al enviarlo queda marcado como avisado.                                                                                                               |
| **Dar de baja**        | El código deja de funcionar y el historial de cobros se conserva.                                                                                                                                                                                           |

El sistema arranca con un plan **Mensual de $549 MXN** y el código de país de México (`52`) para
WhatsApp. En **Ajustes** puedes cambiar el nombre del gimnasio, la moneda, el código de país para WhatsApp
(por ejemplo `52` para México), los días de antelación del aviso, el texto del recordatorio y los
planes con sus precios.

## Tienda, recibos y gráficas

- **Tienda**: da de alta productos (agua, suplementos, ropa…) con precio y existencias. Cada venta
  descuenta existencias, nunca permite vender más de lo que hay y suma a los ingresos del mes.
- **Recibo**: al registrar un cobro aparece el recibo con el periodo pagado y un botón para
  enviarlo por WhatsApp con la nueva fecha de vencimiento.
- **Resumen**: ingresos de los últimos 6 meses (membresías y tienda) y entradas del día por hora.
- **Pantalla de entrada**: muestra en grande los días restantes y emite un sonido distinto para
  acceso permitido, aviso y acceso denegado.

## Datos y copias de seguridad

Todo se guarda en `data/gym.db` (o en la carpeta que indiques con `DATA_DIR`). El servidor crea una
**copia de seguridad automática cada día** en `data/backups/gym-AAAA-MM-DD.db` y conserva las 14 más
recientes. Para restaurar una, detén el servidor y copia ese archivo sobre `data/gym.db`. Conviene
guardar además una copia fuera del ordenador de recepción (USB o nube).

## Variables de entorno

| Variable         | Por defecto | Uso                                                                 |
| ---------------- | ----------- | ------------------------------------------------------------------- |
| `PORT`           | `5050`      | Puerto del servidor                                                 |
| `HOST`           | `0.0.0.0`   | Interfaz de red                                                     |
| `DATA_DIR`       | `./data`    | Carpeta de la base de datos                                         |
| `ADMIN_PIN`      | aleatorio   | PIN inicial (solo se usa si todavía no hay PIN)                     |
| `TZ`             | del sistema | Zona horaria para calcular vencimientos (ej. `America/Mexico_City`) |
| `SECURE_COOKIES` | `0`         | Pon `1` si el sistema se sirve por HTTPS                            |
| `TRUST_PROXY`    | `0`         | Pon `1` detrás de un proxy inverso (Nginx, Caddy…)                  |

## Seguridad

- El PIN se guarda con hash (scrypt), y la sesión usa una cookie `HttpOnly` y `SameSite=Strict` que dura 12 horas.
- Límite de intentos: 20 códigos por minuto y 5 intentos de PIN cada 5 minutos por IP.
- La pantalla de entrada solo muestra el nombre de pila y la fecha de vencimiento: nunca el teléfono ni el email.
- Todas las consultas a SQLite son sentencias preparadas, y el CSV neutraliza las fórmulas.
- Lleva cabeceras CSP, `X-Frame-Options` y `nosniff`, y los errores no exponen detalles internos.

Para usarlo fuera de la red local, publícalo detrás de HTTPS (por ejemplo, con Caddy) con
`SECURE_COOKIES=1 TRUST_PROXY=1`.

## Pruebas

```bash
npm test
```

## Personalización

- **Foto de fondo**: coloca una imagen en `public/img/kiosk.jpg` y la pantalla de entrada la usará
  en lugar de la composición gráfica.
- **Tipografías**: Anton (Google Fonts, OFL) para titulares y Switzer (Fontshare FFL,
  `public/fonts/FFL.txt`), la misma fuente autoalojada del UI kit de OmniRoute.

## Limitaciones actuales

- Los cobros se **registran** (efectivo, tarjeta, transferencia), pero no se cobra con tarjeta en
  línea. Para cobrar en línea se puede integrar una pasarela como Stripe o Mercado Pago.
- Los avisos se envían abriendo WhatsApp con el mensaje listo, uno por uno. Para envíos
  automáticos hace falta un proveedor de mensajería (WhatsApp Business API, SMS o email).
