#requires -Version 5.1
<#
.SYNOPSIS
  Producción completa con la voz clonada para los videos de "Versión Superior".
  Por cada video: revisar archivos -> cortar voz por bloques -> nivelar audio ->
  render 1080p (a un archivo temporal) -> comprobar duración -> reemplazar el final ->
  vista previa 480p.

.DESCRIPTION
  Versión corregida del producir.ps1 que falló (exit 1 y exit 4). Cambios principales:
  - "${num}" en todas las cadenas (antes "$n:" se leía como unidad de disco -> exit 1).
  - Set-StrictMode + $ErrorActionPreference = 'Stop'.
  - Revisa requisitos ANTES de empezar (ffmpeg, ffprobe, herramientas, archivos de cada video).
  - Revisa el código de salida de cada ffmpeg y de cada script hijo, y dice en qué paso falló.
  - Bitácora en archivo: produccion_YYYYMMDD_HHmm.log en la carpeta base.
  - YA NO mata los ffmpeg del sistema. En su lugar usa un candado para que no corran dos
    producciones a la vez, y solo AVISA si ve otros ffmpeg abiertos.
  - Si falla un video sigue con el siguiente, y al final muestra un resumen OK / FALLÓ.
  - El video final anterior no se borra hasta que el nuevo está completo y revisado.
  - Comprueba que cada video dure más de 8 minutos (regla del canal).
  - Los scripts hijos (cortar_voz.ps1, build.ps1) se ejecutan en un proceso aparte de
    PowerShell, para que no hereden el modo estricto ni las variables de este script.

  Guardado en UTF-8 CON BOM para que Windows PowerShell 5.1 lea bien los acentos.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File "C:\Users\alexa\.claude\version-superior\herramientas\producir.ps1"

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File "...\producir.ps1" -Videos 03,05
#>
[CmdletBinding()]
param(
  # Videos a producir. Acepta "02", "2" o "video02".
  [string[]]$Videos = @('02', '03', '04', '05'),

  # Carpeta donde están video02, video03, ...
  [string]$Base = 'C:\Users\alexa\OneDrive\Documentos\Version Superior',

  # Carpeta de las herramientas (build.ps1, cortar_voz.ps1, ...). Por defecto, la de este script.
  [string]$Herramientas = '',

  # Nombre de la subcarpeta de fotos dentro de cada videoNN.
  [string]$CarpetaFotos = 'fotos',

  # Duración mínima en segundos (regla del canal: más de 8 minutos = 480 s).
  [double]$DuracionMinima = 480,

  # Si se indica, el video final anterior se conserva como videoNN_final.anterior.mp4.
  [switch]$ConservarAnterior
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------------------
# Preparación de la consola y del PATH
# ---------------------------------------------------------------------------------------

# Acentos bien en la consola (si no hay consola, por ejemplo en segundo plano, se ignora).
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { $null = $_ }

# Recargar el PATH de Windows para encontrar ffmpeg instalado con winget.
if ($env:OS -eq 'Windows_NT') {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User')
}

if (-not $Herramientas) { $Herramientas = Split-Path -Parent $MyInvocation.MyCommand.Path }

# Ejecutable de PowerShell con el que se lanzan los scripts hijos (el mismo que corre éste).
$script:ExePowerShell = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName

# ---------------------------------------------------------------------------------------
# Bitácora (se escribe en pantalla y en el archivo .log al mismo tiempo)
# ---------------------------------------------------------------------------------------

$script:Bitacora = $null
$marcaHora = Get-Date -Format 'yyyyMMdd_HHmm'
$carpetaLog = $Base
if (-not (Test-Path -LiteralPath $carpetaLog -PathType Container)) {
  # Si la carpeta base no existe, la bitácora va junto a este script.
  $carpetaLog = $Herramientas
}
$script:RutaLog = Join-Path $carpetaLog ("produccion_{0}.log" -f $marcaHora)
$sufijo = 2
while (Test-Path -LiteralPath $script:RutaLog) {
  # Ya hay una bitácora de este mismo minuto: se usa otro nombre para no mezclarlas.
  $script:RutaLog = Join-Path $carpetaLog ("produccion_{0}_{1}.log" -f $marcaHora, $sufijo)
  $sufijo++
}
try {
  # Se deja abierto todo el tiempo (OneDrive no puede bloquearlo mientras escribimos).
  $script:Bitacora = New-Object System.IO.StreamWriter($script:RutaLog, $true, (New-Object System.Text.UTF8Encoding($true)))
  $script:Bitacora.AutoFlush = $true
} catch {
  Write-Host ("AVISO: no se pudo crear la bitácora en {0}: {1}" -f $script:RutaLog, $_.Exception.Message) -ForegroundColor Yellow
  $script:Bitacora = $null
}

function Escribir {
  param([string]$Texto = '', [string]$Color = 'Gray')
  $linea = '[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $Texto
  Write-Host $linea -ForegroundColor $Color
  if ($null -ne $script:Bitacora) {
    try { $script:Bitacora.WriteLine($linea) } catch { $null = $_ }
  }
}

# ---------------------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------------------

# Explica en palabras los códigos de salida más comunes (ffmpeg / PowerShell / Windows).
function Explicar-Codigo {
  param([long]$Codigo)
  $sinSigno = $Codigo -band 0xFFFFFFFFL
  switch ($sinSigno) {
    1           { return 'error general (ffmpeg: ver mensaje arriba; PowerShell: error no controlado en el script)' }
    255         { return 'proceso interrumpido (Ctrl+C o señal de cierre)' }
    4294967295  { return '-1: proceso terminado a la fuerza (por ejemplo Stop-Process o el Administrador de tareas)' }
    4294967294  { return '-2: archivo o carpeta no encontrado' }
    4294967291  { return '-5: error de lectura/escritura en disco' }
    4294967284  { return '-12: memoria insuficiente' }
    4294967283  { return '-13: permiso denegado (¿archivo abierto en otro programa o bloqueado por OneDrive?)' }
    4294967274  { return '-22: argumento inválido (filtro o ruta mal escrita)' }
    3221225786  { return '0xC000013A: se cerró la ventana o se pulsó Ctrl+C' }
    3221225477  { return '0xC0000005: el programa se cerró por un fallo interno' }
    3221225495  { return '0xC0000017: Windows se quedó sin memoria' }
    1073807364  { return '0x40010004: Windows cerró el proceso (apagado, suspensión o cierre de sesión)' }
    default {
      if ($sinSigno -ge 2 -and $sinSigno -le 254) {
        return 'código propio del programa o script hijo; mira sus mensajes justo arriba'
      }
      return 'código no reconocido'
    }
  }
}

# Ejecuta un programa externo (ffmpeg o un PowerShell hijo), manda su salida a la bitácora y
# lanza un error claro si el código de salida no es 0.
function Invocar-Externo {
  param(
    [Parameter(Mandatory = $true)][string]$Paso,
    [Parameter(Mandatory = $true)][string]$Exe,
    [string[]]$Argumentos = @()
  )
  Escribir ("   -> {0}" -f $Paso)
  $preferenciaAnterior = $ErrorActionPreference
  # Con 'Stop', PowerShell 5.1 corta en cuanto ffmpeg escribe algo en stderr; aquí se
  # relaja solo mientras corre el programa y el resultado se juzga por el código de salida.
  $ErrorActionPreference = 'Continue'
  try {
    $global:LASTEXITCODE = 0
    & $Exe @Argumentos 2>&1 | ForEach-Object { Escribir ('      ' + $_.ToString()) 'DarkGray' }
    $codigo = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $preferenciaAnterior
  }
  if ($null -eq $codigo) { $codigo = 0 }
  if ($codigo -ne 0) {
    throw ("falló el paso [{0}] con código de salida {1} ({2})" -f $Paso, $codigo, (Explicar-Codigo $codigo))
  }
}

# Lanza un script de herramientas en un proceso aparte de PowerShell.
function Invocar-Herramienta {
  param(
    [Parameter(Mandatory = $true)][string]$Paso,
    [Parameter(Mandatory = $true)][string]$RutaScript,
    [string[]]$Argumentos = @()
  )
  $todos = @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', $RutaScript) + $Argumentos
  Invocar-Externo -Paso $Paso -Exe $script:ExePowerShell -Argumentos $todos
}

# Duración en segundos de un archivo multimedia (con ffprobe).
function Obtener-Duracion {
  param([Parameter(Mandatory = $true)][string]$Ruta)
  $preferenciaAnterior = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $global:LASTEXITCODE = 0
    $salida = & $script:Ffprobe -v error -show_entries format=duration -of csv=p=0 $Ruta 2>$null
    $codigo = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $preferenciaAnterior
  }
  $texto = (@($salida) -join '').Trim()
  if ($codigo -ne 0 -or -not $texto) {
    throw ("ffprobe no pudo leer la duración de {0} (código {1}); el archivo puede estar incompleto o dañado" -f $Ruta, $codigo)
  }
  return [double]::Parse($texto, [System.Globalization.CultureInfo]::InvariantCulture)
}

