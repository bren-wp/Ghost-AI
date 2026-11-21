; Ghost AI by Brendigo
Unicode true
Name "Ghost AI Update"
OutFile "${OUTPUT_FILE}"
Icon "${ICON_FILE}"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
ShowInstDetails nevershow
SetCompressor /SOLID lzma

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "Ghost AI"
VIAddVersionKey "CompanyName" "Brendigo"
VIAddVersionKey "FileDescription" "Ghost AI installed application updater"
VIAddVersionKey "LegalCopyright" "Copyright 2026 Brendigo"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"

!ifndef SETUP_FILE
  !error "SETUP_FILE is required"
!endif
!ifndef OUTPUT_FILE
  !error "OUTPUT_FILE is required"
!endif
!ifndef ICON_FILE
  !error "ICON_FILE is required"
!endif
!ifndef PRODUCT_VERSION
  !error "PRODUCT_VERSION is required"
!endif

Function .onInit
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ghost AI" "DisplayName"
  StrCmp $0 "" 0 ready
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ghost AI" "DisplayName"
  StrCmp $0 "" 0 ready
  MessageBox MB_OK|MB_ICONEXCLAMATION "Ghost AI is not installed. Please use Ghost AI Setup instead."
  Abort
ready:
FunctionEnd

Section "Update installed Ghost AI"
  InitPluginsDir
  SetOutPath "$PLUGINSDIR"
  File /oname=Ghost-AI-Setup.exe "${SETUP_FILE}"
  ExecWait '"$PLUGINSDIR\Ghost-AI-Setup.exe" /P' $0
  SetErrorLevel $0
SectionEnd
