!include "WinVer.nsh"
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "WITI BOT · Asistente de instalación"
  !define MUI_WELCOMEPAGE_TEXT "Configura tu estudio de directos en Windows 10 u 11 de 64 bits.$\r$\n$\r$\nEl instalador incluye la aplicación, 120 audios y las imágenes de regalos. No necesitas instalar herramientas de programación.$\r$\n$\r$\nPodrás elegir la carpeta y los accesos directos. Al actualizar se conservan tus configuraciones y medios personales."
  !insertmacro MUI_PAGE_WELCOME
!macroend
!macro customInit
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "WITI BOT necesita Windows 10 u 11 de 64 bits."
    Abort
  ${EndIf}
!macroend
!macro customInstall
  ; A versioned first-upgrade backup never overwrites an earlier backup.
  ReadEnvStr $R0 "APPDATA"
  ${If} $R0 != ""
    ${If} ${FileExists} "$R0\WITI BOT\witi.sqlite"
      CreateDirectory "$R0\WITI BOT\backups"
      ${IfNot} ${FileExists} "$R0\WITI BOT\backups\antes-de-${VERSION}.sqlite"
        CopyFiles /SILENT "$R0\WITI BOT\witi.sqlite" "$R0\WITI BOT\backups\antes-de-${VERSION}.sqlite"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend
!macro customUnInstall
  ${ifNot} ${isUpdated}
    ${ifNot} ${Silent}
      MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "¿Eliminar también configuraciones, credenciales, puntos, medios personales y respaldos de WITI BOT?$\r$\n$\r$\nSelecciona No para conservarlos y recuperarlos al reinstalar." IDNO keepWitiData
      SetShellVarContext current
      RMDir /r "$APPDATA\WITI BOT"
      keepWitiData:
    ${endIf}
  ${endIf}
!macroend
