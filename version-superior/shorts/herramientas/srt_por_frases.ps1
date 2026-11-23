<#
  srt_por_frases.ps1 — Subtítulos sincronizados por frases para un short, SIN gastar créditos.

  Qué hace:
   1. Lee el short de plan-shorts.json (texto exacto + inicio/fin aproximados).
   2. Ajusta el inicio y el fin a la pausa más cercana del audio (ffmpeg silencedetect).
   3. Parte el texto en frases (. ? ! :) y cada frase en trozos de pocas palabras.
   4. Pega cada cambio de frase a una pausa real del audio y reparte los trozos de cada frase
      según su número de letras (las palabras largas tardan más).
   5. Escribe un .srt con tiempos relativos al inicio del short.

  Uso (PowerShell, con ffmpeg en el PATH):
    .\srt_por_frases.ps1 -Plan ..\plan-shorts.json -Id s02-1 -Audio "C:\...\video02\voz.mp3" -Out s02-1.srt
  Opcionales: -Offset 1.5 (si la voz empieza 1.5 s después del inicio del short, p. ej. tras el gancho)
              -MaxPalabras 3  -Ruido -35  -PausaMin 0.18
  Imprime el inicio/fin ajustados: úsalos para cortar el audio (ffmpeg -ss <inicio> -to <fin>).
#>
param(
  [Parameter(Mandatory = $true)][string]$Plan,
  [Parameter(Mandatory = $true)][string]$Id,
  [Parameter(Mandatory = $true)][string]$Audio,
  [Parameter(Mandatory = $true)][string]$Out,
  [double]$Offset = 0,
  [int]$MaxPalabras = 3,
  [int]$Ruido = -35,
  [double]$PausaMin = 0.18
)
$Inv = [Globalization.CultureInfo]::InvariantCulture
function F([double]$x) { return $x.ToString('0.000', $Inv) }

$planObj = Get-Content -Raw -Encoding UTF8 $Plan | ConvertFrom-Json
$s = $planObj.shorts | Where-Object { $_.id -eq $Id }
if (-not $s) { throw ("No existe el short {0} en {1}" -f $Id, $Plan) }

# --- 1) Pausas del audio alrededor del fragmento (ventana de ±5 s)
$ventIni = [Math]::Max(0, [double]$s.inicio_s - 5)
$ventDur = ([double]$s.fin_s + 5) - $ventIni
$filtro = 'silencedetect=noise={0}dB:d={1}' -f $Ruido, (F $PausaMin)
$prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
$log = & ffmpeg -hide_banner -nostats -ss (F $ventIni) -t (F $ventDur) -i $Audio -af $filtro -f null - 2>&1 | ForEach-Object { "$_" }
$ErrorActionPreference = $prev

$pausas = @()
$ini = $null
foreach ($l in $log) {
  if ($l -match 'silence_start:\s*(-?[0-9.]+)') { $ini = [double]::Parse($Matches[1], $Inv) + $ventIni }
  elseif ($l -match 'silence_end:\s*([0-9.]+)' -and $ini -ne $null) {
    $fin = [double]::Parse($Matches[1], $Inv) + $ventIni
    $pausas += [pscustomobject]@{ a = $ini; b = $fin; m = ($ini + $fin) / 2 }
    $ini = $null
  }
}
Write-Host ("Pausas detectadas en la ventana: {0}" -f $pausas.Count)

# --- 2) Ajustar inicio (fin de una pausa) y fin (comienzo de una pausa) dentro de ±3 s
$t0 = [double]$s.inicio_s; $t1 = [double]$s.fin_s
$c = $pausas | Where-Object { [Math]::Abs($_.b - $t0) -le 3 } | Sort-Object { [Math]::Abs($_.b - $t0) } | Select-Object -First 1
if ($c) { $t0 = $c.b }
$c = $pausas | Where-Object { [Math]::Abs($_.a - $t1) -le 3 } | Sort-Object { [Math]::Abs($_.a - $t1) } | Select-Object -First 1
if ($c) { $t1 = $c.a }
Write-Host ("Corte ajustado: inicio {0} s  fin {1} s  (duración {2} s)" -f (F $t0), (F $t1), (F ($t1 - $t0)))

# --- 3) Frases y trozos
$texto = [string]$s.texto
$frases = [regex]::Split($texto.Trim(), '(?<=[.?!:])\s+') | Where-Object { $_.Trim() -ne '' }
$largo = @($frases | ForEach-Object { $_.Length })
$totalLetras = ($largo | Measure-Object -Sum).Sum

# --- 4) Límites de frase: estimación proporcional y ajuste a la pausa más cercana (±1.2 s, en orden)
$lim = @([pscustomobject]@{ finFrase = $t0; iniSig = $t0 })
$acum = 0
$internas = @($pausas | Where-Object { $_.a -gt $t0 + 0.3 -and $_.b -lt $t1 - 0.3 })
for ($i = 0; $i -lt $frases.Count - 1; $i++) {
  $acum += $largo[$i]
  $est = $t0 + ($t1 - $t0) * $acum / $totalLetras
  $ultimo = [double]$lim[$lim.Count - 1].iniSig
  $p = $internas | Where-Object { $_.a -gt $ultimo + 0.2 -and [Math]::Abs($_.m - $est) -le 1.2 } |
       Sort-Object { [Math]::Abs($_.m - $est) } | Select-Object -First 1
  if ($p) { $lim += [pscustomobject]@{ finFrase = $p.a; iniSig = $p.b } }
  else    { $lim += [pscustomobject]@{ finFrase = $est; iniSig = $est } }
}

# --- 5) Repartir trozos dentro de cada frase y escribir SRT
function Ts([double]$x) {
  if ($x -lt 0) { $x = 0 }
  $ms = [int][Math]::Round($x * 1000)
  return ('{0:00}:{1:00}:{2:00},{3:000}' -f [int][Math]::Floor($ms / 3600000), [int][Math]::Floor(($ms % 3600000) / 60000), [int][Math]::Floor(($ms % 60000) / 1000), ($ms % 1000))
}
$sb = New-Object System.Text.StringBuilder
$n = 1
for ($i = 0; $i -lt $frases.Count; $i++) {
  if ($i -eq 0) { $fa = $t0 } else { $fa = $lim[$i].iniSig }
  if ($i -eq $frases.Count - 1) { $fb = $t1 } else { $fb = $lim[$i + 1].finFrase }
  $pal = $frases[$i].Trim() -split '\s+'
  $trozos = @()
  for ($k = 0; $k -lt $pal.Count; $k += $MaxPalabras) {
    $hasta = [Math]::Min($k + $MaxPalabras, $pal.Count) - 1
    $trozos += ($pal[$k..$hasta] -join ' ')
  }
  $letras = ($trozos | ForEach-Object { $_.Length } | Measure-Object -Sum).Sum
  $t = $fa
  foreach ($tr in $trozos) {
    $d = ($fb - $fa) * $tr.Length / $letras
    [void]$sb.AppendLine($n); $n++
    [void]$sb.AppendLine(('{0} --> {1}' -f (Ts ($t - $t0 + $Offset)), (Ts ($t + $d - $t0 + $Offset))))
    [void]$sb.AppendLine($tr.ToUpper())
    [void]$sb.AppendLine('')
    $t += $d
  }
}
[IO.File]::WriteAllText($Out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("SRT escrito: {0} ({1} subtítulos)" -f $Out, ($n - 1))
