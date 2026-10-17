# WITI BOT 1.1.0 — entrega Creator Studio

El instalador anterior 1.0.0 fue confirmado como funcional por el usuario. Se ha generado una actualización 1.1.0 con nuevos módulos y un instalador NSIS real. **La 1.1.0 aún requiere pruebas de aceptación en Windows y cuentas reales. El proyecto completo del prompt maestro no se considera finalizado.**

## Contenido de esta versión

| Área | Implementación |
|---|---|
| Galería | 30 plantillas, 27 tipos. Se conservan las ocho pantallas originales y se agregan 29 diseños. Instalación nueva: 37 pantallas |
| Música | Portada, foto del perfil, canción/artista, progreso, pausa, tres siguientes solicitudes; cola Spotify como alternativa si su endpoint está permitido |
| Editor | RGB, dos colores, resolución, letra, opacidad, esquinas, avatar, portada, cola, objetivos, métricas, textos y premios |
| Widgets | Top regalos/likes/puntos, chat, feed, últimos eventos, metas, contador específico, estadísticas, timer, ticker, redes, webcam, corazones, partículas, frasco, avatares, ruleta, votos, comandos, tarjeta y duelo |
| Audios | 200 WAV originales, todos incluidos en el instalador, búsqueda/categorías, reproducción de prueba y uso en reglas; importación múltiple de sonidos propios |
| TikTok LIVE | Conector no oficial, eventos, reconexión, catálogo consultado en el LIVE, procesamiento de rachas finales; pendiente prueba con un directo real |
| Spotify | PKCE, callback local, sesión segura, refresh, perfil/reproducción/búsqueda/cola. Pendiente autorizar una app real del propietario |
| TikTok identidad | Login Kit Desktop y PKCE, configurable con una app propia registrada; no concede escritura LIVE por sí mismo |
| OBS | Conexión básica, escenas y creación de fuente Navegador con confirmación y lectura de verificación. Pendiente OBS real |
| Actualizaciones | Manifiesto Ed25519, HTTPS, tamaño/SHA-256, rechazo de downgrade, progreso, consentimiento, bloqueo LIVE y backup |
| Git | Repositorio local y workflow Windows de compilación/publicación por tag preparados; repositorio remoto pendiente |

Los 200 sonidos son **efectos sintetizados originales**, no descargas de Sound Instants. Sus términos no conceden redistribución general: https://soundinstants.com/term-of-use . No se repaquetaron muestras de terceros sin licencia. Se permite importar los archivos que el usuario tenga autorización para usar.

## Validaciones

- **21 pruebas aprobadas, 0 fallidas.** Se incluyen sus registros.
- Migración de galería sin duplicados y conservación de pantallas previas.
- Cada WAV tiene cabecera correcta y SHA-256 válido; los 200 hashes son distintos.
- DOM de todos los widgets y pruebas específicas de portada, foto del perfil, progreso y tres canciones siguientes.
- Prueba OAuth con servidor de callback real y proveedor Spotify simulado: estado incorrecto rechazado, canje PKCE, perfil y música sin exponer tokens.
- Manifiestos válidos aceptados; alteraciones, otra clave, ausencia de firma, HTTP, dominios ajenos y downgrade rechazados.
- Puntos, SQLite, idempotencia, 1000 eventos, temporizador, SSE, token, rutas y rangos de audio.
- Auditoría npm de producción: 0 vulnerabilidades reportadas en la consulta; no equivale a una auditoría completa de seguridad.
- Instalador NSIS y paquete interno app-64.7z extraídos y comprobados. El ASAR extraído coincide por hash con el build y contiene los 200 WAV y los módulos de esta versión.
- No se incluye la clave privada de publicación en el programa ni en el fuente público.

## Instalador final

- Archivo: `WITI_BOT_Setup_v1.1.0.exe`
- Tamaño: 129,559,140 bytes.
- SHA-256: `3e84d64d0b1d9bc95a25aa15b2ed373f435f1239c5fad174db78118220ee12b2`
- Integridad NSIS: correcta.
- Integridad del paquete interno: correcta.
- Recursos del instalador coinciden con el build: correcto.
- Manifiesto de esta versión firmado y verificado: correcto, todavía sin publicación remota.

No se ejecutó la 1.1.0 en Windows ni se completó una actualización N → N+1 publicada. Un intento de QA con Electron en este contenedor Linux quedó bloqueado por restricciones del entorno; las pruebas DOM no sustituyen la aceptación de Windows. No se afirma un login real, LIVE real o OBS real sin haberlos observado.

## Acciones del propietario necesarias

1. Crear el repositorio público `witi0/WITI-BOT` y habilitarle acceso al complemento GitHub. La conexión permite modificar repositorios existentes, pero no ofrece crear nuevos.
2. Configurar `WITI_UPDATE_PRIVATE_KEY` como secreto de Actions con la clave del kit privado. No incluir ese kit en el repositorio ni en releases.
3. Registrar una aplicación Spotify y autorizarla desde Conexiones. Retorno exacto: `http://127.0.0.1:43823/callback`. Client ID es público; no se necesita Client secret para Spotify PKCE. El propietario Premium y límites de cuentas dependen de Spotify.
4. Para identidad TikTok, registrar Login Kit Desktop y retorno `http://127.0.0.1:43824/callback`; configurar sus claves directamente en la aplicación, sin enviarlas por chat. Para identidad universal distribuida se necesita backend del titular; la configuración local individual no lo sustituye.
5. Probar 1.1.0, cuentas, overlays y una actualización firmada publicada antes de declarar una release plenamente validada.

GitHub ya está conectado. No hace falta instalar un complemento Spotify para que el programa pueda usar OAuth; hace falta el registro de la aplicación en Spotify Developers.

## Instalación sobre 1.0.0

Instalar 1.1.0 manualmente una vez, sobre la instalación existente. La 1.0.0 tenía su actualizador desactivado y no puede recibir retroactivamente esta configuración. Las preferencias, puntos, medios y enlaces existentes se conservan por el diseño de migración/NSIS; falta confirmar ese flujo en Windows para esta nueva compilación.

## Firma Windows

Ed25519 autentica el manifiesto del proyecto, no es una firma Authenticode del ejecutable. No se adquirió un certificado de Windows ni se promete eliminar avisos SmartScreen. La firma Authenticode se puede agregar por separado mediante un certificado o servicio reconocido, normalmente con coste y validación del titular.

## Pendiente del prompt completo

Permisos granulares exhaustivos, tienda/recompensas y niveles completos, edición/mezcla avanzada de audio, backend de identidad compartida, escritura LIVE autorizada, acciones OBS avanzadas/restauración, webhooks y pruebas prolongadas. No se presentan como terminados.
