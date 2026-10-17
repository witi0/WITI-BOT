# WITI BOT V2

Panel de escritorio Windows x64 para TikTok LIVE, OBS y Spotify. Electron 44, Node 22, SQLite y servidor de overlays ligado a 127.0.0.1.

**Build:** `npm ci`, `npm test`, `npm run dist:win`.

**Runtime:** eventos de TikTok LIVE por conector comunitario, reconexión con espera exponencial y cola de eventos priorizada. Estado persistente, búsqueda de actualizaciones con manifiesto Ed25519 y verificación SHA-256.

**Overlay Studio:** 34 plantillas no exclusivas, estilos RGB independientes para texto y marco, 6 estilos de marco y salida HTML para fuentes navegador OBS.

**Regalos:** catálogo regional de referencia con 1667 entradas, 682 con etiqueta MX, sincronización dinámica al conectar LIVE. La disponibilidad y el valor de regalos dependen de TikTok.

**Medios:** biblioteca personal importada desde MP3/WAV/OGG. No se distribuyen audios de terceros ni sonidos sintéticos de versiones anteriores. Las reglas heredadas que apuntan a efectos eliminados se deshabilitan y pueden actualizarse.

**Diseño:** fuentes Outfit/Syne autohospedadas, RGB desactivable, menor movimiento, transiciones y atajos configurables con la aplicación enfocada.

**Seguridad:** tokens de overlays locales, credenciales cifradas mediante safeStorage, actualización firmada Ed25519, copias de SQLite. Datos sensibles excluidos del repositorio.

**Pruebas externas pendientes:** comportamiento con cuentas TikTok LIVE reales, Spotify real, OBS en Windows y compatibilidad completa del instalador.
