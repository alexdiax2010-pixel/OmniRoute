# 00-CONTEXTO — Canal "Versión Superior" (resumen verificado)

Fuente: historial de la sesión "Realización de videos en YouTube" (14–17 nov 2026), extraído el 23-nov.
Solo datos que aparecen ahí; si algo no aparecía, se dice.

## Canal
- Nombre: **Versión Superior**. El canal de YouTube real aún se llama "Sky_StudioLabs" (@sky_studiolabs),
  0 suscriptores, 0 videos. Cambio de nombre, handle (`@versionsuperior` / `@versionsuperiormx`) y foto
  (opción 3, `perfil-3-texto.png`) **pendiente, lo hace el usuario**.
- Nicho: superación personal, estilo, higiene y cuidado personal para hombres de 18–30 años en México.
  Sin rostro, voz en off, fotos/clips. Referencia de formato: @lirykal. Tono informal mexicano.
- Plan: 1 video diario del 11-nov al 07-dic-2026 (27 títulos en la base de Notion "Guiones YouTube").
- Voz: clon "Alejandro" en ElevenLabs (modelo `eleven_v4`). Duración > 8 min (meta ~9; 1,550–1,650 palabras).
- Reglas del canal: ver `LEEME-canal.md` (sin estadísticas inventadas, sin consejos médicos concretos,
  fotos Unsplash/Pexels sin marcas, estilo fondo oscuro + blanco + amarillo #FFD400 + rojo, **nunca publicar
  sin aprobación explícita**).

## Los 5 videos
| # | Título | Voz clonada | Estado |
|---|---|---|---|
| 1 | 10 Errores que te Hacen Ver DESCUIDADO (aunque te bañes diario) | 8:37 | **Terminado, no publicado** (`video01_final.mp4`, 3 shorts listos) |
| 2 | 12 Hábitos que te Hacen Ver MAYOR (sin darte cuenta) | 515 s | Audio listo; render con voz clonada **falló** (existe versión con voz temporal "Raúl") |
| 3 | Cómo OLER CARO Gastando POCO (guía completa) | 502.1 s | Audio listo; render **falló** |
| 4 | 9 Cosas que MATAN tu Confianza (cada mañana) — alternativa propuesta sin respuesta: "9 Hábitos de la Mañana que DESTRUYEN tu Confianza" | 516 s | Audio listo; render **falló** |
| 5 | La RUTINA de Piel MÁS FÁCIL para Hombres (5 minutos) | 511.6 s | Audio listo; render **falló** |

Puntos de cada video: ver la tabla del informe en `00-AVANCE.md` y los guiones en `guiones/originales/`.
Los guiones 2–5 son el texto exacto enviado a ElevenLabs. El del video 1 es la versión del 14-nov
(después se quitaron los "Número diez…" y repeticiones; el texto final exacto no aparece).

## Producción (en la PC del usuario, Windows)
- Carpeta de trabajo: `C:\Users\alexa\OneDrive\Documentos\Version Superior\videoNN\` y herramientas en
  `C:\Users\alexa\.claude\version-superior\herramientas\` (`build.ps1`, `cards.ps1`, `cortar_voz.ps1`,
  `short.ps1`, `producir.ps1`, …). FFmpeg por winget. Sin Python. PC: i3-10110U, 7.8 GB RAM.
- **Fallo de los videos 2–5**: `producir.ps1` usa `"== video$n: cortando voz"` → PowerShell lee `$n:` como
  unidad de disco (error de sintaxis, exit 1). Segundo intento: exit 4, **causa no registrada**.
- Errores previos ya resueltos: mayúsculas/minúsculas en nombres de variables de PowerShell (`$P`/`$p`) en
  `build.ps1` y `short.ps1`; ElevenLabs falla con textos de ~8,400 caracteres (funciona en trozos ≤ 3,000).

## Créditos
- vidIQ: queda **1 crédito**; se renuevan el 04-dic-2026 (150/mes). Canva: sin créditos de IA.
- ElevenLabs (plan Creator): ~34,800 caracteres gastados en las voces de los videos 2–5. Antes: 27,844 de 130,997.

## Pendientes del usuario
- Publicar el video 1 (lo sube él; falta enlace público de OneDrive o subirlo desde el celular).
- Cambiar nombre/handle/foto del canal.
- Decidir título del video 4 y si los videos van públicos, ocultos o programados.
- Imagen del personaje del canal (nunca la envió).
