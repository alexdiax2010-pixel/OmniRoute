# Diagnóstico: por qué `producir.ps1` terminó con exit 4 (00:59, 17-nov)

> **La causa NO se conoce.** El historial solo guarda el número "exit 4", no el mensaje. Lo que sigue
> son **hipótesis ordenadas de más a menos probable**, cada una con un comando para confirmarla o
> descartarla en la PC. El `producir.ps1` nuevo deja una bitácora (`produccion_YYYYMMDD_HHmm.log`)
> con el paso exacto y el código de cada programa, así que si vuelve a fallar ya no habrá que adivinar.

## Lo que sí se sabe

- **Fallo 1 (exit 1):** error de sintaxis. `"== video$n: cortando voz"` hace que PowerShell lea `$n:`
  como una unidad de disco (igual que `C:`). Se arregla con `${n}` y ya está corregido. Los acentos
  rotos ("CarÃ¡cter") eran el mensaje de error de PowerShell (en español) mal decodificado por la
  consola que lo leyó. El script nuevo va en UTF-8 con BOM y pone la consola en UTF-8.
- El script viejo **nunca hace `exit`**. Si se lanza con `powershell -File`, al terminar normalmente
  devuelve 0, y si se cae por un error no controlado devuelve 1. Un **4** no sale del final normal
  del script, así que tuvo que venir de otro lado (ver H1 y H2).
- Probado aquí en Linux con **PowerShell 7.7** (no con Windows PowerShell 5.1): un script lanzado con
  `-File` que llama a un hijo que hace `exit 4`, o cuyo último comando externo devuelve 4, termina
  con **0**. En 5.1 no se pudo probar; el comando de H2 lo comprueba en la PC.
- Probado aquí con **ffmpeg 6.1** (Linux): archivo de entrada inexistente devuelve 254 (= -2),
  filtro mal escrito devuelve 234 (= -22), Ctrl+C/señal de cierre devuelve 255 y matarlo a la fuerza
  devuelve 137. ffmpeg devuelve el error como **número negativo**. En Windows esos códigos se ven
  sin recortar (-2, -22, …), pero eso no se pudo probar aquí. **ffmpeg no suele devolver un 4 positivo.**

## Cómo leer el "exit 4"

El número lo dio la herramienta que lanzó el script (la sesión de Claude en la PC, probablemente con
Git Bash). Git Bash **recorta los códigos de Windows a su último byte** (0–255). Así, un código grande
de Windows puede verse como 4: por ejemplo **0x40010004**, que aparece cuando Windows termina un
proceso al apagar, suspender o cerrar sesión, se ve como 4. Esto es una posibilidad, no algo
comprobado en esta PC.

---

## Hipótesis (de más a menos probable)

### H1. Windows o alguien cerró el proceso (suspensión, apagado, cierre de sesión, ventana cerrada)

Eran las 00:59 y un render 1080p en un i3 tarda mucho. Si la laptop se suspendió o se apagó, o si se
cerró la ventana o la sesión de Claude, Windows mata el proceso. Un código como 0x40010004, recortado
por Git Bash, se ve como **4**.

**Confirmar.** En PowerShell, busca eventos de energía y apagado alrededor de esa hora:

```powershell
Get-WinEvent -FilterHashtable @{LogName='System'; StartTime='2026-11-16 23:30'; EndTime='2026-11-17 02:00'} |
  Where-Object { $_.Id -in 1,41,42,107,109,1074,6005,6006,6008,7002 } |
  Format-Table TimeCreated, Id, ProviderName, Message -AutoSize -Wrap
```

Qué buscar:
- **42**: entró en suspensión.
- **1** (Power-Troubleshooter) o **107**: salió de la suspensión.
- **1074** o **6006**: apagado o reinicio.
- **6008** o **41**: apagado inesperado.
- **7002**: cierre de sesión.

Si alguno cae entre las 00:55 y las 01:00, la causa casi seguro es esta.

