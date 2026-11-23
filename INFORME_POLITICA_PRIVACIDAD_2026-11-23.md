# Informe — Política de privacidad de Legion Multiversal Backup

- **Fecha:** 2026-11-23
- **Contacto operativo confirmado:** losmoriartys@gmail.com
- **PR:** #100 — `feat/privacy-policy-google-drive-backup`
- **Estado de la integración:** Google Drive aún no está implementado ni habilitado en el flujo de backup.
- **Evidencia técnica revisada:** PR #97 incluye un workflow con variables `BACKUP_S3_*` y AWS CLI para destino S3-compatible. No implementa Google Drive OAuth. La ejecución externa y la restauración siguen pendientes.
- **SEO:** la política debe formar parte del conjunto `PUBLIC` del validador, con canonical esperado `https://legion-multiversal.pages.dev/politica-de-privacidad/`; el sitemap ya incluye esa URL.
- **Roster:** el panel de Crecimiento presenta incrementos del período (`SEGUIDORES GANADOS`), no el total actual de seguidores. El test que exigía `SEGUIDORES ACTUALES` no reflejaba el contrato de datos y se corrige para comprobar la métrica que realmente se publica; no se altera la UI ni la lógica del Roster.
- **Alcance de datos corregido:** el permiso previsto es `drive.file`, limitado a archivos autorizados mediante selección/compartición explícita. El archivo de respaldo, no obstante, puede contener el conjunto de datos de los archivos del repositorio incluidos: código, documentación, datos del Roster, handles, enlaces a perfiles públicos, métricas y demás contenido presente. Debe revisarse el artefacto real para minimizarlo antes de activar.
- **Identidad jurídica:** pendiente de confirmación por el titular. “Legión Multiversal” es la marca/proyecto, no una identificación jurídica suficiente. Deben incorporarse responsable legal, jurisdicción y, si corresponde, domicilio.
- **Conservación y eliminación:** no hay copias Drive activas a la fecha. No se declara un plazo ficticio. La activación debe bloquearse hasta aprobar un plazo concreto, rotación, eliminación de vencidos y procedimiento de borrado.
- **Credenciales:** no deben incorporarse al código, informes ni logs; el mecanismo de secretos y el OAuth real todavía deben implementarse y verificarse.
- **Pendientes antes de publicación/activación:** completar identidad jurídica y jurisdicción; aprobar retención/eliminación; implementar OAuth Drive y selección de destino; validar alcance mínimo; proteger tokens; revisar el artefacto que se respaldará; probar subida, descarga, checksum y restauración aislada; completar CI.
- **Estado:** PR Draft; no integrado en main ni publicado en producción.
