# WITI BOT 4.0.1

- Repara la carga de preferencias antiguas con prefijo TTS vacío: el panel general y el editor de overlays pueden abrir sin errores de TTS. La validación estricta se aplica únicamente al guardar la configuración de voz.
- El botón Conectar del panel LIVE inicia la conexión directamente con el usuario indicado, muestra progreso e impide intentos simultáneos. Opciones avanzadas abre la configuración de sala y proveedor.
- El estado de TikTok se actualiza por su propio canal, sin depender de leer todas las preferencias de la aplicación. Los errores de conexión permanecen visibles y se puede reintentar o desconectar.
- Pruebas de regresión con preferencias heredadas, handlers IPC reales, conexión del adaptador y editor de overlays. Se conservan puntos, fuentes y reglas al actualizar.

---

# WITI BOT 4.0.0

- Corrección del bloqueo de compilación: npm start/test/dist ya no ejecuta la migración destructiva a 3.4.
- TikTok: evento de suscripción SUB_NOTIFY compatible con SDK 2.5, lectura de userIdentity, niveles y avatar; catálogo de regalos actualizado después de abrir el socket, sin bloquear la conexión.
- Conexión directa con reconexión y diagnóstico visible; entrada alternativa desde la Event API de TikFinity para Windows (puerto local 21213). Abrir el puente local no se presenta como un LIVE confirmado.
- Comandos configurables /play, /puntos, /skip, /voz y respuestas, alias, permisos, recarga y costo. Registro persistente, cobro único y devolución si la acción falla. /play añade la canción a la cola de Spotify, que requiere sesión y dispositivo activo; sujeto a los permisos de la cuenta Spotify.
- TTS con prefijo opcional; audiencia, club de fans, nivel de donador, top donadores de la sesión, bloqueos, longitud y espera por usuario.
- TTS y alertas comparten exclusión de audio. Prioridad crítica configurable, pausa, reintento y separación entre audios. Espectro medido de la fuente OBS; Windows TTS local no informa niveles.
- RGB tipográfico con espectro, colores personalizados, dirección, velocidad de 0.1 a 10 s, ángulo, saturación y brillo; incluye nombre, badges y mensaje. Transparencia sin fondo, bordes ni sombras en modo transparente.
- Workspace oscuro cyan/verde/rojo, fuentes locales Inter, Space Grotesk y JetBrains Mono, respuesta de controles y reducción de movimiento.

## Instalación y conexión

Descarga WITI_BOT_Setup_v4.0.0.exe en Assets. Cierra WITI BOT antes de actualizar. El instalador conserva la configuración y los puntos existentes.

En Chat & Acciones en LIVE, selecciona conexión directa y escribe tu @usuario. Si TikTok o el proveedor rechaza la firma/conexión, consulta el código y detalle en la consola. La autorización OAuth de identidad no concede por sí sola acceso al chat LIVE. Como alternativa, abre TikFinity para Windows, conecta allí tu LIVE, habilita Event API y selecciona Usar TikFinity local.

La validación automatizada no sustituye una emisión real de tu cuenta ni prueba el instalador mediante una sesión interactiva de Windows. Si no existe clave privada de actualización en GitHub Actions, se publica el instalador manual y su SHA-256; el verificador de actualizaciones automáticas conserva su requisito de firma.

---

# WITI BOT 3.5.0

- Nuevo panel Chat & Acciones en LIVE, conectado al flujo nativo de eventos de Electron, con consola dividida, filtros, estadísticas y pruebas TBT aisladas.
- Diagnóstico en vivo: EPS, latencia estimada cuando existe timestamp del proveedor, estado del conector y registro limitado.
- Motor Chroma RGB para todos los textos de overlays: velocidades de 0.1 a 10 s, ángulo, brillo, saturación y paletas editables.
- Mejoras de transparencia en fuentes de navegador: fondo alfa, eliminación de sombras en modo transparente y capas animadas selectivas. La fidelidad definitiva depende de OBS y GPU.
- Cola de reproducción SQLite con prioridades (crítico, medio, estándar), serialización de audio y preempción de acciones no críticas para alertas críticas; se conservan confirmaciones de finalización.
- Nueva estética táctica en negro/cyan/verde/Redstone, con accesibilidad de movimiento reducido.
- Compatibilidad preservada con la galería WITI BOT v12 y el núcleo existente de TikTok LIVE/Spotify/OBS.

## Validación necesaria antes de afirmar funcionamiento completo

- Probar una sesión LIVE real con la cuenta del creador y su proveedor de conexión. Las restricciones externas de TikTok no pueden resolverse de forma absoluta solo con código cliente.
- Probar OBS y audio real de salida en Windows: reproducción, interrupciones de prioridad, alfa y antialiasing.
- Pruebas automatizadas del proyecto completo y empaquetado mediante GitHub Actions antes de generar etiqueta de release.
