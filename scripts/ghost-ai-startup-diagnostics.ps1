# Ghost AI by Brendigo
param(
  [Parameter(Mandatory = $true)][string]$Executable,
  [string]$OutputDirectory = 'diagnostics',
  [int]$ObserveSeconds = 18
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$destination = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($destination) | Out-Null
$binary = (Resolve-Path -LiteralPath $Executable).Path
$startedAt = Get-Date
$stdout = Join-Path $destination 'ghost-ai-stdout.txt'
$stderr = Join-Path $destination 'ghost-ai-stderr.txt'
$summary = Join-Path $destination 'ghost-ai-startup-summary.txt'
$events = Join-Path $destination 'ghost-ai-windows-errors.txt'
$process = $null
try {
  $process = Start-Process -FilePath $binary -WorkingDirectory (Split-Path $binary -Parent) -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  $deadline = (Get-Date).AddSeconds($ObserveSeconds)
  $windowSeen = $false
  do {
    Start-Sleep -Milliseconds 600
    $process.Refresh()
    if ($process.HasExited) { break }
    if ($process.MainWindowHandle -ne [IntPtr]::Zero) { $windowSeen = $true; break }
  } while ((Get-Date) -lt $deadline)

  $process.Refresh()
  $exited = $process.HasExited
  $exitCode = if ($exited) { $process.ExitCode } else { 'running' }
  $description = @(
    "Ghost AI by Brendigo"
    "Executable: $binary"
    "Started: $($startedAt.ToString('o'))"
    "Exited early: $exited"
    "Exit code: $exitCode"
    "Window detected: $windowSeen"
    "AppData: $env:APPDATA"
    "LocalAppData: $env:LOCALAPPDATA"
  )
  $description | Set-Content -Path $summary -Encoding utf8

  $roots = @(
    (Join-Path $env:APPDATA 'com.brendigo.ghostai'),
    (Join-Path $env:LOCALAPPDATA 'com.brendigo.ghostai'),
    (Join-Path $env:APPDATA 'Ghost AI'),
    (Join-Path $env:LOCALAPPDATA 'Ghost AI')
  )
  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match '(log|error|panic)' -and $_.Length -lt 5000000 } |
      Select-Object -First 20 | ForEach-Object {
        Add-Content -Path $summary -Value "Log: $($_.FullName)"
        $name = ($_.FullName -replace '[^a-zA-Z0-9_.-]', '_')
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $destination $name) -ErrorAction SilentlyContinue
      }
  }
  try {
    Get-WinEvent -FilterHashtable @{ LogName='Application'; StartTime=$startedAt.AddMinutes(-1) } -MaxEvents 120 -ErrorAction Stop |
      Where-Object { $_.ProviderName -match 'Application Error|Windows Error Reporting|SideBySide' -or $_.Message -match 'Ghost-AI|ghost.ai.desktop|webview2' } |
      Select-Object TimeCreated,ProviderName,Id,Message | Format-List | Out-String -Width 240 |
      Set-Content -Path $events -Encoding utf8
  } catch {
    "Windows event log could not be read: $_" | Set-Content -Path $events -Encoding utf8
  }

  Write-Host ($description -join [Environment]::NewLine)
  if ($exited) { throw "Ghost AI exited before displaying its main window (exit code: $exitCode)" }
  if (-not $windowSeen) { Write-Warning 'Process stayed alive but no main window was detected in the CI session' }
} finally {
  if ($null -ne $process) {
    $process.Refresh()
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    $process.Dispose()
  }
}
