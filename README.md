# WITI BOT 4

Workspace local para TikTok LIVE, OBS, Spotify, comandos con puntos y TTS configurable.

## Conexión LIVE

En Conexiones o Chat & Acciones en LIVE, escribe el @usuario y pulsa Conectar al LIVE. El motor principal es PirateTok 0.3.0: conexión directa desde la PC, sin clave API, sin Euler y sin TikFinity abierto. No se impone una cuota propia por hora ni por número de eventos. TikTok puede restringir el acceso o cambiar su protocolo; un fallo se muestra con diagnóstico y reconexión con espera. Una apertura de socket se distingue de la recepción efectiva de eventos en el panel.

Se normalizan comentarios, regalos (al finalizar cada racha), likes, seguidores, compartidos, suscripciones y espectadores para los puntos, comandos, TTS y overlays existentes. No se reproducen mensajes antiguos identificados por su fecha de origen.

## Desarrollo

Requiere Node.js 22.19 o posterior. Ejecuta `npm ci`, `npm test`, `npm start`. Para Windows: `npm run dist:win`. El build verifica la integridad del instalador y de todos los recursos empaquetados.

## Publicación

El workflow compila y prueba en Windows. Un commit de main cuyo mensaje comience con `release:` publica la versión de package.json como Release, con instalador y SHA-256. Una etiqueta `v*` también publica. La clave opcional `WITI_UPDATE_PRIVATE_KEY` firma el manifiesto de actualización; sin ella el instalador se distribuye manualmente y no se habilitan actualizaciones sin firma.

Consulta CHANGELOG.md para conexión, comandos, permisos TTS y limitaciones verificadas.
