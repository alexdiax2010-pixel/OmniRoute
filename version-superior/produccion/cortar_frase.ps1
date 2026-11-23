#requires -Version 5.1
<#
.SYNOPSIS
  Quita un tramo [Inicio, Fin] de la voz voz_original\alejandro_completo.mp3 de un video,
  con un fundido corto (30 ms) a cada lado del corte, SIN gastar créditos de ElevenLabs.
  Se corre ANTES de producir.ps1.

.DESCRIPTION
  Caso actual: en el video 4 sobra la frase ", de eso ya hay un video entero en el canal"
  (ese video todavía no existe). Por proporción de palabras cae cerca del minuto 5:28 de los
  516 s, pero los segundos exactos hay que encontrarlos ESCUCHANDO (ver INSTRUCCIONES.md).

  Qué hace:
  1. La primera vez guarda una copia del original: voz_original\alejandro_completo.original.mp3
     (nunca la sobrescribe). Los cortes siempre se hacen A PARTIR DE ESA COPIA, así que si te
     equivocas de segundos, solo vuelve a correrlo con los segundos corregidos.
  2. Con -Escuchar: NO cambia nada; crea voz_original\prueba_corte.mp3 con 4 s antes y 4 s
     después del corte ya unidos, y lo abre para que oigas si quedó bien.
  3. Sin -Escuchar: crea la voz nueva en un archivo temporal, revisa su duración y solo
     entonces reemplaza alejandro_completo.mp3.

  Los tiempos se aceptan en segundos (327.4 o 327,4) o en minutos:segundos (5:27.4).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File cortar_frase.ps1 -Video 04 -Inicio 5:27.4 -Fin 5:30.1 -Escuchar

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File cortar_frase.ps1 -Video 04 -Inicio 5:27.4 -Fin 5:30.1
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Video,
  [Parameter(Mandatory = $true)][string]$Inicio,
  [Parameter(Mandatory = $true)][string]$Fin,
  [string]$Base = 'C:\Users\alexa\OneDrive\Documentos\Version Superior',
  # Duración del fundido en segundos (0.03 = 30 ms).
  [double]$Fundido = 0.03,
  # Solo crear y abrir el archivo de prueba; no cambia la voz.
  [switch]$Escuchar
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { $null = $_ }
if ($env:OS -eq 'Windows_NT') {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User')
}
$cultura = [System.Globalization.CultureInfo]::InvariantCulture

# Convierte "327.4", "327,4" o "5:27.4" en segundos.
function Convertir-Tiempo {
  param([string]$Texto)
  $limpio = $Texto.Trim().Replace(',', '.')
  $partes = $limpio.Split(':')
  $total = 0.0
  foreach ($parte in $partes) {
    $valor = 0.0
    if (-not [double]::TryParse($parte, [System.Globalization.NumberStyles]::Float, $cultura, [ref]$valor)) {
      throw "tiempo no válido: '$Texto' (usa por ejemplo 327.4 o 5:27.4)"
    }
    $total = $total * 60 + $valor
  }
  return $total
}

# Ejecuta ffmpeg/ffprobe y falla con un mensaje claro si el código de salida no es 0.
function Invocar-Externo {
  param([string]$Paso, [string]$Exe, [string[]]$Argumentos)
  $preferenciaAnterior = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $global:LASTEXITCODE = 0
    $salida = @(& $Exe @Argumentos 2>&1 | ForEach-Object { $_.ToString() })
    $codigo = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $preferenciaAnterior
  }
  if ($codigo -ne 0) {
    $salida | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
    throw ("falló el paso [{0}] con código de salida {1}" -f $Paso, $codigo)
  }
  return $salida
}

