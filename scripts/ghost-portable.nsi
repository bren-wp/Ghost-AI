; Ghost AI by Brendigo
; Ghost AI single-file, self-extracting portable launcher.
; No installation, registry changes, shortcuts or elevation.
Unicode true
Name "Ghost AI"
OutFile "${OUTPUT_FILE}"
Icon "${ICON_FILE}"
SetCompressor /SOLID lzma
VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "Ghost AI"
VIAddVersionKey "CompanyName" "Brendigo"
VIAddVersionKey "FileDescription" "Ghost AI — run without installation"
VIAddVersionKey "LegalCopyright" "Copyright 2026 Brendigo"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
ShowInstDetails nevershow

!ifndef ICON_FILE
  !error "Set /DICON_FILE=<absolute Ghost AI icon path>"
!endif
!ifndef PRODUCT_VERSION
  !error "Set /DPRODUCT_VERSION=<version>"
!endif
!ifndef PAYLOAD
  !error "Set /DPAYLOAD=<absolute packaged application directory>"
!endif
!ifndef OUTPUT_FILE
  !error "Set /DOUTPUT_FILE=<absolute Portable.exe path>"
!endif

Section "Run Ghost AI"
  InitPluginsDir
  SetOutPath "$PLUGINSDIR\GhostAI"
  File /r "${PAYLOAD}\*.*"
  ExecWait '"$PLUGINSDIR\GhostAI\Ghost-AI.exe"' $0
  SetOutPath "$TEMP"
  SetErrorLevel $0
SectionEnd
