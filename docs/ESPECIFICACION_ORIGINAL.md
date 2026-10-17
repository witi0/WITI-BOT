# PROMPT MAESTRO PARA ASTRA — WITI BOT

## INSTRUCCIÓN PRINCIPAL: CONSTRUYE UN PRODUCTO REAL

Actúa como un equipo sénior de ingeniería de software, arquitectura, seguridad, diseño de producto, UI/UX, audio en tiempo real, integraciones para streaming, pruebas y distribución de aplicaciones de escritorio. Tu objetivo es **crear, probar, empaquetar y, cuando se autorice, publicar WITI BOT**, una aplicación de escritorio para Windows 10/11 x64 destinada a creadores de TikTok LIVE. No quiero únicamente asesoría, diseños, un prototipo, páginas estáticas o fragmentos inconexos: quiero una aplicación mantenible y verdaderamente funcional, construida por etapas verificables hasta una entrega instalable.

Usa TikFinity como **referencia de amplitud funcional y experiencia de configuración**, NO copies sin licencia su código, branding, archivos, gráficos, audio, elementos protegidos ni claves privadas. La galería debe abarcar las mismas **categorías y capacidades principales** que TikFinity, con implementaciones y estilos originales. Referencia funcional: https://tikfinity.zerody.one/ y https://tikfinity.zerody.one/tiktok/obsoverlays . Si aparecen nuevas categorías en su galería pública durante la implementación, compáralas con el inventario de esta especificación y propón incluir las pertinentes sin romper lo anterior.

**Nombre público del producto:** WITI BOT. No arrastres nombres antiguos (Wisherity, Sheriti Studio, etc.) en título, instalador, carpetas visibles, menús o banners. **Idioma por defecto:** español latinoamericano, idealmente es-MX; prepara internacionalización. **Identidad visual:** negro/grafito y morado, con acentos violetas, RGB optativo, diseño profesional propio, tipografía moderna, transiciones fluidas, menús funcionales, paneles redimensionables, scroll que conserve su posición y controles accesibles. No hagas una copia pixel a pixel de TikFinity. **Modelo económico del producto:** todas las funciones propias gratuitas, sin créditos, publicidad ni versión Pro. Cuando terceros exijan cuentas Premium, pago, licencias o revisiones, dilo y ofrece alternativas gratuitas cuando existan; no finjas que son ilimitados.

**Forma de trabajar:** investiga documentación actualizada de las integraciones antes de programarlas; examina repositorios/archivos existentes si el usuario facilita acceso; ejecuta los cambios mediante las herramientas disponibles; produce código íntegro y pruebas; usa un registro de avances y pendientes comprobables; no afirmes que una integración, build, .exe, publicación o prueba funcionó sin evidencia. No solicites aprobaciones genéricas: solicita únicamente la autorización, conexión o configuración concreta que haga falta en el momento. Si cuentas con acciones autorizadas para crear proyectos, configurar GitHub o desplegar releases, úsalas; nunca pidas contraseñas en texto, ni las incrustes. Si careces de acceso a un servicio, deja su integración preparada y explica con exactitud el bloqueo; sigue trabajando en los módulos independientes. No hagas una aplicación falsa para cumplir una lista.

## 1. ARQUITECTURA Y TECNOLOGÍAS

Propón una arquitectura local-first con **Electron + React + TypeScript + Vite + Tailwind CSS** (o explica una alternativa técnicamente superior), procesos principales y de renderizado aislados, preload con API mínima, `contextIsolation`, sin `nodeIntegration` inseguro; backend local con servicios Node, WebSocket/HTTP ligados a `127.0.0.1` por defecto, base SQLite con migraciones y transacciones, registros y pruebas automatizadas. Para gráficos de overlays usa HTML/CSS/Canvas/Web Animations según el caso; para física, un motor eficiente. Audio y TTS con proveedores enchufables. Modulariza: TikTok Read Connector, TikTok Chat Write Connector, Spotify Connector, OBS Connector, Event Bus, Rule Engine, Sound Engine, TTS Engine, Points Ledger, Song Queue, Timer Engine, Gift Catalog, Overlay Renderer, Updater, Settings, Diagnostics.

Diseña puertos/adaptadores claros para cambiar bibliotecas sin reescribir la interfaz. Evita cloud obligatoria: el procesamiento, las preferencias, los puntos y los overlays deben seguir funcionando localmente siempre que la integración externa lo permita. Cualquier nube será opcional o necesaria solo para funciones claramente explicadas (p. ej. hosting de releases o acceso remoto seguro).

La app instalable debe mantener recursos multimedia fuera de carpetas que se sobrescriban al actualizar. Archivos importados, datos y perfiles deben conservarse mediante copias/migraciones. Incluye modo simulación visible y diferenciado de un directo real.

## 2. EXPERIENCIA Y NAVEGACIÓN

