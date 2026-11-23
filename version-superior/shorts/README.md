# Shorts — videos 2 a 5

12 shorts, 3 por video. Cada uno sale de un **trozo continuo de la narración que ya está grabada**, así que
no hay que gastar créditos de voz.

| Archivo | Qué es |
|---|---|
| `plan-shorts.md` | Plan para leer: bloque, texto exacto, tiempos, gancho, título, hashtags y calendario |
| `plan-shorts.json` | Lo mismo en JSON, para que lo lea un script de la PC |
| `herramientas/generar-plan.cjs` | Regenera el MD y el JSON desde `guiones/originales/` y comprueba que el texto exista tal cual, que no cruce de párrafo y que dure 35–55 s |
| `herramientas/srt_por_frases.ps1` | Subtítulos por frases ajustados a las pausas del audio (gratis, solo usa FFmpeg) |

Formato (igual que los shorts del video 1): vertical 1080×1920, ~35–55 s, subtítulos Arial Black 100 y
cierre "Video completo en el canal". El cierre suma unos segundos: **s04-3** (~54 s) y **s05-3** (~53 s)
quedan cerca de 1 minuto en total. Revisa la duración final antes de subir.

## Campos del JSON (para el script de la PC)

`shorts[]`: `id`, `video`, `bloque`, `texto` (exacto), `inicio_s` / `fin_s` / `duracion_s` (aproximados),
`gancho_pantalla` (2 líneas en MAYÚSCULAS), `titulo_youtube`, `hashtags` (3) y `cierre_pantalla`.
`calendario_propuesto.dias[]`: `dia`, `fecha_propuesta` y `short`.

Ejemplo en PowerShell:

```powershell
$plan = Get-Content -Raw -Encoding UTF8 .\plan-shorts.json | ConvertFrom-Json
$s = $plan.shorts | Where-Object id -eq 's02-1'
$s.inicio_s; $s.fin_s; $s.gancho_pantalla -join "`n"
```

## Los tiempos son aproximados: ajústalos a la pausa más cercana

Los tiempos se calculan así: `inicio = palabras antes del fragmento / palabras totales × duración del audio`.
La voz no habla a velocidad constante. Además, el audio se generó en varios trozos (de 3,000 caracteres o
menos), así que puede tener pausas extra. El error puede ser de algunos segundos. Para no cortar a media
palabra, busca las pausas reales sin gastar nada:

```powershell
ffmpeg -hide_banner -nostats -ss 140 -t 55 -i voz.mp3 -af silencedetect=noise=-35dB:d=0.2 -f null - 2>&1 | Select-String silence_
```

Los valores que imprime son **relativos a `-ss`**: súmale 140. El corte bueno es el `silence_end` más
cercano a `inicio_s` y el `silence_start` más cercano a `fin_s`. El script `srt_por_frases.ps1` hace este
ajuste solo e imprime los tiempos ajustados.

Usa esos tiempos ajustados para cortar el audio, poniendo `-ss` después de `-i` para que el corte sea exacto:

```powershell
ffmpeg -y -i voz.mp3 -ss 149.30 -to 186.50 -c:a pcm_s16le s02-1_voz.wav   # 149.30 y 186.50 son un ejemplo
```

## Subtítulos mejor sincronizados (sin créditos)

Hoy los subtítulos están sincronizados solo de forma aproximada. Propuesta, de menor a mayor esfuerzo:

1. **Partir por frases, no por bloque.** Divide el texto en frases (en `.`, `?`, `!` y `:`) y cada frase en
   trozos de 2–3 palabras. Con Arial Black 100 en 1080 px de ancho caben unas 2–3 palabras por renglón.
2. **Duración según las letras, no las palabras.** Reparte el tiempo de cada frase según el número de
   letras de cada trozo. "Desodorante" tarda más que "y", y contar palabras no lo refleja.
3. **Anclar cada frase a una pausa real.** La voz casi siempre hace una pausa al final de cada frase.
   `silencedetect` encuentra esas pausas. El cambio de frase se pega a la pausa más cercana a donde se
   esperaba (a ±1.2 s como máximo). Así el error no se acumula: cada frase vuelve a empezar alineada.
   Dentro de la pausa no se muestra subtítulo.

`herramientas/srt_por_frases.ps1` hace los 3 pasos y genera un `.srt`:

```powershell
cd shorts\herramientas
.\srt_por_frases.ps1 -Plan ..\plan-shorts.json -Id s02-1 -Audio "C:\Users\alexa\OneDrive\Documentos\Version Superior\video02\voz.mp3" -Out s02-1.srt -Offset 0
```

- `-Audio`: la voz completa del video (pon la ruta y el nombre reales de tu archivo).
- `-Offset`: los segundos que tarda en empezar la voz dentro del short. Por ejemplo, si antes de la voz
  va 1 s de gancho sin voz, pon `-Offset 1`.
- `-MaxPalabras 3`: las palabras por subtítulo. `-Ruido -35` y `-PausaMin 0.18`: si detecta pocas pausas,
  prueba con `-Ruido -30`.

Para quemar el `.srt` con el estilo actual (Arial Black de ~100 px en un video de 1080×1920):

```powershell
ffmpeg -y -i short_sin_subs.mp4 -vf "subtitles=s02-1.srt:force_style='FontName=Arial Black,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1.5,Shadow=0.5,Alignment=2,MarginV=80'" -c:a copy s02-1_final.mp4
```

> Ojo: en un `.srt`, el filtro `subtitles` mide todo sobre un lienzo de 288 px de alto, no en píxeles del
> video. Por eso `FontSize=15` da unos 100 px en 1920 (15 × 1920 / 288), y `MarginV=80` da unos 530 px desde
> abajo. Si pones `FontSize=100`, la letra sale gigante y queda fuera de la pantalla (lo comprobé aquí). Si
> se ve distinto a los shorts del video 1, copia el `force_style` que ya usa `short.ps1`. Si un trozo no
> cabe en una línea, libass lo parte en dos solo; para evitarlo, usa `-MaxPalabras 2`.

Probado aquí con PowerShell 7 y un audio sintético con pausas conocidas: el script detectó las pausas,
ajustó el inicio y el fin y pegó los finales de frase a ellas. **No está probado con la voz real ni con
Windows PowerShell 5.1.** Evité la sintaxis exclusiva de PowerShell 7 y los números se leen con cultura
invariante (punto decimal), aunque Windows esté en español.

**Opcional, más preciso:** whisper.cpp es gratis, de código abierto y corre sin internet. Da tiempos por
palabra a partir del audio. En la i3 sería lento y hay que descargar un modelo, así que solo vale la pena
si el método de las pausas no basta.

## Integración con `short.ps1`

No puedo ver `short.ps1` desde aquí. Lo más simple es que lea `plan-shorts.json`, corte con los tiempos
que imprime `srt_por_frases.ps1`, ponga `gancho_pantalla` arriba durante los primeros ~3 s, use el `.srt`
en lugar de los subtítulos actuales y termine con `cierre_pantalla`. La corrección de los scripts de la PC
le toca a la carpeta `produccion/` (otro subagente).
