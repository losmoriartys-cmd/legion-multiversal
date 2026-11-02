# Gestión del roster — Instituto Xavier / LOS S3X-MEN

El roster se mantiene en el arreglo `heroesData` dentro de `index.html` (rama `command-center-3.0`). Cada ficha incluye `name`, `role`, `img`, `twitch`, `bio`, `stats` y `log`.

## Jerarquías disponibles

- `director`: Dirección del instituto.
- `teacher`: Cuerpo docente.
- `student`: Estudiantes.

La página agrupa y ordena las tarjetas automáticamente según `role`. Para cambiar la jerarquía de un integrante, se modifica únicamente ese campo. Para sumar un integrante, se agrega un objeto nuevo a `heroesData`.

## Distribución actual

| Integrante | Jerarquía |
|---|---|
| MORIARTYS | Director |
| ROD3R1K | Director |
| LADYMORIARTY | Profesora |
| CAPY | Profesor |
| ARDIPII | Profesor |
| AKUMA | Profesor |
| ELGABII | Profesor |
| HABITOS | Profesor |
| DAVE | Estudiante |

## Expediente de Dave

Dave ya tiene su espacio en el roster y su canal enlazado: https://twitch.tv/daved0608. Como todavía no está disponible su ilustración, la tarjeta muestra un marcador visual de **EXPEDIENTE EN FORMACIÓN**. Cuando se entregue el retrato, se completa el campo `img` con el nombre/ruta del archivo y se actualizan su biografía, poderes y registro.

## Reglas de publicación

- No usar las puntuaciones ficticias de personaje como métricas reales de Twitch.
- Las métricas deben venir de `data.json` y mostrar período/fuente.
- Mantener el cambio en `command-center-3.0` hasta recibir autorización explícita para publicar en `main`.
