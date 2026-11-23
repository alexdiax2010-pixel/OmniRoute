# 00-PLAN — Mejora integral de Sky Studios Labs

Encargo del usuario (23-nov-2026): "trabaja mejorando todo lo que tengo, usa toda la información de
OmniRoute, usa 4 subagentes". Lo apruebó con un "sí absoluto durante este lapso de tiempo".

## Reglas
- No enviar, publicar (ni deploy a skystudioslabs.com), ni comprar o gastar créditos.
- No inventar datos (precios, reseñas, clientes, teléfonos, métricas). Si falta algo, va a 00-PREGUNTAS.md.
- Respetar lo que ya decidió el usuario: **todo México**, **sin precios ni "nuestros clientes" en el
  video**, **los dos números con WhatsApp y llamada**.
- El trabajo va en la rama `claude/zealous-volta-2gws3a` (parte de `claude/stoic-rubin-tloqv7`, sin tocar esa rama).
- Pruebas (`tsc`, `vitest`) en verde antes de cada commit.

## Información de OmniRoute que se usa
- `claude/stoic-rubin-tloqv7`: este proyecto (sitio, CRM, portal, anuncio).
- `claude/brave-fermi-leic62`: 171 prospectos reales (Salud 66 · Automotriz 38 · Servicios 32 ·
  Belleza 19 · Comida 16) → qué giros tienen demanda y qué necesita el CRM.
- `claude/intelligent-lovelace-s9te8m`: bocetos y propuestas de talleres → plantillas de boceto.

## Reparto en 4 subagentes (cada uno en su worktree, archivos sin cruzarse)
| # | Área | Archivos que le pertenecen |
|---|------|----------------------------|
| A | Diseño, UX y animaciones del sitio público | `components/scenes/`, `components/chrome/`, `app/globals.css`, `app/(sitio)/page.tsx`, `app/(sitio)/layout.tsx` |
| B | SEO técnico, rendimiento y accesibilidad | `lib/seo/` (menos `paginas.ts`), `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `app/layout.tsx`, `components/seo/JsonLd.tsx`, `next.config.ts`, `lighthouse/` |
| C | CRM, portal, datos y seguridad | `app/admin/`, `app/portal/`, `app/api/`, `app/auth/`, `lib/crm/`, `lib/data/`, `lib/auth*.ts`, `lib/portal/`, `supabase/`, `scripts/crm-*` |
| D | Contenido y conversión | `lib/seo/paginas.ts`, `components/seo/` (menos `JsonLd.tsx`), `components/forms/`, `app/(sitio)/<giro>/`, `bocetos-ejemplo/`, `app/propuestas/` |

Pruebas nuevas: cada subagente agrega las suyas en `tests/unit/<area>-*.test.ts`.

## Orden
1. Línea base (hecho): tsc limpio, vitest 116/116.
2. Los 4 subagentes trabajan en paralelo.
3. Unir sus ramas, correr tsc + vitest + build, revisar.
4. Commit, subir la rama, actualizar 00-AVANCE / 00-PREGUNTAS / 00-RESUMEN.
