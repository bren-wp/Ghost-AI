# Ghost AI by Brendigo
param(
  [Parameter(Mandatory = $true)][string]$Launcher,
  [string]$OutputDirectory = 'portable-diagnostics',
  [int]$ObserveSeconds = 35
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$binary = (Resolve-Path -LiteralPath $Launcher).Path
$destination = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($destination) | Out-Null
$baseline = @((Get-Process -Name 'Ghost-AI' -ErrorAction SilentlyContinue | ForEach-Object { $_.Id }))
$launcherProcess = $null
$spawned = @()
$windowDetected = $false
try {
  $launcherProcess = Start-Process -FilePath $binary -PassThru
  $deadline = (Get-Date).AddSeconds($ObserveSeconds)
  do {
    Start-Sleep -Milliseconds 700
    $launcherProcess.Refresh()
    $spawned = @(Get-Process -Name 'Ghost-AI' -ErrorAction SilentlyContinue | Where-Object { $_.Id -notin $baseline })
    foreach ($process in $spawned) {
      $process.Refresh()
      if (-not $process.HasExited -and $process.MainWindowHandle -ne [IntPtr]::Zero) {
        $windowDetected = $true
        break
      }
    }
    if ($windowDetected -or $launcherProcess.HasExited) { break }
  } while ((Get-Date) -lt $deadline)
  $launcherProcess.Refresh()
  @(
    'Ghost AI by Brendigo'
    "Launcher: $binary"
    "Launcher exited: $($launcherProcess.HasExited)"
    "Main application process count: $($spawned.Count)"
    "Main application window detected: $windowDetected"
  ) | Set-Content -Path (Join-Path $destination 'portable-health.txt') -Encoding utf8
  if (-not $windowDetected) {
    throw 'The Ghost AI Portable.exe did not launch a visible Ghost AI application window'
  }
  Write-Host 'Ghost AI Portable.exe launched its bundled application successfully'
} finally {
  foreach ($process in $spawned) {
    try {
      if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    } catch {}
  }
  if ($null -ne $launcherProcess) {
    $launcherProcess.Refresh()
    if (-not $launcherProcess.HasExited) {
      Stop-Process -Id $launcherProcess.Id -Force -ErrorAction SilentlyContinue
    }
    $launcherProcess.Dispose()
  }
}
