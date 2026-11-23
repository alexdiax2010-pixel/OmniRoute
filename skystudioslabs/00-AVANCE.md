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