# Tipos de pistas (video/audio) que tiene un archivo.
function Obtener-Pistas {
  param([Parameter(Mandatory = $true)][string]$Ruta)
  $preferenciaAnterior = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $salida = & $script:Ffprobe -v error -show_entries stream=codec_type -of csv=p=0 $Ruta 2>$null
  } finally {
    $ErrorActionPreference = $preferenciaAnterior
  }
  return @($salida | ForEach-Object { "$_".Trim() } | Where-Object { $_ })
}

function Formatear-Duracion {
  param([double]$Segundos)
  $ts = [TimeSpan]::FromSeconds($Segundos)
  return ('{0}:{1:00} ({2:N1} s)' -f [int][math]::Floor($ts.TotalMinutes), $ts.Seconds, $Segundos)
}

# Revisa que un archivo exista, que no esté "solo en la nube" de OneDrive y que se pueda leer.
# Devuelve una lista de problemas (vacía si todo está bien).
function Revisar-Archivo {
  param([string]$Ruta, [string]$Descripcion)
  $problemas = @()
  if (-not (Test-Path -LiteralPath $Ruta -PathType Leaf)) {
    return @("falta $Descripcion ($Ruta)")
  }
  $item = Get-Item -LiteralPath $Ruta -Force
  $atributos = [long]$item.Attributes
  # 0x400000 = RECALL_ON_DATA_ACCESS y 0x1000 = OFFLINE: archivo de OneDrive que solo está en la nube.
  if (($atributos -band 0x400000) -or ($atributos -band 0x1000)) {
    $problemas += "$Descripcion está solo en la nube de OneDrive; márcalo como 'Mantener siempre en este dispositivo' ($Ruta)"
  }
  if ($item.Length -eq 0) {
    $problemas += "$Descripcion está vacío (0 bytes) ($Ruta)"
  }
  try {
    $flujo = [System.IO.File]::Open($Ruta, 'Open', 'Read', 'ReadWrite')
    $flujo.Dispose()
  } catch {
    $problemas += ("no se puede abrir {0}: {1}" -f $Descripcion, $_.Exception.Message)
  }
  return $problemas
}

