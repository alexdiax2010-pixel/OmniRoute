# 00-AVANCE — Bitácora

## 2026-11-23 17:00 UTC — Arranque
- Los 00-*.md originales no existían en el contenedor ni en ninguna rama. El usuario pidió seguir con Sky
  Studios Labs desde esta sesión, porque la sesión propia de Sky no acepta confirmaciones que llegan
  de otra sesión.
- Rama `claude/zealous-volta-2gws3a` creada desde `claude/stoic-rubin-tloqv7` (avance rápido, sin tocar esa rama).
- Línea base: `npm ci` OK · `tsc --noEmit` limpio · `vitest` 12 archivos, 116 pruebas OK.
- `npm run lint` falla: ESLint toma el `eslint.config.mjs` del repo raíz, que pide `@eslint/compat` (no
  instalado aquí). Se anota en preguntas/plan.
- Leídos los 171 prospectos de `brave-fermi`: los giros con más demanda sin página propia en el sitio
  son abogados/contadores, salud general (médicos, fisioterapia) y estéticas/belleza.

## 2026-11-23 17:05 UTC — 4 subagentes de Sky lanzados
- A diseño/UX · B SEO/rendimiento · C CRM/portal/seguridad · D contenido/conversión, cada uno en
  `.claude/worktrees/sky-<x>` (rama local `sky/<x>`), con archivos separados.
- El usuario pidió también correr aquí los agentes de YouTube (canal **Versión Superior**), porque su PC
  está apagada. Primero, un agente extrae el historial de esa sesión para no inventar temas.
- Causa del fallo de los videos 2–5 (vista en el historial): `producir.ps1` usa `"== video$n: …"`;
  PowerShell interpreta `$n:` como unidad de disco → se corrige con `${n}`. Además, guardar el .ps1 en
  UTF-8 con BOM (los acentos salían como "CarÃ¡cter").

## 2026-11-23 19:56 UTC — Pausa por límite de uso y reanudación
- Los 5 agentes se detuvieron a las ~17:10 por el límite de 5 horas de la cuenta (se restableció a las 19:40).
- Ninguno alcanzó a hacer commit; solo quedó un cambio sin commitear de D en `lib/seo/paginas.ts`.
- Reanudados los 5 a las 19:57.

## 2026-11-23 ~20:05 UTC — Terminó A (diseño y UX) → unido
- Cierre de la home: botón "Escríbeme por WhatsApp" y una tarjeta por número con WhatsApp y Llamar.
  Se quitó el marcador `[MI_WHATSAPP]`.
- `Contactos.tsx`: variante de botones grandes; cada enlace dice su número al lector de pantalla.
- Fuera de la vista pública: reseñas `[RESEÑA REAL AQUÍ]`, `[PRECIO]` (ahora "Precio según tu negocio:
  te lo damos junto con tu boceto gratis"), `[MI_CORREO]`, `[MI_FACEBOOK]`. "Nuestros clientes" → "Trabajo
  real" (solo Wellness Fitness 5AM, que está en `config/portafolio.ts`).
- Corregido el recorte de la "Y" de "SKY" a 360px; el resaltado se ve en el modo de alto contraste.
- Verificado: tsc limpio, vitest 124/124, Lighthouse móvil de la home: performance 96 (antes 94), accesibilidad 100, CLS 0.
- Sugerencias: `css: { postcss: {} }` en `vitest.config.ts` (toma el postcss de OmniRoute); dar margen a las anclas
  `#precios` para que no queden bajo el encabezado fijo.

## 2026-11-23 ~20:10 UTC — Terminó D (contenido y conversión) → unido
- 3 páginas de giro nuevas, respaldadas por los 171 prospectos (sin copiar datos de ellos):
  `/paginas-web-para-abogados-y-contadores` (20), `/paginas-web-para-consultorios` (16),
  `/paginas-web-para-veterinarias` (8). Estéticas sin página (solo ~5 prospectos); se cubren con una
  pregunta frecuente en la página de barberías. Siguiente candidata: guarderías (9).
- Las 7 páginas de giro: preguntas frecuentes "¿el boceto me compromete?" y "¿cuánto cuesta?" (sin montos), texto
  de cierre por giro, ajustes según lo que más aparece en los prospectos. Sin cifras ni reseñas inventadas.
- Formulario: validación en el navegador igual a la del servidor, foco en el primer error, enlace a
  WhatsApp si falla el envío, acepta "+52 1 …", funciona sin JavaScript (`?lead=ok|error`). Mismo contrato con `/api/prospectos`.
- El sitemap y el menú toman las páginas nuevas solos (11 páginas).
- Unido con A sin conflictos: tsc limpio, vitest 170/170.
- Sugerencia → 00-PREGUNTAS: falta un aviso de privacidad (el formulario pide nombre y WhatsApp).

## 2026-11-23 ~20:20 UTC — Terminó C (CRM, portal y seguridad) → unido
- `crm:importar` ahora acepta la carpeta de prospección (un .json por negocio): **los 171 prospectos reales
  importan bien** (antes 0). Probado en un almacén temporal fuera del repo, ya borrado. 59 escrituras de giro
  → 26; los teléfonos dudosos van a "alertas" sin inventar números; volver a importar actualiza, no duplica.
- Seguridad (4 arreglos): límite real de 8 KB en el formulario público aunque el envío venga por partes (antes
  se evadía); migración `supabase/migrations/0003_seguridad.sql`: un cliente no puede adjuntar la foto de otro
  (probado en PostgreSQL local); CSV a salvo de fórmulas con espacios o signos de ancho completo; un id mal
  formado da 404 en vez de 500. Arreglado también "Ver foto" con el código especial.
- CRM: filtros por giro y categoría con conteo, "seguimiento hoy o vencido" y botones por etapa.
- Yo agregué `data/crm-prospectos.json` al `.gitignore` (datos personales; sugerencia de C).
- Unido con A y D: tsc limpio, vitest 200/200.
- Pendiente (no urgente): un trigger de límite de solicitudes en Supabase; revisar el origen en `/auth/salir`.

## 2026-11-23 ~21:00 UTC — Terminó B (SEO técnico, rendimiento y seguridad) → unido. Cierre.
- Datos estructurados: `WebSite` + negocio con logo PNG, areaServed México, los dos teléfonos, Instagram; sin
  reseñas/precios/dirección inventados. Las tarjetas de Twitter/Open Graph van en cada página.
- Sitemap sin fechas falsas; `robots.txt` bloquea `/auth/` y deja leer `/c/` y propuestas (para que Google vea su noindex).
- Nuevas cabeceras: CSP (sin romper páginas estáticas), `X-Frame-Options`, HSTS (sin preload), `X-Robots-Tag`
  noindex en admin/portal/propuestas/previews, redirección www → dominio raíz.
- Lighthouse móvil: home 95 → **96**; dentistas 96; talleres 95; accesibilidad/buenas prácticas/SEO 100 en todas.
- **Verificación final del conjunto (A+B+C+D):** tsc limpio · vitest **216/216** (antes 116) · Playwright e2e
  **42 pasaron, 0 fallaron** (66 omitidas a propósito: solo corren en escritorio).
- Pendiente: comprobar la redirección www tras el próximo deploy.
