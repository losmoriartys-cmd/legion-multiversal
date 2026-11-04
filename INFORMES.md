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

## 2026-11-03 — Ordenar ubicación del retrato de Nexus

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** ubicar el retrato de Dave/Nexus dentro de la carpeta de recursos visuales y mantener la ruta del sitio coherente.
- **Archivos modificados:**
  - `nexus.jpg`: trasladado a `assets/nexus.jpg` sin alterar la imagen.
  - `index.html`: actualizada únicamente la ruta del retrato de Dave/Nexus.
- **Implementado:** se conserva el marco y la composición actuales. El rediseño global de las cartas queda separado para no interferir con el trabajo visual que el equipo está realizando.
- **Validaciones y resultados:** commit creado sobre el `main` vigente; queda pendiente comprobar el despliegue de Pages y la visualización final en navegador.
- **Pendientes / riesgos:** el equipo está unificando el marco de todas las cartas; no se modificaron estilos ni capas del marco en esta intervención.
- **Commit:** [`f55f6561`](https://github.com/losmoriartys-cmd/s3xmen/commit/f55f656167288bb430613de9a344271026710aec).
- **Despliegue:** pendiente de verificación.

## 2026-11-04 — Integrar el retrato Moriarty y eliminar la galería duplicada del Capítulo 1

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** integrar el nuevo retrato moriarty.jpg en el expediente principal y evitar que el Capítulo 1 vuelva a mostrar miniaturas antiguas duplicadas respecto del Roster.
- **Archivos modificados:**
  - index.html: corregida la ruta del retrato de Los Moriartys; sustituida la galería antigua del Capítulo 1 por una invitación al Capítulo 02.
  - INFORMES.md: agregado este registro.
- **Implementado:**
  - El expediente de Los Moriartys utiliza moriarty.jpg (archivo existente en la raíz del repositorio).
  - El Capítulo 1 conserva la narrativa, pero ya no duplica los retratos de los integrantes por fuera de sus fichas oficiales.
  - Se agregó un acceso directo al Capítulo 02, donde vive el Roster con el marco oficial.
- **Validaciones y resultados:**
  - Confirmada la existencia de moriarty.jpg en main.
  - Confirmado que el Roster se genera desde heroesData y que el retrato anterior apuntaba a assets/moriartys.jpg, ruta inexistente.
  - Confirmado que la galería eliminada repetía integrantes por fuera de las fichas oficiales.
  - No se ejecutó una prueba visual en navegador; queda pendiente revisar GitHub Pages.
- **Pendientes / riesgos:**
  - Revisar visualmente el encuadre de moriarty.jpg dentro del área de retrato del marco.
  - Verificar el despliegue de GitHub Pages y el comportamiento del botón de acceso al Roster.
  - Continuar la revisión de rutas de retratos restantes y completar el estado del Command Center 2.0.
- **Commit:** bcc433532e471c693a40db1bea4dce29dc60e517
- **Despliegue:** pendiente de verificación.

## 2026-11-04 — Corregir la ruta del retrato de Pato — Oratoris

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** evitar que el expediente de Pato — Oratoris muestre un retrato roto.
- **Archivos modificados:**
  - index.html: reemplazada la ruta inexistente oratoris.jpg por PatoTeksplika.jpg, archivo existente en la raíz del repositorio.
  - INFORMES.md: agregado este registro.
- **Implementado:** la ficha de Oratoris apunta ahora al recurso visual disponible cuyo nombre identifica al creador Pato te explica.
- **Validaciones y resultados:** auditadas las rutas de imagen declaradas en heroesData contra los archivos actuales de la raíz y de assets/. Tras el ajuste, todas las rutas declaradas en heroesData corresponden a archivos existentes.
- **Pendientes / riesgos:** comprobar el encuadre de los retratos en el navegador y verificar el despliegue de GitHub Pages.
- **Commit:** e5b381066eb541cb27774e0a1497fea67aeba069.
- **Despliegue:** pendiente de verificación.

## 2026-11-03 — Integrar las cartas oficiales y ampliar los expedientes del Roster

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** reemplazar las composiciones anteriores del Roster por las cartas finales con marco unificado y llevar los datos impresos en cada carta a las páginas del expediente individual.
- **Archivos modificados:**
  - `index.html`: rutas de las diez cartas oficiales, renderizado del Roster y contenido de las páginas A, B y D del expediente.
  - `INFORMES.md`: registro de esta intervención.
- **Implementado:**
  - Se integraron diez cartas oficiales desde `assets/heroes/`: Los Moriartys, Lady Moriarty, Rod3r1k, Capy, Ardipii, Akuma, Elgabii, Nexus, Oratoris y Habitos.
  - El Roster ahora muestra cada carta completa como una única imagen clickeable. Se quitó de su renderizado la plantilla superpuesta, los textos duplicados y el retrato antiguo dentro de otro marco.
  - Página A — Biografía: incorpora identidad/codename, rol y rango junto a la biografía existente.
  - Página B — Poderes: muestra función, conjunto de poderes y rango operativo tomados de las cartas finales.
  - Página C — Estadísticas: conserva las métricas de plataformas y su lógica de fuentes verificables; no se inventaron cifras.
  - Página D — Misiones: agrega serie, número de registro y clasificación del expediente junto al historial existente.
  - Se mantuvieron las biografías, enlaces y funciones de estadísticas existentes. No se eliminaron los archivos visuales anteriores.
- **Validaciones y resultados:**
  - Confirmada la presencia de diez recursos visuales en `assets/heroes/` y su asignación a diez integrantes de `heroesData`.
  - Confirmado que el nuevo renderizador no conserva el elemento de plantilla superpuesta `dossier-template`.
  - GitHub aceptó el commit de `index.html`.
  - No se realizó una prueba visual automatizada en navegador ni se confirmó la publicación final de GitHub Pages.
- **Pendientes / riesgos:**
  - Revisar en navegador el encuadre y tamaño de las diez cartas en escritorio y móvil.
  - Abrir cada expediente y comprobar las cuatro páginas, especialmente los saltos de línea y la visualización de métricas.
  - Verificar el workflow de GitHub Pages antes de declarar el despliegue exitoso.
  - Los textos biográficos y de misiones siguen siendo los que ya estaban en el repositorio; deben ampliarse con información aprobada por cada integrante.
- **Commit:** [`2f894140`](https://github.com/losmoriartys-cmd/s3xmen/commit/2f89414009bc1c9486bccb5b500edf60176005c6).
- **Despliegue:** pendiente de verificación.


## 2026-11-04 — Ampliar estadísticas y registro de directos en expedientes

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** hacer que la página C de cada expediente distinga las métricas observadas en Twitch del historial de directos y de las analíticas comparables de 30 días.
- **Archivos modificados:**
  - `index.html`: renderizado de la página C de los expedientes.
  - `INFORMES.md`: registro de esta intervención.
- **Implementado:**
  - Se agregó un registro por integrante de las sesiones en directo detectadas por el muestreo de Twitch Helix, agrupadas por ID de transmisión.
  - Cada sesión muestra fecha de inicio observada, categorías detectadas, pico entre muestras y cantidad de muestras en directo.
  - Se aclara que el registro puede no incluir todos los directos y que no equivale al archivo/VOD de Twitch.
  - Se separó explícitamente el estado en directo y la telemetría de Twitch Helix de las métricas comparables de los últimos 30 días, cuya fuente acordada es Streams Charts.
  - Se dejó indicado “pendiente de integrar” cuando todavía no existe una exportación verificable de Streams Charts; no se inventan cifras.
  - Se conserva el enlace de cada expediente a su plataforma principal; Oratoris mantiene YouTube separado de Twitch.
- **Validaciones y resultados:**
  - Se comprobó que el esquema de `data.json` contiene `snapshots`, `stream_id`, `started_at`, `game_name` y `viewer_count`, necesarios para construir el registro observado.
  - Se comprobó que el muestreo actual conserva una ventana de 10 días; el registro declara esa ventana y no la presenta como historial completo.
  - Pendiente validar en navegador la apertura de los diez expedientes y el formato responsive.
- **Pendientes / riesgos:**
  - Integrar exportación/datos de Streams Charts para la ventana común de 30 días y mostrar fuente y fecha de corte.
  - La ampliación de la ventana de muestreo de Twitch Helix, si se desea, deberá tratarse por separado: el histórico previo a su cambio no puede reconstruirse retroactivamente.
  - Verificar GitHub Pages tras el commit.
- **Commit de implementación:** [`5fc8f9de`](https://github.com/losmoriartys-cmd/s3xmen/commit/5fc8f9dea4a3952d3b3be64a1e4eea432aad8764) — actualización de `index.html`.
- **Commit del informe:** se agrega este registro en el commit actual.
- **Ajuste posterior:** [`50fc5b79`](https://github.com/losmoriartys-cmd/s3xmen/commit/50fc5b79b116669d1e71079d716b76f58367a8e0) — Oratoris conserva un bloque de métricas de YouTube independiente; no se le aplica la fuente ni la ventana de Twitch.
- **Despliegue:** pendiente de verificación.


## 2026-11-04 — Asignar número de expediente único a Dave — Nexus

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** eliminar la duplicación del número de expediente dentro del roster.
- **Archivos modificados:**
  - `index.html`: se actualizó únicamente el número de expediente de Dave — Nexus.
  - `INFORMES.md`: registro de esta intervención.
- **Implementado:** Dave — Nexus pasa del expediente `#047` al `#048`. Se conserva `#047` para MORIARTYS. No se modificaron la imagen `nexus_dark.webp`, los poderes, la serie ni otros datos de los integrantes.
- **Validaciones y resultados:** se revisaron los diez registros de `heroesData`; los números quedan únicos: #047, #008, #025, #038, #037, #024, #090, #048, #039 y #007.
- **Pendientes / riesgos:** comprobar el despliegue de GitHub Pages.
- **Commit:** se registra en el commit de esta intervención.
- **Despliegue:** pendiente de verificación.