# Mueve/renombra un archivo con reintentos (OneDrive o un reproductor pueden tenerlo abierto).
function Mover-ConReintentos {
  param([string]$De, [string]$A)
  for ($intento = 1; $intento -le 5; $intento++) {
    try {
      Move-Item -LiteralPath $De -Destination $A -Force
      return
    } catch {
      if ($intento -eq 5) {
        throw ("no se pudo mover {0} a {1}: {2} (¿está abierto en un reproductor o sincronizándose en OneDrive?)" -f $De, $A, $_.Exception.Message)
      }
      Escribir ("      archivo ocupado, reintento {0}/5 en 5 s..." -f $intento) 'Yellow'
      Start-Sleep -Seconds 5
    }
  }
}

# Pone el archivo nuevo en el lugar del definitivo SIN perder el anterior si algo sale mal.
function Reemplazar-Archivo {
  param([string]$Nuevo, [string]$Destino)
  $carpetaDestino = Split-Path -Parent $Destino
  $nombre = [System.IO.Path]::GetFileNameWithoutExtension($Destino)
  $extension = [System.IO.Path]::GetExtension($Destino)
  $respaldo = Join-Path $carpetaDestino ($nombre + '.anterior' + $extension)

  $habiaAnterior = Test-Path -LiteralPath $Destino -PathType Leaf
  if ($habiaAnterior) {
    if (Test-Path -LiteralPath $respaldo) { Remove-Item -LiteralPath $respaldo -Force }
    Mover-ConReintentos -De $Destino -A $respaldo
  }
  try {
    Mover-ConReintentos -De $Nuevo -A $Destino
  } catch {
    # Si no se pudo colocar el nuevo, se regresa el anterior a su lugar.
    if ($habiaAnterior) { Mover-ConReintentos -De $respaldo -A $Destino }
    throw
  }
  if ($habiaAnterior -and -not $ConservarAnterior) {
    try { Remove-Item -LiteralPath $respaldo -Force }
    catch { Escribir ("      AVISO: no se pudo borrar el respaldo {0}; bórralo a mano" -f $respaldo) 'Yellow' }
  }
}

