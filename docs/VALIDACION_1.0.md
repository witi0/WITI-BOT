# WITI BOT 1.0.0 — estado verificable de la entrega inicial

**Estado: proyecto no finalizado. No aprobado todavía para distribución pública.**

Se generó un instalador NSIS real y una aplicación empaquetada Windows x64. Esta entrega implementa el núcleo local inicial, no todas las funciones del prompt maestro. No se ha probado instalación, ejecución, actualización ni desinstalación en Windows limpio: el entorno de trabajo es Linux y no dispone de una VM Windows.

## Archivos

- `WITI_BOT_Setup_v1.0.0.exe`: 122,900,422 bytes (~117.2 MiB), instalador real con contenido completo x64 y desinstalador integrado.
- `WITI_BOT_Windows_x64_v1.0.0.zip`: carpeta compilada; extraer completa. Este ZIP no reemplaza al instalador ni está habilitado para autoactualización.
- `WITI_BOT_Fuente_v1.0.0.zip`: código de esta entrega, dependencias fijadas, scripts, configuración NSIS, pipeline Windows, especificación y evidencias.

SHA-256 del instalador:

`dfc634f32259a7edd4fc54a6c00127e27aedb8ef588911f4421e128e0669cab8`

## Evidencia obtenida

| Verificación | Resultado |
|---|---|
| Empaquetado NSIS | Generado sin errores; build log incluido |
| Aplicación Windows x64 | Encabezado PE machine 0x8664, 247,033,344 bytes |
| Arquitectura del stub NSIS | Stub x86 que instala app x64; no es una aplicación para Windows 32 bits |
| Integridad del archivo NSIS con 7zip | Correcta; registro incluido |
| Contenido instalador | Incluye app-64.7z y Uninstall WITI BOT.exe |
| SQLite, idempotencia y saldo no negativo | Pruebas aprobadas |
| Simulación sin puntos persistentes y cooldown | Pruebas aprobadas |
| 1000 eventos y repetición | Saldo 1000, sin duplicación |
| Temporizador y persistencia | Pruebas aprobadas |
| Loopback, token, Host y rutas | Pruebas aprobadas |
| Formularios, reglas, puntos, temporizador, pantallas | Prueba DOM con jsdom y núcleo real aprobada; usa puente de prueba, no Electron |
| Total pruebas | 8 aprobadas / 0 fallidas |
| Auditoría npm de dependencias de producción | 0 vulnerabilidades reportadas en la consulta; no garantiza ausencia de fallos |
| Firma Authenticode | Ausente: tabla de certificados de instalador y aplicación vacía |
| Arranque Electron en Windows | No ejecutado |
| Instalación/desinstalación Windows 10/11 limpio | No ejecutado |
| Actualización publicada N → N+1 | No ejecutada |

## Requisitos del instalador

| Requisito | Implementación / pendiente |
|---|---|
| Windows 10/11 x64 | Configuración y binarios x64; falta aceptación real en ambos sistemas |
| UAC solo cuando corresponde | App asInvoker, instalación por usuario predeterminada y elevación NSIS para todos los usuarios; falta prueba interactiva |
| Dependencias incluidas | Electron/Node integrado, sql.js WASM, bibliotecas, interfaz, icono y recursos; no exige herramientas al usuario final |
| Accesos y asistente | Configurados escritorio/Inicio, carpeta, ejecutar al terminar; falta comprobarlos en Windows |
| Desinstalador | Incluido; ofrece conservar/borrar datos en modo interactivo. Silencio y actualización conservan datos. Falta ejecución real |
| Actualizaciones | Controles y adaptador preparados. Sin servidor configurado ni releases publicadas; no operativas todavía |
| Seguridad actualizaciones | Verificación de código habilitada, GitHub HTTPS previsto y comprobación SHA-512 del updater; falta identidad de editor y publicación firmada |
| Credenciales | OBS usa safeStorage; no se piden cookies o contraseñas TikTok/Spotify. Falta prueba DPAPI Windows |
| Firma | No hay certificado. Obtener un certificado o servicio de firma reconocido normalmente cuesta y requiere verificación del titular. No se garantiza ausencia de avisos SmartScreen |
| Windows limpio | Script de prueba preparado, no ejecutado. No se sustituyó por una afirmación de éxito |

## Alcance funcional real

Núcleo de reglas, simulador, datos SQLite, puntos manuales auditables, ocho pantallas de acción iniciales y creación de más pantallas, alertas/multimedia, ranking, temporizador extensible, calculadora manual, colores/RGB, TTS del sistema con disponibilidad variable y conexión básica OBS (sin OBS real probado).

Siguen pendientes TikTok, Spotify, permisos granulares, galería completa, catálogo de regalos, biblioteca extensa de sonidos, mezcla/edición de audio, niveles/recompensas, automatización de economía y más módulos de la especificación. Las acciones multimedia y TTS registran despacho, no reproducción confirmada. Esta etapa muestra cada recurso multimedia por seis segundos.

## Para completar la aceptación

1. Disponer de una VM limpia de Windows 10 x64 y otra Windows 11 x64; ejecutar los ensayos incluidos y guardar evidencia. No basta con que compile un runner de desarrollo.
2. Elegir un repositorio público dedicado de releases, conceder permisos mínimos de publicación y configurar su propietario/nombre. No se usó un repositorio académico ajeno para alojar la app.
3. Configurar firma con el certificado o servicio del titular, mediante secretos de CI; nunca compartir contraseñas ni claves privadas por chat. La preparación no equivale a firma realizada.
4. Publicar dos versiones firmadas de ensayo y probar la actualización con datos existentes, bloqueo LIVE y consentimiento.
5. Completar y probar las funciones todavía pendientes del prompt antes de presentar la app como alternativa integral terminada.

El fuente contiene README detallado, scripts Build.ps1 y Test-CleanWindows.ps1 y logs. Los scripts de QA no son una carga para el usuario final; corresponden a las tareas pendientes del mantenedor.
