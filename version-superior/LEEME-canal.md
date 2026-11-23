# Versión Superior: datos compartidos del equipo de agentes

Canal de YouTube sin rostro sobre superación personal, estilo y cuidado personal para hombres de 18 a 30 años en México. Tono informal mexicano.

## Datos clave
- **Notion:** base "Guiones YouTube", data source `84980ecd-78bb-4f46-a2e5-8ab37f14796c`
  - Propiedades: Título, #, Fecha, Estado (Idea / Guion listo / Audio listo / Editado / Publicado), Texto miniatura
- **Aprendizajes del analista:** página de Notion "Aprendizajes del canal", dentro de la misma base. Si no existe, el analista la crea. El guionista y el investigador la leen antes de trabajar.
- **Herramientas** (PowerShell, en `C:\Users\alexa\.claude\version-superior\herramientas`):

| Archivo | Para qué sirve |
|---|---|
| `limpiar_voz.ps1 -V <carpeta>` | Limpia las grabaciones del usuario (de `<carpeta>\grabaciones\00.m4a…`) y las guarda en `audio\<id>.wav` |
| `voz.ps1 -V <carpeta>` | Voz sintética de Windows. Solo como respaldo, y solo si el usuario la pide |
| `fotos.ps1 -V <carpeta> -SelJson <json>` | Descarga las fotos de Unsplash elegidas y crea `hoja_fotos.png` para revisarlas |
| `build.ps1 -V <carpeta> -OutName <archivo.mp4>` | Monta el video 1080p: zoom y paneo en 4 fotos por bloque, tarjetas "#N" y transiciones |
| `cards.ps1` | Lo usa `build.ps1` para las tarjetas |
| `thumbs.ps1`, `tier.ps1` | Miniaturas hechas por código |
| `ejemplo_guion.json` | Formato de guion que espera el montaje |

- **FFmpeg:** está instalado con winget. Antes de usarlo, recarga el PATH:
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`

## Formato del guion (`guion.json`)
- Es un array de objetos con estos campos: `id`, `n`, `t`, `i1`, `i2`, `q`, `x`.
- **Intro** (`id` "00"):
  - `i1` / `i2`: las dos líneas de la tarjeta de intro, en MAYÚSCULAS y de 18 caracteres como máximo cada una.
- **Puntos** (`id` "10", "09"… "01"):
  - `n`: el número con almohadilla, por ejemplo "#10".
  - `t`: el título en MAYÚSCULAS, de 22 caracteres como máximo.
- **Cierre:** `id` "99".
- **En todos los bloques:**
  - `q`: 4 búsquedas de Unsplash en inglés, en formato slug.
  - `x`: la narración. Números escritos con palabras, sin símbolos, sin paréntesis y sin comillas dobles.

## Reglas del canal (obligatorias)
1. **Duración:** cada video debe durar más de 8 minutos (meta: unos 9). Eso equivale a unas 1,550–1,650 palabras de narración. Confirmar con ffprobe antes de entregar.
2. **Voz:** se usa LA VOZ DEL USUARIO, ya sea grabada por él o su clon en vidIQ cuando exista y haya créditos (`vidiq_voiceover_list_voices` → la voz con isCustom=true). El clon cuesta unos 250 créditos por video.
3. **Imágenes:** solo de Unsplash (license=free) o Pexels.
   - Nada con logos ni marcas visibles, ni famosos, ni portadas de libros.
   - Nunca usar personas reconocibles para representar algo negativo.
   - Revisar SIEMPRE `hoja_fotos.png` antes de montar.
4. **Contenido:**
   - Nada de estadísticas inventadas.
   - Nada de consejos médicos ni financieros concretos.
   - Para precios, dar rangos aproximados y verificables.
5. **Estilo visual:** fondo oscuro, texto blanco con palabra clave amarilla (#FFD400) y subrayado o flecha roja.
6. **Publicación:** NUNCA publicar ni subir a YouTube sin la aprobación explícita del usuario en el chat.
7. **Videos pesados:** si un video pesa más de 30 MB, mandar también una vista previa de 480p con menos de 30 MB, porque el usuario lo ve desde el celular.
