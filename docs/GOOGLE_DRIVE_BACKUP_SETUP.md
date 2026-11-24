# Google Drive backup · setup inicial

La integración está en una rama de desarrollo y todavía no es operativa en producción.

## Alcance y permisos
- OAuth scope mínimo previsto: `https://www.googleapis.com/auth/drive.file`.
- No usar el scope amplio `drive`.
- La carpeta de destino debe seleccionarse explícitamente mediante Google Picker y su ID guardarse como secreto de Actions.
- No habilitar la programación ni considerar operativo el respaldo hasta completar una subida, descarga y restauración reales.

## OAuth bootstrap
1. Configurar credenciales OAuth tipo Web en Google Cloud, redirect URI local `http://127.0.0.1:8765/callback` y habilitar Google Drive API.
2. En entorno local, exportar `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`.
3. Ejecutar `python scripts/google_drive_oauth_setup.py` y completar el consentimiento.
4. Copiar el refresh token directamente a un administrador de secretos; no compartirlo por chat, escribirlo en archivos ni guardarlo en el repositorio.
5. Si el proyecto OAuth permanece en Testing, los refresh tokens pueden caducar periódicamente (incluido el límite de 7 días para apps de testing). Confirmar el estado de publicación/verificación aplicable antes de automatizar.

## Selector de carpeta
- Obtener un access token temporal con scope `drive.file`.
- Abrir `scripts/google_drive_folder_picker.html`, completar API key, access token y Project Number/App ID.
- Elegir la carpeta en Google Picker y guardar el ID como secreto `GOOGLE_DRIVE_FOLDER_ID`.

## Secrets de GitHub Actions
Configurar en Settings → Secrets and variables → Actions:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

## Workflow
`.github/workflows/google-drive-backup.yml` permite únicamente ejecución manual (`workflow_dispatch`). No hay cron activo. Antes de ejecutarlo debe completarse OAuth, seleccionar la carpeta y superar una restauración aislada. El workflow actual no realiza limpieza automática.

## Integridad y restauración
El backup crea Git Bundle, snapshot, manifiesto y SHA-256. El proceso de restauración comprueba que los nombres Drive sean únicos y seguros, que el manifiesto cubra exactamente los artefactos, que los hashes coincidan, que el bundle sea válido y que su HEAD coincida con el commit del manifiesto. Rechaza enlaces simbólicos, hard links, archivos especiales y rutas inseguras en el snapshot.

## Retención
La retención objetivo es de 30 días. Actualmente solo se identifican candidatos completos y antiguos; no se elimina ningún archivo. La eliminación automática permanece deshabilitada porque Drive no ofrece una transacción atómica para borrar varios objetos. No habilitarla hasta definir y probar un protocolo de publicación/commit del conjunto y recuperación ante fallos parciales.

## Estado
- Esta rama no acredita operación real de Drive.
- Las pruebas automatizadas usan respuestas simuladas; no sustituyen OAuth real, subida real, descarga independiente ni restauración aislada.
- No publicar ni afirmar que el respaldo externo está operativo hasta documentar evidencias de todas esas etapas.
