# Ghost AI by Brendigo
param(
  [Parameter(Mandatory = $true)][string]$Executable,
  [Parameter(Mandatory = $true)][string]$Output
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not (Test-Path -LiteralPath $Executable -PathType Leaf)) {
  throw "Ghost AI executable not found"
}

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class GhostAiWindowCapture {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool GetWindowRect(IntPtr handle, out RECT rect);
}
'@

$process = $null
$bitmap = $null
$graphics = $null
try {
  $process = Start-Process -FilePath (Resolve-Path -LiteralPath $Executable).Path -PassThru
  $deadline = (Get-Date).AddSeconds(35)
  $window = [IntPtr]::Zero
  do {
    Start-Sleep -Milliseconds 700
    $process.Refresh()
    if ($process.HasExited) { throw "Ghost AI closed before its window appeared" }
    $window = $process.MainWindowHandle
  } while ($window -eq [IntPtr]::Zero -and (Get-Date) -lt $deadline)

  if ($window -eq [IntPtr]::Zero) { throw "Ghost AI window is not available" }
  Start-Sleep -Seconds 6
  $rect = New-Object GhostAiWindowCapture+RECT
  if (-not [GhostAiWindowCapture]::GetWindowRect($window, [ref]$rect)) {
    throw "Cannot read Ghost AI window dimensions"
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 680 -or $height -lt 400) { throw "Invalid Ghost AI window dimensions" }

  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))

  $samples = [System.Collections.Generic.HashSet[int]]::new()
  for ($y = 12; $y -lt $height - 12; $y += [Math]::Max(1, [int]($height / 16))) {
    for ($x = 12; $x -lt $width - 12; $x += [Math]::Max(1, [int]($width / 16))) {
      [void]$samples.Add($bitmap.GetPixel($x, $y).ToArgb())
    }
  }
  if ($samples.Count -lt 8) { throw "Screenshot appears blank or visually invalid" }

  $destination = [System.IO.Path]::GetFullPath($Output)
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destination)) | Out-Null
  $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  if ((Get-Item $destination).Length -lt 20000) { throw "Screenshot file appears incomplete" }
  Write-Host "Ghost AI first-run screenshot captured from the running application"
}
finally {
  if ($graphics) { $graphics.Dispose() }
  if ($bitmap) { $bitmap.Dispose() }
  if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
}