Diseña un onboarding de primera ejecución con progreso: bienvenida → perfil del streamer → TikTok → Spotify (opcional) → OBS (opcional) → probar overlays → tutorial corto. Mostrar el estado real de conexión de cada servicio (conectado, conectando, esperando autorización, limitado, error, no disponible). Nada de interruptores falsos.

Menú lateral agrupado de manera intuitiva:
- **Inicio:** dashboard, directo, estadísticas, eventos recientes, centro de notificaciones, estado de servicios y diagnósticos.
- **Conexiones:** TikTok LIVE, inicio de sesión/autorizaciones TikTok, Chatbot, Spotify, OBS Studio, webhooks.
- **Interacciones:** Eventos y acciones, alertas de sonido, galería de regalos, TTS del chat, comandos, respuestas del chatbot, moderación.
- **Comunidad:** Usuarios, puntos, niveles, transacciones, rankings, recompensas, economía y ajustes de puntos.
- **Spotify:** Reproductor, solicitudes musicales, cola, historial, comandos y permisos.
- **Superposiciones:** Galería, objetivos y metas, overlays guardados, editor, vistas previas y enlaces OBS.
- **Herramientas:** Like Tool/Likeathon, temporizador extensible, calculadora de donaciones, ruleta, puntos emergentes, utilidades de stream.
- **Configuración:** General, audio, carpetas, seguridad, backups, actualizaciones, accesibilidad, logs, sobre WITI BOT.

Todas las pestañas deben funcionar de forma coherente, con estados vacíos útiles, validación, mensajes claros, deshacer cuando proceda y persistencia; evitar recarga al hacer scroll o cambiar de pestaña.

## 3. TIKTOK LIVE: LECTURA Y SESIÓN

Permitir indicar @usuario, consultar si está en LIVE, conectar/desconectar, recordar usuario, reconectar con backoff y mostrar estado y diagnósticos. Recibir, siempre que una fuente de eventos realmente lo permita: comentarios, comandos, likes y sus acumulados, regalos y sus rachas, monedas, seguidores, compartidos, suscripciones, superfans, miembros del team y su nivel, entrada de usuarios, espectadores actuales, cierre del directo, acciones del streamer y metadatos asociados. Algunas plataformas no ofrecen todos los eventos con la misma fiabilidad: mostrar fuente, precisión y disponibilidad.

Crear **dos conectores independientes**: (A) lectura del LIVE y (B) capacidad de escribir mensajes en el chat como cuenta autenticada del streamer. Que leer el chat funcione no significa que haya permiso para enviar mensajes. TikFinity documenta que su chatbot necesita iniciar sesión en TikTok desde su aplicación de escritorio, pero no publica el mecanismo interno preciso. Investiga qué opción **autorizada y vigente** permite a WITI BOT enviar chat con consentimiento del titular. Diseña una experiencia «Conectar cuenta de TikTok»: inicio de sesión propio de la plataforma, consentimiento claro, conservación segura de sesión, cerrar sesión, revocar, estado de permiso y control de envíos. No solicitar `sessionid` ni cookies pegadas manualmente, no copiar tokens de TikFinity, no eludir captcha/antibot, no extraer contraseñas ni presentar una API de escritura inexistente como oficial. Si no se dispone de una integración de escritura autorizada, implementa el módulo con interfaz lista, cola de mensajes, simulador y modo alternativo de respuesta en overlay; informa que el envío al chat está pendiente de acceso real, sin fingir resultados.

Construir catálogo de regalos dinámico, con caché versionada y refresco: búsqueda, filtros, icono, nombre, ID interno, coste en monedas cuando esté disponible, regalos de racha, imagen y variantes. Debe aspirar a representar **todo el catálogo accesible en la región/cuenta/live**, con avisos de que TikTok lo modifica y no hay una lista universal inmutable. Permitir vincular una alerta o acción a «cualquier regalo», un tipo concreto (incluido el regalo «Quiéreme», si está disponible), umbral de monedas, cantidad y racha. Evitar disparos duplicados durante los streaks, con estrategia configurable inicio/final/cada N regalos.

## 4. CHATBOT CON RESPUESTAS EN EL CHAT

Crear panel para activar/desactivar chatbot, elegir nombre, prefijo de comandos, plantillas, permisos, filtros, cooldowns, tasa máxima de envío, antispam y registro de confirmaciones. El flujo esperado: un espectador escribe `!play nombre - artista`; el sistema valida usuario/permisos/cola/Spotify, acepta o rechaza y **si el conector de escritura está autorizado y operativo** publica desde la cuenta autenticada: «@usuario, tu canción fue añadida a la lista». Proporcionar plantillas para éxito, error, duplicado, falta de puntos, límite, canción no encontrada, comando no permitido y servicio desconectado. Variables `{user}`, `{song}`, `{artist}`, `{points}`, `{queue_position}`, `{reason}` con escape contra inyección. Cola de respuestas, consolidación, límites por usuario y globales, máximo de longitud, opción «no enviar» y auditoría de qué mensajes fueron realmente enviados. Otros comandos: `!puntos`, `!nivel`, `!top`, `!recompensas`, `!canjear`, `!play`, `!revocar` (retirar solicitud propia pendiente), `!skip` (según permiso), `!queue`, `!ayuda`, y comandos personalizados.

