# Validación WITI BOT 1.2.0

- **Sí verificado**: se puede leer y comprobar el código de la versión 1.1.1 desde el fuente anterior; 60/60 nuevos WAV pasan formato WAV y SHA-256; los 200 WAV anteriores existen; logo PNG/ICO válido; sintaxis JS de ficheros modificados; 8 pruebas autónomas nuevas de voces y catálogo pasadas.
- **No verificado**: instalador NSIS 1.2.0, primera ejecución de Electron, voces comunitarias desde conexión real, pruebas UI DOM completas, conexión con Spotify/TikTok/OBS.
- **Bloqueo de pruebas UI**: jsdom y otras dependencias no instaladas y el registro npm no responde desde este entorno (EAI_AGAIN). `npm test` requiere `npm ci` en Windows/CI con red.
- **Meme MrBeast biz**: no está incluido el archivo original. El botón específico permite elegir un audio que el usuario tenga derecho a utilizar y lo registra con nombre y favorito.
- **Compatibilidad**: los archivos `witi-001.wav` a `witi-200.wav` permanecen en el paquete para las reglas persistidas; la galería solo muestra los 60 nuevos y los importados por el usuario.
- **GitHub**: el repositorio `witi0/WITI-BOT` se observó vacío. Este ZIP es entregable local, no es un commit remoto publicado.
