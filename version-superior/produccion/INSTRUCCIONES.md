# Cómo producir los videos 2 al 5 (paso a paso)

Archivos de esta carpeta que vas a usar:

- `producir.ps1`: hace todo. Corta la voz, la nivela, hace el video 1080p y la vista previa 480p.
- `cortar_frase.ps1`: quita una frase de la voz sin gastar créditos. Por ahora solo hace falta en el
  video 4 (ver el paso 4).

---

## 1. Antes de empezar (una sola vez)

1. **Conecta la laptop a la corriente** y evita que se duerma mientras trabaja:
   Configuración → Sistema → Inicio/apagado y batería → "Pantalla y suspensión" → en
   **"Suspender el dispositivo"** elige **Nunca**. Al terminar puedes regresarlo como estaba.
2. **OneDrive:** en el Explorador de archivos, ve a `Documentos`, haz clic derecho en la carpeta
   **Version Superior** y elige **"Mantener siempre en este dispositivo"**. Espera a que todos los
   iconos queden en **check verde relleno**, no en nube. Si algo se queda en la nube, el script lo
   detecta y te lo dice.
3. Cierra el navegador y los programas que no uses. La PC es modesta y el render consume mucho.

## 2. Copiar los archivos a la PC

1. Abre la carpeta de herramientas: `C:\Users\alexa\.claude\version-superior\herramientas\`
2. Cambia el nombre del `producir.ps1` viejo a `producir_viejo.ps1`, para conservarlo.
3. Copia ahí el **`producir.ps1` nuevo** y **`cortar_frase.ps1`**.
   - Si los copias abriéndolos en el Bloc de notas, guárdalos con **Codificación: "UTF-8 con BOM"**.
     Si no, los acentos de los mensajes salen raros.
   - También puedes pedirle a la sesión de Claude en tu PC que los copie desde esta rama.

## 3. Abrir PowerShell

1. Pulsa la tecla **Windows**, escribe **PowerShell** y abre **"Windows PowerShell"**. No hace falta
   abrirlo como administrador.
2. Se abre una ventana azul o negra. Ahí vas a pegar los comandos: cópialos de aquí, haz clic derecho
   en la ventana para pegar y pulsa **Enter**.

## 4. Solo para el video 4: quitar la frase falsa (antes de producir)

En el video 4 la voz dice: *"Aquí no te voy a decir que lo tires ni que lo dejes por completo,
**de eso ya hay un video entero en el canal**."* Ese video todavía no existe, así que hay que quitar
solo el pedazo **", de eso ya hay un video entero en el canal"**. Por la cantidad de palabras cae
**cerca del minuto 5:28** (de 8:36 en total), pero **hay que encontrar los segundos exactos
escuchando**. Nadie los ha medido todavía.

### 4a. Encontrar los segundos exactos

**Opción A: con ffplay (viene con FFmpeg).** Pega esto y escucha. Empieza en el minuto 5:20, abre una
ventanita con la onda del sonido y en PowerShell muestra un contador de segundos:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
ffplay -autoexit -ss 320 -t 25 "C:\Users\alexa\OneDrive\Documentos\Version Superior\video04\voz_original\alejandro_completo.mp3"
```

- El número que va subiendo en la última línea (por ejemplo `327.45`) son los **segundos** que se
  están oyendo.
- Anota el segundo justo **después de "por completo"**: es el **INICIO** del corte.
- Anota el segundo justo **antes de lo que sigue a "en el canal"**: es el **FIN**.
- Con la ventanita seleccionada: **espacio** pausa y reanuda, **flecha izquierda** regresa 10 s y
  **q** cierra. Para repetir un pedazo también puedes cambiar `-ss 320` por otro número (por
  ejemplo `-ss 326`).
- Si ffplay no existe, usa la opción B.

**Opción B: con el Reproductor multimedia de Windows.** Abre el mp3 con doble clic y arrastra la barra
a **5:20**. Escucha y pausa justo en cada punto. El reproductor muestra minutos:segundos (por ejemplo
`5:27`). Puedes escribir los tiempos así (`5:27.4`), pero es menos preciso que ffplay.

> Consejo: es mejor cortar un poco **dentro de la pausa** que comerse una sílaba. Con -Escuchar
> (paso 4b) compruebas cómo quedó antes de cambiar nada.

### 4b. Probar el corte (no cambia nada todavía)

Cambia `INICIO` y `FIN` por tus números. Pueden ser segundos (`327.4`) o minutos:segundos (`5:27.4`):

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\alexa\.claude\version-superior\herramientas\cortar_frase.ps1" -Video 04 -Inicio INICIO -Fin FIN -Escuchar
```

Se abre `prueba_corte.mp3`: son 4 segundos antes y 4 después del corte, ya unidos con un fundido de
30 ms. Debe oírse natural: "…ni que lo dejes por completo. [siguiente frase]". Si se oye un pedazo de
la frase o falta una sílaba, ajusta los números y repite.

### 4c. Aplicar el corte

Es el **mismo comando sin `-Escuchar`**:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\alexa\.claude\version-superior\herramientas\cortar_frase.ps1" -Video 04 -Inicio INICIO -Fin FIN
```

