## 1.2.1 - Actualizacion oficial de mantenimiento

- Primera publicacion oficial para probar el sistema de actualizaciones firmadas desde WITI BOT 1.2.0.
- Se conservan el logo, las voces y la biblioteca de 60 sonidos visibles mas los 200 archivos anteriores para compatibilidad.
- Sin cambios en las cuentas, puntos ni configuraciones del usuario.

## Corrección de compilación 1.2.0

- Recupera mediante generación reproducible los 200 WAV históricos para no romper reglas existentes.
- Mantiene solo los 60 nuevos sonidos en el catálogo visible.
- Ajusta los tests y el verificador del instalador a 260 WAV totales.
- Prueba streaming HTTP de sonidos antiguos y nuevos.

# Historial — WITI BOT

## 1.2.0 — Meme Sound Lab y voces clásicas

- Logo oficial nuevo en toda la aplicación y en los iconos de Windows.
- Rediseño de navegación, inicio guiado, mejor contraste y modo responsive.
- 60 efectos originales con nombres de reacción/meme; 200 antiguos conservados para compatibilidad, ocultos de la biblioteca visible.
- Favoritos, edición, importación de biblioteca anterior, filtros, selección rápida para las reglas.
- Vuelta de 7 voces online del WITI BOT antiguo, con reproducción de prueba y fallback local español. Servicios no oficiales sin garantía de disponibilidad.
- Pruebas automáticas específicas de catálogo, hashes WAV, TTS y el icono.
- Sin instalador 1.2.0 compilado ni validado en Windows todavía.

# WITI BOT 1.1.1

- Spotify utiliza el Client ID público de WITI BOT por defecto: basta con iniciar sesión y aceptar.
- Las cuentas con una aplicación Spotify propia conservan su configuración avanzada.
- Canal de compilación Windows y actualizaciones firmadas preparado para witi0/WITI-BOT.
- La autorización de TikTok se ha probado por el propietario en Sandbox; la aprobación pública sigue pendiente.
- Los límites y la lista de usuarios autorizados de Spotify siguen aplicándose.

# WITI BOT 1.1.0 — Creator Studio

- Galería con 30 plantillas y 27 tipos de widgets; instala 29 diseños adicionales conservando las ocho pantallas iniciales.
- Música: portada, avatar del perfil, progreso, pausa y siguientes tres solicitudes WITI BOT; RGB y estilos configurables.
- Editor de tamaño, opacidad, colores, fondo, avatar, portada, cola, objetivos, métricas y premios de ruleta.
- Ranking de regalos/likes, chat, últimos eventos, metas, contadores, temporizador, estadísticas, webcam, redes, ticker, animaciones, ruleta, votos y compañeros del chat.
- Biblioteca de 200 efectos sintetizados originales, buscador, categorías, prueba e importación múltiple de audio propio. No son audios descargados de Sound Instants.
- TikTok LIVE mediante conector no oficial, reconexión, catálogo consultado en el LIVE y eventos normalizados; depende del proveedor y del acceso disponible.
- Spotify: autorización PKCE, sesiones seguras, perfil, reproducción, búsqueda y solicitudes internas. Requiere app Spotify y permisos/plan que exija el proveedor.
- TikTok Login Kit Desktop con PKCE para identidad, configurable con una app registrada del propietario. No habilita por sí mismo escritura de chat LIVE.
- Puntos automáticos opcionales por moneda/follow y TTS automático con prefijo.
- Crear fuentes Navegador desde OBS con confirmación y comprobación de URL.
- Actualizador con manifiestos firmados Ed25519, verificación SHA-256, rechazo de downgrade, descarga con progreso y consentimiento antes de abrir instalador.
- Pipeline GitHub Actions para compilar y publicar versiones por tag, preparado; pendiente crear el repositorio y configurar el secreto de firma.

La instalación de 1.0.0 fue confirmada por el usuario. 1.1.0 requiere nueva aceptación en Windows y cuentas reales. No se presenta como verificada una conexión externa sin haberla probado con la cuenta del propietario.
