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

## Backup independiente · contrato Google Drive y verificación BASE-02

El destino acordado y utilizado en la prueba técnica documentada en el PR #100 es **Google Drive, carpeta `root` (Mi unidad)**, con el scope OAuth mínimo `drive.file`. No se adopta S3/R2 ni se incorpora un proveedor nuevo.

El candidato reutiliza los motores existentes:
- `scripts/google_drive_backup.py`: genera el paquete mediante `scripts/create_repo_backup.sh`, sube los cuatro objetos (`backup-manifest.txt`, `legion-multiversal-source.tar.gz`, `legion-multiversal.bundle` y `SHA256SUMS`) y descarga cada objeto para comparar su SHA-256.
- `scripts/google_drive_restore.py`: localiza el conjunto por Backup ID, comprueba que esté completo, vuelve a descargar los objetos, valida `SHA256SUMS`, restaura el bundle y extrae el snapshot en un destino aislado. También compara el snapshot con los blobs Git rastreados.
- `scripts/verify_critical_restore.py`: valida que el manifiesto restaurado contenga exactamente 14 rutas críticas únicas y compara el SHA-256 de cada archivo restaurado con el blob del mismo commit dentro del bundle.
- `tests/test_verify_critical_restore.py`: incluye pruebas positivas y negativas para coincidencia, alteración, omisión e inventario incompleto.

