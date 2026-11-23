# Lighthouse — resumen (móvil)

## 2026-11-23 — SEO técnico y cabeceras de seguridad (antes / después)

- Lighthouse 12.8.2, perfil móvil por defecto (Moto G, 4× CPU, 4G simulado). 3 corridas por URL;
  mediana (rango). Sandbox compartido con otras sesiones: el TBT varía mucho entre corridas.
- Servidor: `next build && next start -p 3202` con el entorno E2E (`SKY_ALLOW_LOCAL_STORE=1`,
  `SKY_DATA_FILE=.data/e2e.json`, `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3202`).
- Chrome: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome --headless=new --no-sandbox`.

| URL | | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | antes | 95 (93–96) | 100 | 100 | 100 | 0.81 s | 2.69 s | 113 ms (111–214) | 0 |
| `/` | después | **96** (96–96) | 100 | 100 | 100 | 0.81 s | 2.65 s | **85 ms** (70–87) | 0 |
| `/paginas-web-para-dentistas` | antes | 96 (95–97) | 100 | 100 | 100 | 0.80 s | 2.65 s | 118 ms (39–165) | 0 |
| `/paginas-web-para-dentistas` | después | 96 (96–96) | 100 | 100 | 100 | 0.80 s | 2.63 s | 92 ms (72–128) | 0 |
| `/paginas-web-para-talleres-mecanicos` | antes | 95 (95–96) | 100 | 100 | 100 | 0.79 s | 2.67 s | 134 ms (65–148) | 0 |
| `/paginas-web-para-talleres-mecanicos` | después | 95 (92–96) | 100 | 100 | 100 | 0.80 s | 2.64 s | 163 ms (100–241)* | 0 |

\* Ruido del sandbox: en la tanda previa con los mismos cambios (antes de añadir sólo la reescritura
de `/favicon.ico`) el TBT de talleres dio 100 ms (79–117) y performance 96 (96–97). `/admin/login` y `/portal/login` (CSP activa): buenas
prácticas 100, sin errores de consola.

Lo que se midió en el camino:

- **COOP descartado.** Con `Cross-Origin-Opener-Policy: same-origin` el FCP simulado subía ~50 ms
  en las tres URLs (0.80 → 0.85 s, reproducible en 2 tandas; desaparecía al quitar sólo COOP).
  Se dejó fuera: el sitio no abre ventanas emergentes que lo justifiquen.
- La CSP (sin nonces, para no volver dinámicas las páginas estáticas/ISR) y HSTS no cambian
  ninguna métrica (+~80 bytes por respuesta).
- El LCP simulado de 2.6 s sigue siendo "render delay" del modelo de Lighthouse (LCP observado sin
  throttling ≈ 0.15–0.25 s = FCP). Lo que queda (unused JS 29 KiB, legacy JS 13 KiB) es el chunk
  de framework de Next.

Comando (ajusta el puerto):

```bash
npx -y lighthouse@12 http://localhost:3202/<ruta> \
  --chrome-path=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,seo,best-practices --output=json
```

---

## 2026-11-21 — medición anterior

- Fecha: 2026-11-21 · Lighthouse 12.8.2 · perfil móvil por defecto (Moto G, 4× CPU, 4G simulado)
- Servidor: `next start -p 3100` (build de producción) con el entorno E2E (`SKY_ALLOW_LOCAL_STORE=1`, `SKY_DATA_FILE=.data/e2e.json`)
- Chrome: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome --headless=new --no-sandbox`
- 3 corridas por URL; se reporta la mediana (rango entre paréntesis). Sandbox compartido: el TBT varía.

| URL | Performance | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` (home cinematográfica) | **94** (93–95) · antes 82 | **100** · antes 96 | 100 | 100 | 2.7 s (simulado) | 150 ms (120–200) · antes 600 | 0 |
| `/paginas-web-para-dentistas` | **96** (87–96) | 100 | 100 | 100 | 2.7 s | 100 ms (70–410) | 0 |
| `/chatbot-whatsapp` | **96** (96–97) | 100 | 100 | 100 | 2.7 s | 60 ms (60–100) | 0 |

Comando:

```bash
npx -y lighthouse@12 http://localhost:3100/<ruta> \
  --chrome-path=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,seo,best-practices --output=json
```

## Home `/` — tras la QA visual (2026-11-21): performance 94 (93–95), accesibilidad 100

- Cada escena tiene un timeline de **entrada** (mientras el escenario sube a pantalla) que deja
  título, texto y protagonista completos ANTES del pin; el timeline fijado anima el resto. Pins más
  cortos; la cámara limita su zoom/paneo para no sacar el título de pantalla; contadores por tiempo
  (nunca se quedan en 0); reseñas y formulario se revelan completos al asomar.
- La distancia de cada pin se reserva como espacio fijo (padding/margin) y los pins usan
  `pinSpacing: false`, así se crean de forma perezosa sin cambiar el alto de la página.
- El motor arranca con la primera intención del usuario (rueda/toque/tecla/scroll) o ~3 s después
  de `load` en un momento ocioso; la intro ya se anima con CSS desde el primer frame.

## Home `/` — después de la optimización (2026-11-21): performance 94 (91–94), accesibilidad 100

Medido en `next start -p 3125` (mismo entorno E2E), 3 corridas Lighthouse 12 móvil.

Cambios aplicados (escenas + config):

- **LCP**: el `h1` del intro ya no tiene máscara ni transform: se pinta completo desde el servidor
  (LCP observado = FCP ≈ 0.3 s sin throttling). La entrada del intro (sol, horizonte, lema con máscara,
  CTA, círculo) es CSS puro; sobre el título sólo pasa un destello decorativo (no es texto).
  El 2.5 s simulado restante es "render delay" del modelo de Lighthouse (cuenta los scripts del framework).
- **TBT 600 → ~230 ms**: el orquestador espera a `load` + `requestIdleCallback` (tope 1.5 s); GSAP/Lenis
  se cargan después; los 11 pins se crean uno por tarea (lecturas de layout en lote, antes de escribir);
  el contenido de cada escena (SplitText + tweens) se construye perezosamente cuando la escena está a
  ~1 viewport, una escena por tarea con `scheduler.yield`. La tarea larga mayor que queda (180–260 ms)
  es la hidratación de React (`react-dom`), no las escenas.
- **A11y**: SplitText con `aria: "none"` (sin `aria-label` en `<p>`/`<span>`; el texto sigue legible).
- **CSS bloqueante**: `experimental.inlineCss: true` (0 `<link rel="stylesheet">` en el HTML).
- `browserslist` moderno en `package.json`; el aviso de *legacy JS* (~13 KiB) persiste porque viene del
  chunk de framework de Next.

## Home `/` — medición anterior: performance 82 (< 90) y accesibilidad 96

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
