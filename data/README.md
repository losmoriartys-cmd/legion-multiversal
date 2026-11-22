# Datos canónicos de Legión Multiversal

Esta carpeta contiene las fuentes maestras de contenido estructurado. Cada entidad debe tener un único documento de autoría; no se admiten copias manuales ni espejos editables.

## Fuente migrada en el primer corte

- `games.json` (ruta anterior, retirada al integrar este corte) → **`data/games.json`**: catálogo de juegos, sesiones BIT, participantes, POV y enlaces de VOD. El esquema se mantiene en `schemas/games.schema.json`.

## Fuentes canónicas migradas

- **`data/games.json`**: catálogo de juegos, sesiones BIT, participantes, POV y enlaces audiovisuales.
- **`data/roster.json`**: identidad canónica, ocho perfiles, cuentas por plataforma, enlaces y horarios declarados. La ruta raíz `roster-data.json` queda retirada.

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
