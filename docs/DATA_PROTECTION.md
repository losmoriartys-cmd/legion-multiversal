# Protección de datos críticos · BASE-02

## Qué bloquea la CI
- `data/integrity-manifest.json` enumera los 14 archivos críticos y los ocho IDs históricos protegidos del roster.
- `scripts/guard_data_integrity.py` compara cada PR contra `origin/main`, bloquea eliminaciones de archivos críticos, verifica el inventario y detecta retiros sin autorización previamente aprobada en la línea base.
- El inventario crítico y el conjunto histórico de IDs protegidos no se pueden reducir desde un PR ordinario.
- El workflow `validar` ejecuta la guardia y publica un reporte de recuperación Git.
- **Fase A endurecida:** si se agrega una autorización nueva, el diff completo del PR debe contener exactamente una modificación (`M`) de `data/integrity-manifest.json`. Cualquier modificación del Roster, otro archivo, alta, borrado o renombrado hace fallar la CI.

## Procedimiento obligatorio para retirar un perfil

La autorización y la ejecución del retiro son **dos cambios separados**, en ese orden.

### Fase A — Aprobar la autorización
1. Abrir un issue con motivo, alcance y consumidores afectados.
2. Crear un PR que modifique únicamente `data/integrity-manifest.json`, agregando un registro con `id`, `reason` y `reference`.
3. No modificar ningún otro archivo. La guardia verifica el diff completo, no solamente que los IDs del Roster permanezcan iguales.
4. Exigir revisión de Code Owner. El archivo raíz `CODEOWNERS` asigna al propietario del repositorio, `@losmoriartys-cmd`, como mantenedor responsable de todos los cambios. El ruleset de `main` debe tener activado **Require review from Code Owners**; esta opción aún requiere confirmación administrativa en GitHub.
5. Fusionar la autorización solo después de CI y revisión humana. Las autorizaciones existentes son inmutables.

### Fase B — Ejecutar el retiro
1. Abrir un PR posterior que retire el perfil de `data/roster.json` y actualice consumidores y referencias.
2. No modificar el manifiesto en ese PR. La guardia confía exclusivamente en la autorización ya presente en `origin/main`.
3. Mantener el ID en `protected_roster_ids` como registro histórico.
4. Ejecutar los checks y revisar los cambios antes de integrar.

**Pruebas negativas obligatorias:** la suite debe rechazar autorización combinada con (a) cambios de campos del Roster sin modificar IDs, (b) cambios en cualquier otro archivo, (c) altas de archivos y (d) renombrados. También debe seguir rechazando la autorización y el retiro del perfil en un mismo PR.

## Revisión y protección de GitHub
El ruleset `PROTECCION-MAIN-LEGION` (ID `27883004`) está activo, apunta a la rama predeterminada `main`, tiene dos actores de bypass (`RepositoryRole` ID `5` e `Integration` ID `1143301`, ambos `always`; la identidad de la integración sigue sin verificarse) y exige los checks `validar`, `python-tests` y `audit-public-links`. La API confirmó `strict_required_status_checks_policy: true`, PR obligatorio, una aprobación, aprobación del último push y resolución de conversaciones. `require_code_owner_review=false`; CODEOWNERS asigna responsables pero no constituye todavía una barrera obligatoria.
El archivo `CODEOWNERS` ahora asigna todos los archivos a `@losmoriartys-cmd`. Para que esa asignación sea una barrera de integración efectiva, el administrador debe activar **Require review from Code Owners** en el ruleset y verificar por API que `require_code_owner_review` sea `true`. Hasta entonces, CODEOWNERS identifica al revisor responsable pero no garantiza por sí solo que GitHub bloquee un merge sin su aprobación.

## Recuperación comprobable en Git
La CI usa `git rev-parse`/ `git show` para verificar que el objeto histórico de cada archivo crítico siga disponible y publica el comando de restauración:

```bash
git restore --source origin/main -- data/roster.json
```

La recuperación desde Git no es un backup independiente. El repositorio todavía necesita una réplica fuera de GitHub y una prueba de restauración.

## Límites
- GitHub CODEOWNERS no reemplaza la revisión de contenido: el mantenedor debe comprobar motivo, referencia, alcance y consumidores.
- La protección Git conserva objetos históricos mientras el repositorio siga disponible; no cubre pérdida o indisponibilidad total de la cuenta/proveedor.
- El backup independiente queda pendiente de configurar contra un destino externo con credenciales y retención verificables.

## Backup independiente · diseño y estado de prueba

Se incorporó `scripts/create_repo_backup.sh`, que genera:
- `legion-multiversal.bundle`: refs e historial Git completo disponible en el checkout.
- `legion-multiversal-source.tar.gz`: snapshot de los archivos de trabajo, incluidos los recursos presentes en el checkout.
- `backup-manifest.txt` y `SHA256SUMS`: identificación del commit, fecha UTC y checksums.

El script verifica el bundle con `git bundle verify`, inspecciona el tar y valida los checksums localmente. El workflow `.github/workflows/independent-backup.yml` sube los artefactos a un destino S3-compatible y los vuelve a descargar. Después de verificar SHA-256, clona el bundle en un repositorio independiente, comprueba que contiene el commit de origen, extrae el snapshot en un directorio aislado y compara uno por uno los 14 blobs críticos restaurados contra ese commit. Solo imprime `BACKUP_EXTERNAL_ROUNDTRIP: PASS` si ambas restauraciones aisladas terminan correctamente.

La primera ejecución de este procedimiento en el candidato actual (run [45558641646](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45558641646), SHA `2cc721a73a4168372bcf111a167d2a0adc873242`) verificó la creación local del bundle, el snapshot y sus checksums, pero se detuvo en el preflight del destino porque los cuatro secretos S3 requeridos estaban ausentes. No se subió ni descargó ningún objeto y no hubo restauración externa. Por tanto, el backup remoto continúa **NO VERIFICADO**.

Se añadió un disparador `push` limitado a la rama candidata y a cambios en el propio workflow/script para ejecutar esta primera prueba sin modificar `main`; el schedule permanece deshabilitado.

### Configuración necesaria en GitHub Actions

Crear estos repository secrets:
- `BACKUP_S3_ENDPOINT`: endpoint HTTPS del proveedor (por ejemplo, endpoint de Cloudflare R2).
- `BACKUP_S3_BUCKET`: bucket privado dedicado.
- `BACKUP_S3_ACCESS_KEY_ID`.
- `BACKUP_S3_SECRET_ACCESS_KEY`.
- `BACKUP_S3_REGION` (opcional; valor por defecto `auto`).

Antes de habilitar el schedule, configurar en el proveedor una política de retención y versionado acorde a la política de recuperación, acceso restringido y cifrado en reposo. Recomendación inicial: conservar al menos 30 copias diarias y 12 mensuales, con credenciales de escritura limitadas al bucket de backup y credenciales de lectura disponibles para restauración.

**Estado:** el generador y el workflow están versionados, pero no se ejecutó aún una subida/descarga real: faltan endpoint, bucket y credenciales. No marcar el backup externo como probado ni activar la ejecución programada hasta completar la primera ejecución manual exitosa y ensayar una restauración en un directorio aislado.
