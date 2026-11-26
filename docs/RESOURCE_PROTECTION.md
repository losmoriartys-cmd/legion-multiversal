# Protección de recursos · BASE-04

## Principios

La protección se aplica por tipo de cambio; no congela el repositorio ni sustituye los contratos existentes.

- **Rutinario:** snapshots generados de actividad/métricas y clips indicados en `data/resource-protection-policy.json`. Se mantienen los checks Python, esquemas, procedencia y validaciones semánticas ya existentes.
- **Autorización explícita:** imágenes, ilustraciones, CSS, HTML, archivos canónicos de identidad/editorial, CODEOWNERS, esquemas y la propia política. La clasificación también cubre recursos nuevos por extensión.
- **Revisión + CI:** código y scripts que no estén incluidos en las rutas sensibles, workflows, tests y documentación. Continúan sometidos a PR, aprobación normal y checks requeridos.

Las tipografías cargadas remotamente se protegen a través de las páginas/hojas que declaran sus familias, URL, pesos y fallback. No se descargan ni duplican archivos de Google Fonts.

## Inventario canónico por SHA

En CI se ejecuta:

```bash
python scripts/audit_resource_inventory.py --output reports/resource-inventory.json
```

El artefacto `resource-inventory-<SHA>` contiene, para todos los archivos versionados:
- clasificación y ruta;
- SHA-256 del contenido y Git blob SHA;
- referencias exactas detectadas en HTML, CSS, JavaScript, JSON y otras fuentes textuales, con archivo, línea y contexto;
- dependencias tipográficas externas detectadas (Google Fonts);
- recursos visuales sin referencia, reportados para revisión y no eliminados automáticamente.

El informe pertenece al SHA de la ejecución y se publica como artefacto de CI con retención de 30 días. La política versionada es la fuente de clasificación; el inventario generado es la evidencia enlazada de ese candidato.

## Flujo obligatorio para una modificación sensible

La autorización y la ejecución son dos PR separados. No se permite aprobar y modificar un recurso en el mismo PR.

### A · Autorizar la transición

1. Abrir/actualizar un issue con el motivo, alcance e impacto editorial o técnico.
2. Preparar el recurso propuesto fuera de la rama de producción y calcular sus hashes. Para una actualización:

```bash
git show origin/main:ruta/al/recurso > /tmp/recurso-aprobado
sha256sum /tmp/recurso-aprobado
sha256sum /ruta/al/recurso-propuesto
```

3. Crear un PR que modifique únicamente `data/resource-change-authorizations.json`. Añadir un registro con los campos exactos:

```json
{
  "id": "actualizar-portada-expediente-001",
  "path": "assets/heroes/ejemplo.webp",
  "action": "update",
  "from_sha256": "HASH_SHA256_ACTUAL",
  "to_sha256": "HASH_SHA256_PROPUESTO",
  "reason": "Motivo concreto del cambio y alcance aprobado.",
  "reference": "Issue #95 / decisión editorial"
}
```

Para un alta se usa `action: add`, `from_sha256: null` y el hash propuesto en `to_sha256`. Para una baja se usa `action: delete`, el hash actual en `from_sha256` y `to_sha256: null`.

4. El PR A no puede modificar el recurso, ni ningún otro archivo. La guardia contrasta el hash previo con el `main` del que parte el PR.
5. Integrar la autorización solo después de revisar el motivo, referencia, ruta y transición exacta. El ledger es append-only: las entradas ya aprobadas no se editan ni borran.

### B · Aplicar la transición autorizada

1. Abrir un segundo PR con la modificación exacta del recurso.
2. No tocar `data/resource-change-authorizations.json`.
3. La guardia compara el SHA-256 actual con `from_sha256` y el candidato con `to_sha256`; cualquier diferencia, ruta o acción no coincidente bloquea el PR.
4. Ejecutar los checks requeridos y revisar el diff visual/contenido antes de integrar.

Las actualizaciones de recursos nuevos también requieren el par A/B. Un cambio CSS/HTML no se considera rutina por el hecho de ser pequeño; una actualización generada de métricas no requiere autorización editorial adicional si permanece dentro de la lista rutinaria y pasa sus contratos.

## Recuperación y rollback

Para restaurar desde el último `main` aprobado:

```bash
git fetch origin
git restore --source origin/main -- ruta/al/recurso
git diff -- ruta/al/recurso
sha256sum ruta/al/recurso
```

La guardia BASE-02 conserva el reporte de disponibilidad de los 14 objetos críticos de datos. La nueva política publica el comando de restauración para cada recurso sensible modificado. La suite incluye un test aislado que crea un repositorio Git temporal, altera un asset binario y un JSON del Roster, ejecuta `git restore` desde el commit aprobado y compara los blobs recuperados.

La restauración desde Git no es un backup independiente. El roundtrip Google Drive debe verificarse por separado para el SHA vigente de `main`, con las credenciales OAuth disponibles, transferencia y restauración aislada, y coincidencia SHA-256 de los 14 datos críticos.

## Límites administrativos

- El ruleset `PROTECCION-MAIN-LEGION` sigue exigiendo PR, una aprobación, aprobación del último push, resolución de conversaciones y los checks estrictos `validar`, `python-tests` y `audit-public-links`.
- `require_code_owner_review=false` sigue siendo una brecha administrativa; el archivo raíz CODEOWNERS no sustituye esa opción.
- La integración de bypass ID `1143301` todavía requiere identificación. No se presume que sea GitHub Actions ni se cambia el ruleset desde esta implementación.
- El bypass administrativo puntual, cuando se aplique bajo el acuerdo del issue #113, debe registrarse como bypass y nunca como aprobación independiente.
