# Créditos y licencias de recursos

Este archivo lista el origen y la licencia de cada recurso de terceros usado en el sitio.
Otros módulos pueden agregar sus propias secciones.

## Home (escenas animadas)

### Audio
- **Sonido ambiente y golpes de transición**: generados de forma **procedural en el navegador**
  con la Web Audio API (osciladores senoidales/triangulares, LFO y ruido filtrado), en
  `components/scenes/hooks/audioEngine.ts`. No se descarga ni se incluye ningún archivo de
  audio, por lo que son **libres de regalías por construcción** (obra original del proyecto).
  El sonido está **apagado por defecto** y solo se activa con el botón "Sonido" (`aria-pressed`).
- `public/audio/` queda reservada; actualmente vacía.

### Gráficos
- Brillos, sol, horizonte, mapa, navegador, reloj, constelación, órbita y partículas: dibujados
  con CSS, SVG en línea y `<canvas>`; diseño original del proyecto. Sin imágenes de stock.
- El "mini-sitio" dentro del navegador está marcado como **ejemplo de diseño**; la gráfica de
  barras está marcada como **ilustrativa (no son datos reales)**; la conversación del chatbot
  está marcada como **conversación de ejemplo**.

### Bibliotecas
- **GSAP 3** (incluye ScrollTrigger y SplitText) — GreenSock "Standard No Charge" License
  (gratuita, incluidos los plugins, desde 3.13). https://gsap.com/standard-license
- **Lenis** — Licencia MIT. https://github.com/darkroomengineering/lenis

### Tipografías
- **Anton** — SIL Open Font License 1.1 (vía `@fontsource/anton`).
- **Inter** — SIL Open Font License 1.1 (vía `@fontsource-variable/inter`).
