# Protección de datos críticos · BASE-02

## Qué bloquea la CI
- `data/integrity-manifest.json` enumera archivos críticos y los ocho IDs históricos protegidos del roster.
- `scripts/guard_data_integrity.py` compara cada PR contra `origin/main`, falla ante la eliminación de archivos críticos, verifica que el inventario exista y detecta retiros de perfiles sin autorización ya aprobada en la línea base.
- El inventario crítico y el conjunto histórico de IDs protegidos no se pueden reducir desde el mismo PR que modifica los datos.
- El workflow `validar` ejecuta esta guardia y emite un reporte de recuperación Git para cada archivo crítico.

## Procedimiento obligatorio para retirar un perfil

La autorización y la ejecución del retiro son **dos cambios separados**, en ese orden. Nunca se autoriza y elimina un perfil en el mismo PR.

### Fase A — Aprobar la autorización (sin tocar el roster)
1. Abrir un issue que explique la solicitud, el motivo, el alcance y los consumidores afectados.
2. Crear un PR que agregue únicamente un registro a `authorized_roster_removals` en `data/integrity-manifest.json`, con `id`, `reason` y `reference` (URL o identificador del issue).
3. No modificar `data/roster.json`, `critical_files` ni `protected_roster_ids` en ese PR.
4. Exigir revisión explícita de un mantenedor distinto del autor del PR. La aprobación debe confirmar la solicitud y su referencia; no alcanza con que la CI esté verde.
5. Fusionar ese PR de autorización. La guardia permite agregar autorizaciones solo si el roster permanece idéntico, el ID existe y está protegido, el motivo y la referencia no están vacíos, y no se reescriben ni eliminan autorizaciones históricas.

### Fase B — Ejecutar el retiro (en un PR posterior)
1. Abrir otro PR que retire el perfil de `data/roster.json` y actualice consumidores, enlaces, estadísticas y referencias según corresponda.
2. No modificar `data/integrity-manifest.json` en este segundo PR. La guardia solo confía en la autorización que ya existe en `origin/main`.
3. Ejecutar todos los checks y revisar los cambios de datos antes de integrar.
4. Conservar el ID en `protected_roster_ids` como registro histórico. La autorización aprobada explica por qué ese ID ya no debe estar presente; no se borra la evidencia histórica.

**Regla de seguridad:** si se agrega una autorización y se retira el perfil en el mismo PR, la CI falla. Si una autorización ya aprobada se modifica o elimina, la CI también falla. Los cambios del inventario crítico o de los IDs protegidos siguen bloqueados por esta guardia y requieren un proceso administrativo independiente.

## Recuperación comprobable
El workflow usa `git show` para verificar que el objeto histórico de cada archivo crítico sigue disponible en la base y publica el comando exacto de restauración:

```bash
git restore --source origin/main -- data/roster.json
```

Para recuperar otro punto histórico, sustituir `origin/main` por el SHA de commit verificado. Confirmar el contenido restaurado, ejecutar validación y abrir un PR; no restaurar ni sobrescribir producción directamente.

## Límites actuales
- La revisión humana de la fase A depende de que GitHub exija una aprobación y de que el revisor sea distinto del autor. Hasta activar y verificar la protección de `main`, esta condición debe comprobarse manualmente por un administrador.
- Git permite recuperar contenido del historial; no protege por sí solo ante borrado o pérdida total del repositorio.
- La copia independiente fuera de GitHub (backup/replica) aún requiere destino, credenciales y verificación de restauración.
- La protección de rama de `main` sigue pendiente de activación administrativa y verificación en Settings. Esta guardia de CI no equivale a reglas de branch protection.
