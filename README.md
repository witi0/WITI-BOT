# WITI BOT 2.5.0 · Gothic Studio

Aplicación Windows 10/11 x64 para TikTok LIVE, Spotify y OBS. El usuario instala el EXE; no necesita Python, Node, Visual Studio ni Git.

## Interfaz y overlays

Tema negro y rojo carmesí, títulos góticos, contornos animados y RGB configurable. La galería y el editor toman como referencia la versión 12.2.0: favoritos, vista previa antes de añadir, personalización en ventana, presets, controles según el widget y fuentes individuales para regalos. Hay 43 diseños y ocho pantallas iniciales. Las pantallas existentes y sus URL se conservan.

Música muestra portada, perfil, progreso y cola cuando Spotify proporciona esos datos. Puedes cambiar tamaño de avatar, tipografía, alineación, transparencia, contornos y textos RGB; ocultar título, posición, usuario, valor o progreso según el widget. Los borradores de la ventana de edición no cambian las fuentes guardadas de OBS.

## Colección incluida

120 MP3 y 1667 imágenes WebP del paquete proporcionado por Witi, verificados con SHA-256. Se restauran las imágenes solicitadas para esta versión y se conservan los audios que el usuario haya eliminado deliberadamente, sus nombres y favoritos. No se recuperan los efectos sintéticos retirados de versiones antiguas ni credenciales de la 12.2.0.

## Reproducción de regalos

Los sonidos y los medios de audio se repiten una vez por regalo recibido, también en rachas. 1000 regalos de una moneda generan 1000 reproducciones; un regalo cuyo precio sea 1000 monedas genera una. La opción «Repetir audio por regalo» puede desactivarse por regla. El cooldown no descarta estos sonidos; sigue aplicándose a las demás acciones. Puntos y temporizador no se multiplican por la cola de audio.

La cola SQLite conserva pendientes al reiniciar, pausa, permite reintentar fallos y cuenta finalizaciones confirmadas por el reproductor. Una fuente por overlay reproduce cada elemento; las vistas previas tienen una cola aislada. Si se usa una fuente individual de regalo, hay que abrir o añadir su URL a OBS. Debe mantenerse conectada una fuente de reproducción. Los sonidos se reproducen secuencialmente; 1000 archivos de 7,44 segundos tardan aproximadamente dos horas. Vaciar la cola o borrar una pantalla cancela explícitamente sus pendientes. Si se pierde la conexión antes de confirmar el final de un sonido, ese sonido pendiente puede comenzar de nuevo al reconectar.

## Compilación y publicación

`npm ci`, `npm test`, `npm run dist:win`. Scripts/Build.ps1 ofrece el flujo Windows. Las versiones de dependencias están fijadas en package-lock.json. GitHub Actions utiliza Windows 2022 y Node 22.

PUBLICAR_WITI_BOT.ps1, en la raíz del ZIP, verifica todos los recursos y hashes, los incluye explícitamente en Git, sube main a witi0/WITI-BOT, espera las pruebas/compilación y crea v2.5.0 únicamente si pasan. El propietario necesita Git y acceso al repositorio; los usuarios finales solo el instalador.

Las actualizaciones consultan HTTPS y verifican el manifiesto Ed25519 y el SHA-256 del instalador. WITI_UPDATE_PRIVATE_KEY debe permanecer como secreto GitHub. La firma Authenticode del EXE requiere certificado o servicio propio, que puede ser de pago: CSC_LINK y CSC_KEY_PASSWORD. No se incluye una clave privada. SmartScreen puede mostrar avisos sin una firma y reputación adecuadas. No se modifica Defender ni el firewall.

## Verificación y límites

Ver PRUEBAS_2.5.0.md, verification.json y registros en la entrega. Las pruebas de 1000 regalos ejercitan motor, SQLite, HTTP/SSE y el reproductor DOM con finales de audio simulados. FFmpeg decodifica MrBeast Rizz 1000 veces; esto no demuestra salida física por altavoces. El instalador real se compila y extrae en Linux para verificar contenido e integridad.

La instalación, ejecución, actualización y desinstalación en Windows limpio aún necesitan validación en Windows. No se declara esa prueba realizada. Spotify requiere consentimiento y aprobación/capacidad del proveedor; TikTok LIVE depende de una emisión real y del conector comunitario. Las voces online dependen de sus proveedores. No se han inventado credenciales ni aprobaciones de TikTok.