No confundir **respuesta en overlay** con **mensaje realmente publicado en TikTok**. Mostrar ambas salidas por separado.

## 5. MOTOR DE EVENTOS, DISPARADORES Y ACCIONES

Implementar editor visual profesional de reglas tipo «CUANDO [evento] Y [condiciones] → ejecutar [acciones]». Crear, copiar, agrupar, activar/desactivar, reordenar, exportar/importar, probar y borrar reglas; historial de ejecución con motivo de aceptación o rechazo. Permitir **múltiples acciones simultáneas, secuenciales o una aleatoria**, con prioridad, retraso, duración, cola y cooldown. Disparadores: follow, share, suscripción, superfan, miembro team con nivel configurable, entrada al LIVE si disponible, like individual/lotes/umbral, comentario cualquiera o coincidencia regex segura, prefijos `.` `/` `!`, comando, regalo específico/cualquier regalo/cantidad/monedas/streak, puntos/nivel/recompensas, timer, meta alcanzada, canción aceptada/terminada, botón manual, evento OBS, webhook válido, evento periódico.

Filtros «quién puede activar»: todos, seguidores, moderadores, suscriptores, superfans, miembros de team con nivel mínimo, Top donadores (del Top 1 al Top N elegible, por ejemplo Top 3 o 5), puntos/nivel, listas blanca/negra, usuarios concretos, usuario nuevo/recurrente, monto mínimo, antigüedad, número de veces, horas y cooldown. Si TikTok no informa una insignia, no inventarla: regla de fallback configurable o denegación clara.

**Acciones disponibles y funcionales**: mostrar imagen PNG/JPEG/WebP; GIF; video MP4/WebM con audio; animación CSS/Canvas; alerta «avatar + usuario + texto»; reproducir audio WAV/MP3/OGG; TTS; respuesta de chatbot en LIVE cuando autorizada; aviso en overlay; cambiar escena OBS; mostrar/ocultar/activar una fuente OBS; silenciar/ajustar fuente OBS; iniciar transición; invocar webhook HTTPS con plantilla JSON; llamada HTTP autorizada; actualizar contador; añadir/quitar puntos; canjear recompensa; cambiar temporizador (+/-/pausa/reset); mostrar ruleta; reproducir secuencia; activar una o varias pantallas de overlay; ejecutar comando interno seguro; permitir acciones de teclado limitadas y explícitamente autorizadas. Para webhooks: validación URL, evitar SSRF hacia red privada por defecto, secretos fuera del frontend, timeouts, retry limitado y logs sin credenciales. Para archivos, previsualización, límites de tamaño y formatos compatibles.

Ejemplos obligatorios funcionando en simulación y en entorno conectado: (a) al seguir, mostrar video y reproducir sonido; (b) al enviar «Quiéreme», ejecutar GIF, TTS y sumar puntos; (c) al escribir `!susto`, mostrar video y cobrar puntos; (d) regalo costoso cambia escena OBS 10 s y restaura escena, si no hubo cambio manual; (e) un comando envía confirmación por chatbot solo si se confirmó envío real.

Editor de acciones con selectores de disparador, condición, grupo permitido, acción, recursos, overlay/pantalla, prueba, guardar, duplicar y logs. Variables de eventos accesibles en plantillas, saneadas.

## 6. SUPERPOSICIONES — INVENTARIO EXHAUSTIVO

La galería es prioritaria. Emular la **cobertura funcional**, no copiar assets. Implementar tarjetas con búsqueda, filtros, ejemplo animado, «Configurar», «Probar», «Duplicar», «Copiar URL», «Añadir a OBS», exportar configuración y eliminar. Ofrecer categorías:

**Clasificaciones y comunidad:** Top Gifters (1/3/5/10, medallas y coronas), Top Liker y Likeathon, Ranking de puntos, Top Gift de mayor valor, Top Streak, Top donadores históricos, User Info Screen, Command Info Screen, Points Animation, Points Drop, último seguidor/último regalo/último suscriptor/último compartido («Last X»).

**Objetivos y contadores:** metas de likes, follows, shares, monedas/regalos, suscriptores, viewers, team y metas personalizadas; barras lineales/circulares/verticales, progreso, colores, animaciones y acción al completar; Gift Counters individuales/múltiples y votación por contadores; contador de espectadores y estadísticas; coin jar física y versión PRO si se puede desarrollar de forma original.

