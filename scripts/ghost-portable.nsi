; Ghost AI single-file, self-extracting portable launcher.
; No installation, registry changes, shortcuts or elevation.
Unicode true
Name "Ghost AI"
OutFile "${OUTPUT_FILE}"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
ShowInstDetails nevershow

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
