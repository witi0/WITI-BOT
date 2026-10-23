## 5.3.5 · WitiVoces y cola LIVE

- WitiVoces no sustituye silenciosamente las voces elegidas por Microsoft; informa fallas del proveedor.
- Síntesis comunitaria concurrente con límites de espera acotados y colas de comentarios recientes.
- Preserva el estado de seguidor entre eventos y exige seguimiento + 100 likes, un regalo o 10 comentarios para aparecer en Comunidad. Aísla fallos de puntos de los comandos.
- /play registra atribución antes del envío a Spotify, revierte solicitudes fallidas y actualiza Siguientes 3 inmediatamente.
- El overlay musical muestra las solicitudes de WITI BOT con quién las pidió y su avatar cuando existe.

# WITI BOT 5.3.4 — WitiVoces y lectura rápida

- Se vuelven a mostrar explícitamente las siete voces originales de WitiVoces; la opción Windows se conserva como respaldo local. Si una voz antigua estaba guardada, se restaura su motor online.
- Se reducen los límites de espera remota por comentario de hasta 17 segundos a 4.4 segundos como máximo para los dos intentos, más el tiempo normal de red y reproducción.
- Cuando los proveedores comunitarios fallan se usa temporalmente Windows, sin repetir esperas remotas por cada comentario durante 30 segundos; se muestra el estado real al usuario.
- La cola de comentarios TTS evita acumular lecturas antiguas: conserva la lectura activa y como máximo una lectura en espera; no cancela sonidos, comandos o pruebas manuales.
- Se corrigen cancelaciones y límites de tiempo de la reproducción para impedir que un audio atascado bloquee toda la cola.
- No se modifican TikTok LIVE, OBS, el diseño del chat ni los datos de Comunidad.

# WITI BOT 5.3.3 — Estabilidad de conexión TikTok LIVE

- Se conserva el dashboard y el chat LIVE de la 5.3.2.
- Se recupera el esquema de eventos del conector PirateTok de la 5.3.1, evitando que eventos experimentales afecten la apertura de sesión.
- Las notificaciones de la interfaz y el procesamiento de telemetría no pueden hacer fallar el handshake de TikTok: el estado LIVE es independiente de las ventanas.
- Una excepción del chat flotante ya no interrumpe el proceso de conexión.
- Se añaden pruebas de regresión para errores de observadores de estado.
- Los regalos y comentarios siguen disponibles; los cofres y entradas siguen sujetos a los eventos que realmente exponga el proveedor conectado.

> La recepción de un LIVE real requiere validación en la PC y cuenta del creador; GitHub Actions valida el código, no la disponibilidad de TikTok.

# WITI BOT 5.3.2

- Rediseño final del chat LIVE: panel compacto inspirado en TikTok, anclado al Inicio y Chat & LIVE, con el mismo contenido en la ventana desprendible.
- Cronología más reciente primero, nombres, avatares, niveles y roles; filtros de todos, regalos, suscripciones, seguidores, mensajes y cofres.
- Cada regalo usa su imagen real de TikTok o su imagen importada cuando está disponible; un icono local sustituye los regalos sin imagen. Se muestran nombre, cantidad y hora.
- Likes y compartidos excluidos de la visualización del chat, sin alterar puntos ni reglas; el envío al chat permanece en solo lectura.
- Nuevo resumen LIVE, accesos a comandos, eventos y economía; conserva la experiencia Electron y el icono elegido.
 — Chat LIVE e identidad WITI

- Icono de aplicación actualizado al emblema W de la referencia proporcionada por el creador (barra lateral, splash, ventana e instalador Windows).
- Ventana flotante LIVE con una sola cronología, avatares, regalos con imagen y cantidad, insignias de nivel/moderación, seguimiento, suscripciones, comandos y respuestas del bot.
- Likes y compartidos ocultos en el chat flotante y el resumen del Inicio, sin modificar su contabilización ni sus reglas.
- Filtros y preferencias individuales, seguimiento automático opcional, acceso al evento más reciente y tamaño/posición conservados.
- Estadísticas reales de la sesión y top de donadores, sin cifras de demostración. Los eventos de cofres o miembros solo aparecen si el conector realmente los proporciona.
- Nuevo resumen LIVE en Inicio, con actividad reciente y acceso directo al chat flotante.
- Mantiene Electron y las funciones de la versión 5.3.1; no migra todavía a Tauri.