function Obtener-Duracion {
  param([string]$Ruta)
  $texto = (@(Invocar-Externo -Paso "leer duración de $Ruta" -Exe 'ffprobe' -Argumentos @(
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', $Ruta)) -join '').Trim()
  return [double]::Parse($texto, $cultura)
}

# Los números van con punto decimal dentro de los filtros de ffmpeg.
function T { param([double]$Segundos) return $Segundos.ToString('0.###', $cultura) }

try {
  foreach ($programa in @('ffmpeg', 'ffprobe')) {
    if ($null -eq (Get-Command $programa -CommandType Application -ErrorAction SilentlyContinue)) {
      throw "$programa no está en el PATH (instala FFmpeg con winget y abre otra ventana)"
    }
  }

  $num = '{0:D2}' -f [int]($Video -replace '[^0-9]', '')
  $carpetaVoz = Join-Path (Join-Path $Base ("video{0}" -f $num)) 'voz_original'
  $voz = Join-Path $carpetaVoz 'alejandro_completo.mp3'
  $original = Join-Path $carpetaVoz 'alejandro_completo.original.mp3'
  $temporal = Join-Path $carpetaVoz 'alejandro_completo.nuevo.mp3'
  $prueba = Join-Path $carpetaVoz 'prueba_corte.mp3'

  if (-not (Test-Path -LiteralPath $voz -PathType Leaf) -and -not (Test-Path -LiteralPath $original -PathType Leaf)) {
    throw "no existe $voz"
  }

  # 1) Copia de seguridad del original (solo la primera vez)
  if (-not (Test-Path -LiteralPath $original -PathType Leaf)) {
    Copy-Item -LiteralPath $voz -Destination $original
    Write-Host "Copia del original guardada en: $original" -ForegroundColor Green
  } else {
    Write-Host "Se usa la copia del original que ya existía: $original"
  }

  $segIni = Convertir-Tiempo $Inicio
  # OJO: no llamar $fin a esta variable: PowerShell no distingue mayúsculas y pisaría el parámetro [string]$Fin.
  $segFin = Convertir-Tiempo $Fin
  $durOriginal = Obtener-Duracion $original
  if ($segIni -le $Fundido) { throw 'el inicio del corte está demasiado cerca del principio' }
  if ($segFin -le $segIni) { throw ("el fin ({0}) debe ser mayor que el inicio ({1})" -f (T $segFin), (T $segIni)) }
  if ($segFin -ge $durOriginal - $Fundido) { throw ("el fin ({0} s) pasa del final del audio ({1} s)" -f (T $segFin), (T $durOriginal)) }
  $quitado = $segFin - $segIni
  if ($quitado -gt 15) { throw ("el tramo a quitar mide {0} s; para una frase es demasiado, revisa los tiempos" -f (T $quitado)) }
  Write-Host ("Original: {0} s. Se quita de {1} s a {2} s ({3} s)." -f (T $durOriginal), (T $segIni), (T $segFin), (T $quitado))

  # Filtro: parte A (hasta Inicio, se apaga en 30 ms) + parte B (desde Fin, se enciende en 30 ms).
  $antes = 0.0
  $despues = $durOriginal
  if ($Escuchar) {
    # Solo 4 s antes y 4 s después del corte, para oírlo rápido.
    $antes = [math]::Max([double]0, $segIni - 4)
    $despues = [math]::Min([double]$durOriginal, $segFin + 4)
  }
  $filtro = ('[0:a]asplit=2[x][y];' +
             '[x]atrim=start={0}:end={1},asetpts=PTS-STARTPTS,afade=t=out:st={2}:d={3}[a];' +
             '[y]atrim=start={4}:end={5},asetpts=PTS-STARTPTS,afade=t=in:st=0:d={3}[b];' +
             '[a][b]concat=n=2:v=0:a=1[out]') -f (T $antes), (T $segIni), (T ($segIni - $antes - $Fundido)), (T $Fundido), (T $segFin), (T $despues)

  $destino = $temporal
  if ($Escuchar) { $destino = $prueba }
  if (Test-Path -LiteralPath $destino) { Remove-Item -LiteralPath $destino -Force }
  $null = Invocar-Externo -Paso 'cortar la frase' -Exe 'ffmpeg' -Argumentos @(
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', $original,
    '-filter_complex', $filtro, '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '2', $destino)

  if ($Escuchar) {
    Write-Host "Prueba creada: $prueba (4 s antes + 4 s después del corte). Se abre ahora..." -ForegroundColor Green
    Write-Host 'Si suena bien, vuelve a correr el MISMO comando sin -Escuchar.'
    try { Invoke-Item -LiteralPath $prueba } catch { Write-Host 'Ábrelo tú con doble clic.' }
    exit 0
  }

  # 2) Revisar la duración antes de reemplazar
  $durNueva = Obtener-Duracion $temporal
  $esperada = $durOriginal - $quitado
  if ([math]::Abs($durNueva - $esperada) -gt 0.5) {
    throw ("la voz nueva dura {0} s y se esperaban unos {1} s; no se reemplazó nada (queda en {2})" -f (T $durNueva), (T $esperada), $temporal)
  }
  if ($durNueva -le 480) {
    Write-Host ("AVISO: la voz quedó en {0} s; el video debe durar más de 480 s." -f (T $durNueva)) -ForegroundColor Yellow
  }

  # 3) Reemplazar la voz (el original sigue a salvo en alejandro_completo.original.mp3)
  Move-Item -LiteralPath $temporal -Destination $voz -Force
  Write-Host ("Listo: {0} ahora dura {1} s (antes {2} s)." -f $voz, (T $durNueva), (T $durOriginal)) -ForegroundColor Green
  Write-Host 'Ahora corre producir.ps1 para este video.'
  exit 0
} catch {
  Write-Host ("ERROR: {0}" -f $_.Exception.Message) -ForegroundColor Red
  exit 1
}