El workflow `.github/workflows/independent-backup.yml` ejecuta el roundtrip en Google Drive, conserva el disparador manual y el disparador acotado a la rama candidata, y publica un artefacto de evidencia. El destino usa `GOOGLE_DRIVE_FOLDER_ID` si ya está definido; de lo contrario, mantiene el destino acordado `root`. Requiere las credenciales OAuth ya utilizadas por el motor: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` y `GOOGLE_OAUTH_REFRESH_TOKEN`. **No se afirma que GitHub Actions tenga esos secretos configurados**: el PR #100 dejó expresamente esa comprobación pendiente. Si no están disponibles, el preflight debe detenerse sin cambiar de proveedor ni solicitar credenciales S3.

La prueba anterior del workflow S3 (run [45558641646](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45558641646)) queda como antecedente de una implementación equivocada: solo verificó el paquete local y falló en un preflight S3 que no pertenecía al contrato acordado. No hubo subida, descarga ni restauración en esa ejecución; no se la cuenta como evidencia de backup externo.

**Guardrails permanentes:** sin schedule, sin rotación y sin borrado automático. El motor solo informa candidatos vencidos; no elimina objetos. BASE-02 solo podrá declarar el roundtrip verificado cuando una ejecución del SHA final del candidato confirme subida, descarga, restauración aislada y coincidencia SHA-256 de los 14 archivos críticos, con artefactos de evidencia conservados.


### Evidencia del roundtrip Google Drive · 25/11/2026

- **Workflow:** [run 45560952459](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45560952459), resultado SUCCESS.
- **Commit de origen y restaurado:** `9470744bfb1f60dfcf68ba268e22e912e08dbee7`.
- **Backup ID:** `20261125T062927Z-45560952459`.
- **Destino:** Google Drive, `root` (Mi unidad), usando el flujo OAuth existente.
- **Cuatro objetos subidos y descargados:** todos coincidieron con SHA-256:
  - `SHA256SUMS` · Drive ID `1_Ud6L9BLqKkB7FhMlSMwZ72qyheHxznZ` · `c6d0130270fccbdb0a0b2220e5490a5e9c612cbf1fc0aa5919f8ea4b9fa944b7`.
  - `backup-manifest.txt` · Drive ID `1Nvie-DWOv59mSryOYzr_KWPZSWfw6eV_` · `16bef031efccdb692db7a1f7ddeb2c81c054668a39b12fa040ace3fe99c8504f`.
  - `legion-multiversal-source.tar.gz` · Drive ID `1uvJ7nJjsDEaaJmNa1J6eSf8PnBDwqfUv` · `81158cc22f9e536192ea7cb04fc7d563183183366f40356930bc551b4cd667de`.
  - `legion-multiversal.bundle` · Drive ID `1tpmzCMZ5UVgA6cZQCczoIqYkSepP-Td5` · `9d95657e9accc338042e8edc0da32f751ef023bf20e00a922a5950963a273574`.
- **Restauración aislada:** SUCCESS; `isolated: true`; commit restaurado idéntico al SHA de origen; 318 archivos del snapshot comparados contra Git.
- **Archivos críticos:** `critical_files_verified: 14`; los 14 SHA-256 coinciden exactamente con los blobs del commit restaurado. Resultado explícito: `RESTORE_CRITICAL_FILES: PASS (14/14 SHA-256 match)`.
- **Evidencia conservada:** artifact [google-drive-roundtrip-evidence-45560952459](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45560952459/artifacts/14997444276), ID `14997444276`, SHA-256 del ZIP `92f4daf0348ffb95b7ec6458ba73d421db81d51b43618412816ddac5a8407536`.
- **Retención/eliminación:** `expired_candidates: 0`; eliminación automática deshabilitada. No se borró ningún objeto y no se activó schedule ni rotación.

Esta ejecución valida el roundtrip externo y los 14 archivos para el SHA indicado. No cierra por sí sola BASE-02: siguen siendo independientes la validación integral del candidato final y la revisión del ruleset/Code Owners.


### Repetición sobre el HEAD documental vigente · 25/11/2026

- **Workflow:** [run 45561155987](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45561155987), SUCCESS.
- **SHA de origen/restaurado:** `b45e5684155deebdea2a32a7c05f32a557f59cc5`.
- **Backup ID:** `20261125T063058Z-45561155987`.
- **Transferencia Google Drive:** cuatro objetos subidos y descargados con coincidencia SHA-256:
  - `SHA256SUMS` · Drive ID `1LQimnrawJEBUg2yG-svd7kOcsFtVE5Ck` · `006442eb33c9021715704aeb7336251e6475c83c446a90be3ae4a3553d631a92`.
  - `backup-manifest.txt` · Drive ID `1WjtsB-SjRB3R_odmGI-ypYanlZ7ZjZV9` · `f4f3a2d5b26e15255c1aa47970efc4af92e031958ad807686a1154ba31e9e953`.
  - `legion-multiversal-source.tar.gz` · Drive ID `1-8c_NA3NNr3Oqa8cjyPRrdOKjsNICb8v` · `6ef4d8f2bc5a227ef063bc15b0bc377ed6f1e75e36f6b2dff9c4acab03f0ece2`.
  - `legion-multiversal.bundle` · Drive ID `17wSdsRge6j9oEMvhd84eN7yizY-ESMVa` · `0b1fda9041259d5107c0851f329bc7c3206566af3d3e0bacfb3bc14e743b171c`.
- **Restauración:** `restore: success`, `isolated: true`, commit exacto, 318 archivos verificados.
- **14 archivos críticos:** `critical_files_verified: 14`; salida `RESTORE_CRITICAL_FILES: PASS (14/14 SHA-256 match)`. Los hashes de los 14 archivos coinciden con el inventario anterior porque los datos protegidos no cambiaron entre ambas revisiones documentales.
- **Artefacto:** [google-drive-roundtrip-evidence-45561155987](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45561155987/artifacts/14998420592), ID `14998420592`, ZIP SHA-256 `32e3af182de0e53b1e8292f3cadaa08b60696666dbe847f3007c60e7aa132516`.
- `expired_candidates: 0`; borrado automático deshabilitado; sin schedule ni rotación.

Esta repetición cubre el HEAD documental `b45e568...`. Cualquier cambio posterior del contenido versionado exige una nueva copia y restauración para que la evidencia siga correspondiendo al SHA exacto.


### Ejecución verificada antes de la reconciliación final de main · 25/11/2026

- **Workflow:** [run 45561352157](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45561352157), SUCCESS.
- **SHA de origen/restaurado:** `d51be448f90b17cc69c6fff1fb0347420994d1e2`; backup ID `20261125T063243Z-45561352157`.
- **Destino:** Google Drive `root` (Mi unidad), OAuth existente; cuatro objetos subidos y descargados con SHA-256 coincidente.
- **Restauración aislada:** SUCCESS; commit exacto; 318 archivos del snapshot verificados.
- **Inventario crítico:** 14/14 SHA-256 coincidentes; `RESTORE_CRITICAL_FILES: PASS (14/14 SHA-256 match)`.
- **Evidencia:** [artifact 14998375937](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45561352157/artifacts/14998375937), ZIP SHA-256 `1b48b69d8391dc501b2f2f2d3317dedf70dc150b78b6e82cffd767c1023e0a73`.
- **Límite:** esta prueba es histórica respecto del candidato actual: cubre `d51be448...`, anterior a la reconciliación con main `805bef800ff1c953d8686319025e576ccf686da4`. No se usa como evidencia del nuevo SHA. La actualización documental actual activa una nueva ejecución por el workflow de backup; su resultado deberá quedar asociado al nuevo HEAD.
- Rotación, schedule y borrado automático permanecen deshabilitados.


### Evidencia de roundtrip Google Drive consolidada · 25/11/2026

- **Workflow:** [run 45562871414](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45562871414), resultado SUCCESS.
- **SHA de origen y restaurado:** `2028f110638998795bc6d64edfe4a62d37123d4e`.
- **Backup ID:** `20261125T064503Z-45562871414`.
- **Destino:** Google Drive, flujo OAuth existente. Cuatro objetos fueron subidos y descargados con checksums coincidentes.
- **Restauración aislada:** SUCCESS; 318 archivos del snapshot comparados contra Git.
- **Inventario crítico:** `RESTORE_CRITICAL_FILES: PASS (14/14 SHA-256 match)`.
- **Artefacto:** [14998786756](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45562871414/artifacts/14998786756); ZIP SHA-256 `8e5a77bf9f044546e58acd9fd36d63d37bd54c8bb149b8158b0737b19b5a7ab8`.
- **Alcance:** esta evidencia corresponde al SHA señalado; no debe atribuirse a los commits de integración #109 o #101.
- **Antecedente S3:** run [45558641646](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/45558641646) falló antes de cualquier transferencia externa porque el preflight no encontró los secretos S3. No hubo operación S3 y no se computa como roundtrip.
- **Guardrails:** sin schedule, sin rotación y sin borrado automático. La evidencia no habilita ninguna de esas funciones.


---

## BASE-04 · Huellas de assets editoriales aprobados · 26/11/2026

### Inventario curado

El archivo data/approved-assets-manifest.json registra **42 assets editoriales activos** mediante su Git blob object ID (git-blob-sha1):

- 8 retratos de assets/carnet/ y 8 ilustraciones de assets/heroes/; los dos directorios quedan enumerados íntegramente.
- 8 ilustraciones de personaje utilizadas por los expedientes del Roster.
- 8 imágenes editoriales activas referenciadas por index.html, incluida la imagen del caso comercial BarFender.
- 3 variantes del logo oficial y 5 variantes responsive del Hero.
- favicon.svg y og-legion-multiversal.jpg.

La selección parte de image-reference-audit y de las referencias de index.html/data/roster.json. No congela previews históricas sin uso comprobado, capturas huérfanas, duplicados de documentación ni recursos externos dinámicos. El manifiesto guarda huellas, no copias de los binarios: los assets originales siguen siendo la única fuente de contenido.

### Ejecución y protocolo de autorización

scripts/guard_approved_assets.py se ejecuta de manera incondicional en el workflow validar, a continuación del guard de datos críticos. El control falla ante una huella distinta, un asset protegido ausente, un symlink, un intento de retirar rutas del inventario o una modificación del historial de autorizaciones.

Toda modificación deliberada de un asset protegido requiere dos PR separados:

1. **Fase A — autorización de metadatos:** modifica únicamente data/approved-assets-manifest.json y agrega operation, ruta, huella anterior, huella propuesta, razón y referencia. Los bytes del asset permanecen intactos. El check rechaza el cambio de contenido en esta misma fase.
2. **Fase B — aplicación:** un segundo PR modifica el asset y la huella del manifiesto; el nuevo blob debe coincidir exactamente con la autorización ya integrada en main. Las aprobaciones históricas son append-only.

Las incorporaciones nuevas pueden autorizarse con operation: add, también en dos fases. La eliminación/retirada y el renombrado no están habilitados por la guardia actual: fallan cerrados y requieren una ampliación de política deliberada y probada. Tampoco se permite retirar rutas del inventario existente.

### Pruebas controladas

tests/test_approved_asset_guard.py crea repositorios Git temporales y demuestra:
- bootstrap del baseline contra los blobs del main real de la fixture;
- omisión de imágenes dentro de los directorios de Roster;
- sustitución simultánea a la creación del baseline;
- reemplazo sin autorización, borrado y reducción del inventario;
- rechazo de autoautorización en el mismo PR;
- autorización Fase A y aplicación Fase B;
- rechazo de bytes diferentes a la huella autorizada;
- autorización de una nueva imagen de Roster en dos fases;
- inmutabilidad del historial de autorizaciones.

La suite Python se ejecuta con python -m unittest discover -s tests -v en python-tests; el guard se ejecuta también desde validar sobre origin/main.

### Límites conocidos

Las huellas son Git blob SHA-1: identificadores de contenido nativos de Git adecuados para detectar sustituciones accidentales o cambios no registrados; **no son firmas digitales ni garantizan resistencia a un actor administrador que pueda cambiar a la vez el código, el manifiesto y las reglas del repositorio**. El inventario protege la selección curada de 42 activos, no todos los archivos de imagen del repositorio. Las nuevas incorporaciones en los directorios de Roster deben entrar mediante el flujo de autorización.

La guardia complementa, no reemplaza, la revisión de diff, la protección de ramas de GitHub, el respaldo independiente ni la verificación de restauración.

