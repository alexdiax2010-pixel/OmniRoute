# Plan de mejoras — Sky Studios Labs

Encargo: mejorar sitio, CRM, portal y bocetos usando la información del repo
(`claude/brave-fermi-leic62`: prospección + CRM de 171 prospectos en `resultados/`;
`claude/intelligent-lovelace-s9te8m`: bocetos-zapopan con intro, mockups y propuestas).

Decisiones que mandan (si algo de las ramas de Zapopan choca, gana esto):
- El sitio atiende **todo México** (no "Zapopan y Guadalajara").
- Video publicitario sin precios ni "nuestros clientes".
- Los dos números (+52 44 9288 9487 y +52 33 3028 2202) aceptan WhatsApp y llamada.
- Nada de publicar en producción, enviar mensajes, gastar créditos ni inventar datos.

## Reparto (4 subagentes en paralelo, yo coordino y uno)

| # | Área | Carpetas que toca |
|---|------|-------------------|
| A | Diseño, UX y animaciones del sitio público | `components/scenes/`, `components/chrome/` (salvo `Contactos.tsx`), `app/globals.css` |
| B | SEO, rendimiento y accesibilidad | `lib/seo/` (salvo `paginas.ts`), `app/sitemap.ts`, `app/robots.ts`, metadatos, `components/seo/` (estructura, no textos), `next.config.ts` |
| C | CRM, portal y Supabase | `app/admin/`, `app/portal/`, `app/auth/`, `lib/data/`, `lib/auth*`, `supabase/`, `scripts/` |
| D | Contenido y conversión | `lib/seo/paginas.ts`, `config/precios.ts`, `components/forms/`, `clientes/` (bocetos como propuestas) |

## Prioridades

1. **Alta** — Importar los 171 prospectos reales al CRM (script desde `resultados/crm/seed/`), sin subir datos personales al repo.
2. **Alta** — Llevar los 13 bocetos reales a `clientes/` como propuestas (`propuesta.skystudioslabs.com/<slug>`, noindex, con caducidad).
3. **Alta** — Revisión de accesibilidad y rendimiento (Lighthouse móvil ≥90/≥95) tras los cambios recientes.
4. **Media** — Textos de conversión y páginas de giros alineados con "todo México" y con los servicios reales del catálogo.
5. **Media** — Pulido visual y de animaciones (respetando las 4 reglas y reduced-motion).
6. **Media** — Seguridad del CRM/portal: RLS, pruebas, límites, manejo de errores.
7. **Baja** — Documentación (README) al día.
