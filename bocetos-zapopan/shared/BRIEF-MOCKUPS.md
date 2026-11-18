# Brief: materiales para WhatsApp (uno por negocio)

Raíz: /home/user/OmniRoute/bocetos-zapopan/
El pipeline YA EXISTE y funciona: `generar.mjs` + plantillas en `_plantillas/`. Tu trabajo es la ficha del negocio y la revisión de calidad.

## Lo que haces
1. Lee el `index.html` de tu negocio para sacar su identidad: variables CSS de color (`:root{...}`), la URL de Google Fonts y qué familia usa para titulares y para texto.
2. Escribe `<giro>/<negocio>/propuesta.json` con este formato (ejemplo real: `dentistas/dental-prados/propuesta.json`):
   - `nombre`, `nombreCorto` (para frases como "Lo que tu página puede hacer por X"; si el nombre es largo, uno corto natural), `giroLinea` (p.ej. "Taller de frenos en Las Águilas, Zapopan"), `direccion` (solo la dada; si no hay: "Zapopan, Jalisco"), `dominio` "www.<nombre-sin-espacios-ni-acentos>.com" en minúsculas.
   - `colores`: `oscuro` (fondo principal de los mockups; debe ser oscuro para que el texto blanco tenga contraste AA), `medio` (segundo color del degradado), `acento` (color de marca vivo; se usa en texto pequeño sobre `oscuro` y como fondo de los checks del PDF), `sobreOscuro` (color de texto sobre `oscuro`, normalmente #fff o crema), `acentoTexto` (color de la palomita dibujada sobre `acento`, que contraste con él). Toma los colores del boceto; para dentistas el `oscuro` puede ser el azul/verde más profundo de la paleta.
   - `fuentes`: `url` (Google Fonts del boceto, añade pesos si faltan), `titulo` y `texto` (font-family CSS con respaldo), `pesoTitulo`, `mayusculas` (true para fuentes tipo Bebas/Anton/Big Shoulders), `tracking`, `tamTitulo` (tamaño del nombre en el combo, px; ajústalo para que el nombre quepa en UNA línea de ~1500 px de ancho máximo, o en dos como máximo si es muy largo).
   - `beneficios`: 3 o 4 objetos `{titulo, texto}` concretos para su giro y su caso (p.ej. talleres: "Cotizaciones por WhatsApp", "Clientes que buscan 'taller en Zapopan'"; Industrial Macías: enfoque empresas). REGLAS: describen lo que HACE la página (la página está a la venta), sin prometer resultados numéricos ("+50% clientes"), sin garantizar el primer lugar en Google ("ayuda a que te encuentren", no "aparecerás primero"), sin inventar datos del negocio (años, reseñas, precios, horarios, servicios no listados). Títulos ≤ 45 caracteres, textos ≤ 130 caracteres, en español de México, de tú.
3. Desde la raíz corre: `node generar.mjs <tu-negocio>` (SOLO tu negocio, nunca `todos`).
4. Revisa con tus propios ojos (herramienta Read sobre las imágenes) los 4 archivos generados en la carpeta del negocio:
   - mockup-celular.png (1080x1350), mockup-escritorio.png (1920x1080), mockup-combo.png (1920x1080)
   - propuesta.pdf: conviértelo a PNG para verlo, p.ej. `pdftoppm -r 60 -png propuesta.pdf <SCRATCH>/<negocio>-pdf` (escribe esas vistas previas en una subcarpeta propia con el nombre de tu negocio dentro de tu scratchpad, NUNCA en el proyecto; otros agentes comparten el scratchpad, usa nombres únicos).
   Busca: nombre cortado o desbordado, poco contraste, colores que no combinan con el boceto, el texto del PDF que se sale de su caja, el PDF con más de 2 páginas (`pdfinfo`), capturas con elementos a medio cargar.
5. Itera ajustando SOLO tu `propuesta.json` hasta que se vea profesional.

## Prohibido
- NO edites `generar.mjs`, `_plantillas/*`, `shared/*`, `index.html` de la raíz, ni el `index.html` de ningún negocio (tampoco el tuyo). Si una plantilla tiene un problema que no puedes resolver desde el JSON, descríbelo en tu reporte y yo lo arreglo.
- No hagas ninguna operación git. Never use `git stash` / `git stash pop` anywhere in this repo.
- No inventes datos del negocio. Los precios de los paquetes y los datos del vendedor ya son marcadores en la plantilla: no los toques.

## Reporte final (breve)
Ruta del JSON, los beneficios que elegiste, tamaño en KB de los 4 archivos, número de páginas del PDF, qué ajustaste tras revisar y cualquier problema de plantilla que haya que corregir.
