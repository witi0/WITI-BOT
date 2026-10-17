!macro customUnInstall
  ${ifNot} ${isUpdated}
    ${ifNot} ${Silent}
      MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "¿Eliminar también configuraciones, credenciales, puntos y archivos personales de WITI BOT? Selecciona No para conservarlos." IDNO keepWitiData
      SetShellVarContext current
      RMDir /r "$APPDATA\WITI BOT"
      keepWitiData:
    ${endIf}
  ${endIf}
!macroend
