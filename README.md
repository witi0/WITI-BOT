# WITI BOT

Aplicacion de escritorio para Windows 10/11 x64: TikTok LIVE, puntos, sonidos, TTS, Spotify, OBS y overlays locales.

## Desarrollo

Node.js 22.19 o posterior. `npm ci`, `npm test`, `npm start`.

`npm run dist:win` genera y verifica el instalador de Windows. GitHub Actions ejecuta las pruebas antes de compilar y publicar una Release.

## Overlays

Cada pantalla tiene su URL local para una fuente Navegador de OBS. WITI BOT debe permanecer abierto. La paleta RGB tiene cinco colores editables; el interruptor del overlay permite usar colores fijos. Cancion actual, cola de tres canciones y contenido combinado tienen fuentes independientes.

Los rankings cuentan los eventos observados durante la sesion. Las alertas de likes acumulan por usuario y por regla. El simulador no modifica puntos ni controla Spotify u OBS reales.

## Comunidad

El registro automatico requiere seguimiento confirmado e interaccion. Los puntos iniciales se otorgan una vez. Si el proveedor no informa la relacion de seguimiento, el usuario queda sin confirmar y no cumple el filtro de seguidores. Un evento de seguimiento confirma esa relacion; las confirmaciones se conservan localmente.

Los regalos observados tienen prioridad sobre el catalogo de referencia, que puede incluir variantes regionales o retiradas. Se puede filtrar para mostrar solo regalos confirmados en los propios directos.

## Publicacion

Extraer el ZIP completo en una carpeta nueva y abrir `PUBLICAR_WITI_BOT.bat` en su raiz. El publicador usa GitHub CLI oficial con comprobacion SHA-256, solicita iniciar sesion si hace falta, envia solo los archivos modificados y sigue la ejecucion de GitHub Actions. No requiere Git ni Node.js en esa PC. Se detiene si detecta cambios posteriores en los archivos que actualiza; no fuerza ramas ni reemplaza etiquetas.

La publicacion requiere permisos de escritura sobre `witi0/WITI-BOT`. El codigo de inicio de sesion aparece en la consola. La compilacion y el instalador se producen en GitHub; la confirmacion final exige que exista el instalador en la Release.
