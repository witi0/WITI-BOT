# WITI BOT 3.3.0

Aplicación para Windows 10/11 x64: eventos TikTok LIVE, overlays locales, Spotify, voces y automatizaciones.

## Desarrollo

Requiere Node.js 22 o posterior. Ejecutar `npm ci`, `npm test` y `npm start`.
`npm run dist:win` genera y verifica el instalador asistido de Windows.

## Conexión LIVE

En Conexiones, introducir el @usuario exacto o la URL del directo. Si la resolución habitual falla, se consulta la página pública de TikTok y se vuelve a conectar con la sala encontrada. La detección del LIVE y la apertura del chat se muestran por separado. Los tiempos de espera, la cancelación y los límites del proveedor se respetan.

Una clave Euler puede configurarse si el servicio la requiere. El inicio de identidad de TikTok no concede por sí solo acceso al chat LIVE.

## Overlays

Galería renovada, editor con vista previa, favoritos y URL persistente. Siete composiciones musicales, rankings, metas, alertas y fuentes individuales por regalo. Los datos de demostración quedan identificados y separados del directo.

## Diseño

Se aplicaron las skills `animate` y `apple-design` de Emil Kowalski, revisión `2d228630ba1446365f614a108cb8252f1feda202`: tipografía de sistema, jerarquía visual, materiales oscuros, respuesta al pulsar y movimiento reducido. Referencia: https://github.com/emilkowalski/skills

## Validación

Pruebas automatizadas del núcleo, conector, cola de 1000 regalos, widgets y permisos IPC. Revisión en Chromium de galería, edición, guardado, vista previa SSE y movimiento reducido. La ejecución del instalador en Windows y la conexión al LIVE desde la PC del creador requieren comprobación en ese equipo.
