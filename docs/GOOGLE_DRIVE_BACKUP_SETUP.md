# Google Drive backup · setup inicial

Esta integración está en una rama de desarrollo y todavía no es operativa en producción.

## Alcance y permisos
- OAuth scope: `https://www.googleapis.com/auth/drive.file` (solo archivos creados/abiertos por esta app).
- No usar el scope amplio `drive`.
- La carpeta debe seleccionarse explícitamente mediante Google Picker y el ID guardarse como secreto de Actions.

## OAuth bootstrap
1. Configurar credenciales OAuth tipo Web en Google Cloud, redirect URI local `http://127.0.0.1:8765/callback` y habilitar Google Drive API.
2. En entorno local, exportar `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`.
3. Ejecutar `python scripts/google_drive_oauth_setup.py`, abrir el enlace de autorización y completar consentimiento.
4. Copiar el refresh token mostrado directamente a un administrador de secretos; no compartirlo por chat, no escribirlo en archivos y no guardarlo en el repositorio.
5. Si el proyecto OAuth permanece en Testing, los refresh tokens pueden caducar periódicamente (incluido el límite de 7 días para apps de testing); para automatización estable, completar la configuración de publicación/verificación que corresponda antes de depender del schedule.

## Selector de carpeta
- Obtener un access token temporal con scope `drive.file` usando OAuth.
- Abrir `scripts/google_drive_folder_picker.html` en navegador, completar API key, access token y Project Number/App ID.
- Elegir una carpeta en Google Picker y copiar su ID.
- Guardar el ID como secreto `GOOGLE_DRIVE_FOLDER_ID`. No publicar el ID si la carpeta es privada.

## Secrets de GitHub Actions
Configurar en Settings → Secrets and variables → Actions:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

## Workflow
`.github/workflows/google-drive-backup.yml` programa una ejecución diaria (05:17 UTC) y permite ejecución manual. La ejecución usa un checkout completo, crea Git bundle + snapshot + manifiesto + SHA-256, sube los archivos, los descarga y compara SHA-256. La rotación de archivos expirados ocurre solo después de validar todas las nuevas cargas.

## Estado y límites
- No ejecutar en producción hasta haber configurado secretos, autorizado la carpeta y probado manualmente.
- Rotación de 30 días requiere confirmar que el inventario/listado Drive y appProperties query sean compatibles con scope Picker y permisos concedidos; no se considerará validada hasta pruebas reales.
- La restauración aislada se realizará como una etapa de prueba separada; el workflow de backup por sí solo no acredita una restauración integral.
- Los tokens se manejan como secretos de entorno; el script de bootstrap imprime el refresh token solo en consola local y no lo guarda.
