# youtube/: SEO de YouTube de Versión Superior

Todo está listo para copiar y pegar en YouTube Studio. **Nada se ha subido ni publicado.**

## Archivos

| Archivo | Qué es |
|---|---|
| `video01-original.txt` | Lo que ya estaba hecho para el video 1 (no se tocó). |
| `video01-mejorado.txt` | Video 1 con mejoras pequeñas; al final explica qué cambió y por qué. |
| `video02.txt` … `video05.txt` | Título, descripción, capítulos, etiquetas y configuración de los videos 2–5. Al final de cada uno hay una sección **NOTAS (NO copiar a YouTube)** con alternativas de título y pendientes. |
| `capitulos.mjs` | Script que calcula los capítulos aproximados (Node, sin dependencias). |
| `estrategia.md` | Listas de reproducción, plantillas de descripción y comentario fijado, orden y calendario de publicación, y qué medir. |

## Cómo copiar a YouTube Studio

1. **Título**: la línea bajo `TÍTULO`. En el video 4 todavía falta decidir entre las dos opciones (ver NOTAS).
2. **Descripción**: todo lo que hay entre `DESCRIPCIÓN` y `ETIQUETAS` (incluye capítulos y hashtags).
   Antes de pegar, cambia el encabezado `⏱️ Capítulos (APROXIMADOS: verificar contra el video final)`
   por `⏱️ Capítulos` **cuando ya hayas verificado las marcas**.
3. **Etiquetas**: la línea bajo `ETIQUETAS`, tal cual (separadas por comas).
4. **Configuración**: la lista bajo `CONFIGURACIÓN SUGERIDA`.
5. **No copies** nada debajo de la línea `NOTAS (NO copiar a YouTube)`.

## Capítulos: cómo se calcularon

Todavía no existe el render final de los videos 2–5 con la voz clonada, así que las marcas son
**aproximadas**:

- Duración del audio clonado: video 2 = 515 s, video 3 = 502.1 s, video 4 = 516 s, video 5 = 511.6 s.
- Cada guion de `../guiones/originales/` se divide en bloques (intro, un bloque por punto y cierre,
  separados por una línea en blanco), y la duración total se reparte **en proporción a las palabras
  de cada bloque**, igual que el corte de `cortar_voz.ps1`. Cada capítulo empieza donde empieza su bloque.
- Prueba con el video 1 (`node capitulos.mjs --validar`): con el mismo método, el estimado queda
  cada vez más atrasado respecto a los capítulos reales del video final, hasta 26 s en el cierre. Con
  `--tarjeta 1.8` (1.8 s extra antes de cada punto, el valor que mejor ajusta) la diferencia baja a
  8 s como máximo. **Hipótesis**: el montaje (`build.ps1`) agrega tarjetas "#N" y transiciones que
  alargan el video. Ojo: parte de la diferencia también viene de que el guion guardado del video 1
  no es el texto final.
- Por eso cada `videoNN.txt` trae los capítulos proporcionales en la descripción y, en NOTAS, la
  versión con `--tarjeta 1.8`.

```bash
node capitulos.mjs                 # videos 2 a 5
node capitulos.mjs 4 --detalle     # video 4 con palabras y segundos por bloque
node capitulos.mjs 4 --tarjeta 1.8 # con tiempo extra por tarjeta (como el video 1)
node capitulos.mjs --validar       # prueba del método con el video 1
```

## Cómo ajustar los capítulos después del render (en la PC)

Opción A, la más fiable (2 minutos por video):
1. Abre el video final y pon el cursor donde aparece cada tarjeta "#N".
2. Escribe ese segundo en la descripción. El primer capítulo siempre es `00:00`.
3. Quita la palabra "APROXIMADOS" del encabezado.

Opción B, con las duraciones reales de cada trozo de voz (si `cortar_voz.ps1` dejó un archivo por bloque
en `audio\`):

```powershell
# En la carpeta del video, con FFmpeg en el PATH:
Get-ChildItem audio\*.wav | Sort-Object Name | ForEach-Object {
  (ffprobe -v error -show_entries format=duration -of csv=p=0 $_.FullName)
}
```

Junta esos valores en orden, separados por comas, y córrelos así:
`node capitulos.mjs 4 --duraciones 40.7,46.9,...` (debe haber un valor por bloque: intro, puntos y cierre).
Si el montaje agrega tarjetas, suma `--tarjeta <segundos que dura cada tarjeta>`. Si el video
final dura distinto a la voz y no tienes los trozos, usa `--total <duración del video final>`.

Al final, revisa igualmente 2 o 3 marcas a ojo en el video.

## Pendientes de verificar en la PC

- Capítulos de los videos 2–5 contra el render final (y si `build.ps1` añade tarjetas).
- Título del video 4 (decide el usuario).
- Si `creditos_fotos.txt` de cada video incluye Pexels, ajustar la línea de fotos.
- Que la numeración "#N" de los capítulos coincida con las tarjetas del video (sobre todo el video 2,
  cuya narración no dice los números).
- Nombre exacto de la categoría en tu YouTube Studio ("Consejos y estilo" / Howto & Style).

## Fuentes y límites

- Sin datos externos: las herramientas de vidIQ que servirían (palabras clave, búsqueda, puntaje de
  títulos) cuestan 5 créditos cada una y solo queda 1, así que no se usaron. Las etiquetas se
  eligieron por relevancia con el guion, **sin volúmenes de búsqueda**.
- Ninguna cifra de audiencia, CTR o "mejor horario" en estos archivos es un dato: donde hay una
  sugerencia, dice que es hipótesis.
