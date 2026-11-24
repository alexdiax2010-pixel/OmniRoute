# Resumen de la ronda de mejoras (23–24 nov 2026)

4 subagentes en paralelo, unidos y verificados. Todo está en la rama `claude/stoic-rubin-tloqv7`.
**No se publicó en skystudioslabs.com, no se importó nada a Supabase de producción, no se envió nada y no se gastaron créditos.**

## Qué mejoró
- **Bocetos → propuestas (D):** los 13 bocetos reales (4 dentistas, 7 talleres, 2 barberías) están en `clientes/` como propuestas privadas (noindex, franja "boceto no oficial", caducan el 31-dic-2026). Mockups en webp ligeros.
- **Textos de venta (D):** las 8 páginas SEO con combos por giro (sin precios), gestión mensual de Google Maps, costos de Meta explicados en chatbot y una respuesta engañosa corregida. Formulario más claro ("primero ves tu boceto y luego decides").
- **CRM (C):** importador de los 171 prospectos reales (`npm run crm:desde-rama` + `crm:importar`), sin subir datos personales al repo. Filtros nuevos, próximos seguimientos, CSV de la vista, botón Llamar y enlace al boceto.
- **Portal y seguridad (C):** el cliente nunca ve datos internos; historial de solicitudes; tope global de intentos del código; 2 bugs corregidos; migración 0003 lista sin aplicar.
- **Google y velocidad (B):** Lighthouse móvil portada 96, dentistas 96, chatbot 94, accesibilidad 100 en las tres; hreflang es-MX, Open Graph coherente, catálogo de servicios en JSON-LD (sin precios ni calificaciones), noindex por cabecera en admin/portal/propuestas.
- **Diseño (A):** el círculo "BOCETO GRATIS" ya no desaparece; tarjetas de Proceso sin huecos; reseñas falsas de ejemplo ocultas; objetivos táctiles de 44 px en celular.

## Pruebas
tsc sin errores · 135 pruebas unitarias · 40 pruebas e2e en Playwright · build OK · imágenes ≤300 KB.

## Qué necesita tu aprobación
Ver `00-PREGUNTAS.md`. Lo principal:
1. Publicar estos cambios en producción.
2. Importar los 171 prospectos al Supabase real y aplicar la migración 0003.
3. Confirmar los precios del catálogo (y si llevan IVA) para poder mostrarlos.
4. Datos que faltan: correo, Facebook, logo PNG, Perfil de Google, tu nombre para los mensajes.
