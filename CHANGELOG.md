# WITI BOT 2.5.0 · Gothic Studio

- Negro y rojo carmesí, títulos góticos, RGB ajustable y reducción de movimiento.
- Galería inspirada en 12.2.0: favoritos, preview antes de añadir, editor en ventana y fuentes exclusivas para regalos.
- 43 diseños, seis variantes góticas nuevas y controles contextuales de visibilidad, tamaño de avatar, alineación y tipografía.
- Restauradas 1667 imágenes del paquete del propietario y conservados los 120 audios.
- Cola persistente de audio sin el límite que descartaba eventos al superar 100 pendientes.
- Confirmación individual de final de reproducción, pausa, reintento de errores y aislamiento de simulaciones.
- Rachas finales normalizadas sin sumar actualizaciones intermedias ni confundir cantidad con monedas.
- Pruebas de 1000 regalos separados, racha de 1000, reconexión, duplicados, persistencia, HTTP/SSE y reproductor DOM.
- Publicador 2.5.0 verifica e incluye toda la colección antes de esperar el resultado de Windows en GitHub.

# WITI BOT 2.4.1 · Audios sin imágenes

- Retiradas las 1667 imágenes de regalos del paquete a petición de Witi.
- Conservados los 120 audios, el logo y el tema cobre RGB.
- Corrección del publicador: comprueba todos los audios y sus hashes antes de subirlos, los incluye explícitamente en Git y elimina las imágenes de la colección anterior.
- Migración que limpia las imágenes incluidas antiguas y protege recursos personalizados o usados por reglas.

# WITI BOT 2.4.0 · Cobre RGB

- Nueva paleta cobre y verde petróleo; RGB en contornos de toda la interfaz y en títulos seleccionados.
- Colección integrada: 120 MP3 y 1667 imágenes WebP proporcionados por Witi, instalados al primer inicio.
- MrBeast Rizz destacado, duraciones verificadas, filtro de sonidos incluidos e importaciones.
- Corregida la validación y reproducción de audios MP3 en reglas de sonidos.
- Ocho pantallas útiles por defecto para instalaciones nuevas, con bordes RGB.
- Conservación de reglas, URLs, nombres, favoritos, imágenes y borrados al actualizar.
- Publicación en GitHub mediante un único script PowerShell.

# WITI BOT 2.3.0 · Studio mejorado

- Simulación visual de cambios del editor sin alterar las fuentes OBS guardadas.
- Protección de borradores al cambiar de pantalla o cerrar y guardado sin duplicados.
- Corrección de edición de regalo más valioso y mayor racha; compatibilidad con 37 diseños.
- Contadores creados desde referencias por nombre; eventos LIVE por ID conservan sus contadores independientes.
- Búsqueda sin acentos, selección accesible y ficha de regalos coherente con filtros.
- Compilación PowerShell sin dependencia de Python ni generador de sonidos retirados.
- Conserva RGB global, tipografías, logo, datos e integraciones de 2.2.0.

# WITI BOT — Notas de versión

## 2.2.0 — Sistema visual y navegación

- Consolidación del diseño del escritorio con jerarquía tipográfica de mayor peso y estilos compartidos en navegación, editor, biblioteca y overlays.
- Tematización RGB global con tres modos, velocidad de 4–24 segundos, intensidad de 10–100 %, opción de desactivación y color estático configurable.
- Persistencia y normalización de preferencias visuales en la base de datos; compatibilidad con ajustes creados en versiones anteriores.
- Compatibilidad con fuentes del sistema Windows y reducción de recursos tipográficos empaquetados.
- Búsqueda de secciones por `Ctrl + K`, navegación mediante flechas e Intro y soporte de cierre con Escape.
- Controles de densidad del escritorio y reducción de movimiento; adaptación del panel a ventanas de menor tamaño.
- Integración de las nuevas preferencias en los controles de actualización, biblioteca de regalos y galerías de overlays.

## 2.1.0 — Overlay Studio y Gift Browser

- Separación de Galería, Mis overlays y Personalizar, con creación bajo demanda y previsualización.
- Cuatro presets de presentación para overlays, controles RGB por fuente y ajustes independientes de tipografía.
- Catálogo de regalos con filtros por fuente, valor y región; sincronización prioritaria con regalos del LIVE.
- Widgets para el regalo de mayor valor y la mayor racha de regalos.

## 2.0.0 — Procesamiento de eventos

- Gestión acotada de ráfagas de eventos LIVE con prioridad para regalos.
- Ajustes visuales persistentes y atajos configurables en la ventana.
- Catálogo regional de respaldo separado de los datos de regalos sincronizados.
- Eliminación de efectos de audio sintetizados preinstalados.
