# Protección de datos críticos · BASE-02

## Qué bloquea la CI
- `data/integrity-manifest.json` enumera archivos críticos y los ocho IDs de roster protegidos.
- `scripts/guard_data_integrity.py` compara el PR contra `origin/main`, falla ante la eliminación de archivos críticos, verifica que el inventario exista y detecta eliminaciones de perfiles del roster sin autorización documentada.
- La lista protegida de IDs no reemplaza JSON Schema ni la validación semántica de BASE-02: funciona como una defensa adicional.
- El workflow `validar` ejecuta esta guardia y emite un reporte de recuperación Git para cada archivo crítico.

## Retirar un perfil de forma deliberada
No borrar perfiles directamente. En un PR que retire un ID:
1. explicar la decisión y el alcance;
2. registrar en `data/integrity-manifest.json` un elemento de `authorized_roster_removals` con `id`, `reason` y `reference` (issue/PR);
3. actualizar `protected_roster_ids` con la revisión explícita del conjunto protegido;
4. revisar todos los consumidores y referencias del ID, junto con los checks requeridos.

La guardia detecta el retiro frente a la base y exige que el registro de autorización contenga motivo y referencia. La revisión humana y la protección de `main` siguen siendo necesarias; la CI no puede sustituir permisos de GitHub.

## Recuperación comprobable
El workflow usa `git show` para verificar que el objeto histórico de cada archivo crítico sigue disponible en la base y publica el comando exacto de restauración:

```bash
git restore --source origin/main -- data/roster.json
```

Para una recuperación de otro punto histórico, sustituir `origin/main` por el SHA de commit verificado. Confirmar el contenido restaurado, ejecutar validación y abrir un PR; no restaurar ni sobrescribir producción directamente.

## Límites actuales
- Git permite recuperar contenido del historial; no protege por sí solo ante borrado o pérdida total del repositorio.
- La copia independiente fuera de GitHub (backup/replica) aún requiere destino, credenciales y verificación de restauración.
- La protección de rama de `main` sigue pendiente de activación administrativa y verificación en Settings. Esta guardia de CI no equivale a reglas de branch protection.