**Interacción y animaciones:** My Actions con **mínimo ocho pantallas de acción independientes**, URL propia y cola por pantalla; Interaction Slider; Wheel of Fortune con premios/probabilidades configurables; Like Fountain, Gift Cannon, Gift Fireworks, Emojify, Gift Feed, alertas de follow/sub/share, chat overlay, Stream Buddies con avatares, burbujas y movimientos, social media rotator, clips/animaciones de reacción, stream challenges y minijuegos originales aptos para LIVE.

**Música/tiempo/escena:** Song Requests con actual y siguientes tres, portada y progreso según permisos; Timer/Subathon/Extensible; texto ticker/avisos; marcos de webcam (gaming, RGB, minimalista); pantallas especiales y fondo transparente.

**Reglas de overlay:** URL `http://127.0.0.1:<puerto>/overlay/<id>?token=<token-limitado>` u otra vía segura, compatible con OBS Browser Source y TikTok LIVE Studio Link Source cuando proceda. Nunca exponer datos sensibles en URL. Configuración individual de resolución (1920x1080, 1080x1920, 1280x720 y personalizado), posicionamiento, tamaño, fuente, color, RGB que funcione, sombra, borde, iconos, avatar, opacidad, duración, velocidad, animaciones, sonido, cola, límite de entradas y reinicio por directo. Que el overlay no requiera que la ventana principal esté al frente, pero sí que los servicios locales necesarios estén ejecutándose. Proporcionar opción de servidor remoto seguro solo si es necesario y autorizado; no afirmar que localhost es accesible desde otro equipo.

Previsualizador con datos de prueba etiquetados, vista real-time, guías de áreas seguras para vertical y horizontal, editor de plantillas y un flujo sencillo para copiar el enlace al OBS. El render debe mantener estado aun si se cambia de pestaña. Si se cambia una meta, el overlay debe actualizarse automáticamente.

## 7. ALERTAS DE SONIDO Y BIBLIOTECA MEME

Crear sistema de alertas con búsqueda y catálogo de regalos, asignar un sonido a cualquier regalo o regalo concreto, likes, follower, suscriptor, share, comandos y combinaciones. Editor de volumen por alerta, prioridad, cooldown, duración, repetir, cortar audio anterior, cola, mezcla/ducking, salida de audio, prueba y perfiles.

El usuario recuerda **Sound Instants** como fuente de memes y quiere **muchísimos sonidos preinstalados**, más que en versiones antiguas de Witi Bot. Investiga el catálogo de https://soundinstants.com/ para inspiración y mecanismos de importación por el propio usuario, pero **no descargues masivamente, empaquetes ni redistribuyas audios de terceros sin licencia verificable**: sus términos no conceden distribución libre general. Ofrece inicialmente una biblioteca grande, bien etiquetada, con sonidos **originales o de licencias compatibles** (ideal 100+ si de verdad están creados/licenciados), y un importador para audios que el usuario tenga derecho a utilizar. Categorías: memes, reacción, risas, sustos, gaming, celebraciones, errores, donaciones, notificaciones, animaciones, música breve. No falsifiques el origen o la licencia.

**MP3Cut.net** es un editor/cortador de audio, no un servicio confirmado de voces TTS: incluir recortar audio, fade-in/out, volumen, velocidad, conversión, normalización, waveform y exportación mediante bibliotecas locales gratuitas o interoperabilidad apropiada, sin asumir que el sitio es una API. Ofrecer importar MP3, WAV, OGG y otros formatos compatibles. No depender de descargar desde servicios restringidos.

## 8. CHAT TTS: MÚLTIPLES VOCES, RANDOM Y FILTROS

Diseñar panel TTS con catálogo amplio de voces realmente instaladas/disponibles, idioma/variante, género/estilo si proveedor informa, velocidad, pitch, volumen, vista previa, pronunciación configurable, normalización de emojis/URLs, filtro de palabras, blacklist y sustituciones. **Random Voice** debe seleccionar al azar una voz compatible por comentario, entre voces autorizadas seleccionadas, evitando repetir opcionalmente la anterior y registrando qué voz se usó. Permitir voz predeterminada y voces por grupos. Proporcionar motores gratuitos/locales cuando sea posible (voces Windows/Edge cuando su uso esté permitido, SAPI, alternativas locales de software libre y modelos con licencias compatibles), sin costes artificiales por comentario impuestos por WITI BOT; informar limitaciones del proveedor.

**Preferencia prioritaria de voz:** la «Español (México) — Male Voice» gratuita que el usuario escucha en TikFinity. Hay una pista de tráfico observada a un servicio de síntesis de Google con `lang=es-MX`, `gender=male`, `speed=0.50`, `pitch=0.45`, pero **esto NO acredita la identidad del modelo ni concede licencia o acceso público**. Investigar un método legítimo con credenciales propias; NO reutilizar URLs privadas, claves ni tokens de TikFinity. Si no se puede verificar/integrar exactamente esa voz sin coste, explicarlo y proponer voces alternativas claramente identificadas, sin etiquetarlas falsamente como idénticas.

