# Protección de datos críticos · BASE-02

## Qué bloquea la CI
- `data/integrity-manifest.json` enumera los 13 archivos críticos y los ocho IDs históricos protegidos del roster.
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
El ruleset `PROTECCION-MAIN-LEGION` (ID `27883004`) está activo, apunta a la rama predeterminada `main`, no tiene bypass y exige los checks `validar`, `python-tests` y `audit-public-links`. La API confirmó `strict_required_status_checks_policy: true`, además de PR obligatorio y aprobación independiente.
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
