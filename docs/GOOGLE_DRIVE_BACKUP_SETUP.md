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

## Destino utilizado en la prueba validada
- La prueba del 24/11 configuró `GOOGLE_DRIVE_FOLDER_ID=root`, que apunta a Mi unidad de la cuenta autorizada.
- No se utilizó Google Picker. La página `scripts/google_drive_folder_picker.html` no forma parte del flujo que fue validado; no volver a intentar ese mecanismo para reproducir la prueba.
- Para una futura carpeta dedicada, deberá implementarse y probarse un selector/autorización compatible con el scope `drive.file`; no asumir que el flujo actual ya lo resuelve.

## Secrets de GitHub Actions
Configurar en Settings → Secrets and variables → Actions:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

## Workflow
`.github/workflows/google-drive-backup.yml` permite únicamente ejecución manual (`workflow_dispatch`). No hay cron activo. La primera prueba real se ejecutó localmente desde PowerShell; no se afirma que el workflow de Actions haya realizado esa transferencia. El workflow no realiza limpieza automática.

## Integridad y restauración
El backup crea Git Bundle, snapshot, manifiesto y SHA-256. El proceso de restauración comprueba que los nombres Drive sean únicos y seguros, que el manifiesto cubra exactamente los artefactos, que los hashes coincidan, que el bundle sea válido y que su HEAD coincida con el commit del manifiesto. Rechaza enlaces simbólicos, hard links, archivos especiales y rutas inseguras en el snapshot.

## Retención
La retención objetivo es de 30 días. Actualmente solo se identifican candidatos completos y antiguos; no se elimina ningún archivo. La eliminación automática permanece deshabilitada porque Drive no ofrece una transacción atómica para borrar varios objetos. No habilitarla hasta definir y probar un protocolo de publicación/commit del conjunto y recuperación ante fallos parciales.

## Estado
- **Prueba real completada el 24/11/2026:** OAuth `drive.file`; destino `root`; backup ID `20261124T083437Z-local`; cuatro objetos subidos, descargados y verificados por SHA-256; restauración aislada exitosa de 310 archivos.
- **Límite de la evidencia:** el conjunto restaurado corresponde al commit `0cf0c68fe1073a3645747be1b99b3380d4639648`; el HEAD final del motor `fa3fc1a3ba1cc69818d9cdbebe0c6be757a5095c` contiene correcciones posteriores y todavía requiere una nueva copia y restauración.
- Las pruebas automatizadas de fallos siguen siendo simuladas; complementan, pero no reemplazan, la prueba real. La CI del HEAD final ejecutó 18 pruebas y la comprobación de sintaxis correctamente.
- No hay cron ni borrado automático. El borrado sigue deshabilitado (`disabled_non_atomic_drive_api`). No declarar operativo un servicio recurrente hasta completar la copia actualizada, la restauración, la revisión de alcance y el protocolo de recuperación.
