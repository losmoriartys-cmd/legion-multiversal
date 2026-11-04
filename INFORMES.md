# Informes de intervenciones — Los Moriartys

Esta es la bitácora vigente de trabajo compartido del repositorio. Cada colaborador debe leer la entrada más reciente antes de intervenir y agregar un informe al finalizar una tarea relevante.

Los registros anteriores a la adopción de este archivo se conservan en [`BITACORA.md`](./BITACORA.md), que queda como archivo histórico. Para evitar duplicaciones, los informes nuevos se agregan únicamente aquí.

## Plantilla para nuevas intervenciones

### AAAA-MM-DD — Título de la intervención

- **Responsable:**
- **Objetivo:**
- **Archivos modificados:**
- **Implementado:**
- **Validaciones y resultados:**
- **Pendientes / riesgos:**
- **Commit:** hash y enlace.
- **Despliegue:** pendiente / exitoso / fallido; incluir enlace o ID verificable del workflow.

> Diferenciar siempre lo acordado, lo implementado y lo que efectivamente se verificó. No marcar un despliegue como exitoso sin comprobarlo.

---

## 2026-11-03 — Inicio del protocolo compartido y registro de estado

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** establecer una bitácora común para coordinar cambios humanos y automatizados y reducir el riesgo de sobrescribir trabajo ajeno.
- **Archivos creados/modificados:**
  - `README.md`: reemplazado el contenido mínimo anterior por las reglas de colaboración, flujo de revisión, prevención de conflictos y verificación de publicación.
  - `INFORMES.md`: creado como bitácora vigente.
- **Implementado:**
  - Se establece `main` como rama de referencia y GitHub como fuente única de verdad.
  - Se indica revisar commits recientes, README y último informe antes de editar.
  - Se exige registrar archivos afectados, cambios, validaciones, pendientes, commit y estado verificable del despliegue.
  - Se conserva `BITACORA.md` como archivo histórico anterior; los informes nuevos se agregan solo a `INFORMES.md`.
- **Estado previo observado al iniciar esta intervención:**
  - El README anterior contenía únicamente una descripción mínima del repositorio.
  - Ya existía `BITACORA.md` con antecedentes del rebranding, conexión de Twitch y rediseño de cartas. Se conserva sin modificar.
  - Los commits recientes consultados incluían:
    - [`7822c452`](https://github.com/losmoriartys-cmd/s3xmen/commit/7822c4525739100ac7bb829611817d8ca203f3cf) — rediseño de cartas del roster en `index.html`.
    - [`8396eb79`](https://github.com/losmoriartys-cmd/s3xmen/commit/8396eb791a00df75e4d36a7cc4167a93115f98d2) — documentación de ese rediseño en `BITACORA.md`.
    - [`a366c8c0`](https://github.com/losmoriartys-cmd/s3xmen/commit/a366c8c00427697f36fb5aaf1a0aa2af0a1cdc59) — actualización automática de estadísticas Twitch en `data.json`.
    - [`14129f2e`](https://github.com/losmoriartys-cmd/s3xmen/commit/14129f2e661b5a90efb9c51710325a1c5e2b19bf) — eliminación de `assets/moriartys.jpg`.
- **Validaciones:**
  - Se consultó el historial reciente de commits de `main`.
  - Se leyó el README existente y el contenido de `BITACORA.md` antes de actualizar la documentación.
  - GitHub aceptó la actualización de `README.md` y la creación de `INFORMES.md`.
- **Pendientes / riesgos:**
  - Verificar GitHub Pages y el workflow de despliegue asociado a estos cambios; no se declara el despliegue como exitoso en este informe.
  - Revisar el efecto de la eliminación de `assets/moriartys.jpg`: un commit anterior de rediseño había configurado esa ruta en el roster. Confirmar si el retrato fue reemplazado por otro recurso o si debe corregirse la referencia; no restaurar ni sustituir archivos sin verificar con el equipo.
  - Revisar el estado de Dave/Nexus y su retrato actual en `assets/` en la siguiente intervención visual.
  - Antes de nuevas modificaciones, confirmar la identidad/nomenclatura vigente del sitio: el historial de `BITACORA.md` documenta una etapa de rebranding a “Legión Multiversal”, mientras que el proyecto y el equipo siguen usando “Los Moriartys” como referencia de trabajo.
- **Commit README:** [`5055ce8d`](https://github.com/losmoriartys-cmd/s3xmen/commit/5055ce8d647f34c9cef023737722c8342a921941).
- **Commit INFORMES (creación inicial):** [`5ea303b5`](https://github.com/losmoriartys-cmd/s3xmen/commit/5ea303b572b61dc493657ef7e9920e3870f3f0e1).
- **Despliegue:** pendiente de verificación.
