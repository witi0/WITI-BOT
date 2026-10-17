# WITI BOT 1.2.0 — Creator Studio + Meme Sound Lab

Aplicación de escritorio Windows x64, local-first, con instalador NSIS y datos persistentes. La instalación 1.0.0 fue confirmada por el usuario. Esta actualización 1.2.0 todavía requiere aceptación en Windows y autorización real de sus servicios. No se considera completada toda la especificación original.

## Novedades de 1.2.0

- Branding: nuevo logo azul/turquesa WITI BOT en la ventana, barra lateral e iconos PNG/ICO del instalador.
- Navegación: tarjetas de inicio para conectar, audios, voces y acciones; acceso rápido, mejor contraste y diseño responsive.
- Audios: reemplazo de la galería de campanas/boings repetitivos por 60 nuevos efectos originales; favoritos, filtro de incluidos/importados, renombrado, borrado protegido si está en una regla, importación MP3/WAV/OGG y carpetas anteriores hasta 500 archivos.
- Voces: catálogo de 7 voces clásicas recuperadas de WITI BOT 12.2; nombres e IDs conservados, sintetizador online comunitario sujeto a disponibilidad, voces locales en español como respaldo, pausa, cancelación y colas acotadas. No se afirma disponibilidad online sin reproducir.
- Integridad: se conservan los nombres y archivos de los 200 efectos antiguos para evitar invalidar reglas anteriores. Los WAV nuevos son originales, sin diálogos, música ni clips de meme de terceros.

**Estado comprobado:** pruebas autónomas de voces/audio, sintaxis JS y verificación SHA-256. **Pendiente:** pruebas completas con dependencias Electron (npm no accesible en este entorno), ejecución real de TTS comunitario, integración LIVE/OBS/Spotify y compilación/instalación Windows de esta nueva versión.

## Incluido

- Galería de 30 plantillas / 27 tipos. La migración conserva las pantallas previas y agrega 29 diseños. Una instalación nueva tiene 37 pantallas (ocho de acciones y 29 widgets).
- Música con portada, foto de perfil, progreso, estado de reproducción y tres siguientes solicitudes propias, o la cola de Spotify cuando el endpoint está permitido y no hay solicitudes internas. RGB, colores, dimensiones, tamaño de letra, opacidad y visibilidad de elementos.
- Ranking de puntos, Top regalos/likes, chat, feed, últimos eventos, metas, contador de regalo, estadísticas, temporizador, ticker, redes, webcam, fuente de corazones, partículas de regalos, frasco, avatares, ruleta, votos, comandos, tarjeta de usuario y slider.
- Vistas previas diferenciadas de datos reales; crear, duplicar, editar, exportar/importar y eliminar pantallas; copiar URL y crear fuente de OBS con comprobación.
- 60 nuevos efectos originales para reacciones, memes, impactos, victorias, suspenso y donaciones; 200 WAV antiguos permanecen ocultos de la galería para preservar reglas existentes. Búsqueda, favoritos, categorías, vista previa, importación, edición de nombres e importación de carpetas del WITI BOT anterior. El meme «MrBeast biz» se puede incorporar desde un archivo del usuario; no viene incluido sin licencia de redistribución.
- Reglas de varias acciones: alertas, multimedia hasta finalizar reproducción, sonidos incluidos, TTS, puntos, timer, escena OBS y ruleta.
- Lectura TikTok LIVE con tiktok-live-connector no oficial, estados reales, backoff, eventos y catálogo del LIVE. Puede necesitar clave Euler y está sujeto al proveedor. No hay acceso de escritura de chat presentado como funcional.
- Spotify PKCE en navegador del sistema, credenciales protegidas por safeStorage, refresh, perfil, portada, progreso, controles, búsqueda y cola interna de solicitudes. !play, !revocar y !puntos ofrecen respuestas en overlay, sin fingir mensajes enviados al chat TikTok.
- TikTok Login Kit Desktop para identidad de perfil, usando configuración local de una aplicación registrada del propietario. PKCE con challenge hexadecimal según documentación TikTok. La identidad no autoriza por sí misma el chat LIVE.
- SQLite y puntos transaccionales/idempotentes, puntos automáticos opcionales por moneda/follow, temporizador persistente y calculadora manual.
- Actualizador de manifiesto Ed25519 y SHA-256, con consentimiento y bloqueo durante LIVE. GitHub Actions preparado para builds y releases por tag. Publicación remota pendiente.

## Uso

**Esta entrega incluye el código fuente actualizado, no un instalador 1.2.0 probado.** Compilar y validar un instalador NSIS en Windows antes de distribuir. No se debe presentar el instalador 1.1.1 como una aplicación 1.2.0. No borrar datos durante una desinstalación si se quieren conservar. El usuario final no instala Python, Node, Git o Visual Studio.

En Superposiciones, seleccionar una plantilla, revisar la demostración, editar y guardar. Copiar URL o usar Añadir a OBS tras conectar OBS. Las pantallas de acciones quedan transparentes cuando no hay una alerta; sus demos muestran un ejemplo. Las otras familias muestran un diseño con estados vacíos antes de conectar datos.

