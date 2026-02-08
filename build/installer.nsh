; Custom NSIS script for NumiSync Wizard
; Creates EULA acceptance marker after installation

!macro customInstall
  ; Create EULA acceptance marker file
  FileOpen $0 "$INSTDIR\eula-installer-accepted.marker" w
  FileWrite $0 "EULA accepted during installation$\r$\n"
  FileWrite $0 "Version: ${VERSION}$\r$\n"
  FileWrite $0 "Date: ${__DATE__} ${__TIME__}$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  ; Remove EULA marker on uninstall
  Delete "$INSTDIR\eula-installer-accepted.marker"
!macroend
