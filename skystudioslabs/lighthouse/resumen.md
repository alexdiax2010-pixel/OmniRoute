# Lighthouse — resumen (móvil)

- Fecha: 2026-11-21 · Lighthouse 12.8.2 · perfil móvil por defecto (Moto G, 4× CPU, 4G simulado)
- Servidor: `next start -p 3100` (build de producción) con el entorno E2E (`SKY_ALLOW_LOCAL_STORE=1`, `SKY_DATA_FILE=.data/e2e.json`)
- Chrome: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome --headless=new --no-sandbox`
- 3 corridas por URL; se reporta la mediana (rango entre paréntesis). Sandbox compartido: el TBT varía.

| URL | Performance | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` (home cinematográfica) | **82** (81–82) | **96** | 100 | 100 | 2.7 s | 600 ms (560–620) | 0 |
| `/paginas-web-para-dentistas` | **96** (87–96) | 100 | 100 | 100 | 2.7 s | 100 ms (70–410) | 0 |
| `/chatbot-whatsapp` | **96** (96–97) | 100 | 100 | 100 | 2.7 s | 60 ms (60–100) | 0 |

Comando:

```bash
npx -y lighthouse@12 http://localhost:3100/<ruta> \
  --chrome-path=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,seo,best-practices --output=json
```

## Home `/` — performance 82 (< 90) y accesibilidad 96

Auditorías que fallan / oportunidades principales:

1. **Total Blocking Time 560–620 ms** (score 0.48) y *Max Potential FID* 620 ms. Tarea larga de ~616 ms en el
   chunk de `SplitText` + arranque de escenas (`components/scenes/anim/*`), y ~70 KB de GSAP/ScrollTrigger
   evaluados al cargar. *Forced reflow* detectado (mediciones de layout durante el split de textos).
   - Sugerencias (archivos de escenas, no editados aquí): partir el texto sólo de la escena visible y diferir
     el resto (`requestIdleCallback` / al entrar en viewport); construir las escenas inferiores de forma
     perezosa; evitar leer layout (`offsetHeight`, `getBoundingClientRect`) entre escrituras de estilos.
2. **LCP 2.7 s** — elemento LCP: `<h1 id="intro-titulo" ... style="clip-path: inset(0%)">`. La animación de
   máscara (clip-path) retrasa el pintado "completo" del h1. Pintar el h1 visible desde el servidor y animar
   sólo un adorno, o empezar la máscara ya abierta en el primer frame, ayudaría.
3. **Render-blocking CSS ~280 ms** (3 hojas CSS en `<head>`). Común a todas las páginas; ver "General".
4. **Unused JS 29 KiB / Legacy JS 13–14 KiB** en el chunk principal de React/Next (común a todas las páginas).
5. **Accesibilidad — `aria-prohibited-attr`** (único fallo, score 96): `SplitText` pone `aria-label` en
   `<p>` y `<span>` sin rol (`p.t-title "Hacemos que tu negocio brille en internet"`,
   `span "Sin página."`, `span "Sin Google Maps."`, `p.t-display "Con Sky Studios Labs"`,
   `p.t-title "+1 cliente que te encuentra"`). `aria-label` está prohibido en elementos con rol genérico/
   párrafo. Arreglo (escenas): usar la opción `aria: "hidden"` de SplitText + un `<span class="sr-only">`
   con el texto, o `aria: "none"` y dejar el texto original legible para lectores de pantalla.

## Páginas SEO — performance 96, accesibilidad 100

- LCP 2.7 s (score ~0.85): elemento LCP `span.ejemploSello` (dentistas) / texto del encabezado (chatbot).
  Lo frena el CSS bloqueante y la fuente.
- Una corrida de dentistas dio TBT 410 ms (87) — ruido del sandbox; las otras dos 70–100 ms (96).

## General (todas las páginas)

- **Render-blocking CSS (~270–300 ms)**: 3 archivos CSS. Opción: `experimental.inlineCss: true` en
  `next.config.ts` (inyecta el CSS en el HTML; el CSS total es pequeño) — medir antes de adoptarlo.
- **Legacy JavaScript (~14 KiB)**: polyfills en el chunk de React/Next. Se puede acotar con un
  `browserslist` moderno en `package.json` (p. ej. `"browserslist": ["defaults and supports es6-module"]`).
- **Unused JavaScript (~29 KiB)** en el mismo chunk de framework: poco margen sin cambiar de arquitectura.
- CLS 0 y buenas prácticas/SEO 100 en todas.