# Lee guion.json como lista de bloques. (En PowerShell 5.1, ConvertFrom-Json entrega el array
# entero como UN objeto; asignarlo primero a una variable evita que @() lo envuelva otra vez.)
function Leer-Guion {
  param([string]$Ruta)
  $datos = Get-Content -LiteralPath $Ruta -Raw -Encoding UTF8 | ConvertFrom-Json
  return ,@($datos)
}

# Convierte "2", "02" o "video02" en "02".
function Normalizar-Numero {
  param([string]$Texto)
  $digitos = ($Texto -replace '[^0-9]', '')
  if (-not $digitos) { throw "número de video no válido: '$Texto'" }
  return ('{0:D2}' -f [int]$digitos)
}

# ---------------------------------------------------------------------------------------
# Revisión de requisitos de un video (antes de gastar tiempo en renderizar)
# ---------------------------------------------------------------------------------------

function Revisar-Video {
  param([string]$Num)
  $carpeta = Join-Path $Base ("video{0}" -f $Num)
  $problemas = @()
  if (-not (Test-Path -LiteralPath $carpeta -PathType Container)) {
    return @("no existe la carpeta $carpeta")
  }

  # Voz clonada completa
  $voz = Join-Path (Join-Path $carpeta 'voz_original') 'alejandro_completo.mp3'
  $problemas += @(Revisar-Archivo -Ruta $voz -Descripcion 'la voz (voz_original\alejandro_completo.mp3)')

  # Guion
  $rutaGuion = Join-Path $carpeta 'guion.json'
  $problemasGuion = @(Revisar-Archivo -Ruta $rutaGuion -Descripcion 'el guion (guion.json)')
  $problemas += $problemasGuion
  if ($problemasGuion.Count -eq 0) {
    try {
      $guion = Leer-Guion -Ruta $rutaGuion
      if ($guion.Count -eq 0) { $problemas += 'guion.json no tiene bloques' }
      foreach ($bloque in $guion) {
        if ($null -eq $bloque.PSObject.Properties['id']) { $problemas += 'guion.json tiene un bloque sin "id"'; break }
      }
    } catch {
      $problemas += ("guion.json no es un JSON válido: {0}" -f $_.Exception.Message)
    }
  }

  # Fotos
  $rutaFotos = Join-Path $carpeta $CarpetaFotos
  if (-not (Test-Path -LiteralPath $rutaFotos -PathType Container)) {
    $problemas += "no existe la carpeta de fotos ($rutaFotos)"
  } else {
    $fotos = @(Get-ChildItem -LiteralPath $rutaFotos -File -Force |
               Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' })
    if ($fotos.Count -eq 0) {
      $problemas += "la carpeta de fotos está vacía ($rutaFotos)"
    } else {
      $enNube = @($fotos | Where-Object { ([long]$_.Attributes -band 0x400000) -or ([long]$_.Attributes -band 0x1000) })
      if ($enNube.Count -gt 0) {
        $problemas += ("{0} fotos están solo en la nube de OneDrive (ej. {1}); marca la carpeta como 'Mantener siempre en este dispositivo'" -f $enNube.Count, $enNube[0].Name)
      }
    }
  }
  return $problemas
}

# ---------------------------------------------------------------------------------------
# Producción de un video (lanza un error si algo falla)
# ---------------------------------------------------------------------------------------

function Producir-Video {
  param([string]$Num)
  $carpeta = Join-Path $Base ("video{0}" -f $Num)
  $voz = Join-Path (Join-Path $carpeta 'voz_original') 'alejandro_completo.mp3'
  $grabaciones = Join-Path $carpeta 'grabaciones'
  $audio = Join-Path $carpeta 'audio'
  $final = Join-Path $carpeta ("video{0}_final.mp4" -f $Num)
  $finalNuevoNombre = "video{0}_final_nuevo.mp4" -f $Num
  $finalNuevo = Join-Path $carpeta $finalNuevoNombre
  $vista = Join-Path $carpeta ("video{0}_vista_previa.mp4" -f $Num)
  $vistaNueva = Join-Path $carpeta ("video{0}_vista_previa_nueva.mp4" -f $Num)

  # 1) Cortar la voz por bloques
  Escribir ("== video{0}: cortando voz" -f $Num) 'Cyan'
  $inicioCorte = Get-Date
  Invocar-Herramienta -Paso ("video{0} / cortar_voz.ps1" -f $Num) -RutaScript (Join-Path $Herramientas 'cortar_voz.ps1') `
    -Argumentos @('-V', $carpeta, '-Audio', $voz)
  $bloques = @()
  if (Test-Path -LiteralPath $grabaciones -PathType Container) {
    $bloques = @(Get-ChildItem -LiteralPath $grabaciones -Filter '*.wav' -File | Sort-Object Name)
  }
  if ($bloques.Count -eq 0) {
    throw ("cortar_voz.ps1 terminó sin error pero no hay archivos .wav en {0}" -f $grabaciones)
  }
  $viejos = @($bloques | Where-Object { $_.LastWriteTime -lt $inicioCorte.AddSeconds(-5) })
  if ($viejos.Count -gt 0) {
    Escribir ("   AVISO: {0} bloques en grabaciones\ son anteriores a este corte (ej. {1}); revisa que no sobren" -f $viejos.Count, $viejos[0].Name) 'Yellow'
  }
  Escribir ("   {0} bloques de voz" -f $bloques.Count)

  # 2) Nivelar cada bloque (filtro paso-alto + volumen estándar de YouTube -14 LUFS)
  Escribir ("== video{0}: nivelando audio" -f $Num) 'Cyan'
  New-Item -ItemType Directory -Force -Path $audio | Out-Null
  Get-ChildItem -LiteralPath $audio -Filter '*.wav' -File | Remove-Item -Force
  foreach ($bloque in $bloques) {
    $salidaBloque = Join-Path $audio ($bloque.BaseName + '.wav')
    Invocar-Externo -Paso ("video{0} / nivelar {1}" -f $Num, $bloque.Name) -Exe $script:Ffmpeg -Argumentos @(
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', $bloque.FullName,
      '-af', 'highpass=f=60,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000', '-ac', '1', $salidaBloque)
  }

  # Aviso si algún bloque del guion no tiene su audio (build.ps1 lo necesitará).
  try {
    $guion = Leer-Guion -Ruta (Join-Path $carpeta 'guion.json')
    $faltantes = @($guion | ForEach-Object { "$($_.id)" } |
                   Where-Object { -not (Test-Path -LiteralPath (Join-Path $audio ($_ + '.wav'))) })
    if ($faltantes.Count -gt 0) {
      Escribir ("   AVISO: bloques del guion sin audio\<id>.wav: {0}" -f ($faltantes -join ', ')) 'Yellow'
    }
  } catch {
    Escribir ("   AVISO: no se pudo comparar guion y audios: {0}" -f $_.Exception.Message) 'Yellow'
  }

  # 3) Render 1080p a un archivo TEMPORAL (el final anterior sigue intacto)
  Escribir ("== video{0}: render 1080p (puede tardar bastante en esta PC)" -f $Num) 'Cyan'
  if (Test-Path -LiteralPath $finalNuevo) { Remove-Item -LiteralPath $finalNuevo -Force }
  $inicioRender = Get-Date
  Invocar-Herramienta -Paso ("video{0} / build.ps1" -f $Num) -RutaScript (Join-Path $Herramientas 'build.ps1') `
    -Argumentos @('-V', $carpeta, '-OutName', $finalNuevoNombre)
  Escribir ("   render terminado en {0:N1} min" -f ((Get-Date) - $inicioRender).TotalMinutes)

  # 4) Revisar el render antes de aceptarlo
  if (-not (Test-Path -LiteralPath $finalNuevo -PathType Leaf)) {
    throw ("build.ps1 terminó sin error pero no creó {0}" -f $finalNuevo)
  }
  $tamano = (Get-Item -LiteralPath $finalNuevo).Length
  if ($tamano -lt 1MB) { throw ("el render pesa solo {0:N0} bytes; está incompleto" -f $tamano) }
  $pistas = Obtener-Pistas -Ruta $finalNuevo
  if ($pistas -notcontains 'video') { throw 'el render no tiene pista de video' }
  if ($pistas -notcontains 'audio') { throw 'el render no tiene pista de audio' }
  $duracion = Obtener-Duracion -Ruta $finalNuevo
  Escribir ("   duración: {0}, tamaño: {1:N1} MB" -f (Formatear-Duracion $duracion), ($tamano / 1MB))
  if ($duracion -le $DuracionMinima) {
    throw ("el video dura {0}, debe durar más de {1:N0} s (regla del canal). Se dejó en {2} y NO se reemplazó el final" -f (Formatear-Duracion $duracion), $DuracionMinima, $finalNuevo)
  }

  # 5) Ahora sí: reemplazar el final anterior
  Reemplazar-Archivo -Nuevo $finalNuevo -Destino $final
  Escribir ("   listo: {0}" -f $final) 'Green'

  # 6) Vista previa 480p (para verla en el celular, menos de 30 MB)
  Escribir ("== video{0}: vista previa 480p" -f $Num) 'Cyan'
  if (Test-Path -LiteralPath $vistaNueva) { Remove-Item -LiteralPath $vistaNueva -Force }
  Invocar-Externo -Paso ("video{0} / vista previa 480p" -f $Num) -Exe $script:Ffmpeg -Argumentos @(
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', $final,
    '-vf', 'scale=854:480', '-c:v', 'libx264', '-preset', 'veryfast',
    '-b:v', '330k', '-maxrate', '450k', '-bufsize', '900k',
    '-c:a', 'aac', '-b:a', '80k', '-ac', '1', '-movflags', '+faststart', $vistaNueva)
  $duracionVista = Obtener-Duracion -Ruta $vistaNueva
  if ([math]::Abs($duracionVista - $duracion) -gt 2) {
    throw ("la vista previa dura {0:N1} s y el final {1:N1} s; la vista previa está incompleta" -f $duracionVista, $duracion)
  }
  Reemplazar-Archivo -Nuevo $vistaNueva -Destino $vista
  $tamanoVista = (Get-Item -LiteralPath $vista).Length / 1MB
  if ($tamanoVista -ge 30) {
    Escribir ("   AVISO: la vista previa pesa {0:N1} MB (la meta es menos de 30 MB)" -f $tamanoVista) 'Yellow'
  }
  Escribir ("   listo: {0} ({1:N1} MB)" -f $vista, $tamanoVista) 'Green'

  return $duracion
}

# ---------------------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------------------

$candado = $null
$codigoFinal = 0
$resultados = New-Object System.Collections.ArrayList
try {
  Escribir '=========================================================' 'White'
  Escribir ' Versión Superior - producción con voz clonada' 'White'
  Escribir '=========================================================' 'White'
  Escribir ("Bitácora: {0}" -f $script:RutaLog)
  Escribir ("Carpeta base: {0}" -f $Base)
  Escribir ("Herramientas: {0}" -f $Herramientas)

  # --- Candado: impide que corran dos producciones a la vez (en lugar de matar ffmpeg) ---
  $rutaCandado = Join-Path ([System.IO.Path]::GetTempPath()) 'version_superior_producir.lock'
  try {
    $candado = [System.IO.File]::Open($rutaCandado, 'OpenOrCreate', 'ReadWrite', 'None')
  } catch {
    throw 'Ya hay otra producción corriendo (otra ventana o tarea en segundo plano). Espera a que termine o ciérrala, y vuelve a intentar.'
  }

  # --- Otros ffmpeg abiertos: solo se avisa, NO se cierran ---
  $otrosFfmpeg = @(Get-Process -Name ffmpeg -ErrorAction SilentlyContinue)
  if ($otrosFfmpeg.Count -gt 0) {
    Escribir ("AVISO: hay {0} ffmpeg abiertos de antes (PID: {1}). No se cierran; si son de una corrida vieja colgada, ciérralos desde el Administrador de tareas. Mientras sigan, todo irá más lento." -f $otrosFfmpeg.Count, (($otrosFfmpeg | ForEach-Object { $_.Id }) -join ', ')) 'Yellow'
  }

  # --- Requisitos generales ---
  Escribir 'Revisando requisitos...' 'Cyan'
  $faltan = @()
  $cmdFfmpeg = Get-Command ffmpeg -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  $cmdFfprobe = Get-Command ffprobe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $cmdFfmpeg) { $faltan += 'ffmpeg no está en el PATH (instálalo con: winget install Gyan.FFmpeg y abre otra ventana)' }
  if ($null -eq $cmdFfprobe) { $faltan += 'ffprobe no está en el PATH (viene con ffmpeg)' }
  foreach ($herramienta in @('cortar_voz.ps1', 'build.ps1')) {
    if (-not (Test-Path -LiteralPath (Join-Path $Herramientas $herramienta) -PathType Leaf)) {
      $faltan += "falta la herramienta $herramienta en $Herramientas"
    }
  }
  if (-not (Test-Path -LiteralPath $Base -PathType Container)) { $faltan += "no existe la carpeta base $Base" }
  if ($faltan.Count -gt 0) {
    foreach ($falta in $faltan) { Escribir ("   FALTA: {0}" -f $falta) 'Red' }
    throw 'No se cumplen los requisitos generales; no se produjo ningún video.'
  }
  $script:Ffmpeg = $cmdFfmpeg.Path
  $script:Ffprobe = $cmdFfprobe.Path
  Escribir ("   ffmpeg: {0}" -f $script:Ffmpeg)

  # --- Requisitos de cada video ---
  # Con "powershell -File", "-Videos 03,05" llega como UN solo texto "03,05": se separa aquí.
  $numeros = @($Videos | ForEach-Object { $_ -split '[,;\s]+' } | Where-Object { $_ } |
               ForEach-Object { Normalizar-Numero $_ } | Select-Object -Unique)
  $listos = @()
  foreach ($num in $numeros) {
    $problemas = @(Revisar-Video -Num $num)
    if ($problemas.Count -eq 0) {
      Escribir ("   video{0}: OK" -f $num) 'Green'
      $listos += $num
    } else {
      foreach ($problema in $problemas) { Escribir ("   video{0}: {1}" -f $num, $problema) 'Red' }
      [void]$resultados.Add([pscustomobject]@{ Video = "video$num"; Estado = 'FALLÓ'; Detalle = 'revisión previa: ' + ($problemas -join '; ') })
    }
  }

  # --- Producción, un video a la vez; si uno falla se sigue con el siguiente ---
  foreach ($num in $listos) {
    $inicioVideo = Get-Date
    try {
      # Se toma el último valor que devuelve la función (la duración del video).
      $duracionFinal = [double](@(Producir-Video -Num $num)[-1])
      $minutos = ((Get-Date) - $inicioVideo).TotalMinutes
      Escribir ("== video{0} listo: {1} (en {2:N1} min)" -f $num, (Formatear-Duracion $duracionFinal), $minutos) 'Green'
      [void]$resultados.Add([pscustomobject]@{ Video = "video$num"; Estado = 'OK'; Detalle = (Formatear-Duracion $duracionFinal) })
    } catch {
      $mensaje = $_.Exception.Message
      Escribir ("== video{0} FALLÓ: {1}" -f $num, $mensaje) 'Red'
      Escribir ("   (línea {0} de producir.ps1)" -f $_.InvocationInfo.ScriptLineNumber) 'DarkGray'
      [void]$resultados.Add([pscustomobject]@{ Video = "video$num"; Estado = 'FALLÓ'; Detalle = $mensaje })
    }
  }
} catch {
  Escribir ("ERROR GENERAL: {0}" -f $_.Exception.Message) 'Red'
  $codigoFinal = 2
} finally {
  # --- Resumen ---
  Escribir ''
  Escribir '======================== RESUMEN ========================' 'White'
  if ($resultados.Count -eq 0) {
    Escribir 'No se produjo ningún video.' 'Red'
  }
  foreach ($r in $resultados) {
    $color = 'Green'
    if ($r.Estado -ne 'OK') { $color = 'Red' }
    Escribir ("{0,-8} {1,-6} {2}" -f $r.Video, $r.Estado, $r.Detalle) $color
  }
  $fallidos = @($resultados | Where-Object { $_.Estado -ne 'OK' })
  if ($codigoFinal -eq 0 -and ($fallidos.Count -gt 0 -or $resultados.Count -eq 0)) { $codigoFinal = 1 }
  Escribir ("Bitácora guardada en: {0}" -f $script:RutaLog)
  if ($codigoFinal -ne 0) {
    Escribir 'Si algo falló, manda el archivo .log a la sesión de Claude.' 'Yellow'
  }
  if ($null -ne $candado) { $candado.Dispose() }
  if ($null -ne $script:Bitacora) { $script:Bitacora.Dispose() }
}
exit $codigoFinal