**Permisos de TTS configurables**: todos, seguidores, suscriptores, superfans, moderadores, miembros del Team con umbral de nivel, Top donadores con rango Top 1 a Top N, usuarios especiales, nivel mínimo de puntos. **Filtro de mensajes**: leer todos; únicamente comentarios que comiencen con `.`; únicamente `/`; únicamente `!`; prefijos personalizados, lista de palabras o regex segura; ignorar menciones o enlaces; lectura del nombre opcional; ignorar comandos de música; límites por caracteres/palabras/usuario; cooldown, colas, prioridades y pausa/reanudar/saltar/limpiar. Permitir **cobrar X puntos por uso del TTS**, verificar saldo, débito atómico y devolución si no se logró reproducir por fallo atribuible al sistema; permitir TTS gratis a grupos elegidos.

## 9. SISTEMA DE PUNTOS, USUARIOS, NIVELES, TRANSACCIONES

Base SQLite persistente y transaccional. Modelo usuario: identificador estable, @, nombre mostrado, avatar, fecha primera actividad, última actividad, duración observable en LIVE, likes, shares, regalos, monedas, suscripciones cuando verificables, puntos actuales, puntos totales ganados, puntos gastados, nivel, experiencia, historial y roles. Pantallas «Usuarios», «Transacciones», «Configuración de puntos», «Niveles», «Recompensas», «Rankings».

Puntos configurables por moneda/regalo, compartir, X likes, mensaje, minuto de presencia elegible, follow, suscripción, team y bonos manuales. El dueño elige **nombre de su moneda virtual**, singular/plural, icono, fórmula, bonos porcentuales para suscriptores/superfans o team, topes y cooldown. Presencia por minuto **solo si se puede medir con evidencia**; en caso contrario usar actividad reciente y llamarlo «minutos de actividad estimados», sin inflar automáticamente tiempos. Puntos por minuto de chat opcionales y separados de presencia real.

Niveles: XP o puntos acumulados, valor base como 100 por nivel, multiplicador creciente configurable, fórmula documentada (lineal, exponencial, curva personalizada), preview de umbrales y recalcular sin perder transacciones. Transacciones con ID, fecha, usuario, acción/origen, tipo, cantidad positiva/negativa, saldo resultante, evento asociado y operador; filtrado, orden, export CSV/JSON, reversión por contramovimiento auditable en vez de borrar silenciosamente el registro; permitir borrado administrativo solo mediante política y confirmación. Índices, deduplicación de eventos, idempotencia y pruebas contra puntos duplicados/saldos negativos.

Tienda y recompensas: nombre, coste, stock, permisos, horario, cooldown, acciones (audio, video, OBS, TTS, ruleta, mensaje, temporizador, webhook), confirmación, registro y reembolso. Transferencias opcionales entre usuarios con límites, permisos y antiabuso; comandos configurables de puntos, top y recompensas.

## 10. SPOTIFY Y SOLICITUDES MUSICALES

En «Conectar Spotify», abrir navegador del sistema con login oficial de Spotify y autorización clara; usar **Authorization Code with PKCE** para escritorio, `state`/verifier, callback registrado exactamente, tokens cifrados/protegidos en almacenamiento del sistema, refresh, revocación y diagnósticos. No pedir contraseña de Spotify dentro de WITI BOT. Si falta registrar una aplicación, guiar el alta y pedir al propietario únicamente la configuración/consentimiento necesarios. Elegir y registrar redirect URI correcto y probarlo de extremo a extremo (sin errores de mismatch).

**Restricción vigente importante para distribución pública:** a octubre de 2026, Spotify Developer Mode exige propietario Premium, limita a **cinco usuarios autorizados** por app y restringe endpoints; ampliar cuota requiere criterios y aprobación de Spotify, normalmente orientados a organizaciones. **PKCE no elimina ese límite**. Por tanto, diseñar una arquitectura que permita una integración individual autorizada y un camino formal de aprobación para uso público, pero **NO vender ni presentar como universal una integración de Spotify que únicamente funciona para cinco cuentas**. Señalar claramente qué endpoints están disponibles y los que no. Mantener la aplicación plenamente útil sin Spotify y añadir proveedor alternativo local de cola de solicitudes con archivos/URLs permitidas cuando sea adecuado.