---

# WITI BOT 5.3.1 — Creator Workspace integrado en Electron

- Se integra directamente al ejecutable Electron el diseño industrial del HTML Creator Workspace: navegación lateral agrupada, cabecera, telemetría de conexiones, dashboard y paleta titanio/obsidiana con acento esmeralda.
- El nuevo shell conserva las páginas y los identificadores originales, y se conecta a los comandos reales de TikTok LIVE, OBS, música, comunidad, sonidos, simulador y TTS que ya existen. No es una vista previa desconectada.
- Transiciones de secciones calculadas mediante resorte amortiguado; admite reducir movimiento y evita renderizado 3D continuo mientras el juego está abierto.
- Se mantiene sin cambios el formato y URL de las fuentes Navegador de OBS, evitando que haya que agregarlas de nuevo.
- Incluye nuevas pruebas de integración para exigir el shell y verificar que las 18 páginas siguen disponibles.
- Los módulos Tauri 2 continúan como proyecto experimental independiente; este instalador es una actualización de la app Electron que ya usas.

# WITI BOT 5.3.0

- Puntos automáticos desde la primera interacción con audiencia explícita: todos, seguidores confirmados o requisitos de comunidad. Se conservan las cantidades y los tiempos de espera configurados.
- El bono de alta se suma a la recompensa del evento; los bloques de likes y las fracciones por moneda conservan sus excedentes. Detección persistente de eventos duplicados.
- Panel de Comunidad actualizado al recibir eventos, con última acreditación y motivo de cero puntos.
- Controles de overlays según contenido y estilo. Interruptor general de animaciones que también detiene RGB, transiciones y partículas.
- Top Donadores con medallas de oro, plata y bronce. Se mantienen las miniaturas fijas y la vista previa bajo demanda.
- Validación: 152 pruebas automatizadas y comprobación en Chromium de medallas y activación/desactivación real de animaciones y RGB. Pendiente prueba con TikTok, Spotify y OBS reales en Windows.

# WITI BOT 5.2.1

- Galería con 29 miniaturas SVG locales, fijas y sin RGB.
- Vista previa bajo demanda con la configuración persistida del overlay, dimensiones, colores y animaciones. Al cerrar o salir del apartado se restaura la miniatura.

# WITI BOT 5.2.0

- Las reglas de regalos específicos tienen prioridad sobre las reglas generales, incluidos sus sonidos. Un regalo sin regla específica usa las reglas generales habilitadas.
- Estadísticas por sala LIVE y reinicio al detectar un nuevo directo. Las reconexiones a la misma sala conservan la sesión; el saldo permanente de Comunidad no se borra. Top Puntos muestra puntos ganados durante el directo.
- Los rankings completan los puestos configurados con USUARIO EJEMPLO y cero puntos, likes o monedas. Los eventos reales sustituyen esos puestos.
- Solicitudes musicales por orden de llegada antes de las recomendaciones de Spotify, con nombre y foto de quien solicitó cada canción. La atribución acompaña a la canción actual.
- Tres estilos persistentes por overlay: Minimalista, RGB WITI y PRO. Texto de color configurable o RGB, animaciones por cambios de contenido y reducción de movimiento.
- Reconexión OBS: actualización de fuentes de navegador y alertas individuales, conservando sus URL estables.

Validación local con eventos simulados y servidor de overlays. Las conexiones reales con Spotify, TikTok y OBS requieren comprobarse en Windows durante un directo.

# WITI BOT 5.1.1