**Evitarlo:** conecta la laptop a la corriente y pon "Suspender: Nunca" mientras se renderiza
(Configuración → Sistema → Inicio/apagado y batería).

### H2. Un script hijo (`build.ps1` o `cortar_voz.ps1`) devolvió 4 y el código se propagó

No tenemos el código de las herramientas. Si alguna hace `exit 4`, o termina con
`exit $LASTEXITCODE` después de un comando que devolvió 4, y Windows PowerShell 5.1 o la forma en que
se lanzó pasó ese código hacia afuera, el resultado sería exactamente "exit 4".

**Confirmar:**

```powershell
# ¿Alguna herramienta usa exit con un número?
Select-String -Path "C:\Users\alexa\.claude\version-superior\herramientas\*.ps1" -Pattern '\bexit\b'

# ¿Windows PowerShell 5.1 propaga el código de un hijo? (prueba de 10 segundos)
Set-Content "$env:TEMP\hijo.ps1" 'exit 4'
Set-Content "$env:TEMP\padre.ps1" '& "$env:TEMP\hijo.ps1"; "fin del padre"'
powershell -NoProfile -File "$env:TEMP\padre.ps1"; "codigo del padre: $LASTEXITCODE"
```

Si `Select-String` muestra un `exit 4` (o un `exit $LASTEXITCODE`) y el padre devuelve 4, la causa
casi seguro es esta. Entonces el render falló dentro de esa herramienta y hay que ver su mensaje: el
script nuevo lo guarda en la bitácora.

### H3. Choque con otra corrida: `Stop-Process ffmpeg` mató el render de la otra tarea

El script viejo hacía `Get-Process ffmpeg | Stop-Process -Force` antes de cada render. Si había dos
corridas a la vez (por ejemplo, el primer intento en segundo plano y el segundo), cada una mataba los
ffmpeg de la otra. El render quedaba cortado: un mp4 sin terminar, o un ffmpeg con código -1. Además,
dos renders 1080p a la vez en 7.8 GB de RAM son muy pesados.

**Confirmar:**

```powershell
# ¿Quedaron mp4 incompletos? Un archivo cortado da "moov atom not found" o no da duración.
Get-ChildItem "C:\Users\alexa\OneDrive\Documentos\Version Superior\video0*\*.mp4" |
  ForEach-Object { "{0}  {1:N1} MB  {2}  duración: {3}" -f $_.Name, ($_.Length/1MB), $_.LastWriteTime,
    (& ffprobe -v error -show_entries format=duration -of csv=p=0 $_.FullName 2>&1) }

# Mientras corre una producción: ¿hay más de un PowerShell con producir.ps1?
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object CommandLine -like '*producir*' | Select-Object ProcessId, CreationDate, CommandLine
```

Si hay archivos con hora de 00:5x y duración vacía o rara, o si aparecen dos procesos, apunta a esto.
**El script nuevo ya no mata ffmpeg.** Usa un candado que no deja correr dos producciones a la vez y
solo avisa si ve otros ffmpeg.

### H4. OneDrive: archivos "solo en la nube" o bloqueados durante la sincronización

Con "Archivos a petición", un archivo puede estar solo en la nube (icono de nube). Al abrirlo,
Windows lo descarga en ese momento, y si no hay internet o tarda, falla. Además, OneDrive puede
bloquear un instante `videoNN_final.mp4` mientras lo sube, y el script viejo lo sobrescribía
directamente. ffmpeg devolvería algo como -13 (permiso denegado) o -2 (no encontrado).

**Confirmar:**

```powershell
Get-ChildItem "C:\Users\alexa\OneDrive\Documentos\Version Superior\video0*" -Recurse -File |
  Where-Object { $_.Attributes -match 'Offline|RecallOnDataAccess' -or ([int]$_.Attributes -band 0x400000) } |
  Select-Object FullName, Attributes
```

