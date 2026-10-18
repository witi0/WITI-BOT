# WITI BOT 3.4.0

Aplicación para Windows 10/11 x64: eventos TikTok LIVE, overlays locales, Spotify, voces y automatizaciones.

## Desarrollo

Requiere Node.js 22 o posterior. Ejecutar `npm ci`, `npm test` y `npm start`.
`npm run dist:win` genera y verifica el instalador asistido de Windows.
Los comandos de prueba, inicio y compilación integran automáticamente la actualización de apariencia 3.4.0 cuando los archivos originales siguen en 3.3.0.

## Conexión LIVE

En Conexiones, introducir el @usuario exacto o la URL del directo. Si la resolución habitual falla, se consulta la página pública de TikTok y se vuelve a conectar con la sala encontrada. La detección del LIVE y la apertura del chat se muestran por separado. Los tiempos de espera, la cancelación y los límites del proveedor se respetan.

Una clave Euler puede configurarse si el servicio la requiere. El inicio de identidad de TikTok no concede por sí solo acceso al chat LIVE.
La conexión con un LIVE real debe validarse en Windows y con una emisión activa. Esta versión conserva el conector existente.

## Overlays

Galería basada en el estudio de WITI BOT 12.2, editor con vista previa, favoritos y URL persistente. Siete composiciones musicales, rankings, metas, alertas y fuentes individuales por regalo. Los datos de demostración quedan identificados y separados del directo.

Los overlays mantienen la personalización y los controles RGB por diseño. La actualización visual cambia los fondos ornamentales por superficies sólidas y agrega variantes sin degradados a los widgets servidos localmente para OBS.

## Diseño

Paleta oscura con negro, grises neutros y azul de sistema de referencia; RGB animado únicamente donde esté activado. Tipografía de sistema, navegación accesible y movimiento reducido. Sin degradados de fondo en la interfaz.

## Validación

Pruebas automáticas del código de actualización (aplicación, idempotencia y rechazo de proyectos ajenos), además de las pruebas heredadas del núcleo, conector, cola de regalos y widgets en GitHub Actions. La ejecución completa del instalador y la conexión real con TikTok LIVE deben verificarse en el equipo Windows del creador.
