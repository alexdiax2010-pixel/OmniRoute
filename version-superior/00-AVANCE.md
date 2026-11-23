# 00-AVANCE — Bitácora Versión Superior

## 2026-11-23 20:15 UTC — Arranque
- Contexto extraído del historial de la sesión de YouTube → `00-CONTEXTO.md`.
- Guiones originales guardados en `guiones/originales/` (01 como JSON; 02–05 tal como se mandaron a ElevenLabs).
- Lanzados 4 subagentes (Y1–Y4).

## 2026-11-23 ~20:30 UTC — Terminó Y2 (SEO de YouTube) → unido
- `youtube/video02.txt` a `video05.txt`: título, descripción, capítulos, etiquetas y configuración ("contenido sintético: Sí").
  Los títulos originales se quedan; las alternativas van en las NOTAS de cada archivo.
- Capítulos **aproximados** con `youtube/capitulos.mjs` (reparto por palabras). Validado contra el video 1: desfase
  de hasta 26 s, que baja a 8 s con `--tarjeta 1.8`. Hay que corregirlos contra el render final.
- `video01-mejorado.txt` (el original no se tocó), `estrategia.md` (listas de reproducción, orden 1→3→2→5→4, uno
  por día a las 19:00 como hipótesis, qué medir).
- No se usó vidIQ: las herramientas útiles cuestan 5 créditos cada una y solo queda 1.
- Aviso: el video 4 dice "ya hay un video entero en el canal" sobre el celular y el 3 promete "otro video" de
  perfumes; esos videos aún no existen.

## 2026-11-23 ~20:35 UTC — Terminó Y1 (guiones) → unido
- `guiones/auditoria.md`: sin palabras cortadas, sin cifras inventadas en los 5 guiones. **Un solo hallazgo grave:**
  el video 4 dice que "ya hay un video entero en el canal" sobre el celular (no existe; en Notion es el #18,
  "Idea"). Arreglo sin créditos: cortar ", de eso ya hay un video entero en el canal" del audio (~5:28, a
  confirmar escuchando). Se le pidió a Y4 el comando para ese corte.
- Menores (no justifican regenerar): falta una oración en el gancho del 2; intros de ~40 s (la promesa llega
  después del segundo 30); muletillas ("Qué hacer" 8 veces en el 4).
- `guiones/plantilla-guion.md` + `validar-guion.mjs` (revisa formato, límites y palabras).
- Guiones nuevos con títulos de Notion (solo lectura): **#6 "10 Prendas BÁSICAS que Todo Hombre NECESITA"**
  (1,630 palabras) y **#7 "Por qué NADIE te Toma en SERIO (y cómo cambiarlo)"** (1,608). Cada uno costaría
  ~8,500–8,750 caracteres de ElevenLabs; no se generó audio.

## 2026-11-23 ~20:40 UTC — Terminó Y3 (miniaturas y shorts) → unido
- Miniaturas: 3 variantes de texto por video (15 capas PNG transparentes 1280×720 con la fuente Anton, licencia OFL,
  todas legibles a 320×180) + comando ffmpeg para ponerlas sobre las fotos en la PC. Recomendadas: V1 "NADIE /
  TE LO DICE", V2 "¿ERES EL / TÍO?", V3 "NO ES EL / PRECIO", V4 "DEJA DE / POSPONER", V5 "DEJA ESE / JABÓN".
  Propuesta de A/B test con "Probar y comparar".
- Shorts: 3 por video (2–5), texto exacto del guion en un tramo continuo, con tiempos aproximados
  (`shorts/plan-shorts.json`). Calendario propuesto de 12 días; ningún short antes que su video largo.
- `shorts/herramientas/srt_por_frases.ps1`: subtítulos sincronizados por frases y pausas reales (sin créditos);
  probado en PowerShell 7 con audio sintético. Falta probarlo con la voz real en Windows.
- Nota técnica: al quemar subtítulos con ffmpeg, `FontSize=15` ≈ 100 px a 1920 de alto (100 se sale de la pantalla).

## 2026-11-23 ~21:00 UTC — Terminó Y4 (producción) → unido. Cierre.
- `produccion/producir.ps1` (UTF-8 con BOM): `${num}`, modo estricto, revisa requisitos (ffmpeg, herramientas, mp3,
  guion, fotos, archivos solo en la nube de OneDrive), revisa cada código de salida, bitácora en archivo, sin
  `Stop-Process ffmpeg` (candado contra corridas paralelas), render a temporal y reemplazo solo si el nuevo es válido
  y dura > 8 min, resumen OK/FALLÓ.
- Verificado con PowerShell 7.7 (0 errores de sintaxis) y corridas en seco con ffmpeg real y herramientas simuladas
  (8 casos, incluida ruta con espacio). Falta probarlo en Windows PowerShell 5.1.
- `DIAGNOSTICO.md`: 7 hipótesis del exit 4 con comandos para confirmar (causa sigue desconocida).
- `cortar_frase.ps1`: quita la frase falsa del video 4 con fundido de 30 ms, guarda el original y permite escuchar
  antes; los segundos exactos los pone el usuario.
- `INSTRUCCIONES.md` (paso a paso) y `CHECKLIST-PUBLICACION.md`.
- Nota: Y4 hizo su commit con los hooks de git desactivados; aquí no había hooks instalados, así que no cambió nada.
