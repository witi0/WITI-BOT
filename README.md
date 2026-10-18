# WITI BOT 4

Workspace local para TikTok LIVE, OBS, Spotify, comandos con puntos y TTS configurable.

## Desarrollo

Requiere Node.js 22 o posterior. Ejecuta `npm ci`, `npm test`, `npm start`. Para Windows: `npm run dist:win`. El build verifica la integridad del instalador y de todos los recursos empaquetados.

## Publicación

El workflow compila y prueba en Windows. Un commit de main cuyo mensaje comience con `release:` publica la versión de package.json como Release, con instalador y SHA-256. Una etiqueta `v*` también publica. La clave opcional `WITI_UPDATE_PRIVATE_KEY` firma el manifiesto de actualización; sin ella el instalador se distribuye manualmente y no se habilitan actualizaciones sin firma.

Consulta CHANGELOG.md para conexión, comandos, permisos TTS y limitaciones verificadas.
