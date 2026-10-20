# WITI BOT 5.2.1

Aplicacion de escritorio para Windows 10/11 x64: TikTok LIVE, puntos, sonidos, TTS, Spotify, OBS y overlays locales.

## Desarrollo

Node.js 22.19 o posterior. `npm ci`, `npm test`, `npm start`.

`npm run dist:win` genera y verifica el instalador de Windows. GitHub Actions ejecuta las pruebas antes de compilar y publicar una Release.

## Overlays

Cada pantalla tiene su URL local para una fuente Navegador de OBS. WITI BOT debe permanecer abierto. La paleta RGB tiene cinco colores editables; el interruptor del overlay permite usar colores fijos. Cancion actual, cola de tres canciones y contenido combinado tienen fuentes independientes.

El editor ofrece Minimalista (texto de color fijo o RGB), RGB WITI (tarjetas neón) y PRO (paneles de transmisión). Los rankings completan las filas elegidas con USUARIO EJEMPLO y sustituyen esas filas con participantes reales. Los tops se reinician al detectar una nueva sala o el fin del directo. Una reconexión a la misma sala mantiene la sesión. Cuando el puente no informa una sala ni el fin del directo, se considera nueva sesión tras 30 minutos sin actividad; también está disponible Reiniciar estadísticas. Top Puntos muestra ganancias de esta sesión, sin borrar saldos de Comunidad. Las alertas de likes acumulan por usuario y por regla. El simulador no modifica puntos ni controla Spotify u OBS reales.

## Comunidad

El registro automático requiere seguimiento confirmado y 100 likes, un regalo o 10 comentarios. Los puntos iniciales se otorgan una vez. Si el proveedor no informa la relacion de seguimiento, el usuario queda sin confirmar y no cumple el filtro de seguidores. El TTS decide con la confirmacion del evento actual, sin consultar la red por comentario. Un estado 0 o una negacion explicita bloquean la lectura; un estado desconocido nunca hereda el permiso guardado de una sesion anterior. El nombre hablado normaliza letras decorativas y mayusculas, conservando el nombre visible original.

Los regalos observados tienen prioridad sobre el catalogo de referencia, que puede incluir variantes regionales o retiradas. Se puede filtrar para mostrar solo regalos confirmados en los propios directos.

## Simulador y conexion

El apartado Simulador permite elegir regalo, cantidad, usuario y estado de seguimiento, ademas de likes, follows, comentarios, comandos, compartidos y suscripciones. Los resultados visuales se ven en las URLs de prueba; el audio se reproduce en la PC. Las simulaciones usan contadores separados y no entregan puntos ni controlan Spotify, OBS o el temporizador real.

Al iniciar con un usuario TikTok guardado, se intenta conectar automaticamente. Tras un fallo recuperable se reintenta a los cinco segundos, sin conexiones simultaneas; se respetan los bloqueos y tiempos de espera del servidor. Desconectar detiene los reintentos hasta conectar de nuevo.

Los umbrales de likes solo aparecen en reglas de likes. Una regla admite hasta diez acciones: sonido, TTS y alerta pueden convivir. Si un regalo coincide con una regla específica habilitada, se omiten las generales para ese evento. Si no hay coincidencia específica, se aplican las generales habilitadas. Las solicitudes musicales aparecen por orden de llegada antes de las sugerencias de Spotify; Por: muestra nombre y avatar del solicitante.

## Publicacion

Extraer el ZIP completo en una carpeta nueva y abrir `PUBLICAR_WITI_BOT.bat` en su raiz. El publicador usa GitHub CLI oficial con comprobacion SHA-256, solicita iniciar sesion si hace falta, envia solo los archivos modificados y sigue la ejecucion de GitHub Actions. No requiere Git ni Node.js en esa PC. Se detiene si detecta cambios posteriores en los archivos que actualiza; no fuerza ramas ni reemplaza etiquetas.

La publicacion requiere permisos de escritura sobre `witi0/WITI-BOT`. El codigo de inicio de sesion aparece en la consola. La compilacion y el instalador se producen en GitHub; la confirmacion final exige que exista el instalador en la Release.

## Versión 5

El simulador compara ID, nombre original y nombre traducido del regalo. Usa la misma cola de sonidos que el LIVE, sin modificar puntos reales. Las fuentes de respuestas reciben nombre, avatar y resultado real de los comandos; las URLs anteriores se conservan.

En Atajos se pueden añadir y eliminar combinaciones. Ctrl+Alt+T activa/desactiva todo el TTS y corta la voz actual; Ctrl+Alt+M corta únicamente la voz y la cola de TTS. Windows puede reservar algunas combinaciones para otra aplicación: se informa el conflicto y se conservan los atajos anteriores.

Colaboradores presenta a Witi como fundador y dueño y a Felipino-FLD como beta tester, con sus enlaces oficiales.
