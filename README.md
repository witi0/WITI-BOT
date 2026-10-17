# WITI BOT 2.4.1 · Cobre RGB

Aplicación Windows x64 para TikTok LIVE, Spotify y OBS. Instala el EXE sin Python, Node ni Git.

## Colección incluida

Los 120 audios MP3 del ZIP proporcionado por Witi se incluyen como sonidos predeterminados. No se incluyen las imágenes de regalos del ZIP. El logo y las portadas que entrega Spotify se conservan. Las imágenes de regalos antiguas de esa colección se retiran al actualizar; los recursos personalizados o utilizados por reglas se protegen. Los nombres, favoritos y audios eliminados se conservan.


## Cobre y petróleo

Tema oscuro verde petróleo, cobre y acentos lima. RGB animado en contornos de paneles, controles, tarjetas, navegación y determinados títulos; la tipografía de lectura y las imágenes conservan su legibilidad y color. Ajustes permite desactivar RGB, cambiar acento, modo, velocidad e intensidad, elegir tipografía o reducir animaciones.

Las instalaciones nuevas incluyen ocho pantallas útiles: alertas, música, top regalos, top likes, meta, temporizador, chat y último regalo. Las instalaciones existentes conservan sus pantallas, reglas y enlaces. Continúan disponibles los 37 diseños y el editor con borrador visual aislado de OBS.

## Publicación y compilación

Para el propietario: PUBLICAR_WITI_BOT.ps1, en la raíz del ZIP, sube las fuentes y los recursos a witi0/WITI-BOT, espera la compilación de GitHub Actions y publica la etiqueta v2.4.1. Requiere Git y el acceso del propietario; no requiere Node en el equipo que publica. El consumidor de la aplicación solo usa el instalador.

Para reproducir la compilación: `npm ci`, `npm test`, `npm run dist:win`, o scripts/Build.ps1 en Windows. GitHub Actions utiliza Windows 2022 y Node 22. WITI_UPDATE_PRIVATE_KEY permanece como secreto de GitHub para firmar el manifiesto Ed25519. No se incluye ninguna clave privada. La firma Authenticode requiere certificado o servicio de firma propio, que puede ser de pago; configurar CSC_LINK y CSC_KEY_PASSWORD. SmartScreen depende de firma y reputación.

## Verificación

Consultar PRUEBAS_2.4.1.md y los registros de la entrega. El instalador se compila y su contenido se verifica en Linux. La instalación, ejecución, actualización y desinstalación sobre Windows 10/11 limpios requieren validación en Windows. Spotify requiere consentimiento; TikTok LIVE depende de un conector comunitario y una emisión real. La identidad TikTok y el acceso LIVE son conexiones independientes. Las voces online dependen de la disponibilidad de sus proveedores.