- Comunidad y puntos: registro automático exclusivo para seguidores confirmados que acumulan 100 likes, envían un regalo o escriben 10 comentarios. Puntos por tap-tap, monedas, compartir, comentar, seguir, suscripción y tiempo activo estimado configurable.
- Panel de miembros con saldo, likes, comentarios, regalos, altas y bajas de puntos, eliminación individual o reinicio confirmado.
- Simulación de comandos con respuesta visible y vista integrada del overlay de prueba, sin alterar el saldo real ni Spotify.
- OBS: reconexión local cuando se habilitó previamente y recarga de fuentes del navegador de WITI BOT al recuperar el WebSocket, conservando la URL estable y las escenas.
- Moneda animada cuando aumenta el total de donadores y apariencia más simple en los demás widgets, respetando la configuración RGB.

# WITI BOT 5.1.0

- Overlays de referencia: música con portada, título y artista en una línea, tiempo y tres siguientes con portadas y solicitante cuando está disponible.
- Tops de likes, puntos y donadores sin paneles, con fotos, corona para el primer lugar y valores bajo el nombre. Niveles reales si el proveedor los informa.
- RGB y paletas configurables; composición clásica disponible. URLs de OBS conservadas al actualizar.
- Avatares del LIVE incorporados al ranking de puntos y niveles conservados en el estado del directo.

# WITI BOT 5.0.1

- Colaboradores rediseñado: WITI en rojo fijo, composición de mayor presencia, retrato destacado y descripción ampliada del creador.
- Felipino-FLD con presentación dedicada y descripción ampliada de su papel como beta tester.
- Enlaces y fotografías originales conservados; distribución adaptable y animaciones que respetan movimiento reducido.
- Corregida la sintaxis del puente de Electron para cargar correctamente las funciones de escritorio.

# WITI BOT 5.0.0

- Simulación de regalos con nombres originales y traducidos compatibles con las reglas reales, misma cola de sonido y sin cobros o puntos permanentes.
- Respuestas de comandos con nombre, avatar, saldo, confirmaciones y errores. Compatibilidad con las fuentes antiguas y recuperación breve del último mensaje al abrir la fuente.
- Atajos configurables y globales de Windows: añadir, editar y eliminar combinaciones; restauración si Windows rechaza una tecla ocupada. Conserva las combinaciones anteriores al actualizar.
- Desactivar TTS corta el sintetizador y audio online, cancela su cola y evita que una síntesis en curso reactive la voz. Corte de voz independiente del resto de sonidos.
- Colaboradores: Witi, fundador y dueño; Felipino-FLD, beta tester. Fotografías facilitadas, enlaces oficiales y marcas vectoriales de TikTok, Discord y GitHub.
- Menos actualizaciones de progreso en fuentes que no muestran música, estado compartido por ciclo del servidor de overlays y cola de respuestas acotada. Se conserva el RGB existente.

---

# WITI BOT 4.4.0

- TTS de seguidores: estado 0 interpretado como no seguidor; se elimina la herencia de permisos anteriores cuando falta confirmacion actual. Sin consulta remota por comentario.
- Nombres hablados en minusculas con normalizacion Unicode, limpieza de emojis y separadores; nombre visible original conservado.
- Contenido musical ajustado al alto disponible para conservar el contorno completo de las tres fuentes.
- Rankings con corona, medallas y valores junto al nombre; corazones y monedas animados.
- Bordes RGB mas visibles conservando la paleta y el interruptor existentes.
- Umbrales exclusivos de likes y multiples acciones por evento.
- Conexion automatica al abrir con usuario guardado, reintento de cinco segundos tras fallos recuperables y respeto de limites remotos.
- Nuevo simulador con catalogo de regalos, cantidades, identidad, estado de seguidor y vistas de prueba. Contadores de pruebas separados de los reales.
- Se retiran las referencias comerciales de los textos visibles; integracion local compatible conservada.

Validacion local: pruebas automatizadas y navegador. La conexion al LIVE real, audio de Windows, Spotify y OBS instalados requieren validacion en la PC del creador.

# WITI BOT 4.3.0

