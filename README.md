# WITI BOT 3.2.0

Aplicacion Electron para Windows 10/11 x64. El instalador incluye el runtime: el usuario final no necesita herramientas de desarrollo.

Desde esta carpeta: `npm ci`, `npm test`, `npm run dist:win`.
El build crea un instalador NSIS asistido y verifica integridad, recursos y correspondencia con las fuentes.
Los scripts de la carpeta superior permiten preparar/publicar en el repositorio existente y esperar GitHub Actions.

La conexion LIVE evita consultas opcionales bloqueantes y separa deteccion de sala de conexion al chat. Si el proveedor exige una clave autorizada, se configura en Conexiones. OAuth TikTok por si solo no concede acceso al chat LIVE.

Se conserva el estudio visual v12.2 de la fuente 3.1, integrado con el motor actual. Los 25 SVG originales de Lucide incluyen licencia y hashes en assets/ui-icons.

Consulta LEER_PRIMERO.txt, CAMBIOS_Y_LIMITACIONES.txt y PRUEBAS_3.2.0.md de la entrega para el alcance de validacion y firmas pendientes. No afirmar conexion real o pruebas en Windows limpio completadas.
