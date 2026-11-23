# Informe — Política de privacidad de Legion Multiversal Backup

- **Fecha:** 2026-11-23
- **Contacto público confirmado por el usuario:** losmoriartys@gmail.com
- **PR:** #100 — `feat/privacy-policy-google-drive-backup`
- **Estado de la integración:** Google Drive aún no está implementado ni habilitado en el flujo de backup.
- **Evidencia técnica revisada:** PR #97 incluye un workflow de backup con variables `BACKUP_S3_*` y AWS CLI para destino S3-compatible. No implementa Google Drive OAuth. La ejecución externa y la restauración siguen pendientes.
- **Corrección legal aplicada:** la política ahora identifica la integración de Google Drive como futura; aclara que crear el cliente OAuth no implica acceso ni transferencia de archivos; condiciona almacenamiento de tokens, conservación, restauración y cumplimiento a implementación y pruebas reales.
- **Permiso previsto:** `drive.file`; requiere seleccionar/compartir expresamente los archivos o carpeta con la app. No se presume que una carpeta preexistente sea visible automáticamente.
- **Ruta:** `/politica-de-privacidad/`
- **Cambios de presentación:** enlace discreto en el pie y entrada en sitemap; no se altera el contenido editorial o comercial principal.
- **Pendientes antes de publicar en producción:** revisar la identidad legal del responsable y el texto aplicable; implementar Google Drive OAuth real; verificar la selección de carpeta y el mínimo alcance; definir retención/eliminación; guardar tokens de forma segura; probar subida, descarga, checksum y restauración aislada; completar CI.
- **Cloudflare:** el commit inicial obtuvo preview de rama exitoso. No equivale a publicación en producción ni a validación del contenido corregido.
- **Estado:** PR Draft; no integrado en main ni publicado en producción.
