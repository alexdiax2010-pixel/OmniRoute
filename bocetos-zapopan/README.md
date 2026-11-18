# Bocetos de landing page — Negocios de Zapopan

13 bocetos estáticos (HTML + CSS, sin build) y un portafolio interno (`index.html`).
Todo se abre con doble clic y se publica tal cual.

```
index.html            → galería interna: boceto + mockups + propuesta por negocio
generar.mjs           → genera los materiales para WhatsApp (mockups PNG + propuesta PDF)
_plantillas/          → plantillas HTML de los marcos (celular, escritorio, combo, propuesta)
shared/base.css       → reset, tipografía, utilidades y componentes comunes
shared/BRIEF.md       → guía de estilo y reglas de honestidad usadas para los bocetos
dentistas/…/index.html
talleres/…/index.html
barberias/…/index.html
capturas/*.png        → capturas móviles simples (375 px)
<giro>/<negocio>/propuesta.json  → datos de la propuesta (colores, fuentes, beneficios, dominio)
<giro>/<negocio>/mockup-*.png, propuesta.pdf → materiales generados
```

## Regenerar los materiales para WhatsApp

Requiere Node 18+ y Playwright con Chromium (una sola vez):

```bash
npm install playwright
npx playwright install chromium
```

Luego, desde esta carpeta:

```bash
node generar.mjs dental-prados        # un negocio (nombre de su carpeta)
node generar.mjs frenos-frescos dr-llamas   # varios
node generar.mjs todos                # los 13
node generar.mjs todos --solo-pdf     # solo propuesta.pdf (no reescribe los mockups)
node generar.mjs --catalogo           # catalogo-servicios.pdf (1 página, sin nombre de cliente)
```

Servicios extra y combos: los precios y el combo de cada giro están en `generar.mjs` (`COMBOS`).
En el `propuesta.json` de cada negocio, `crecer` (1–2 líneas) personaliza los beneficios de la página 3
y `combo` sobrescribe el combo del giro (p. ej. Dental Prados usa la página Premium).

Por cada negocio escribe en su carpeta: `mockup-celular.png` (1080×1350), `mockup-escritorio.png`
(1920×1080), `mockup-combo.png` (1920×1080, la imagen principal) y `propuesta.pdf` (carta, 3 páginas: boceto y beneficios · qué incluye y paquetes · servicios extra y combo).
Para cambiar textos de la propuesta (beneficios, dominio, colores) edita el `propuesta.json` del negocio;
los precios de los paquetes y tus datos de contacto son marcadores en `_plantillas/propuesta.html`
(llénalos ahí una vez y regenera con `todos`).

> Importante: cada boceto enlaza `../../shared/base.css`. Publica **siempre la carpeta completa**
> (`bocetos-zapopan/`) para que no se rompan los estilos.

## Publicar en Netlify (arrastrar y soltar)

1. Entra a <https://app.netlify.com/drop> (inicia sesión o crea cuenta gratis).
2. Arrastra la carpeta **`bocetos-zapopan`** completa a la zona de “Drag and drop”.
3. En unos segundos Netlify te da una URL tipo `https://nombre-aleatorio.netlify.app`.
   - Portafolio: `https://…netlify.app/`
   - Un boceto: `https://…netlify.app/talleres/frenos-frescos/`
4. (Opcional) En *Site configuration → Change site name* ponle un nombre fácil, p. ej. `bocetos-tuestudio`.
5. Para actualizar: en el sitio, pestaña *Deploys*, arrastra otra vez la carpeta.

Tip: si no quieres que un prospecto vea los bocetos de los demás, comparte solo el enlace directo
a su carpeta (el portafolio no está enlazado desde los bocetos).

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (p. ej. `bocetos-zapopan`), público.
2. Sube el **contenido** de la carpeta `bocetos-zapopan/` a la raíz del repo
   (botón *Add file → Upload files*, arrastra todo, *Commit changes*), o por terminal:
   ```bash
   cd bocetos-zapopan
   git init && git add . && git commit -m "Bocetos"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/bocetos-zapopan.git
   git push -u origin main
   ```
3. En el repo: *Settings → Pages → Build and deployment → Source: Deploy from a branch*,
   rama `main`, carpeta `/ (root)` → *Save*.
4. En 1–2 minutos queda en `https://TU-USUARIO.github.io/bocetos-zapopan/`.

## Antes de entregar un sitio como oficial

Los bocetos están marcados a propósito para que no se confundan con el sitio real del negocio:

- Quitar la franja `<div class="franja-boceto">…</div>`.
- Quitar `<meta name="robots" content="noindex, nofollow">`.
- Reemplazar todos los marcadores amarillos `[...]` (clase `marcador`) con datos confirmados por el cliente
  — busca `class="marcador` en el archivo.
- Completar teléfono/WhatsApp donde está `href="#"`, y agregar `openingHours`, `url` y `telephone`
  al JSON-LD cuando estén confirmados.
- Sustituir fotos de stock por fotos reales del negocio.