Si sale algo, esos archivos están solo en la nube. Arreglo: clic derecho en la carpeta
"Version Superior" → **"Mantener siempre en este dispositivo"**. El script nuevo revisa esto antes de
empezar. También usa archivos temporales y renombra con reintentos.

### H5. Rutas con espacios ("Version Superior") dentro de las herramientas

`producir.ps1` ponía comillas en sus rutas, pero no sabemos si `build.ps1`, `cards.ps1` o
`cortar_voz.ps1` arman comandos como texto. Por ejemplo `cmd /c`, `Start-Process -ArgumentList "..."`,
`Invoke-Expression`, listas `concat` o filtros con rutas (`movie=`, `drawtext=textfile=`,
`fontfile=`). En los filtros de ffmpeg, el espacio y los `:` de `C:` necesitan un escape especial. ffmpeg
devolvería -22 (argumento inválido) o -2.

**Confirmar:**

```powershell
Select-String -Path "C:\Users\alexa\.claude\version-superior\herramientas\*.ps1" `
  -Pattern 'cmd /c|Start-Process|Invoke-Expression|iex |ArgumentList|textfile=|fontfile=|movie=|concat'
```

Prueba definitiva: copia `video02` a `C:\vs_prueba\video02` (sin espacios y fuera de OneDrive) y corre
`producir.ps1 -Base C:\vs_prueba -Videos 02`. Si ahí funciona y en la carpeta normal no, es esto
(o H4).

### H6. Falta de memoria o recursos (i3-10110U, 7.8 GB)

Un render 1080p con zoom y paneo sobre muchas fotos, más OneDrive, el navegador y quizá una segunda
corrida (H3), puede agotar la RAM. ffmpeg fallaría con "Cannot allocate memory" (-12) o se cerraría
de golpe.

**Confirmar:**

```powershell
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-Resource-Exhaustion-Detector'; StartTime='2026-11-16'} -ErrorAction SilentlyContinue
Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000; StartTime='2026-11-16'} -ErrorAction SilentlyContinue |
  Where-Object Message -match 'ffmpeg|powershell' | Format-List TimeCreated, Message
```

El evento 2004 indica que se quedó sin memoria. El evento 1000 con ffmpeg.exe indica que ffmpeg se
cerró de golpe. **Evitarlo:** cierra el navegador y otros programas mientras renderiza, y produce un
solo video a la vez (el script nuevo ya va de uno en uno).

### H7. El código lo puso la herramienta que lanzó el script (tarea en segundo plano)

Si el script se lanzó como tarea en segundo plano de la sesión de Claude, el "exit 4" puede ser de
ese mecanismo y no del script: un límite de tiempo, la sesión cerrada o una tubería (`|`) cuyo último
programa dio 4. **Confirmar:** en el historial de esa sesión, mira el comando exacto con que se lanzó
la segunda corrida (`powershell -File …`, `-Command …`, con `| tail`, `timeout`, etc.).

### Descartada casi seguro: otro error de sintaxis

Un error de sintaxis con `-File` da **1**, como en el fallo 1, no 4.

---

## Qué cambia con el `producir.ps1` nuevo para que esto no vuelva a quedar sin registrar

- Deja una bitácora `produccion_YYYYMMDD_HHmm.log` en la carpeta base con cada paso, la salida de
  ffmpeg y de las herramientas, y el código de salida **explicado** (por ejemplo, "-13: permiso
  denegado" o "0x40010004: Windows cerró el proceso").
- Usa `-nostdin` en cada ffmpeg (en segundo plano, ffmpeg puede quedarse esperando el teclado).
- Usa un candado contra dos corridas a la vez, en lugar de `Stop-Process`.
- Revisa antes de empezar: ffmpeg y ffprobe, las herramientas, la voz, `guion.json`, las fotos y los
  archivos solo en la nube.
- Hace el render a un archivo temporal y lo revisa (que tenga pistas de video y de audio y que dure
  más de 8 minutos) antes de reemplazar el final.
