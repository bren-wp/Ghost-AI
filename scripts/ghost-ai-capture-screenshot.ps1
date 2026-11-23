# Ghost AI by Brendigo
param(
  [Parameter(Mandatory = $true)][string]$Executable,
  [Parameter(Mandatory = $true)][string]$Output,
  [int]$ViewportWidth = 0,
  [int]$ViewportHeight = 0,
  [switch]$OpenSettings
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
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool MoveWindow(IntPtr handle, int x, int y, int width, int height, bool repaint);
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetForegroundWindow(IntPtr handle);
}
'@

$process = $null
$bitmap = $null
$graphics = $null
$beforeBitmap = $null
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
  $display = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  if ($ViewportWidth -gt 0 -and $ViewportHeight -gt 0) {
    if ($ViewportWidth -gt $display.Width -or $ViewportHeight -gt $display.Height) {
      throw "NOT VERIFIED: requested viewport ${ViewportWidth}x${ViewportHeight} exceeds CI desktop $($display.Width)x$($display.Height)"
    }
    if (-not [GhostAiWindowCapture]::MoveWindow($window, $display.Left, $display.Top, $ViewportWidth, $ViewportHeight, $true)) {
      throw "Could not resize main window to ${ViewportWidth}x${ViewportHeight}"
    }
  }
  [void][GhostAiWindowCapture]::SetForegroundWindow($window)
  Start-Sleep -Seconds 6
  # An unconfigured first run intentionally opens the "Connect an AI model"
  # onboarding modal. Global Settings shortcuts correctly do nothing behind
  # a blocking dialog. Dismiss onboarding exactly as a user would; do not
  # suppress the onboarding flow in the production app or fake a screenshot.
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}')
  Start-Sleep -Milliseconds 1200
  [void][GhostAiWindowCapture]::SetForegroundWindow($window)
  $rect = New-Object GhostAiWindowCapture+RECT
  if (-not [GhostAiWindowCapture]::GetWindowRect($window, [ref]$rect)) {
    throw "Cannot read Ghost AI window dimensions"
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 680 -or $height -lt 400) { throw "Invalid Ghost AI window dimensions" }

  if ($OpenSettings) {
    $beforeBitmap = [System.Drawing.Bitmap]::new($width, $height)
    $beforeGraphics = [System.Drawing.Graphics]::FromImage($beforeBitmap)
    try {
      $beforeGraphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))
    } finally {
      $beforeGraphics.Dispose()
    }
    [System.Windows.Forms.SendKeys]::SendWait('^,')
    Start-Sleep -Seconds 3
  }
  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))

  if ($OpenSettings) {
    # A real Settings overlay changes a large fraction of the image. Merely
    # sending a shortcut is not proof that a dialog actually appeared.
    $changed = 0
    $checked = 0
    for ($y = 12; $y -lt $height - 12; $y += [Math]::Max(1, [int]($height / 16))) {
      for ($x = 12; $x -lt $width - 12; $x += [Math]::Max(1, [int]($width / 16))) {
        $checked++
        if ($beforeBitmap.GetPixel($x, $y).ToArgb() -ne $bitmap.GetPixel($x, $y).ToArgb()) {
          $changed++
        }
      }
    }
    if ($checked -eq 0 -or $changed / $checked -lt 0.15) {
      throw "NOT VERIFIED: Settings shortcut did not visibly open the dialog"
    }
  }

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
  Write-Host "Ghost AI real Windows screenshot: $destination (viewport ${ViewportWidth}x${ViewportHeight}; Settings: $OpenSettings)"
}
finally {
  if ($graphics) { $graphics.Dispose() }
  if ($bitmap) { $bitmap.Dispose() }
  if ($beforeBitmap) { $beforeBitmap.Dispose() }
  if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
}
