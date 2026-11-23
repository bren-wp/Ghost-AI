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
Add-Type -TypeDefinition @'
using System;
using System.Text;
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
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool ShowWindow(IntPtr handle, int code);
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetProcessDPIAware();
  public delegate bool EnumWindowsProc(IntPtr window, IntPtr param);
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr param);
  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr window);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr window, StringBuilder output, int maxLength);
  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr window, out uint pid);
  [StructLayout(LayoutKind.Sequential)]
  public struct POINT { public int X, Y; }
  [DllImport("user32.dll")]
  public static extern bool GetClientRect(IntPtr window, out RECT rect);
  [DllImport("user32.dll")]
  public static extern bool ClientToScreen(IntPtr window, ref POINT point);
  [DllImport("user32.dll")]
  public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")]
  public static extern void mouse_event(uint flags, uint x, uint y, uint data, UIntPtr extra);
  public static IntPtr FindAppWindow(int processId) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((window, _) => {
      uint owner;
      GetWindowThreadProcessId(window, out owner);
      if (owner != (uint)processId || !IsWindowVisible(window)) return true;
      var title = new StringBuilder(256);
      GetWindowText(window, title, title.Capacity);
      if (!string.Equals(title.ToString().Trim(), "Ghost AI", StringComparison.OrdinalIgnoreCase))
        return true;
      found = window;
      return false;
    }, IntPtr.Zero);
    return found;
  }
  public static void ClickHeaderSettings(IntPtr window) {
    RECT client;
    if (!GetClientRect(window, out client)) throw new InvalidOperationException("Cannot read app client bounds");
    // Actual header button is right-aligned in the 64px-tall webview header.
    var target = new POINT { X = client.Right - 34, Y = 34 };
    if (!ClientToScreen(window, ref target)) throw new InvalidOperationException("Cannot locate Settings button");
    if (!SetCursorPos(target.X, target.Y)) throw new InvalidOperationException("Cannot point at Settings button");
    mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
    mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
  }
}
'@
[void][GhostAiWindowCapture]::SetProcessDPIAware()
Add-Type -AssemblyName System.Windows.Forms

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
    $window = [GhostAiWindowCapture]::FindAppWindow($process.Id)
  } while ($window -eq [IntPtr]::Zero -and (Get-Date) -lt $deadline)

  if ($window -eq [IntPtr]::Zero) {
    throw "NOT VERIFIED: No visible window titled Ghost AI belongs to PID $($process.Id); refusing to capture an unrelated Windows desktop"
  }
  Write-Host "Verified Ghost AI window PID=$($process.Id) HWND=$window"
  $display = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  if ($ViewportWidth -gt 0 -and $ViewportHeight -gt 0) {
    if ($ViewportWidth -gt $display.Width -or $ViewportHeight -gt $display.Height) {
      throw "NOT VERIFIED: requested viewport ${ViewportWidth}x${ViewportHeight} exceeds CI desktop $($display.Width)x$($display.Height)"
    }
    if (-not [GhostAiWindowCapture]::MoveWindow($window, $display.Left, $display.Top, $ViewportWidth, $ViewportHeight, $true)) {
      throw "Could not resize main window to ${ViewportWidth}x${ViewportHeight}"
    }
  }
  [void][GhostAiWindowCapture]::ShowWindow($window, 9)
  [void][GhostAiWindowCapture]::SetForegroundWindow($window)
  Start-Sleep -Seconds 6
  # A real connection panel is now nonmodal; Settings must stay reachable.
  # Escape can still dismiss an older first-run modal when applicable.
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}')
  Start-Sleep -Milliseconds 750
  [void][GhostAiWindowCapture]::SetForegroundWindow($window)
  Start-Sleep -Milliseconds 350
  if ([GhostAiWindowCapture]::GetForegroundWindow() -ne $window) {
    throw "NOT VERIFIED: Ghost AI is not foreground; refusing a desktop/console screenshot"
  }
  $rect = New-Object GhostAiWindowCapture+RECT
  if (-not [GhostAiWindowCapture]::GetWindowRect($window, [ref]$rect)) {
    throw "Cannot read Ghost AI window dimensions"
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  Write-Host ("Verified Ghost AI window bounds: (" + $rect.Left + "," + $rect.Top + ") " + $width + "x" + $height)
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
      # Keyboard synthesis may not reach WebView2 on a hosted runner.
      # Use the actual visible Settings button moved to the app header.
      # Both attempts require a real, independently captured UI change.
      Write-Host "Settings shortcut was not visually confirmed; clicking real header Settings button"
      [void][GhostAiWindowCapture]::SetForegroundWindow($window)
      [GhostAiWindowCapture]::ClickHeaderSettings($window)
      Start-Sleep -Seconds 3
      if ([GhostAiWindowCapture]::GetForegroundWindow() -ne $window) {
        throw "NOT VERIFIED: Ghost AI lost focus during Settings verification"
      }
      $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))
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
        throw "NOT VERIFIED: neither Ctrl+, nor the actual Settings header button visibly opened Settings"
      }
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