Reproductor/estado según permisos: canción actual, artista, portada, progreso, dispositivo, play/pausa, siguiente, cola consultable y siguientes tres si realmente se pueden obtener o si pertenecen a la propia cola de solicitudes de WITI BOT. Distinguir «cola interna de WITI BOT» de «cola real de Spotify». Buscar canciones solo con endpoints permitidos. Comandos configurables: `!play canción - artista`, `!queue`, `!skip` (permisos, votos o coste), `!revocar` (cancelar solicitud pendiente **propia**), `!cancion`, `!ayuda`; respuestas del chatbot si autorizado; límites de peticiones por usuario, cooldown, permisos, listas bloqueadas, duración, deduplicación, puntos/coste y reembolsos. Si el usuario revoca una canción no reproducida, eliminarla de la cola interna y notificar; no fingir que Spotify permite retirar un elemento de su cola si el endpoint no existe. Overlay de canción actual y próximas tres solicitudes.

## 11. CONEXIÓN CON OBS STUDIO

Integrar **obs-websocket 5.x**, valor inicial `localhost:4455`, contraseña gestionada de manera segura, auto-reconexión, escenarios de errores y prueba de conexión. Leer escenas/fuentes y permitir: cambiar escena, mostrar/ocultar fuente, silenciar micrófono, controlar volúmenes, iniciar transiciones, consultar estado de streaming/grabación y activar acciones temporales restaurando estado si procede. Permitir elegir escena/fuente mediante listas recuperadas del OBS real, no texto de ejemplo. No iniciar/detener grabación o transmisión sin acción explícita del creador. Editor de reglas con acciones OBS y comprobación de conflictos.

Overlays para OBS mediante Browser Source: copiar URL, tamaño recomendado, guía de añadir fuente, preview local y diagnósticos de conectividad; botón para crear fuente desde OBS solo cuando exista permiso y se haya verificado su resultado.

## 12. HERRAMIENTAS: LIKE TOOL, TIMER Y DONACIONES

**Like Tool / Likeathon:** registrar likes según eventos disponibles, agrupar incrementos, objetivos, decaimiento de puntuación configurable, metas, reinicio por LIVE, widgets, modos de competición y acciones al superar hitos.

**Timer/Subathon/Extensible:** cuenta atrás con pausa/reanudar/reset, tiempo base, máximo, mínimo, tiempo ganado por **moneda**, regalo, superfan, follow, share, like, mensaje y suscripción; configurar segundos/minutos por cada origen independientemente, mínimos y cooldown para prevenir spam, historial de sumas/restas, acción al llegar a cero, overlays horizontal/vertical y persistencia incluso después de reiniciar programa (reconciliar tiempo transcurrido de forma configurable).

**Calculadora de donaciones externas:** el creador elige moneda (MXN, USD, EUR u otra) y equivalencia personalizada: «100 USD = 5 minutos» o «1 USD = X segundos»; al introducir valor, la app calcula tiempo con precisión, muestra fórmula, redondeo y confirmación y **suma ese tiempo al contador**. Permitir ingresar manualmente donaciones de PayPal/transferencia. Integración automática con PayPal solo si hay credenciales, autorización, webhooks oficiales, validación de firma, moneda/importe confirmado, prevención de duplicados, reembolsos y tratamiento de eventos no confirmados; no fingir recibir donaciones sin conexión real. Registrar importe, moneda, tipo de cambio si aplica, tiempo añadido, origen y estado. Posibilidad de revertir un registro por el administrador sin perder auditoría.

## 13. SEGURIDAD Y PRIVACIDAD

Sesiones y tokens en almacenamiento seguro del sistema, consentimiento explícito, logout y revocación. Proteger SQLite y backups contra lectura inadvertida. HTTP local ligado por defecto a loopback con autenticación de API; CORS restringido y no confiar en rutas/URLs de usuario. Sanitización de entrada y HTML, prevención de XSS en overlays, ruta segura de archivos sin traversal, prevención SSRF para webhooks, límites de tamaño, rate limiting, CSRF donde aplique, validación de actualizaciones, dependencias fijadas y auditadas, logs sin contraseñas, claves ni cookies. Los usuarios de WITI BOT no deben compartir credenciales del desarrollador. Sin acceso administrativo oculto, tracking secreto ni telemetría opt-out disfrazada. Proteger fotos/nombres almacenados y permitir borrar/expulsar usuario y datos personales conforme a la política pertinente.

## 14. ACTUALIZACIONES PARA TODAS LAS PERSONAS QUE INSTALEN WITI BOT

**Función obligatoria, no opcional:** el administrador del proyecto publica una versión nueva y quienes instalaron WITI BOT reciben un aviso dentro del programa: «Nueva versión X.Y.Z disponible», cambios, tamaño si disponible, botones **Actualizar ahora**, **Recordármelo después** y **Ver novedades**. Buscar actualizaciones al iniciar y periódicamente con intervalos sensatos, botón «Buscar actualizaciones» y descarga con progreso/errores/pausa cuando soporte. **No instalar durante un LIVE ni sin consentimiento**; permitir aplicar al cerrar y reiniciar. Conservar puntos, archivos, configuraciones, sesiones cuando sea seguro y overlays. Prever migraciones de BD, backup previo, restauración/rollback factible y comprobaciones tras actualizar.

