# Ghost AI by Brendigo
# Observe the first visible native window frames rather than a screenshot
# captured several seconds after startup. This requires an interactive desktop.
param(
  [Parameter(Mandatory = $true)][string]$Executable,
  [string]$OutputDirectory = 'smoke/first-paint',
  [int]$ObserveSeconds = 18,
  [int]$SampleIntervalMs = 85
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$exe = (Resolve-Path -LiteralPath $Executable).Path
$destination = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($destination) | Out-Null

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class GhostAiFirstPaint {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr handle);
  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr handle, out RECT rect);
}
'@

$started = Get-Date
$process = $null
$firstFrame = $null
$sampled = 0
$whiteFrames = 0
$maxWhiteRatio = 0.0
$maxBrightRatio = 0.0
$nonBlankFrames = 0
$firstVisibleMs = -1
$samplingError = $null
try {
  $process = Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe -Parent) -PassThru
  $deadline = $started.AddSeconds($ObserveSeconds)
  while ((Get-Date) -lt $deadline) {
    $process.Refresh()
    if ($process.HasExited) {
      throw "Ghost AI exited during first-paint check (code $($process.ExitCode))"
    }

    $handle = $process.MainWindowHandle
    if ($handle -eq [IntPtr]::Zero -or -not [GhostAiFirstPaint]::IsWindowVisible($handle)) {
      Start-Sleep -Milliseconds $SampleIntervalMs
      continue
    }

    if ($firstVisibleMs -lt 0) {
      $firstVisibleMs = [int]((Get-Date) - $started).TotalMilliseconds
    }

    $rect = New-Object GhostAiFirstPaint+RECT
    if (-not [GhostAiFirstPaint]::GetWindowRect($handle, [ref]$rect)) {
      Start-Sleep -Milliseconds $SampleIntervalMs
      continue
    }
    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    if ($width -lt 680 -or $height -lt 400) {
      Start-Sleep -Milliseconds $SampleIntervalMs
      continue
    }

    $bitmap = [System.Drawing.Bitmap]::new($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))

      if ($null -eq $firstFrame) {
        $firstFrame = Join-Path $destination 'first-visible-frame.png'
        $bitmap.Save($firstFrame, [System.Drawing.Imaging.ImageFormat]::Png)
      }

      # The edge and center grid catches a mostly-white WebView, not isolated
      # white buttons or text. Inspect the PNG too: no frame sampler proves
      # that sub-85ms flashes did not occur.
      $white = 0
      $bright = 0
      $count = 0
      $distinct = [System.Collections.Generic.HashSet[int]]::new()
      for ($y = 12; $y -lt $height - 12; $y += [Math]::Max(1, [int]($height / 18))) {
        for ($x = 12; $x -lt $width - 12; $x += [Math]::Max(1, [int]($width / 18))) {
          $pixel = $bitmap.GetPixel($x, $y)
          $count++
          [void]$distinct.Add($pixel.ToArgb())
          if ($pixel.R -ge 245 -and $pixel.G -ge 245 -and $pixel.B -ge 245) { $white++ }
          if ($pixel.R -ge 220 -and $pixel.G -ge 220 -and $pixel.B -ge 220) { $bright++ }
        }
      }
      if ($count -gt 0) {
        $sampled++
        $whiteRatio = $white / $count
        $brightRatio = $bright / $count
        $maxWhiteRatio = [Math]::Max($maxWhiteRatio, $whiteRatio)
        $maxBrightRatio = [Math]::Max($maxBrightRatio, $brightRatio)
        if ($whiteRatio -gt 0.80) { $whiteFrames++ }
        if ($distinct.Count -ge 8) { $nonBlankFrames++ }
      }
    } catch {
      $samplingError = 'Desktop capture unavailable: ' + $_.Exception.GetType().Name
      break
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }

    if ($sampled -ge 25) { break }
    Start-Sleep -Milliseconds $SampleIntervalMs
  }
} finally {
  if ($process -and -not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
}

$report = @(
  'Ghost AI by Brendigo - Windows first visible frame'
  "First visible after ms: $firstVisibleMs"
  "Visible frames sampled: $sampled"
  "Frames with >80% white pixels: $whiteFrames"
  "Maximum white pixel ratio: $([Math]::Round($maxWhiteRatio, 4))"
  "Maximum bright pixel ratio: $([Math]::Round($maxBrightRatio, 4))"
  "Frames with >=8 distinct colors: $nonBlankFrames"
  "Sample interval requested (ms): $SampleIntervalMs"
  "Capture warning: $samplingError"
  'NOTE: This sample does not rule out flashes shorter than the capture interval.'
)
$reportPath = Join-Path $destination 'first-paint-report.txt'
$report | Set-Content -Path $reportPath -Encoding utf8
$report | ForEach-Object { Write-Host $_ }

if ($firstVisibleMs -lt 0 -or $sampled -eq 0 -or $nonBlankFrames -eq 0) {
  throw 'NOT VERIFIED: no usable visible desktop frames were captured'
}
if ($whiteFrames -gt 0) {
  throw 'WHITE FLASH DETECTED in first visible Ghost AI frames'
}
