# Ghost AI by Brendigo
param(
  [Parameter(Mandatory = $true)][string]$Setup,
  [Parameter(Mandatory = $true)][string]$Update,
  [string]$OutputDirectory = 'installer-diagnostics'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$setupPath = (Resolve-Path -LiteralPath $Setup).Path
$updatePath = (Resolve-Path -LiteralPath $Update).Path
$root = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($root) | Out-Null

function Invoke-GhostPackage([string]$path, [string]$name) {
  $process = Start-Process -FilePath $path -ArgumentList '/S' -PassThru -Wait
  $code = $process.ExitCode
  "$name exited with code $code" | Tee-Object -FilePath (Join-Path $root "$name-result.txt")
  if ($code -ne 0) { throw "$name failed with exit code $code" }
}

function Find-GhostInstalledBinary {
  $entries = @()
  foreach ($key in @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Ghost AI',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Ghost AI'
  )) {
    if (Test-Path -LiteralPath $key) { $entries += Get-ItemProperty -LiteralPath $key }
  }
  if ($entries.Count -lt 1) { throw 'Ghost AI setup did not register an installed application' }
  $entry = $entries | Select-Object -First 1
  if ($entry.DisplayName -ne 'Ghost AI') { throw 'Unexpected installer registration display name' }
  if (-not $entry.InstallLocation) { throw 'Ghost AI installer registration is missing InstallLocation' }
  $folder = $entry.InstallLocation.Trim('"')
  if (-not (Test-Path -LiteralPath $folder -PathType Container)) { throw 'Ghost AI installation directory does not exist' }
  $candidates = @(
    (Join-Path $folder 'ghost-ai-desktop.exe'),
    (Join-Path $folder 'Ghost AI.exe'),
    (Join-Path $folder 'Ghost-AI.exe')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
  }
  throw 'Ghost AI executable was not installed'
}

Invoke-GhostPackage -path $setupPath -name 'setup'
$binary = Find-GhostInstalledBinary
./scripts/ghost-ai-startup-diagnostics.ps1 -Executable $binary -OutputDirectory (Join-Path $root 'after-setup') -ObserveSeconds 25
Invoke-GhostPackage -path $updatePath -name 'update'
$binary = Find-GhostInstalledBinary
./scripts/ghost-ai-startup-diagnostics.ps1 -Executable $binary -OutputDirectory (Join-Path $root 'after-update') -ObserveSeconds 25