## Conectar cuentas

### Spotify

Registrar una aplicación propia en https://developer.spotify.com/dashboard y añadir exactamente `http://127.0.0.1:43823/callback`. Introducir el Client ID en Conexiones y completar consentimiento en navegador. No se necesita Client secret para Spotify PKCE. El modo desarrollo exige Premium al propietario y admite hasta cinco cuentas autorizadas; consultar documentación actual y permisos. Que OAuth funcione no elimina esas restricciones.

### TikTok LIVE

Conectar al @usuario mientras esté en directo. El proveedor no oficial puede exigir una clave propia Euler; se configura en opciones avanzadas y se cifra localmente. Nunca se solicitan cookies manuales, sessionid ni contraseñas TikTok. Los regalos de racha se procesan al recibir el evento final informado por la biblioteca. La disponibilidad depende de TikTok/proveedor y no se ha verificado con un LIVE real en esta sesión.

### TikTok identidad

El propietario registra su aplicación con Login Kit Desktop en https://developers.tiktok.com/apps/ y retorno `http://127.0.0.1:43824/callback`. Client key y secreto se configuran solo en su propio equipo, protegidos localmente. No se empaqueta un secreto compartido. Para distribución pública universal de identidad se necesita un backend del titular que custodie su secreto; esta configuración individual no lo sustituye. Los tokens no habilitan escritura LIVE sin acceso adicional.

### OBS

WebSocket 5 en 127.0.0.1:4455. Conexión y cambio de escena; añadir fuente Navegador con confirmación. Falta ensayo con OBS real del propietario.

## Actualizaciones

Ver `docs/PUBLICAR_ACTUALIZACIONES.md`. Repositorio previsto: witi0/WITI-BOT; clave pública incluida. Clave privada separada para el propietario. No hay release remota todavía. 1.0.0 necesita instalar 1.1.0 manualmente una vez. Manifest y binarios no están firmados con Authenticode; la firma Ed25519 del manifiesto es independiente. No se deshabilitan Defender, firewall ni comprobaciones de seguridad.

## Compilación del mantenedor

Node >=22, npm y Python 3 para regenerar sonidos originales (solo compilación; no requerido por los usuarios finales).

```powershell
npm ci
python scripts/generate-sounds.py
npm test
npm run dist:win
```

O `scripts/Build.ps1`. El fuente descargable incluye los WAV; el repositorio los regenera en CI. Dependencias fijadas mediante package-lock.json. Linux emplea el extractor estático NSIS del propio electron-builder 26.15.3 para generar el desinstalador sin Wine; Windows usa su ruta nativa. No se promete reproducibilidad binaria bit a bit entre sistemas.

`npm run release:win` genera el instalador y firma un manifiesto usando WITI_UPDATE_PRIVATE_KEY del entorno. No publica por sí mismo; la publicación corresponde al workflow al subir un tag.

## Pruebas

La versión 1.1.1 contó con 21 pruebas en su preparación. La 1.2.0 agrega pruebas de catálogo y TTS; comprueba el estado concreto de la ejecución en el informe de esta entrega. Cubren núcleo, migración, biblioteca WAV y hashes, estado del LIVE, widgets DOM, música/portada/avatar/progreso/tres siguientes, PKCE con servidor de callback real y proveedor simulado, manifiestos firmados/manipulados, bloqueo de downgrade, rutas, SSE y rangos multimedia.

No se ejecutó un login real con cuenta Spotify/TikTok ni una conexión OBS/LIVE. La prueba OAuth usa respuestas simuladas de proveedor. Se intentó arrancar Electron en Linux para QA; las restricciones de sockets de este contenedor impidieron completarlo. Las pruebas DOM no sustituyen aceptación en Windows. Los scripts Windows de la etapa anterior están incluidos y deben ejecutarse en un entorno limpio.

## Pendiente de la especificación completa

Permisos granulares de todas las familias, antifraude y límites exhaustivos, tienda/recompensas y niveles completos, edición/mezcla avanzada de audio, backend de identidad para distribución pública, escritura LIVE autorizada, más acciones OBS y restauración de estados, webhooks, pruebas de estabilidad prolongada y actualización N→N+1 real. No se presentan como terminadas.

## Privacidad y licencias

Datos y multimedia en `%APPDATA%\WITI BOT`. Las credenciales se cifran con safeStorage y no se exportan al renderer. No hay telemetría. SQLite no está cifrada integralmente; la protección depende de la cuenta Windows. Una copia SQLite no incluye multimedia. Los 260 efectos WAV (200 antiguos conservados y 60 nuevos visibles) son síntesis original, sin muestras ajenas, con permiso de uso y redistribución con WITI BOT. El usuario responde por los archivos que importa.

## Spotify en 1.2.0

El Client ID público del propietario se incorpora en release.json. El usuario pulsa Iniciar sesión con Spotify sin registrar una app. La configuración avanzada permite conservar una app propia; no se incluyen secretos Spotify. El modo desarrollo sigue sujeto a los límites de Spotify y a su lista de usuarios autorizados.
