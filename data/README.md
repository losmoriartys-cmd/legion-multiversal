# Datos canónicos de Legión Multiversal

Esta carpeta contiene las fuentes maestras de contenido estructurado. Cada entidad debe tener un único documento de autoría; no se admiten copias manuales ni espejos editables.

## Fuente migrada en el primer corte

- `games.json` (ruta anterior, retirada al integrar este corte) → **`data/games.json`**: catálogo de juegos, sesiones BIT, participantes, POV y enlaces de VOD. El esquema se mantiene en `schemas/games.schema.json`.

## Fuentes canónicas migradas

- **`data/games.json`**: catálogo de juegos, sesiones BIT, participantes, POV y enlaces audiovisuales.
- **`data/roster.json`**: identidad canónica, ocho perfiles, cuentas por plataforma, enlaces y horarios declarados. La ruta raíz `roster-data.json` queda retirada.

- **`data/creator-colors.json`**: color de identidad por creador, indexado por los IDs de `data/roster.json`. Es la única fuente de color de perfiles: `creator-colors.css` se genera con `python3 scripts/build_creator_colors.py` y expone `--c-<id>` y `--c-<id>-soft`; todo componente que pinte a un creador debe usar esas variables o `data-creator-id`. Se mantiene fuera de `roster.json` para no alterar el blob que protege `tests/test_base_data_layout.py`. Reglas validadas por `scripts/validate_creator_colors.py`: hex válido, un color por creador sin repetirse, contraste mínimo 4,5:1 sobre los fondos oscuros y distancia mínima entre colores.

## Siguientes cortes de BASE-01

- `data/clips.json`: índice editorial de clips y sus referencias canónicas.
- Los archivos de métricas observadas y salidas de colectores seguirán separados de los datos editoriales: son capturas generadas, no una segunda fuente de identidad o de sesiones.

## Reglas

1. Usar IDs estables (`creator_id`, `game_id`, `BIT-###`, `EXP-###`) para relaciones; no vincular por nombres visibles.
2. Representar desconocidos como `null` solo cuando el contrato lo permita; nunca completar fechas, participantes, horarios o fuentes por inferencia.
3. Toda migración debe actualizar consumidores, colectores, validadores, tests y workflows en el mismo cambio.
4. Retirar la ruta anterior solo cuando las búsquedas y pruebas demuestren que no quedan consumidores activos.
5. Mantener los esquemas versionados en `schemas/` y validar antes de publicar.

### BASE-01C · corte en preparación

- `data/creator-records.json` contiene los expedientes editoriales por creador, vinculados por ID a `data/roster.json`.
- Su migración está en una rama de trabajo; no se considera canónica en `main` hasta completar consumidores, validaciones y merge.