Para Windows, preferir **electron-builder con instalador NSIS por usuario y electron-updater**, y **GitHub Releases público** como servidor de instaladores y metadatos (o un servidor HTTPS propio seguro). Separar ramas/canales `stable`, `beta` y prereleases; usar SemVer, changelog, artefactos, manifiestos de actualización, checksums, verificación de integridad, y firma de código cuando esté disponible; no desactivar verificaciones de seguridad para ocultar errores. **Un ejecutable portable no equivale automáticamente a instalador autoactualizable**; entregar el instalador correcto. Automatizar builds/publicaciones con GitHub Actions cuando se cuente con permisos, guardar secretos de CI adecuadamente y no meter tokens de GitHub en clientes. Añadir página pública simple de descarga si se autoriza; Vercel puede alojar la página, pero no es obligatorio ni debe reemplazar la publicación de binarios/metadata. Documentar el flujo exacto: subir versión → crear release → app detecta release → aviso → descarga → instalación segura → datos conservados.

## 15. AUDIO, ARCHIVOS Y COMPORTAMIENTO EN DIRECTOS REALES

Mezclador de audio con dispositivos de salida, buses para TTS/alertas/videos, control maestro, ducking sobre música, previsualización con dispositivo elegido, colas separadas y prioridad cuando coinciden regalos/comentarios. Reproductor robusto con indicadores, lectura previa de duración, recursos offline y recuperación ante audio corrupto. Biblioteca multimedia categorizada con favoritos, búsqueda, etiquetado, importación masiva de archivos autorizados, miniaturas para videos y waveform para audio, deduplicación por hash y uso de rutas administradas.

Controles globales de emergencia: «Detener todos los audios», «Pausar TTS», «Silenciar alertas», «Detener acciones», con atajos configurables. Reportar fallo sin congelar UI.

## 16. DIAGNÓSTICOS Y MODO SIMULADOR

Panel de logs filtrable y exportable sin secretos. Diagnóstico por componente: conexión TikTok de lectura, conexión TikTok de escritura, Spotify (incluida limitación de usuarios), OBS, TTS, base de datos, render de overlays, cola de audio, actualizador. Eventos simulados: follow, share, comentario, comando, 15/500/10 000 likes, suscripción, superfan/team nivel elegido, regalo individual/streak, canción, meta, donación externa y webhook. Cada evento simulado debe identificarse visualmente y no sumar puntos permanentes salvo opción de prueba explícita. Pruebas con captura de logs y resultados de cada acción, sin afirmar que un evento ficticio fue recibido desde TikTok.

## 17. PRUEBAS, FIABILIDAD Y CALIDAD

Pruebas unitarias para reglas, permisos, parser de comandos, cálculo de tiempo, XP, puntos y transacciones, idempotencia de regalos, permisos TTS, búsqueda musical, migraciones y actualizador; integración con OBS mock/real si está conectado; E2E para onboarding, alta de acciones, editor de overlays, galería, previsualización, puntos y actualización en entorno de pruebas. Manejar desconexión/reconexión, respuestas tardías, errores 401/403/429, pérdida de red, cambios de API, archivo corrupto, regalos en ráfaga, 1000 eventos simultáneos simulados. Pruebas de CPU/RAM por períodos extensos con overlays activos y sin fugas observables. El programa nunca debe marcar como «enviado» un mensaje de chatbot si solo se colocó en la cola.

## 18. ENTREGABLES Y EJECUCIÓN EN ETAPAS

Quiero resultados, no únicamente una lista de funciones. Proponer y ejecutar estas etapas, avanzando en la misma sesión y entregando pruebas de cada una siempre que las herramientas lo permitan:

**Etapa 0 — Inspección y arquitectura:** comprobar acceso y repositorios existentes; plan técnico ejecutable, matriz de funciones/limitaciones externas, monorepo o estructura elegida, UI base, temas, almacenamiento y pipelines de pruebas.

**Etapa 1 — Núcleo demostrable:** instalable base, dashboard, onboarding, SQLite, motor de eventos/reglas, simulador, audio, overlays transparentes, editor visual, logs y estados reales de conexión. Todas las piezas conectadas entre sí.

**Etapa 2 — TikTok + interacciones:** conector de lectura conforme a accesos disponibles, regalo dinámico, permisos, reglas complejas, sonido y TTS, chatbot con separación lectura/escritura y mensajes reales solo si hay acceso autorizado.

**Etapa 3 — Comunidad y herramientas:** puntos, transacciones, XP/niveles, rankings, tienda y recompensas, Likeathon, Timer/Subathon y calculadora de donaciones.

