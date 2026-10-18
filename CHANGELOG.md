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