- RGB de texto y bordes unificado con paleta personalizada, velocidad e interruptor por pantalla.
- Cancion actual, proximas tres canciones y diseno combinado como overlays independientes.
- Rankings compactos con numero de personas configurable, corazon y moneda animados al aumentar valores.
- Registro y economia para seguidores confirmados que interactuan: alta unica, likes por bloques, compartidos, comentarios y suscripciones.
- Filtro TTS para seguidores y preescucha con volumen al configurar sonidos.
- Una sola ventana flotante con regalos y actividad arriba y comentarios abajo.
- Catalogo de regalos observados persistente con prioridad por ID sobre referencias regionales.
- Menos trabajo por fotograma, vistas previas descargadas al salir y registro de diagnosticos agrupado.

La conexion a un LIVE real, Spotify real y OBS instalado requieren validacion en la PC del creador.

# WITI BOT 4.2.0

- Reproducción de sonidos de reglas directamente en Windows, sin depender de pantallas o OBS y con confirmación en la cola.
- Recuperación de sonidos anteriores pendientes y fuentes de acciones nuevas para perfiles ya instalados.
- Pantallas con enlaces de OBS, botón para añadir fuentes y editor RGB con paletas y colores personalizados por overlay.
- Chat y regalos desprendibles en dos ventanas siempre encima, con nombre, imagen del regalo y multiplicador.
- Likes agrupados por hitos de 1,000 sin eventos uno por uno en las consolas.
- Fuente independiente para /puntos, avisos y errores de comandos.
- Interfaz morada oscura con efectos RGB reales y opciones de transparencia.

---

# WITI BOT 4.1.0

- Sustituye Euler por PirateTok 0.3.0 en la conexión principal. Basta con el usuario de TikTok; se retiran los campos de sala y API key de la interfaz. El conector anterior solo se conserva como dependencia de desarrollo para regresiones históricas y no se distribuye.
- Conexión directa desde la PC, sin cuotas propias de firmas o eventos. Esto no garantiza que TikTok acepte todas las conexiones ni evita sus restricciones.
- Un solo gestor de reconexiones con espera progresiva, cancelación y protección contra estados/eventos de conexiones anteriores. No se marca conectado por el aviso temprano de resolución de sala de PirateTok.
- Adaptación de comentarios, rachas de regalos (repeatEnd numérico o cadena), suscripciones con sender/user, seguidores, compartidos, likes y espectadores; conserva IDs largos, niveles, roles y nombres de regalo.
- Evita reproducir mensajes históricos con fecha anterior al inicio de la conexión.

---

# WITI BOT 4.0.2

- Corrige el texto de chat del esquema actual de TikTok: se lee content, con compatibilidad para comment. Los comentarios recuperan su texto en el panel, overlays, TTS y comandos.
- Elimina la consulta automática del catálogo remoto al conectar. Esa operación adicional pedía firma de un plan Business y dejaba un error AUTH aunque el socket LIVE siguiera recibiendo eventos. Se utiliza el catálogo local y los metadatos incluidos en regalos recibidos.
- Separa las advertencias de catálogo de los errores de conexión y mantiene la detección de rechazos reales de autenticación del chat.
- Corrige los campos count de likes y total de espectadores del esquema actual.
- Regresiones con mensajes protobuf codificados/decodificados por la dependencia instalada y handlers IPC del programa.

---

# WITI BOT 4.0.1

- Repara la carga de preferencias antiguas con prefijo TTS vacío: el panel general y el editor de overlays pueden abrir sin errores de TTS. La validación estricta se aplica únicamente al guardar la configuración de voz.
- El botón Conectar del panel LIVE inicia la conexión directamente con el usuario indicado, muestra progreso e impide intentos simultáneos. Opciones avanzadas abre la configuración de sala y proveedor.
- El estado de TikTok se actualiza por su propio canal, sin depender de leer todas las preferencias de la aplicación. Los errores de conexión permanecen visibles y se puede reintentar o desconectar.
- Pruebas de regresión con preferencias heredadas, handlers IPC reales, conexión del adaptador y editor de overlays. Se conservan puntos, fuentes y reglas al actualizar.

---

# WITI BOT 4.0.0

