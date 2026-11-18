# Brief común para todos los bocetos (léelo completo antes de escribir)

Proyecto: bocetos de landing page para negocios locales REALES de Zapopan, Jalisco, que aún NO han contratado.
Raíz del proyecto: /home/user/OmniRoute/bocetos-zapopan/  (todas las rutas de abajo son relativas a ella).

## Archivo a entregar
- UN solo archivo `index.html` en la carpeta asignada, con su CSS en un `<style>` dentro del mismo archivo.
- Enlaza la base compartida con ruta RELATIVA: `<link rel="stylesheet" href="../../shared/base.css">` (léela: /home/user/OmniRoute/bocetos-zapopan/shared/base.css; usa sus clases y variables, sobrescribe tokens `--brand`, `--font-*`, etc. en tu `<style>`).
- HTML + CSS puro. JS solo si hace falta, mínimo, inline, sin errores en consola. Sin frameworks, sin build, sin dependencias JS externas.
- Debe abrirse con doble clic (file://) y publicarse tal cual. Nada de rutas absolutas "/".
- Peso del HTML < 60 KB idealmente (límite duro 300 KB sin contar imágenes externas). Google Fonts permitido (máx. 2 familias, con `display=swap` y preconnect).
- NO toques ningún otro archivo fuera de tu carpeta. No hagas git (ni commit, ni stash, ni checkout). Nunca uses `git stash`.

## Secciones obligatorias (en este orden aproximado, puedes añadir otras)
1. Franja discreta arriba del todo: `<div class="franja-boceto" role="note">Propuesta de diseño — boceto no oficial</div>`
2. Header con nombre del negocio + navegación ligera (anclas). Skip link (`.skip-link`) hacia `#main`.
3. Hero con nombre y frase de valor + CTA (WhatsApp / llamar / cotizar).
4. Servicios (solo los que se te dan; puedes describirlos de forma genérica y veraz, sin prometer resultados ni precios).
5. Por qué elegirnos (beneficios GENÉRICOS no verificables NO: nada de "20 años", "+5000 pacientes", "certificados", "garantía de X meses". Usa razones neutrales del tipo "Atención en Zapopan", "Te explicamos el diagnóstico antes de trabajar", o marcadores [Dato diferenciador por confirmar]).
6. Ubicación con iframe de Google Maps embebido por dirección:
   `<iframe src="https://www.google.com/maps?q=DIRECCION+URL-ENCODED&output=embed" title="Mapa de ubicación de NOMBRE" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>` dentro de `.map-embed`. Añade también un enlace "Cómo llegar" a `https://www.google.com/maps/search/?api=1&query=DIRECCION`.
7. Horario: SIEMPRE marcador `[Horario por confirmar]` (no inventes días ni horas).
8. Testimonios: si incluyes la sección, solo con marcadores `[Testimonio del cliente aquí]`. Nunca estrellas ni calificaciones.
9. Contacto (teléfono, WhatsApp, dirección; un formulario es opcional — si lo pones, que tenga `<label>` y que el botón abra WhatsApp vía JS o sea `href` de wa.me; sin backend).
10. Footer con nombre, dirección, nota "Boceto de propuesta. Datos sujetos a confirmación por el negocio."
11. Botones flotantes: usa el componente `.fab` de base.css con `<a class="fab-wa">` (WhatsApp, `https://wa.me/52XXXXXXXXXX?text=...` url-encoded) y `<a class="fab-call">` (`tel:+52XXXXXXXXXX`). Con `aria-label`. Íconos SVG inline.

## Reglas de HONESTIDAD (críticas — se revisarán una por una)
1. NO inventes testimonios, reseñas, calificaciones, estrellas, años de experiencia, número de clientes, certificaciones, garantías, marcas con las que trabajan, precios, horarios, nombres de doctores/empleados, correos, redes sociales, ni promociones.
2. Usa SOLO los datos dados. Donde falte, marcador visible con la clase `.marcador` (o `.marcador-bloque`), texto entre corchetes, p. ej. `<span class="marcador">[Horario por confirmar]</span>`.
3. Franja "Propuesta de diseño — boceto no oficial" (ver arriba).
4. `<meta name="robots" content="noindex, nofollow">` en el `<head>`.
5. Sin teléfono confirmado: `href="#"` en los botones de WhatsApp y Llamar, y texto `[Teléfono por confirmar]`.
   Teléfono marcado "(por confirmar)": SÍ úsalo en los enlaces, pero muestra junto al número un marcador `[Teléfono por confirmar]`.
6. Las fotos de stock NO deben representar al negocio como si fuera su local/equipo real: usa `alt` genéricos ("Herramientas de mecánico", "Consultorio dental") y nada de "Nuestro equipo" sobre una foto de stock.

## SEO local
- `<html lang="es-MX">`, `<meta charset>`, viewport.
- `<title>` con giro + nombre + "Zapopan" (≤ 65 caracteres aprox.).
- `<meta name="description">` con giro y "Zapopan" (≤ 160 caracteres).
- JSON-LD schema.org en `<script type="application/ld+json">` con el tipo indicado (Dentist / AutoRepair / BarberOrBeautySalon): name, address (PostalAddress con streetAddress, addressLocality "Zapopan", addressRegion "Jalisco", postalCode si se da, addressCountry "MX"), telephone SOLO si se da, areaServed "Zapopan", y `hasOfferCatalog` o `knowsAbout`/`makesOffer` con los servicios. NO pongas openingHours, aggregateRating, review, priceRange, url ni geo (no los tenemos).
- Open Graph básico (og:title, og:description, og:type=website) opcional.

## Imágenes
- Unsplash por URL directa con parámetros de tamaño: `https://images.unsplash.com/photo-XXXXXXXX?auto=format&fit=crop&w=1200&q=70`. Usa solo IDs de foto que conozcas con seguridad; si no estás seguro de que un ID exista, usa degradados + íconos SVG inline (preferible a una imagen rota). Siempre `alt`, `width`/`height` y `loading="lazy"` (excepto la del hero).
- Pon un color de fondo/degradado detrás de toda imagen para que si falla la carga la página siga viéndose bien.

## Calidad visual
- Mobile-first (diseña para 375 px primero; revisa también 1440 px). Sin scroll horizontal. Áreas táctiles ≥ 44 px.
- Contraste AA. Foco visible. Jerarquía clara. Mucho cuidado con el detalle: debe verse como un sitio profesional que un dueño querría comprar.
- Cada página debe ser CLARAMENTE distinta de las demás del mismo giro: cambia composición del hero, tipografía, distribución de servicios, formas, ornamentos — no solo el color. Tu prompt te indica una dirección de arte específica; síguela.
- Estilo por giro:
  - Dentistas: limpio, confiable, médico. Blancos, azules o verdes suaves, mucho aire, tipografía moderna.
  - Talleres: fuerte e industrial. Fondos oscuros con acento naranja, rojo o amarillo, tipografía robusta, énfasis en "Cotiza por WhatsApp".
  - Barberías: estilo y personalidad. Negro, dorado o crema; aire vintage o urbano.

## Verificación antes de terminar (obligatoria)
Playwright está instalado: `require('playwright')` funciona desde cualquier carpeta, `chromium.launch()` sin opciones. Escribe tu script de prueba en tu scratchpad o en /tmp, NO en la carpeta del proyecto. Comprueba:
- 0 errores de consola / pageerror al cargar por file:// (los errores de red de iframes/imágenes externas pueden ignorarse si el entorno no tiene red, pero repórtalos).
- Sin scroll horizontal a 375 px (`document.documentElement.scrollWidth <= 375`) y a 1440 px.
- Mira tú mismo una captura a 375 px (viewport 375x812, deviceScaleFactor 1) y otra a 1440 px y corrige lo que se vea mal. No guardes esas capturas en el proyecto.
- El JSON-LD parsea con JSON.parse.
Reporta al final: ruta del archivo, peso en KB, lista exacta de marcadores [..] que dejaste, y cualquier problema.
