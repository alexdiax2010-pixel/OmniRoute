# Brief: entrada cinematográfica (una página por agente)

Raíz: /home/user/OmniRoute/bocetos-zapopan/
El núcleo YA EXISTE y está probado: `shared/cinema.css` + `shared/cinema.js`. Lee los dos completos (los comentarios de cabecera explican la API). Tu trabajo es integrarlo en TU página y afinarlo para que se vea espectacular y propio de ese negocio.

## Integración (en tu index.html, sin tocar el contenido ni los textos)
1. `<html lang="es-MX" data-cine="ESTILO" data-cine-nombre="NOMBRE" data-cine-lema="LEMA">`
   - ESTILO por giro: dentistas `luminoso`, talleres `potente`, barberías `vintage`.
   - NOMBRE: el nombre del negocio tal cual (puedes usar la forma corta si el nombre es muy largo, p. ej. "Industrial Macías").
   - LEMA (opcional, pequeño debajo del nombre): solo datos veraces, p. ej. "Zapopan · Jalisco", el giro ("Taller diésel · Zapopan") o la colonia. Nada de promesas ni datos inventados.
2. En `<head>`, justo DESPUÉS del link a `../../shared/base.css` y ANTES del `<style>` de la página:
   `<link rel="stylesheet" href="../../shared/cinema.css">` y luego el snippet inline exacto que aparece en la cabecera de `shared/cinema.js`.
3. Antes de `</body>`: `<script src="../../shared/cinema.js" defer></script>`.
4. En el `<style>` de la página define las variables en el selector `html[data-cine]{ ... }` (NO en :root, para ganarle a los valores por defecto): `--cine-bg`, `--cine-ink`, `--cine-accent`, `--cine-font` (la tipografía de titulares de la página), `--cine-weight`, `--cine-case`. Usa la paleta de la página:
   - luminoso: fondo blanco o blanco cálido de la página, nombre en el color oscuro de marca, acento el azul/verde suave (genera el destello).
   - potente: fondo casi negro, nombre en blanco, acento naranja/rojo/amarillo de marca (barrido de faro, línea, letterbox).
   - vintage: fondo negro/café muy oscuro, nombre en crema o dorado, acento dorado (marco clásico, viñeta, grano marcado; el hero pasa de sepia a color).
5. Ganchos del hero:
   - `data-cine-hero` en `<section class="hero">`.
   - `data-cine="title"` en el h1, `data-cine="subtitle"` en el párrafo principal, `data-cine="actions"` en el contenedor de botones (entran escalonados).
   - `data-cine-kenburns` en el visual grande del hero (foto, ilustración SVG, placa, emblema o una capa de fondo). Asegúrate de que su contenedor recorte (`overflow:hidden` o `overflow:clip`) para que el zoom NO provoque scroll horizontal. Si el elemento ya tiene animaciones propias que choquen, elige otro (p. ej. una capa de fondo).
6. Scroll:
   - `data-cine-reveal` en encabezados de sección y bloques; `data-cine-stagger` en grids/listas de tarjetas (sus hijos entran escalonados). No marques el hero.
   - `data-cine-parallax="0.06"`–`"0.12"` en 1–3 imágenes/visuales grandes o decorativos (nunca en texto ni en botones, ni en el mismo elemento que ya tiene kenburns).
   - `data-cine-count` solo en números que YA existen en la página (p. ej. pasos 01–04). No inventes cifras.
   - Si la página ya tenía su propio sistema de aparición (clases tipo `.reveal` + IntersectionObserver), quítalo y usa el de cinema para no duplicar animaciones; asegúrate de que nada quede oculto.
7. Puedes añadir en el `<style>` de tu página detalles propios del negocio usando las clases de la intro (`.cine-intro`, `.cine-title`, `.cine-sweep`, `.cine-flare`, `.cine-frame`, etc., con `html[data-cine]` delante) para que no se vea igual a las otras páginas del mismo giro: por ejemplo el color/ángulo del barrido, la forma del destello, el marco o el tamaño del nombre. Respeta: solo transform/opacity (y filter breve), duración total < 3 s.

## Prohibido
- NO edites `shared/*` (cinema.css/js, base.css), `generar.mjs`, `_plantillas/*`, `index.html` de la raíz ni páginas de otros negocios. Si el núcleo tiene un bug, descríbelo en tu reporte.
- No cambies textos ni datos, no inyectes contenido con JS, no agregues dependencias.
- No hagas ninguna operación git. Never use `git stash` / `git stash pop` anywhere in this repo.

## Verificación obligatoria (Playwright; scripts y capturas en una subcarpeta con el nombre de tu negocio dentro de tu scratchpad, nunca en el proyecto)
Cada prueba en un contexto NUEVO (sessionStorage limpio), página cargada por file://:
1. 390x844: 0 errores de consola/pageerror; existe `.cine-intro` a los 300 ms; ya no existe a los 3000 ms y `<html>` ya no tiene `cine-on`; `scrollWidth <= 390` durante y después de la intro; después se puede hacer scroll (`window.scrollTo` cambia `scrollY`).
2. Captura fotogramas a ~200, 700, 1200, 1700, 2300 y 3100 ms (deviceScaleFactor 1) y MÍRALOS: nombre legible y bonito, telón abriéndose, hero entrando escalonado, sin saltos raros. Ajusta hasta que se vea de cine.
3. Botón "Saltar intro": click a los 500 ms → la intro desaparece en < 400 ms y el hero está visible. Repite con tap en cualquier parte (`page.mouse.click`) y con una tecla (`page.keyboard.press('Space')`).
4. Recarga en el mismo contexto → no aparece la intro.
5. Contexto con `reducedMotion: 'reduce'` → no aparece la intro, el hero visible de inmediato, ningún elemento con `--cine-py` distinto de 0.
6. Contexto con `javaScriptEnabled: false` → la página se ve completa y normal (captura).
7. Repite 1 y 2 a 1440x900.
8. Recorre toda la página con scroll y confirma que todas las secciones terminan visibles (opacity 1).

## Reporte final (breve)
Qué estilo y qué toques propios le diste a la intro, elementos con kenburns/parallax/count, resultados de cada verificación, y cualquier problema del núcleo.