- Corrección del bloqueo de compilación: npm start/test/dist ya no ejecuta la migración destructiva a 3.4.
- TikTok: evento de suscripción SUB_NOTIFY compatible con SDK 2.5, lectura de userIdentity, niveles y avatar; catálogo de regalos actualizado después de abrir el socket, sin bloquear la conexión.
- Conexión directa con reconexión y diagnóstico visible; entrada alternativa desde la Event API de TikFinity para Windows (puerto local 21213). Abrir el puente local no se presenta como un LIVE confirmado.
- Comandos configurables /play, /puntos, /skip, /voz y respuestas, alias, permisos, recarga y costo. Registro persistente, cobro único y devolución si la acción falla. /play añade la canción a la cola de Spotify, que requiere sesión y dispositivo activo; sujeto a los permisos de la cuenta Spotify.
- TTS con prefijo opcional; audiencia, club de fans, nivel de donador, top donadores de la sesión, bloqueos, longitud y espera por usuario.
- TTS y alertas comparten exclusión de audio. Prioridad crítica configurable, pausa, reintento y separación entre audios. Espectro medido de la fuente OBS; Windows TTS local no informa niveles.
- RGB tipográfico con espectro, colores personalizados, dirección, velocidad de 0.1 a 10 s, ángulo, saturación y brillo; incluye nombre, badges y mensaje. Transparencia sin fondo, bordes ni sombras en modo transparente.
- Workspace oscuro cyan/verde/rojo, fuentes locales Inter, Space Grotesk y JetBrains Mono, respuesta de controles y reducción de movimiento.

## Instalación y conexión

Descarga WITI_BOT_Setup_v4.0.0.exe en Assets. Cierra WITI BOT antes de actualizar. El instalador conserva la configuración y los puntos existentes.

En Chat & Acciones en LIVE, selecciona conexión directa y escribe tu @usuario. Si TikTok o el proveedor rechaza la firma/conexión, consulta el código y detalle en la consola. La autorización OAuth de identidad no concede por sí sola acceso al chat LIVE. Como alternativa, abre TikFinity para Windows, conecta allí tu LIVE, habilita Event API y selecciona Usar TikFinity local.

La validación automatizada no sustituye una emisión real de tu cuenta ni prueba el instalador mediante una sesión interactiva de Windows. Si no existe clave privada de actualización en GitHub Actions, se publica el instalador manual y su SHA-256; el verificador de actualizaciones automáticas conserva su requisito de firma.

---

# WITI BOT 3.5.0

- Nuevo panel Chat & Acciones en LIVE, conectado al flujo nativo de eventos de Electron, con consola dividida, filtros, estadísticas y pruebas TBT aisladas.
- Diagnóstico en vivo: EPS, latencia estimada cuando existe timestamp del proveedor, estado del conector y registro limitado.
- Motor Chroma RGB para todos los textos de overlays: velocidades de 0.1 a 10 s, ángulo, brillo, saturación y paletas editables.
- Mejoras de transparencia en fuentes de navegador: fondo alfa, eliminación de sombras en modo transparente y capas animadas selectivas. La fidelidad definitiva depende de OBS y GPU.
- Cola de reproducción SQLite con prioridades (crítico, medio, estándar), serialización de audio y preempción de acciones no críticas para alertas críticas; se conservan confirmaciones de finalización.
- Nueva estética táctica en negro/cyan/verde/Redstone, con accesibilidad de movimiento reducido.
- Compatibilidad preservada con la galería WITI BOT v12 y el núcleo existente de TikTok LIVE/Spotify/OBS.

## Validación necesaria antes de afirmar funcionamiento completo

- Probar una sesión LIVE real con la cuenta del creador y su proveedor de conexión. Las restricciones externas de TikTok no pueden resolverse de forma absoluta solo con código cliente.
- Probar OBS y audio real de salida en Windows: reproducción, interrupciones de prioridad, alfa y antialiasing.
- Pruebas automatizadas del proyecto completo y empaquetado mediante GitHub Actions antes de generar etiqueta de release.
