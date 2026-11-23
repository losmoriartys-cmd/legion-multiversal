# Informe — Política de privacidad de Legion Multiversal Backup

- **Fecha:** 2026-11-23
- **Contacto operativo confirmado:** losmoriartys@gmail.com
- **PR:** #100 — `feat/privacy-policy-google-drive-backup`
- **Responsable informado:** Cristian Andres Turrisi, persona física responsable del proyecto independiente Legión Multiversal, con domicilio en la República Argentina. La marca no constituye una persona jurídica separada.
- **Pendiente legal:** incorporar un domicilio legal o dirección de notificación apropiado antes de publicar la política como aviso legal definitivo. No se debe exponer un domicilio particular innecesariamente.
- **Estado de la integración:** Google Drive aún no está implementado ni habilitado en el flujo de backup.
- **Evidencia técnica revisada:** PR #97 incluye un workflow con variables `BACKUP_S3_*` y AWS CLI para destino S3-compatible. No implementa Google Drive OAuth. La ejecución externa y la restauración siguen pendientes.
- **SEO:** la política forma parte del conjunto `PUBLIC` del validador, con canonical esperado `https://legion-multiversal.pages.dev/politica-de-privacidad/`; el sitemap incluye esa URL.
- **Roster:** el panel de Crecimiento presenta incrementos del período (`SEGUIDORES GANADOS`), no el total actual de seguidores. El test que exigía `SEGUIDORES ACTUALES` se corrigió para comprobar la métrica que realmente se publica; no se altera la UI ni la lógica del Roster.
- **Alcance de datos corregido:** el permiso previsto es `drive.file`, limitado a archivos autorizados mediante selección/compartición explícita. El archivo de respaldo puede contener el conjunto de datos de los archivos del repositorio incluidos: código, documentación, datos del Roster, handles, enlaces a perfiles públicos, métricas y demás contenido presente. Debe revisarse el artefacto real para minimizarlo antes de activar.
- **Conservación aprobada como diseño:** generación diaria; conservar los últimos 30 días; eliminar copias vencidas solo después de verificar que el respaldo nuevo se generó correctamente; ante revocación, detener respaldos nuevos y habilitar la solicitud de eliminación de copias existentes; realizar pruebas periódicas de restauración.
- **Límite de estado:** los 30 días son una regla aprobada para implementar, no un comportamiento ya desplegado. No hay copias Drive activas ni evidencia de rotación, borrado automático o restauración real.
- **Credenciales:** no deben incorporarse al código, informes ni logs; el mecanismo de secretos y el OAuth real todavía deben implementarse y verificarse.
- **Pendientes antes de publicación/activación:** incorporar domicilio legal/de notificación apropiado; implementar OAuth Drive y selección de destino; validar alcance mínimo; proteger tokens; revisar el artefacto que se respaldará; implementar retención/rotación de 30 días y borrado seguro; probar subida, descarga, checksum y restauración aislada; completar CI; verificar accesibilidad pública anónima.
- **Estado:** PR Draft; no integrado en main ni publicado en producción.
