# Miniaturas — capas de texto (videos 1 a 5)

Capas de **solo texto y formas** (PNG transparente 1280×720) para poner encima de las fotos que tienes en
la PC. Estilo del canal (`LEEME-canal.md`): texto blanco, palabra clave amarilla `#FFD400`, contorno negro
con sombra y subrayado o flecha roja. Cada capa trae además un sombreado negro suave en el lado izquierdo
(de 62 % a 0 % de opacidad) para que el texto se lea sobre cualquier foto.

## Variantes y razón

Regla: 2–4 palabras, sin repetir la palabra fuerte del título, y que abran una pregunta.
La fuente de verdad es `variantes.json`, donde también está la razón de cada una.

| Video | Actual | Variante A (recomendada) | Variante B | Variante C |
|---|---|---|---|---|
| 1 · DESCUIDADO | TE VEN / DESCUIDADO | **NADIE / TE LO DICE** (subrayado) | TODOS LO / NOTAN (flecha) | ¿TÚ LO / HACES? (subrayado) |
| 2 · MAYOR | ¿TE VES / MAYOR? | **¿ERES EL / TÍO?** (flecha) | TE ECHAN / MÁS AÑOS (subrayado) | LO HACES / DIARIO (subrayado) |
| 3 · OLER CARO | HUELE / CARO | **NO ES EL / PRECIO** (subrayado) | ¿TU PERFUME / EN EL BAÑO? (flecha) | NO LO / FROTES (subrayado) |
| 4 · CONFIANZA | SIN / CONFIANZA | **DEJA DE / POSPONER** (subrayado) | ¿TE / FALLAS / DIARIO? (flecha) | ¿TE HABLAS / ASÍ? (flecha) |
| 5 · PIEL | PIEL / LIMPIA | **DEJA ESE / JABÓN** (flecha) | ¿AGUA / CALIENTE? (subrayado) | TE LO / SALTAS (subrayado) |

Por qué esas son las recomendadas:
- **V1 · NADIE TE LO DICE:** sale del gancho del guion ("nadie te lo va a decir de frente") y no repite "descuidado".
- **V2 · ¿ERES EL TÍO?:** humor e incomodidad, tomado del intro ("si eres el tío de alguien").
- **V3 · NO ES EL PRECIO:** es la tesis del video ("no es el precio, es la técnica").
- **V4 · DEJA DE POSPONER:** es un error que casi todos reconocen, y sirve con cualquiera de los dos títulos del video 4.
- **V5 · DEJA ESE JABÓN:** el primer error del intro; la flecha señala el jabón de la foto.

Revisión a 320×180 (`previews/hoja-320x180.jpg`): todas se leen. La más débil a tamaño chico es
**v03-b** (4 palabras, letra más pequeña); úsala solo como tercera opción de la prueba.

## Prueba A/B en YouTube ("Probar y comparar")

En YouTube Studio (computadora): video → Detalles → Miniatura → **Probar y comparar**. Ahí subes hasta 3
miniaturas y YouTube elige la ganadora según el tiempo de visualización. Si la opción no aparece en tu
Studio, todavía no está habilitada para tu canal; en ese caso usa la variante A.

| Video | Qué probar (3 miniaturas) |
|---|---|
| 1 | La actual de vidIQ (TE VEN / DESCUIDADO) vs **v01-a** vs **v01-c** |
| 2 | La actual de vidIQ (¿TE VES / MAYOR?) vs **v02-a** vs **v02-b** |
| 3 | **v03-a** vs **v03-c** vs v03-b |
| 4 | **v04-a** vs **v04-b** vs v04-c |
| 5 | **v05-a** vs **v05-b** vs v05-c |

Consejos:
- Usa la misma foto en las 3 opciones y cambia solo el texto. Así sabes que lo que gana es el texto.
- No cambies el título mientras dura la prueba.
- Espera a que YouTube marque el resultado. Con pocas vistas puede tardar o no llegar a una conclusión.
- Anota la ganadora en Notion (propiedad "Texto miniatura") para que el canal aprenda.

## Archivos

| Ruta | Qué es |
|---|---|
| `capas/vNN-x.png` | 15 capas transparentes de 1280×720, de unos 85–115 KB cada una |
| `previews/vNN-x-preview.png` | Cada capa sobre un fondo oscuro de prueba, a 640×360 y a 320×180 |
| `previews/hoja-320x180.jpg` | Las 15 capas juntas a 320×180, como se verían en la lista de YouTube |
| `variantes.json` | Textos, palabra clave, elemento rojo y razón de cada variante |
| `herramientas/generar-capas.cjs` | Script que genera todo lo anterior (Node + Playwright) |
| `fuentes/Anton-Regular.ttf` + `OFL.txt` | Fuente usada |

El fondo de las vistas previas es un degradado con una silueta gris hecha con formas. No es una foto.

## Fuente

**Anton** (Google Fonts), licencia **SIL Open Font License 1.1** (libre, permite uso comercial).
Viene incluida en `fuentes/` junto con su licencia. La capa ya trae el texto dibujado, así que **no
necesitas instalar la fuente en la PC** para combinarla. Solo la necesitas si quieres regenerar las capas.

## Cómo combinarlas en la PC (FFmpeg)

Coloca la foto con el sujeto **a la derecha**: el texto ocupa más o menos el 60 % izquierdo. Las flechas
apuntan hacia el centro-derecha. Antes de usar ffmpeg, recarga el PATH:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

Una miniatura (la foto se escala y recorta a 1280×720 sin deformarse, y la capa se pone encima):

```powershell
ffmpeg -y -i "foto.jpg" -i "capas\v02-a.png" -filter_complex "[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[bg];[bg][1:v]overlay=0:0" -frames:v 1 -q:v 2 "miniatura_v02-a.jpg"
```

Las 3 variantes de un video con la misma foto (por ejemplo, el video 2):

```powershell
$foto = "C:\Users\alexa\OneDrive\Documentos\Version Superior\video02\miniatura_foto.jpg"
foreach ($v in "a","b","c") {
  ffmpeg -y -i $foto -i ("capas\v02-{0}.png" -f $v) -filter_complex "[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[bg];[bg][1:v]overlay=0:0" -frames:v 1 -q:v 2 ("miniatura_v02-{0}.jpg" -f $v)
}
```

(La ruta y el nombre de la foto son un ejemplo: pon el de tu foto.) Uso `-f` en lugar de `"$v..."` para
evitar errores como el de `$n:` en `producir.ps1`. El JPG sale muy por debajo del límite de 2 MB de YouTube.

Si el sujeto de tu foto está a la izquierda, voltéala con `hflip` (solo si no tiene texto ni logos):
`"[0:v]hflip,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[bg];[bg][1:v]overlay=0:0"`.

Probé este comando aquí con un fondo de prueba y funcionó. No lo probé con tus fotos.

**`thumbs.ps1`:** está en tu PC y no lo veo desde aquí, así que no sé qué parámetros acepta. Si permite
una imagen de primer plano, pásale la capa. Si no, usa el comando de FFmpeg de arriba, que no depende de él.

## Regenerar o crear variantes nuevas

Edita `variantes.json`. Pon la palabra clave entre `[corchetes]` y en `rojo` usa `subrayado` o `flecha`.
Luego corre:

```bash
cd version-superior/miniaturas
node herramientas/generar-capas.cjs   # requiere Node y playwright con chromium
```

Revisa `previews/hoja-320x180.jpg` antes de usar las capas.
