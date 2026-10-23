# WITI BOT 5.3.7

- **Creator identity:** se reemplaza el placeholder `W` por un avatar anónimo; sincronización de la foto pública de TikTok mediante `@uniqueId`, actualización del estado `profile` por IPC y descarte de resultados obsoletos al cambiar de cuenta.
- **LIVE connection:** consulta de avatar desacoplada del handshake de TikTok para evitar bloqueos de conexión por latencia del perfil.
- **Spotify queue:** reconciliación de `/me/player/queue` con `spotifyRequests`; se presentan tres entradas en el orden de prioridad y se deduplican URIs coincidentes.
- **`/play`:** las solicitudes se encolan con prioridad, conservan el usuario solicitante y su avatar y se promueven al cambiar de pista cuando Spotify permite la operación.
- **Overlay musical:** se sincronizan la cola nativa, los metadatos del solicitante y la vista `Siguientes 3`.
