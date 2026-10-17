# Publicar actualizaciones de WITI BOT

## Estado

El repositorio público `witi0/WITI-BOT` existe y se ha confirmado su lectura. La subida mediante el complemento GitHub fue rechazada con HTTP 403 «Resource not accessible by integration». Por tanto, el código remoto y la primera release siguen pendientes. El instalador 1.1.1 se compila por separado para entrega directa.

1. Autorizar acceso de escritura al repositorio `witi0/WITI-BOT` desde la conexión de GitHub. El repositorio ya existe y es público.
2. El archivo privado del kit del propietario se agrega como secreto de Actions con nombre `WITI_UPDATE_PRIVATE_KEY`. El contenido PEM se introduce en Settings → Secrets and variables → Actions → New repository secret. No se añade al código, commits, releases, instalador ni mensajes públicos.
3. Subir el proyecto a la rama `main`. Incluye `.github/workflows/windows.yml`, iconos y el generador original de sonidos. Los WAV se generan en CI para evitar mantener binarios en Git; el instalador los incluye todos.
4. Para publicar: modificar version en package.json, actualizar lockfile y CHANGELOG.md, crear y subir tag `vX.Y.Z`. Por ejemplo `v1.1.1`. El tag debe coincidir exactamente con package.json.
5. GitHub Actions ejecuta npm ci, genera sonidos originales, corre pruebas, compila NSIS y firma `witi-update.json`. Si la clave es incorrecta o falta, falla antes de publicar.
6. La release publica el instalador y el manifiesto. El programa consulta `https://github.com/witi0/WITI-BOT/releases/latest/download/witi-update.json`.
7. Comprobar la prueba N → N+1 antes de anunciar disponibilidad general. Esta prueba está pendiente.

## Qué verifica el programa

- Transporte HTTPS y destinos GitHub permitidos, incluyendo redirecciones.
- Firma Ed25519 del payload exacto del manifiesto, con clave pública incorporada al cliente.
- Versión SemVer superior a la instalada; no ofrece downgrade.
- Tamaño y SHA-256 de la descarga completa.
- SHA-256 otra vez antes de iniciar el ejecutable.
- Bloqueo durante LIVE, confirmación y backup antes de abrir el asistente.

La firma Ed25519 del manifiesto autentica las actualizaciones del proyecto. Es distinta de la firma Authenticode del ejecutable que Windows muestra al usuario. No se ha obtenido un certificado Authenticode ni se promete eliminar avisos SmartScreen. Se conserva la configuración para firmar con CSC_LINK/CSC_KEY_PASSWORD si el titular incorpora un certificado válido.

## Primera actualización desde 1.0.0

La 1.0.0 tenía su actualizador desactivado. Hay que instalar 1.1.0 manualmente una vez para incorporar este sistema de verificación. No se puede activar retroactivamente un actualizador que el cliente anterior no consulta. Instalar sobre la versión previa conserva datos de WITI BOT.

## Custodia y recuperación

La clave privada se entrega por separado al propietario, fuera del código fuente y del instalador. Guardarla de manera privada y mantener una copia segura. El programa solo contiene la clave pública. La pérdida de la clave privada impide firmar actualizaciones aceptadas por esa línea de clientes; no debe regenerarse sin planificar una migración de confianza.

El sistema de actualizaciones queda operativo para consultas de la URL configurada, pero no hay descargas disponibles hasta que existan el repositorio y la primera release firmada.