- La primera vez guarda el original como `alejandro_completo.original.mp3`, en la misma carpeta.
  **Nunca lo borres.**
- Siempre corta **a partir de ese original**. Si te equivocaste, vuelve a correrlo con otros números
  y no se acumulan cortes.
- Al final dice cuánto dura ahora la voz (unos 2–3 s menos que 516 s).

> **Importante:** no sabemos cómo `cortar_voz.ps1` parte la voz en bloques. Si lo hace por
> silencios, no hay problema. Si usa tiempos fijos guardados en algún archivo, los bloques posteriores
> al minuto 5:28 quedarían corridos unos segundos. Por eso, después de producir el video 4, revisa en
> la vista previa que las tarjetas "#N" que vienen después de ese punto empiecen junto con su frase.
> Si no coinciden, manda el `.log` a la sesión de Claude.

## 5. Producir los videos

Pega esto (todo es una sola línea):

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\alexa\.claude\version-superior\herramientas\producir.ps1"
```

- Sin nada más, produce los videos **02, 03, 04 y 05**, uno por uno.
- Para hacer solo algunos, agrega `-Videos`, por ejemplo `-Videos 03,05`.
- **No cierres la ventana** y no corras dos producciones a la vez (el script no te dejará). Cada
  video puede tardar bastante en esta PC. La bitácora anota cuánto tardó cada uno.
- Mientras trabaja puedes usar la PC para cosas ligeras, aunque todo irá más lento.

## 6. Qué significa cada mensaje

| Mensaje | Qué significa |
|---|---|
| `Bitácora: ...produccion_20261124_1530.log` | Ahí se guarda todo lo que pasa. Es el archivo para mandar si algo falla. |
| `Revisando requisitos...` | Revisa que estén ffmpeg, las herramientas y los archivos de cada video. |
| `video03: OK` | Ese video tiene todo lo necesario. |
| `video03: falta la voz ...` / `no existe la carpeta de fotos ...` | Falta ese archivo. Ese video se salta y los demás siguen. |
| `... está solo en la nube de OneDrive` | Haz el paso 1.2 y vuelve a correrlo. |
| `AVISO: hay N ffmpeg abiertos de antes` | Quedó algo de una corrida anterior. No se cierra solo. Si no estás renderizando nada más, ciérralo en el Administrador de tareas (Ctrl+Shift+Esc → ffmpeg → Finalizar tarea). |
| `Ya hay otra producción corriendo` | Ya hay otra ventana o tarea produciendo. Espera a que termine. |
| `== video02: cortando voz` | Parte la voz en bloques (uno por punto del guion). |
| `== video02: nivelando audio` | Deja el volumen parejo, como lo pide YouTube. |
| `== video02: render 1080p` | Arma el video. Es lo más tardado. |
| `duración: 8:35 (515.0 s)` | Lo que dura el video. Debe ser **más de 8:00**. |
| `== video02: vista previa 480p` | Hace una copia ligera (menos de 30 MB) para verla en el celular. |
| `== video02 listo` | Terminado: `video02_final.mp4` y `video02_vista_previa.mp4` en la carpeta del video. |
| `AVISO: ...` (amarillo) | Algo raro que no detiene el proceso. Léelo. |
| `== video03 FALLÓ: falló el paso [video03 / build.ps1] con código ...` | Ese video falló en ese paso. El script sigue con el siguiente video. |
| `el video dura ..., debe durar más de 480 s` | El render salió corto. El final anterior **no se tocó**. El nuevo quedó como `videoNN_final_nuevo.mp4` para revisarlo. |
| `RESUMEN` | Al final, una línea por video: **OK** o **FALLÓ** con el motivo. |

El video final anterior **no se borra** hasta que el nuevo está completo y revisado. Si algo falla
a la mitad, conservas el que tenías.

## 7. Si algo falla

1. Lee el **RESUMEN**: dice qué video falló y en qué paso.
2. Busca el archivo `.log` en `C:\Users\alexa\OneDrive\Documentos\Version Superior\`. Es el más
   reciente que se llame `produccion_...log`.
3. **Manda ese `.log` a la sesión de Claude** (arrástralo al chat o pega su contenido). Con eso se ve
   exactamente qué pasó, sin adivinar.
4. Si la PC se suspendió o se apagó a mitad del render, revisa el paso 1.1 y vuelve a correrlo. Puedes
   producir solo los que fallaron con `-Videos`, por ejemplo `-Videos 04`.

## 8. Después

Mira la vista previa de cada video en el celular, desde el principio hasta el final. Si todo está
bien, sigue con `CHECKLIST-PUBLICACION.md`. **Publicar lo haces tú.**
