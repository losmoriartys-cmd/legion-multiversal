# BASE-01 · Arquitectura canónica de datos

**Estado:** diseño de migración por cortes. No se considera terminado hasta integrar cada corte y comprobar los consumidores en CI.

## Objetivo

Tener una sola fuente editable por entidad bajo `data/`, conservar todos los IDs y separar datos editoriales de métricas recopiladas. No se crearán JSON paralelos que puedan divergir.

## Destino previsto

| Documento | Responsabilidad | Regla |
|---|---|---|
| `data/roster.json` | Identidad, perfiles, cuentas, enlaces y horario declarado por creador | Un perfil por ID canónico. El proyecto compartido no se confunde con una cuenta individual. |
| `data/games.json` | Catálogo de juegos, sesiones BIT, participantes, POV y URLs de VOD/tienda/portada | Una ficha por `game_id`; las sesiones se relacionan con el Roster mediante IDs. |
| `data/clips.json` | Clips vinculados a creador, juego y sesión cuando la relación esté confirmada | Mantener el ID de clip y la URL original; no inferir su sesión. |
| `data/expedientes/` | Expedientes comerciales, incluidos los EXP-### | No mezclar expedientes comerciales con sesiones BIT. |

Los horarios declarados se conservarán dentro del perfil de cada creador salvo que una necesidad funcional justifique un documento normalizado independiente. No se almacenará el mismo horario en ambos lugares.

Los resultados de colectores (Twitch, YouTube, Kick y métricas normalizadas) son instantáneas observadas. Se mantendrán separados de las fuentes editoriales y cada salida deberá identificar la fuente y fecha de captura.

## Secuencia segura de migración

1. **BASE-01A — Juegos:** mover `games.json` a `data/games.json`; actualizar Arsenal, Colaboraciones, validador, tests y CI. Conservar exactamente los 18 juegos, 10 sesiones BIT, 11 POV y EXP-001.
2. **BASE-01B — Roster:** mover `roster-data.json` a `data/roster.json` después de integrar o reconciliar PR de Roster que toquen sus consumidores; actualizar sitio, colectores y contratos sin cambiar los ocho perfiles.
3. **BASE-01C — Clips y expedientes:** normalizar referencias de clips y los expedientes comerciales; mantener la separación BIT/EXP y evitar duplicar metadatos.
4. **BASE-01D — Instantáneas:** revisar rutas de los datos generados y sus automatizaciones, sin convertir métricas observadas en datos editoriales canónicos.

## Requisitos de cada corte

- Lectura de `main` y de los PR abiertos antes de modificar.
- Migración atómica de documento, consumidores, validadores, pruebas y workflows.
- IDs canónicos inmutables salvo cambio aprobado y documentado.
- Conteos y relaciones antes/después comparados automáticamente.
- Enlaces desconocidos o no confirmados preservados como desconocidos; los errores transitorios no equivalen a una baja.
- CI y pruebas de navegador aplicables aprobadas antes del merge.
- `INFORMES.md` actualizado con archivos, resultados, SHA, PR y pendientes.

## Restricciones de seguridad

No cambiar ni borrar datos de los ocho perfiles, canales, sesiones, POV, VOD o expedientes durante una migración de rutas. Una migración de estructura no autoriza una revisión editorial. No mezclar este trabajo con prerender ni con la reorganización visual de BarFender.