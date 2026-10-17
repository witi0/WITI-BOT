# Validación WITI BOT 1.1.1

- Spotify incorpora el Client ID público 6dda7004cf364a3e9b1d2e4bc15b4333 en release.json. No se incluye secreto.
- La conexión sin introducir Client ID se verificó mediante OAuth PKCE con callback loopback y un proveedor simulado. Se comprueba el ID enviado, estado CSRF, canje, perfil y música. No equivale a una conexión real de Spotify.
- Las 21 pruebas automatizadas pasaron.
- Se conserva el Client ID personalizado si ya estaba guardado y la configuración avanzada permite editarlo.
- Repositorio público accesible; subida rechazada HTTP 403 por la integración. No hay workflow ni release publicados por esta sesión.
- El propietario confirmó mediante capturas una conexión real de identidad TikTok en Sandbox con witimc. Esto no concede escritura LIVE ni aprobación pública.
- Las verificaciones del empaquetado se realizan con scripts/verify-installer.cjs. La instalación, actualización y desinstalación en Windows limpio de esta versión siguen pendientes.
- Sin certificado Authenticode; no se promete evitar SmartScreen.