**Etapa 4 — Integraciones:** OBS completo, Spotify OAuth PKCE, canciones/cola con permisos reales, overlays musicales, chatbot y webhooks con pruebas.

**Etapa 5 — Galería completa:** implementar, probar y optimizar todas las familias de widgets descritas; diseño y recursos originales; importación/exportación, múltiples instancias, URLs, resoluciones y editor completo.

**Etapa 6 — Distribución y actualizaciones:** instalador NSIS, release pública autorizada, metadatos y comprobación real de actualización desde versión anterior; página de descarga opcional, firma si disponible, backup/migraciones y release notes.

Para cada etapa, entregar: (a) funcionalidades completadas con evidencia; (b) archivos/código cambiados; (c) instrucciones mínimas para ejecutar/probar; (d) pruebas y resultados; (e) dependencias o permisos pendientes concretos; (f) próximo trabajo. No abandonar el proyecto tras la etapa 1, ni pedir al usuario copiar archivos o compilar manualmente si el agente dispone de herramientas para hacerlo. Si hay una limitación externa, continuar las etapas independientes sin inventar permisos.

## 19. CRITERIOS DE ACEPTACIÓN NO NEGOCIABLES

- Instalador `.exe` de Windows 10/11 x64 que inicia y persiste datos; nombre WITI BOT.
- Panel profesional morado/negro, controles reales y sin scroll que se reinicie solo.
- TikTok lectura separada explícitamente de autenticación y envío a chat; respuesta pública solamente si autorizada y verificada.
- Spotify con inicio de sesión oficial, pantalla de consentimiento, callback sin mismatch, gestión de tokens y restricciones de cuota comunicadas.
- OBS conectado por WebSocket y capaz de modificar una escena/fuente real cuando se autorice.
- Creación de regla «follow → video + sonido» que se pueda simular y se active con un evento real conectado.
- Catálogo dinámico de regalos y alerta para regalo concreto o cualquiera, sin rachas duplicadas.
- TTS con voz, idioma, volumen, velocidad, pitch, Random Voice, prefijos, filtros granulares y pago con puntos.
- Sistema de puntos auditable: usuarios, niveles, monedas virtuales, transacciones, permisos y economía configurable.
- Canciones con `!play`, `!revocar`, `!skip`, cola propia y confirmaciones transparentes.
- Temporizador extensible con tiempo por eventos, calculadora por moneda/importe y actualización inmediata del overlay.
- Galería amplia con widgets reales, edición, previsualización y enlaces de fuentes OBS; ocho pantallas My Actions.
- Biblioteca abundante de sonidos con licencias válidas e importación de archivos propios; herramientas de edición de audio.
- Sistema de actualizaciones probado de una versión publicada a la siguiente, aviso al usuario, progreso y preservación de datos.
- Reporte preciso de lo que está integrado, simulado, pendiente de permisos o no disponible: nada se presenta como funcionando si no ha sido comprobado.

## 20. PRIMERAS ACCIONES QUE DEBES REALIZAR AL RECIBIR ESTE PROMPT

1. Resume en pocas líneas que entendiste el **objetivo ejecutable**, sin volver a preguntarme por requisitos ya escritos.
2. Revisa el entorno, tus herramientas, documentación actual y los conectores/repositorios a los que tengas acceso autorizado.
3. Establece un inventario de funciones con prioridad, dependencias, restricciones de terceros y pruebas de aceptación; da especial prioridad a galería, acciones y actualizaciones.
4. Inicia el proyecto de forma real, creando los archivos, estructura, UI y pruebas correspondientes; continúa tanto como sea posible en la sesión actual.
5. Solicita la autorización exacta solamente cuando sea indispensable (iniciar sesión, conectar GitHub/Spotify/TikTok, crear aplicación Spotify, permitir publicación, acceso a OBS). Explica para qué servirá y no solicites contraseñas por chat.
6. Si no puedes publicar o compilar por una limitación del entorno, di cuál fue el bloqueo comprobable, entrega todo el código posible y no simules la publicación.
7. **Nunca declares el trabajo completo solo porque la interfaz se ve bonita**. Entrega una aplicación genuina, con instalador, integraciones permitidas, actualizaciones y pruebas, en etapas verificables.

**Prioridad definitiva del usuario:** el software debe sentirse como una alternativa integral a TikFinity con más personalización y una identidad propia; regalar/seguir/comentar debe poder activar imágenes, GIF, videos, sonidos, TTS, chatbot, OBS y temporizadores; el sistema de puntos y las herramientas extensibles deben ser completos; conectar Spotify debe ser tan sencillo como autorizar oficialmente; se debe poder distribuir a cualquier persona y avisarle cuando exista una actualización. Mi preferencia es que hagas el máximo trabajo práctico tú mismo con las herramientas permitidas, me pidas únicamente las acciones imprescindibles y me entregues algo instalable y sostenible.
