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


## 2026-11-04 — Evolución de creadores y registros verificables

- **Alcance:** ampliar la telemetría propia de Twitch a una ventana móvil de 30 días y separar el historial real del lore narrativo.
- **Archivos modificados:**
  - `update_stats.py`: retención de muestras ampliada de 10 a 30 días; cálculo de categorías/juegos más observados y actividad diaria.
  - `index.html`: la página de estadísticas del expediente presenta ranking de categorías por muestras y evolución diaria observada; la página de trayectoria distingue hitos, colaboraciones y directos/clips destacados.
  - `creator-records.json`: nueva base estructurada para cargar hitos, colaboraciones y destacados con fecha, descripción, URL y fuente.
- **Criterios de medición:** el ranking de juegos usa cantidad de muestras en directo, no horas jugadas. La actividad diaria se etiqueta en UTC. La ventana local de 30 días se irá completando desde este cambio y no reconstruye muestras anteriores a los últimos 10 días conservados.
- **Fuentes:** Twitch Helix para estado en vivo y muestreo propio; Streams Charts queda como integración histórica independiente pendiente de credenciales.
- **Streams Charts:** API oficial autenticada con Client-ID y Token; las consultas se miden en créditos. El endpoint estándar de canal devuelve el resumen de los últimos 30 días y cuesta 1 crédito por canal según la documentación vigente. No se habilita consumo automático de créditos sin credenciales y aprobación del presupuesto.
- **Pendiente editorial:** cargar hitos, colaboraciones y enlaces destacados confirmados por cada creador; los arreglos JSON se inicializan vacíos intencionalmente para no inventar logros.
- **Validación:** pendiente verificar ejecución de GitHub Actions y despliegue de Pages tras los commits.
- **Commit del colector:** [`bcc73dfa`](https://github.com/losmoriartys-cmd/s3xmen/commit/bcc73dfaa253a9b6cb8cfa3779535aaae7ea9b6a).
- **Commit de UI de evolución:** [`2403b741`](https://github.com/losmoriartys-cmd/s3xmen/commit/2403b7410584e3b93ad2105c3bdff714af4d58d3).
- **Commit de trayectoria:** [`06ffda1f`](https://github.com/losmoriartys-cmd/s3xmen/commit/06ffda1f52cea07e1bdfe95bf2ebce5db145bbfa).
- **Commit de base editorial:** [`3b3f905b`](https://github.com/losmoriartys-cmd/s3xmen/commit/3b3f905b1132b6881370c774ba1987f6ed653ab7).


## 2026-11-04 — Alinear la descripción del historial de Twitch con la ventana real de 30 días

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** corregir textos del sitio que todavía describían una ventana de 10 días, aunque el colector y los datos publicados ya operan con una ventana móvil de 30 días.
- **Archivos modificados:**
  - `index.html`: actualizadas las referencias de la base de datos y del panel de métricas para indicar 30 días.
  - `INFORMES.md`: registro de esta intervención.
- **Implementado:** se corrigieron tres textos. La descripción ahora coincide con `data.json` (`window_days: 30`, muestreo cada 15 minutos) y con `update_stats.py` (`WINDOW_DAYS = 30`). No se modificaron la automatización, sus credenciales, los datos ni las métricas.
- **Chequeo de consolidación:** la rama `instituto-premium-redesign` está divergida respecto de `main` (29 commits por delante y 86 por detrás). No se fusionó completa porque contiene versiones anteriores de `index.html`, retratos y datos estadísticos parciales/desactualizados. Los capítulos 01–07, las diez fichas oficiales y la carta actual de Nexus ya están en `main`.
- **Validaciones y resultados:** comprobado el valor real de 30 días en el colector y en `data.json`; se verificó que las tres referencias antiguas de 10 días fueron reemplazadas. No se realizó una nueva prueba visual en navegador.
- **Pendientes / riesgos:** revisar visualmente la página publicada. Los datos de SullyGnome de la rama antigua siguen sin integrarse: solo contienen registros parciales para algunos canales y requieren contraste con la fuente antes de publicarse.
- **Commit de implementación:** [`784f8f3d`](https://github.com/losmoriartys-cmd/s3xmen/commit/784f8f3de816b7a613f374e5d51bc999cf72452e).
- **Commit del informe:** se agrega este registro en el commit actual.
- **Despliegue:** pendiente de verificar el workflow de GitHub Pages.


## 2026-11-04 — Preparar consulta gratuita de Streams Charts

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** validar la autenticación de Streams Charts y obtener un primer conjunto de datos sin activar un plan de pago ni consumir créditos.
- **Archivos creados:**
  - `update_streamscharts.py`: consulta exclusivamente el endpoint gratuito `/api/v2/channels?platform=twitch&time=7-days`, valida la respuesta y guarda el snapshot en `streamscharts-data.json`. No imprime credenciales.
  - `.github/workflows/streamscharts-free.yml`: workflow manual (`workflow_dispatch`) que utiliza los secretos `STREAMCHARTS_CLIENT_ID` y `STREAMCHARTS_TOKEN`.
- **Credenciales:** el equipo confirmó mediante captura que ambos secretos están creados en GitHub Actions. Sus valores no se leen ni se registran en el repositorio.
- **Límite de coste:** la consulta elegida es el top 100 de Twitch de los últimos 7 días, página 1, documentada por Streams Charts como gratuita (0 créditos). No se llaman endpoints individuales por canal: esos cuestan créditos y requieren plan/ saldo habilitado.
- **Estado:** código y workflow agregados a `main`. La primera ejecución manual queda pendiente de iniciarse desde GitHub Actions; hasta entonces no se afirma que la autenticación haya sido probada ni que existan datos descargados.
- **Pendiente funcional:** una vez obtenido el snapshot, comprobar cuáles de nuestros creadores aparecen en el top 100. La ausencia de un canal solo significa que no figura en ese ranking, no que no haya tenido actividad. Para métricas históricas individuales de los nueve canales hará falta habilitar consultas pagas o acordar otra fuente.
- **Commits:** `385eb998b3389c962f75d0e1f7eba5bb8e76c288` (recolector) y `35f27b717e0da2282d5cdeed176c9eac2f6f35e4` (workflow manual).
- **Despliegue:** el snapshot aún no existe; la integración no está conectada visualmente a los expedientes.



## 2026-11-04 — Retirar rankings globales y limitar el sitio al roster

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** dejar explícito que el sitio integra información y estadísticas únicamente de los integrantes del roster. Los rankings mundiales y el TOP 100 eran referencias informativas y quedan fuera del alcance.
- **Archivos modificados / retirados:**
  - `index.html`: eliminado el antiguo Capítulo 05 «Radar del Instituto», que reunía rankings globales de juegos, streamers y categorías. Se renumeraron los capítulos siguientes y se conservó el Arsenal Cooperativo como Capítulo 05 independiente. Se retiraron las menciones a Streams Charts en las fichas y se dejó como alcance de analítica las estadísticas propias observadas de cada canal.
  - `update_streamscharts.py`: eliminado; era exclusivamente el recolector del TOP 100 gratuito de Twitch de los últimos 7 días.
  - `.github/workflows/streamscharts-free.yml`: eliminado; ejecutaba únicamente ese recolector.
  - `INFORMES.md`: se conserva el registro histórico de la prueba anterior y se agrega esta decisión de retiro.
- **Preservado:** `data.json`, `update_stats.py`, el workflow `actualizar-stats.yml`, la base de estadísticas de Twitch Helix y las secciones del roster, fichas y Arsenal Cooperativo.
- **Validaciones:** confirmada la numeración consecutiva de capítulos 01–09 y la eliminación de los archivos exclusivos del ranking. No se modificaron estadísticas ni automatizaciones propias del roster.
- **Pendientes:** verificar el despliegue de GitHub Pages. Los secretos `STREAMSCHARTS_CLIENT_ID` y `STREAMSCHARTS_TOKEN` dejan de ser utilizados por el repositorio; su eliminación de Settings → Secrets and variables → Actions queda a cargo del propietario del repositorio.
- **Commits de implementación:** `0011f4c2` (sitio), `9b998ff6` (recolector eliminado) y `8ff804e6` (workflow eliminado).
- **Despliegue:** pendiente de comprobar el workflow de GitHub Pages.


## 2026-11-04 — Integrar SullyGnome como fuente histórica complementaria del roster

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** incorporar el historial de SullyGnome en los expedientes individuales, separado de las observaciones actuales de Twitch Helix.
- **Archivos creados/modificados:**
  - `sullygnome-data.json`: incorporada la base histórica de trabajo que ya existía en la rama `instituto-premium-redesign`, sin fusionar esa rama ni sobrescribir `main`.
  - `index.html`: activada la carga del archivo histórico y conectada su información al panel de estadísticas de cada integrante Twitch. Se muestra el período y el enlace de fuente cuando están disponibles.
  - `INFORMES.md`: agregado este registro.
- **Implementado:**
  - SullyGnome queda como fuente histórica complementaria; Twitch Helix continúa como fuente de seguimiento actual y muestreo propio.
  - Las estadísticas se presentan en bloques separados, sin mezclar métricas ni períodos.
  - La base importada conserva los estados y notas originales: Los Moriartys y Dave figuran como parciales; los otros siete canales Twitch figuran pendientes.
  - Para Los Moriartys se conservan 9 transmisiones transcritas (19/10/2026–02/11/2026). Para Dave se conserva el resumen anual informado de 45 transmisiones y las 10 filas visibles por separado; esas 10 filas no se presentan como historial completo.
  - Las cifras de seguidores reportadas en las filas de Los Moriartys mantienen la advertencia de interpretación pendiente; el promedio ponderado se identifica como cálculo derivado.
  - Pato/Oratoris, cuyo canal es YouTube, queda fuera del dataset Twitch/SullyGnome y mantiene sus métricas separadas.
- **Validaciones y límites:**
  - Se verificó que el archivo fuente ya existía en la rama histórica, con 9 canales Twitch y estructura compatible con el renderizador de SullyGnome existente en `index.html`.
  - Se comprobó que el renderizador existía pero no estaba conectado: no se cargaba el JSON ni se añadía su contenido a la ficha. Esta intervención activa ambas partes.
  - No fue posible contrastar en esta intervención las tablas históricas directamente contra las páginas dinámicas de SullyGnome. Por eso los registros heredados conservan explícitamente sus notas de transcripción y estado parcial; no se elevan a datos completos ni se inventan filas para los canales pendientes.
  - No se modificaron `data.json`, `update_stats.py`, workflows, secretos ni automatizaciones.
- **Pendientes / riesgos:** revisar visualmente los expedientes de Los Moriartys y Dave, y completar/contrastar los datos de los siete canales pendientes con sus tablas de SullyGnome. Las métricas de YouTube de Pato requieren una fuente independiente.
- **Commit de datos:** a269338ba3ae379e4c68088ac23e894e8e161584
- **Commit de interfaz:** 765fbcfa47d147d81dfb182738c18baf8f271ffd
- **Despliegue:** pendiente de comprobar GitHub Actions / GitHub Pages.


## 2026-11-04 — Rediseño visual de páginas C y D de expedientes

- **Objetivo:** reemplazar los bloques de texto crudo por paneles visuales legibles y estructurados.
- **Archivo modificado:** `index.html`.
- **Página C — Estadísticas:**
  - Paneles separados para Twitch Helix (seguimiento propio) y SullyGnome (historial histórico).
  - Indicadores KPI en tarjetas, estado del registro, períodos, enlace a la fuente y notas metodológicas.
  - Tabla individual de transmisiones con fecha, horario de inicio cuando está informado, duración, promedio, pico, horas vistas y seguidores reportados.
  - En Dave, el resumen anual de 45 directos permanece separado de las 10 filas visibles.
  - En Los Moriartys, los horarios no informados se muestran expresamente como tales; no se inventan horas de inicio.
  - Canales sin filas históricas muestran un estado pendiente claro, no una tabla falsa ni ceros.
- **Página D — Misiones y logros:**
  - Archivo de personaje en una tarjeta destacada.
  - Secciones visuales separadas para hitos, colaboraciones y directos/clips destacados.
  - Los registros vacíos se identifican como pendientes de datos verificados.
- **Seguridad de presentación:** el contenido dinámico se escapa antes de insertarse como HTML.
- **Preservado:** datos de roster, `data.json`, `sullygnome-data.json`, `creator-records.json`, poderes, automatizaciones y workflows.
- **Límite de datos:** SullyGnome no suministró horarios de inicio para las nueve transmisiones de Los Moriartys; el diseño lo deja visible en la columna de horario. Dave sí conserva horario en las diez filas transcritas.
- **Despliegue:** pendiente de comprobar GitHub Pages tras el commit.
- **Commit de interfaz:** d16ceb407ec5eb175d49912f2e16ed4635ed0b24

- **Ajuste de marcado:** los contenedores de las páginas C y D se cambiaron de párrafos a bloques `div`, necesarios para alojar correctamente tarjetas, secciones y tablas HTML sin anidamiento inválido.
- **Commit de ajuste:** 949e9549142bcb9e94b336ac3e0775d769f208e2


## 2026-11-04 — Incorporar gráficos de actividad a los expedientes

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** reforzar la lectura visual del panel C para que las estadísticas individuales se perciban como un dashboard y no únicamente como una tabla.
- **Archivos modificados:**
  - `index.html`: agregado un componente reutilizable de barras horizontales y estilos adaptables a pantallas pequeñas.
  - `INFORMES.md`: agregado este registro.
- **Implementado:**
  - En el bloque SullyGnome, gráfico de horas vistas por transmisión a partir de las filas históricas disponibles.
  - En el bloque Twitch Helix, gráfico de actividad diaria según muestras en directo y gráfico de categorías según cantidad de muestras observadas.
  - Los gráficos se ocultan cuando no hay valores observados suficientes; no se rellenan períodos ni canales pendientes con ceros ficticios.
  - Se conservan separadas las fuentes y metodologías: los gráficos históricos proceden de SullyGnome y los gráficos Helix reflejan únicamente el muestreo propio.
- **Preservado:** `data.json`, `sullygnome-data.json`, automatizaciones, workflows, roster, poderes y archivo de misiones.
- **Validaciones:** actualización de `index.html` aceptada por GitHub sobre el SHA vigente. Se comprobó la presencia de los estilos, el renderizador reutilizable y las tres inserciones de gráficos. No se realizó todavía una inspección visual en navegador ni se confirmó el despliegue de Pages.
- **Pendientes / riesgos:** revisar la presentación en el sitio publicado y comprobar el workflow de GitHub Pages. Los datos históricos siguen sujetos a los estados parciales y notas de verificación ya documentados.
- **Commit de interfaz:** `5b817b17c034f34ae81ccaf10e3d0376be0ed580`.
- **Despliegue:** pendiente de verificación.


## 2026-11-04 — Rediseñar la entrada del roster y el acceso a expedientes individuales

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** separar la presentación grupal del roster de la experiencia individual de cada integrante, conservando las cartas oficiales y la jerarquía vigente.
- **Archivos modificados:**
  - `index.html`: presentación del roster, contadores, leyenda, vista individual y navegación hacia la bitácora.
  - `INFORMES.md`: registro de esta intervención.
- **Implementado:**
  - El roster presenta retratos en tarjetas compactas, agrupados por Dirección, Cuerpo Docente, Estudiantes y Colaboradores.
  - Los contadores se calculan desde `heroesData`, evitando cifras fijas desactualizadas.
  - Se incorpora la categoría visual Colaboradores en la leyenda.
  - Al seleccionar un integrante se abre una vista individual con su carta oficial completa, presentación y acceso a la bitácora existente (páginas A–D).
  - La vista individual actualiza el fragmento de URL para permitir enlaces directos al expediente; se restaura al cargar la página.
  - Se conserva el renderizador de estadísticas, historial y misiones. No se alteraron datos, poderes, imágenes oficiales ni automatizaciones.
  - Las tarjetas del roster utilizan por ahora un recorte de la imagen oficial disponible como retrato; no se agregaron fotografías nuevas ni se alteraron los archivos de imagen.
  - Se respeta `prefers-reduced-motion` para reducir las transiciones nuevas.
- **Validaciones:**
  - Comprobada la presencia en `heroesData` de dos directores, cinco profesores, un estudiante y dos colaboradores: PATO — ORATORIS y HÁBITOS ATÓMICOS.
  - Comprobada la presencia de la leyenda de colaboradores, contadores dinámicos, vista individual, ruta por fragmento y acceso a la bitácora A–D.
  - La carta oficial se sigue mostrando desde la ruta ya asignada a cada integrante.
  - No se ha realizado todavía una prueba visual manual en navegador ni se ha confirmado el despliegue de GitHub Pages.
- **Pendientes / riesgos:**
  - Revisar el recorte de los retratos en escritorio y móvil. Si el equipo dispone de retratos independientes, podrán reemplazar los recortes sin modificar las cartas oficiales.
  - Completar las presentaciones personales y los contenidos comerciales con información aprobada por cada integrante.
  - Verificar el workflow de Pages y la visualización publicada.
- **Commit de interfaz:** `60aec08c4906ff10ef6db64ad23e5040c3998c84` (ajuste final de contadores y enlaces; incluye el commit anterior de estructura `50599cb33c3cc8288655216314cdc8ff16cb9b13`).
- **Despliegue:** pendiente de verificación.


## 2026-11-04 — Crear carpeta de retratos tipo carnet

- **Objetivo:** preparar un espacio para que el equipo cargue retratos individuales destinados al roster.
- **Ruta creada:** `assets/carnet/` (materializada mediante `README.md`, ya que Git no conserva carpetas vacías).
- **Convención:** una imagen por integrante, con nombre estable basado en el alias; estos retratos son independientes de las cartas oficiales y no las reemplazan.
- **Formatos sugeridos:** JPG, PNG o WebP.
- **Commit:** `1cadb43e14680a37cdd121d9c4c2d8129f7515b1`.
- **Estado:** carpeta disponible en `main`; pendiente de que el usuario cargue las fotografías.

## 2026-11-04 — Integrar retratos carnet en el roster

- **Objetivo:** reemplazar los recortes de cartas oficiales por los retratos individuales cargados por el equipo, manteniendo las cartas completas en cada expediente.
- **Archivo modificado:** `index.html`.
- **Implementado:**
  - Se asignó un campo `portrait` independiente a cada uno de los diez integrantes.
  - El roster utiliza `hero.portrait` y conserva `hero.img` como alternativa si faltara un retrato.
  - La vista individual y la bitácora siguen utilizando `hero.img`; no se reemplazaron ni editaron las cartas oficiales.
  - Se respetó la jerarquía existente: 2 en Dirección, 5 en Cuerpo Docente, 1 Estudiante y 2 Colaboradores.
  - Los archivos de retrato se consumen desde `assets/carnet/` con sus nombres exactos, sin renombrarlos.
- **Validaciones de código:** diez asignaciones de retrato; el render del roster prioriza `portrait`; la vista de expediente continúa leyendo `img` para mostrar la carta oficial.
- **Preservado:** `data.json`, `sullygnome-data.json`, estadísticas, automatizaciones, roles, poderes, bitácoras y archivos de cartas.
- **Commit de interfaz:** `539751301becc7d19fd4e6b57d4a8bcb720f7059`.
- **Despliegue:** pendiente de verificación visual en GitHub Pages.

## 2026-11-04 — Actualizar jerarquía del roster: Capy y ElGabii

- **Solicitud:** mover a CAPYUNAPLAY y ELGABII090 del Cuerpo Docente a Estudiantes.
- **Archivo modificado:** `index.html`.
- **Implementado:** se actualizó `role` de `teacher` a `student` en los expedientes de CAPY y ELGABII. Sus retratos, cartas oficiales, perfiles, horarios y demás contenidos permanecen sin cambios.
- **Efecto en el roster:** los contadores dinámicos y la agrupación reflejan automáticamente Dirección: 2, Cuerpo Docente: 3, Estudiantes: 3 y Colaboradores: 2.
- **Preservado:** el resto de la jerarquía y todos los datos, estadísticas, automatizaciones, poderes y cartas oficiales.
- **Commit de interfaz:** `18fc410d0b3bb18f6629b7d065baaafb1779687c`.
- **Despliegue:** pendiente de verificación visual en GitHub Pages.

## 2026-11-04 — Renombrar la sección del roster a Profesores

- **Solicitud:** reemplazar la denominación «Cuerpo Docente» por «Profesores».
- **Archivo modificado:** `index.html`.
- **Implementado:** se actualizó la leyenda, el encabezado de la sección y la etiqueta usada por el contador dinámico. Se ajustó la descripción de la sección para mantener coherencia con el nuevo nombre.
- **Preservado:** roles y asignaciones de integrantes, contadores, retratos, cartas oficiales, estadísticas y automatizaciones.
- **Commit de interfaz:** `d143ca53102075ab97d1dbfda394091927134136`.
- **Despliegue:** pendiente de verificación visual en GitHub Pages.


## 2026-11-04 — Renovar el Arsenal: diez juegos para compartir en directo

- **Responsable:** ChatGPT + equipo Los Moriartys.
- **Objetivo:** reemplazar el catálogo anterior de veinte títulos por una selección editorial de diez juegos orientada a la diversión compartida, el contenido en directo y la variedad de experiencias.
- **Archivo modificado:** `index.html`.
- **Selección publicada:**
  1. Mimic Party.
  2. MECCHA CHAMELEON.
  3. Backrooms: Escape Together.
  4. R.E.P.O.
  5. Content Warning.
  6. Dale & Dawson Stationery Supplies.
  7. Lethal Company.
  8. Minecraft.
  9. Among Us.
  10. The Forest.
- **Implementado:** se reemplazaron las veinte fichas anteriores por diez tarjetas con imagen, descripción editorial, categoría y enlace directo a la tienda oficial. Se añadió una presentación que deja claro que el Arsenal incluye party games, deducción social, escondidas, terror, supervivencia y sandbox; no todos los títulos se presentan como cooperativos tradicionales.
- **Imágenes:** se enlazan las cabeceras oficiales de Steam para los nueve títulos disponibles en esa tienda y una captura del sitio oficial de Minecraft. Son recursos externos; no se copiaron ni almacenaron imágenes dentro del repositorio.
- **Verificaciones de contenido:** diez títulos exactos, diez imágenes declaradas, diez enlaces de tienda, numeración 01–10 y estilos responsive para las tarjetas. Se preservaron el resto de los capítulos, el roster, los expedientes, las estadísticas y las automatizaciones.
- **Datos de juego destacados:** Mimic Party (1–5 online) y Among Us (4–15) según sus fichas de Steam; Backrooms: Escape Together (1–6) y R.E.P.O. (hasta 6) según sus páginas de Steam; Minecraft distingue Java y Bedrock y sus posibilidades de juego cruzado según la documentación oficial.
- **Fuentes oficiales consultadas:**
  - Steam — Mimic Party: https://store.steampowered.com/app/5053820/
  - Steam — MECCHA CHAMELEON: https://store.steampowered.com/app/4704690/
  - Steam — Backrooms: Escape Together: https://store.steampowered.com/app/2141730/
  - Steam — R.E.P.O.: https://store.steampowered.com/app/3241660/
  - Steam — Content Warning: https://store.steampowered.com/app/2881650/
  - Steam — Dale & Dawson Stationery Supplies: https://store.steampowered.com/app/2920570/
  - Steam — Lethal Company: https://store.steampowered.com/app/1966720/
  - Minecraft — tienda oficial: https://www.minecraft.net/es-es/store/minecraft-java-bedrock-edition-pc
  - Steam — Among Us: https://store.steampowered.com/app/945360/
  - Steam — The Forest: https://store.steampowered.com/app/242760/
- **Pendientes / riesgos:** comprobar visualmente el sitio publicado y que los recursos remotos de imágenes carguen correctamente en GitHub Pages. Las condiciones de crossplay, disponibilidad regional y requisitos pueden variar por edición; por eso se remite a las fichas oficiales y no se anuncian compatibilidades no verificadas.
- **Commit de interfaz:** `1751350bf63c954ad502335b6895bc53fdbb0c39`.
- **Despliegue:** pendiente de comprobar GitHub Actions / GitHub Pages.


## 2026-11-04 — Corregir portadas rotas del Arsenal

- **Solicitud:** corregir las imágenes de Mimic Party y MECCHA CHAMELEON que aparecían rotas en GitHub Pages.
- **Causa identificada:** las tarjetas apuntaban a rutas antiguas del CDN de Steam que no resolvían las portadas de esos dos juegos.
- **Archivo modificado:** `index.html`.
- **Corrección:** se reemplazaron ambas direcciones por las rutas actuales de recursos de Steam con sus identificadores de asset verificados.
- **Verificación de recursos:** se abrió y comprobó que las dos nuevas URLs devuelven las cabeceras oficiales correctas: Mimic Party y MECCHA CHAMELEON.
- **Preservado:** textos, diseño, orden de los diez juegos, enlaces a tiendas, resto del sitio, estadísticas y automatizaciones.
- **Commit de interfaz:** `47c6076e66f084f94ada8287e00fc54e41629da4`.
- **Despliegue:** pendiente de verificar GitHub Actions y la visualización final en GitHub Pages.


## 2026-11-04 — Expediente institucional piloto: Los Moriartys (Demi + Ari)

- **Objetivo:** iniciar la ampliación del Capítulo 2 con el expediente del proyecto conjunto, antes de replicar el modelo en perfiles individuales.
- **Archivo modificado:** `index.html`.
- **Identidad editorial:** Los Moriartys se presenta como proyecto compartido de Demi y Ari. Se distingue explícitamente a Demi como cofundador/coanfitrión y a Ari como cofundadora/coanfitriona, indicando que Ari también mantiene su canal individual LADYMORIARTY01.
- **Presentación:** se actualizó la biografía del canal conjunto para describir su propuesta de gaming, cooperativo, humor y cultura pop desde la identidad de videoclub retro.
- **Secciones añadidas a la vista individual:** A · Identidad y presentación; B · Contenido y especialidades; E · Oportunidades de colaboración.
- **Formatos propuestos:** directos compartidos, videojuegos/cooperativo, humor y situaciones espontáneas, cultura pop/conversación; posibles integraciones contextuales, dinámicas participativas, presentación de juegos y colaboraciones con creadores.
- **Contacto:** se utiliza `losmoriartys@gmail.com` como dirección de contacto propuesta para oportunidades. No se anuncian acuerdos comerciales ni alianzas vigentes.
- **Preservado:** carta oficial, retrato, estructura del roster, roles, estadísticas, automatizaciones, datos de Twitch y expedientes de los demás integrantes.
- **Pendiente editorial:** validar con Ari y Demi los textos finales, completar ejemplos reales de contenido y añadir evidencias/hitos/colaboraciones con fuentes comprobables. Las secciones C y D siguen usando los sistemas de datos existentes; no se inventaron métricas ni registros.
- **Commits de interfaz:** `be6629fcaed1102c6a6016deb4f006c3d006805f`, `bd25cb19493a212a9f0fc7028a4ff565ce52a68b`, `ade1afc0ef5f2ef3e50d88ef101fff51a62ff757`.
- **Despliegue:** pendiente de comprobar GitHub Actions y visualización final en GitHub Pages.

## 2026-11-04 — Reorganización del media kit y central de transmisiones

- **Responsable:** ChatGPT + equipo de Legión Multiversal.
- **Objetivo:** priorizar la presentación comercial y comunitaria, simplificar la información institucional y preparar una experiencia de transmisiones en vivo.
- **Archivo modificado:** `index.html`.
- **Implementado:**
  - Capítulo 03 renovado como presentación de alcance y actividad de la comunidad, con indicadores legibles y fecha de actualización visible.
  - La metodología, fuente Twitch Helix, ventana móvil, frecuencia de muestreo y limitaciones pasan a desplegables secundarios. El detalle por canal también queda disponible bajo demanda.
  - Se retiró de la navegación pública el tutorial operativo de Lurkit y Keymailer; su contenido ya no ocupa un capítulo del media kit.
  - Capítulo 05 conserva la selección editorial de diez juegos, sus imágenes y enlaces a tiendas oficiales.
  - Se retiró la página de contacto con el staff como capítulo público. El pie de página incorpora un enlace discreto para reportes técnicos, separado del contacto comercial.
  - Capítulo 08 se simplificó como presentación de alianzas, experiencia, formatos de colaboración y contacto comercial. Se eliminaron matrices de requisitos históricos y programas en investigación.
  - Capítulo 09 se convirtió en una presentación permanente de comunidad, sin agenda tentativa ni horarios individuales heredados de planillas antiguas.
  - Reclutamiento queda como último capítulo público de navegación.
  - Se incorporó una sección **En vivo** que detecta los canales marcados como activos en la última lectura de `data.json`, permite seleccionar una transmisión y carga el reproductor oficial de Twitch con el dominio actual como parámetro `parent`. Si no hay canales activos, muestra el estado y accesos a los canales del roster.
- **Validaciones realizadas:**
  - Se confirmó que `data.json` contiene 9 canales, ventana declarada de 30 días y frecuencia programada de 15 minutos; en la última lectura todos figuraban offline.
  - Se verificó en el archivo actualizado la presencia de los desplegables metodológicos, el nuevo capítulo En vivo, el reproductor embebido, el contacto técnico del pie de página y la ausencia de los capítulos operativos retirados.
  - Se añadió una aclaración visible en la metodología: una ventana máxima configurada de 30 días no implica que los 30 días estén completos; la cobertura depende de la antigüedad y continuidad de la recolección.
  - Se comprobó que el Arsenal conserva exactamente diez tarjetas.
  - Se confirmó que la navegación utiliza identificadores explícitos de capítulo para permitir el nuevo orden sin renombrar los identificadores internos.
- **Pendientes / riesgos:**
  - El estado de Twitch se basa en la última sincronización programada; no es detección instantánea.
  - El reproductor debe probarse en el dominio publicado de GitHub Pages y requiere conexión, navegador compatible y permiso de inserción de Twitch. No se pudo validar una transmisión real porque los nueve canales figuraban offline en la última lectura.
  - Revisar visualmente escritorio y móvil tras el despliegue.
  - Confirmar con el equipo las acreditaciones y colaboraciones citadas en el apartado comercial antes de utilizar el media kit en una campaña externa.
- **Commits:** interfaz y reorganización `ce6554351fd2455d0e44dd00d307998db38e1a51` — https://github.com/losmoriartys-cmd/s3xmen/commit/ce6554351fd2455d0e44dd00d307998db38e1a51; ajuste de reproductor Twitch (mínimo 400 × 300 px) `ff1624a218fc528255b426131f3035dcb1c8959f` — https://github.com/losmoriartys-cmd/s3xmen/commit/ff1624a218fc528255b426131f3035dcb1c8959f
- **Despliegue:** pendiente de verificación en GitHub Actions / GitHub Pages.


## 2026-11-04 — Revisión posterior al despliegue

- **Responsable:** ChatGPT.
- **Objetivo:** revisión estática de la reorganización del media kit y del capítulo En vivo.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Revisión realizada:**
  - Se confirmó que el workflow de GitHub Pages asociado al commit `ece6dfcc81cf9672514b216c2d67d15ad6d0baff` terminó con resultado `success`; los jobs de build y deploy finalizaron correctamente.
  - Se verificó que la navegación apunta a los ocho capítulos existentes: 1, 2, 3, 10, 5, 8, 9 y 6. No quedaron llamadas a los capítulos 4 o 7 retirados.
  - Se confirmó que el capítulo 3 tiene sus contenedores de estadísticas, fecha de actualización y tabla de detalle; el script consume `data.json`.
  - Se confirmó que el capítulo En vivo reutiliza los canales de `data.json`, arma enlaces de fallback y construye el reproductor Twitch con `parent=window.location.hostname`. Se comprobó en CSS el mínimo de 400 px de ancho y 300 px de alto.
  - Se verificó que el Arsenal conserva diez tarjetas.
  - Se observó que `creator-records.json` no contiene todavía registros de colaboraciones ni hitos para respaldar las relaciones comerciales nombradas en el texto. Para evitar afirmaciones públicas sin evidencia enlazable, se retiraron las menciones concretas a TheR0D3R1K, Enshrouded y Cinderia del apartado de alianzas. Se incorporó un criterio explícito de publicación de acreditaciones y campañas verificables.
  - Los datos de Twitch consultados mostraban nueve canales y ninguno en directo en la última sincronización; por eso no se pudo probar un iframe con una transmisión real.
- **Limitación de esta revisión:** se realizó auditoría del código, datos y estado de GitHub Actions. El navegador de revisión no pudo recuperar el dominio público de GitHub Pages, por lo que no se certifica la apariencia visual final en escritorio/móvil ni el funcionamiento real del reproductor con una transmisión activa. Se requiere comprobación manual en el navegador.
- **Pendientes:** prueba visual en desktop y móvil; prueba del reproductor cuando un canal esté en vivo; completar `creator-records.json` con pruebas documentales antes de volver a mostrar colaboraciones específicas.
- **Commit de corrección de transparencia:** `b9a29c250000cb0a1648a494914f8619677b0b60` — https://github.com/losmoriartys-cmd/s3xmen/commit/b9a29c250000cb0a1648a494914f8619677b0b60
- **Despliegue de la reorganización anterior:** exitoso; workflow `41798161727`. El commit de corrección de transparencia queda sujeto a su propio workflow de Pages.



## 2026-11-04 — Unificación del media kit y la bitácora

- **Objetivo:** eliminar la duplicación entre la vista de perfil y la bitácora modal; convertir la bitácora existente en el expediente comercial completo.
- **Archivo modificado:** `index.html`.
- **Nueva estructura integrada en la bitácora:**
  - **A · Perfil y contenido:** presentación del creador/proyecto, identidad de sus integrantes, especialidades, formatos y posibilidades de colaboración.
  - **B · Audiencia y estadísticas:** paneles de Twitch Helix y SullyGnome existentes, cada fuente separada, con sus períodos y aclaraciones metodológicas.
  - **C · Trayectoria y colaboraciones:** hitos, colaboraciones y directos/clips destacados desde `creator-records.json`, con fecha y fuente/enlace.
- **Retirado de la bitácora:** pestaña de poderes/habilidades ficticias. Esa información permanece en la carta oficial y no se duplica en el media kit.
- **Vista previa del perfil:** vuelve a funcionar como acceso a la carta oficial y a la bitácora unificada; se retiró la repetición de bloques editoriales fuera del expediente.
- **Legibilidad:** se añadieron estilos para la presentación, perfiles de integrantes y navegación responsive. Se conserva el sistema de estadísticas existente y no se inventan cifras ni registros.
- **Preservado:** roster, cartas, roles, fuentes de estadísticas, `data.json`, `sullygnome-data.json`, automatizaciones y registros editoriales.
- **Commit de interfaz:** `683bca4d2449e91c3e8a14ac5b19e0f7022e897f`.
- **Despliegue:** pendiente de comprobar el workflow de GitHub Pages y la lectura visual en escritorio/móvil.

## 2026-11-04 — Incorporación del capítulo «Nuestros valores»
- Se añadió un capítulo institucional independiente, accesible desde la navegación principal como «NUESTROS VALORES».
- Se ubicó después del Roster y antes de Estadísticas para presentar primero a las personas y luego explicar la identidad que comparten.
- El contenido desarrolla el propósito del Instituto como espacio creativo y de colaboración; la creación de contenido con identidad; la convivencia de distintas voces; el compañerismo, el respeto y el crecimiento compartido; la responsabilidad y la transparencia.
- Se explica qué experiencia se busca ofrecer a la comunidad y qué sentido tienen las colaboraciones para marcas, estudios y publishers.
- Se añadieron accesos directos a Alianzas y Comunidad.
- El texto evita atribuir al Instituto una condición jurídica o acreditaciones no documentadas; presenta su identidad y propósito en términos institucionales y creativos.
- Validación realizada: nuevo ID único `chapter-11`, enlace de navegación asociado a `switchChapter(11)` y ubicación antes del Capítulo 03.
- Pendiente de validación visual en GitHub Pages y en vista móvil una vez completado el despliegue.
- Commit: `f3770022fa11ebfd26f03c27b91024a06d95d2d3`.

## 2026-11-04 — Identidad visual: tipografía y microinteracciones
- Se actualizó la combinación tipográfica global: **Bangers** para títulos y elementos de impacto; **Roboto Condensed** para lectura y controles; **Special Elite** para etiquetas editoriales y detalles de archivo; **Permanent Marker** para acentos puntuales.
- Se añadieron microanimaciones de baja intensidad: entrada suave al cambiar de capítulo, flotación mínima del emblema y realce discreto de tarjetas y botones al pasar el cursor.
- Se reforzó el indicador de foco visible para navegación por teclado.
- Se amplió el tratamiento `prefers-reduced-motion` para respetar la preferencia de accesibilidad del sistema y reducir todas las animaciones/transiciones.
- No se incorporó música todavía: no hay una pista propia/licenciada en los assets del proyecto. No se debe enlazar música comercial ni iniciar audio automáticamente. Próximo paso recomendado: incorporar una pista original o con licencia confirmada y un control explícito de reproducción/pausa, siempre apagado por defecto.
- Pendiente: revisión visual de la combinación tipográfica en escritorio/móvil y validación del despliegue de GitHub Pages.
- Commit: `f498bddf08b54482c5602c3bac8169a898256243`.

## 2026-11-04 — Rediseño piloto de estadísticas para Los Moriartys

- **Objetivo:** probar una presentación más clara y comercial del apartado B · Audiencia y estadísticas, tomando como referencia la jerarquía visual de dashboards de analítica.
- **Archivos modificados:** `index.html`; `INFORMES.md`.
- **Implementado:**
  - Se creó un diseño piloto específico para el canal conjunto `losmoriartys`, sin alterar el renderizado estadístico del resto de los integrantes.
  - SullyGnome presenta cinco indicadores principales, período visible, gráfico comparativo de horas vistas por directo y tabla de nueve transmisiones con fecha, duración, promedio, pico y horas vistas.
  - Se omitió la columna de seguidores porque su significado en la fuente todavía no está confirmado.
  - Se aclara que el desglose por juego/categoría no está incluido en la exportación histórica disponible.
  - Twitch Helix se presenta en un panel independiente con cantidad de consultas, muestras en directo, directos detectados y última sincronización. Se explica que la ventana técnica de 30 días no equivale a 30 días completos de observación en el archivo actual.
  - Los indicadores sin datos verificables se muestran como no disponibles; no se sustituyen por ceros ni se extrapolan las muestras.
- **Preservado:** `data.json`, `sullygnome-data.json`, `creator-records.json`, automatizaciones, estadísticas del resto del roster, biografías, cartas y estructura de las tres pestañas.
- **Validaciones:** se volvió a leer el archivo publicado desde `main`; se confirmó la presencia de ambos renderizadores piloto, su aplicación exclusiva al login `losmoriartys` y la conservación de los renderizadores genéricos.
- **Pendientes:** comprobar el workflow de GitHub Pages y revisar visualmente el expediente en escritorio y móvil. El piloto no incorpora gráfico de distribución por juegos porque el histórico de Los Moriartys no contiene ese desglose.
- **Commit de interfaz:** [`9d02c882`](https://github.com/losmoriartys-cmd/s3xmen/commit/9d02c882a1e2bf7758f011497342f08a10691520).
- **Despliegue:** pendiente de verificación.

## 2026-11-04 — Transiciones de expedientes e identidad sonora arcade

- **Objetivo:** reforzar la experiencia de navegación de Legión Multiversal con una transición reconocible entre expedientes y una identidad sonora retro inspirada en arcades de los años 80/90.
- **Archivo de interfaz:** `index.html`.
- **Transiciones:** se incorporó una cortinilla breve de pantalla completa con trama de puntos, colores de la identidad visual y el nombre del expediente de destino. La animación acompaña el cambio de panel sin alterar el orden ni el contenido de los capítulos.
- **Accesibilidad:** se respeta `prefers-reduced-motion`; en ese modo se omite la cortinilla animada y el desplazamiento utiliza comportamiento inmediato.
- **Identidad sonora:** se implementó una composición chiptune original generada en tiempo real mediante Web Audio API, con melodía de onda cuadrada, bajo triangular y acentos electrónicos. No se descargan pistas ni se incorporan obras comerciales.
- **Control de usuario:** botón visible `SONIDO: OFF/ON`; el audio está desactivado por defecto, solo comienza tras una interacción explícita y puede pausarse desde el mismo control. Se suma un breve acorde de navegación al cambiar de expediente mientras el audio está activo.
- **Preservado:** estructura, capítulos, roster, cartas, estadísticas, enlaces, automatizaciones y contenido editorial existente.
- **Pendiente de prueba:** escuchar el resultado en navegador real, comprobar niveles y compatibilidad de Web Audio API en escritorio/móvil y revisar el workflow de GitHub Pages. La implementación evita autoplay, pero la experiencia sonora debe calibrarse con escucha real.
- **Commit de interfaz:** `01668723c26abdd75368ac3216e8774919586d50` — https://github.com/losmoriartys-cmd/s3xmen/commit/01668723c26abdd75368ac3216e8774919586d50
- **Despliegue:** sujeto al workflow de GitHub Pages asociado al commit.

## 2026-11-04 — Revisión de identidad sonora: lounge jazz superheroico

- **Motivo:** la primera melodía chiptune se percibía demasiado simple y con energía de arcade clásico; se reemplazó por una atmósfera más cálida, relajada y cinematográfica.
- **Dirección musical:** lounge jazz / jazz de cómic y aventura; tempo moderado (76 BPM), acordes extendidos maj9, m9 y 13, colchón armónico tipo Rhodes, bajo redondo, percusión sutil tipo escobillas y pequeñas frases melódicas.
- **Navegación:** el efecto de cambio de expediente se sustituyó por un acorde maj7 suave, integrado en la misma paleta sonora.
- **Implementación:** composición generativa original mediante Web Audio API; no utiliza canciones, samples ni archivos externos. Se mantiene el inicio manual, apagado por defecto y el control de silencio.
- **Criterio de mezcla:** volúmenes deliberadamente discretos para funcionar como ambiente y no competir con la lectura. Pendiente de escucha y calibración final en navegador y dispositivos reales.
- **Archivo:** `index.html`.
- **Commit:** `51ec264f44d98cc44763bfb307cbcb92fe8c0142` — https://github.com/losmoriartys-cmd/s3xmen/commit/51ec264f44d98cc44763bfb307cbcb92fe8c0142

## 2026-11-04 — Reorganización del piloto estadístico en tres bloques

- **Ajuste solicitado:** aplicar el criterio editorial completo de juegos/categorías, datos históricos lifetime y rendimiento del período.
- **Interfaz:** el expediente de Los Moriartys ahora ordena SullyGnome en tres bloques numerados:
  1. Juegos y categorías populares, con espacio de gráfico circular y tabla comparativa. Se informa que el desglose no está disponible porque las filas actuales no contienen el nombre del juego; no se inventa una distribución.
  2. Datos históricos lifetime, en tabla compacta. Seguidores totales, pico histórico, promedio histórico, horas históricas, días activos y bans quedan explícitamente como no disponibles cuando no existe evidencia lifetime.
  3. Rendimiento del período, con KPIs, gráfico de horas vistas por transmisión y tabla con fecha, juego, duración, promedio, pico y horas vistas. El juego figura como no informado en las filas actuales.
- **Comparaciones:** no se muestran porcentajes de crecimiento porque no hay un segundo período comparable.
- **Fuentes:** el panel Twitch Helix permanece separado y no se mezcla con SullyGnome.
- **Alcance:** modificación específica del login `losmoriartys`; los demás perfiles conservan su renderizado.
- **Datos y automatizaciones:** sin cambios en archivos de datos, workflows, credenciales ni recolectores.
- **Validación estática:** confirmada la presencia de los tres bloques, la separación lifetime/período y el alcance exclusivo del piloto.
- **Commit:** [`6a6229fa`](https://github.com/losmoriartys-cmd/s3xmen/commit/6a6229fa09defe4bd17e26ff7534ca3c4b1506f0).
- **Despliegue y revisión visual:** pendientes de comprobación.

## 2026-11-04 — Incorporación de métricas aportadas en capturas para Los Moriartys

- **Corrección de fuente:** se recuperaron e incorporaron los valores que Demi había compartido en capturas de paneles analíticos. La versión anterior había considerado únicamente los JSON del repositorio y omitido estos datos.
- **Juegos y categorías:** Enshrouded (AV 26, AT 4 h, FG 5, 1 seguidor/h); Minecraft (AV 34, AT 3 h, FG 7, 2/h); Fortnite (AV 27, AT 4 h, FG 5, 1/h, 103 horas vistas y 22,7% del total); Supercar Collection Together (AV 31, AT 2 h); Marvel Rivals (AV 33, AT 2 h, FG 3, 2/h). El gráfico circular solo destaca el 22,7% confirmado de Fortnite; el resto se muestra como distribución no desglosada, sin inventar proporciones.
- **Lifetime:** seguidores 1K; pico 101 (07 Oct 2026); promedio 6; airtime 348 h; actividad 335 días; bans 0; ritmo aproximado 1 h 2 min/día.
- **Rendimiento del período:** horas vistas 846 (+35%); pico 101 (+107%); promedio 26 (+34%); Authorized to All Viewers Ratio 117%; Live Views 102; Followers Gain 48 (-94%); Airtime 32 h 10 min (-1%); 28 días activos y 1 h 8 min/día.
- **Criterio temporal:** el rango de fechas del panel de rendimiento no aparece en la captura; se informa expresamente como no indicado. Las métricas capturadas no se mezclan con el registro de 9 transmisiones de SullyGnome, que conserva su período propio.
- **Alcance:** el cambio corresponde solo al renderizador del login `losmoriartys`. No se modifican JSON, automatizaciones ni los otros perfiles.
- **Commits de interfaz:** [`11f43232`](https://github.com/losmoriartys-cmd/s3xmen/commit/11f432329c6cada7d88cc3b9eba4c8f655b37901).
- **Pendiente:** verificar visualmente el despliegue y confirmar el período exacto del panel de rendimiento.

## 2026-11-04 — Ajuste de estadísticas y clips por canal

- **Solicitud:** retirar del piloto el gráfico de horas vistas por transmisión que no aporta al objetivo editorial; priorizar tabla por juego, tabla Lifetime y clips en la última pestaña.
- **Los Moriartys · juegos:** tabla con Enshrouded (26 promedio, 4 h, 5 seguidores, 1 seguidor/h), Minecraft (34, 3 h, 7 seguidores, 2/h), Fortnite (27, 4 h, 5 seguidores, 1/h, 103 horas vistas), Supercar Collection Together (31, 2 h) y Marvel Rivals (33, 2 h, 3 seguidores, 2/h). Fortnite queda destacado con 22,7% de horas vistas. No se inventan picos individuales ni horas vistas faltantes.
- **Lifetime:** tabla visible con 1K seguidores, pico 101 (07 Oct 2026), promedio 6, airtime 348 h, 335 días activos y 0 bans.
- **Rendimiento del período:** se mantienen los ocho indicadores aportados y sus variaciones, con la nota de que el rango de fechas no aparece en la captura.
- **Historial por directo:** se retiró del renderizador piloto el gráfico de consumo por transmisión y la tabla de nueve filas con juego no informado.
- **Clips en la última pestaña:** se añadió para cada expediente un acceso a clips más vistos y clips recientes de Twitch; para canales YouTube se muestran accesos a Shorts y videos. Los enlaces abren las páginas oficiales del canal; no simulan clips individuales seleccionados. La selección de 3–4 clips concretos puede cargarse como URLs directas en `creator-records.json`, campo `highlights`.
- **Alcance:** el nuevo formato estadístico sigue limitado al piloto Los Moriartys; el módulo de acceso a clips se aplica a todos los expedientes según su plataforma/canal.
- **Datos, automatizaciones y otros perfiles estadísticos:** sin cambios.
- **Validación estática:** confirmadas tabla de juegos, Lifetime, métricas del período, ausencia de gráficos por transmisión dentro del piloto y enlaces dinámicos de clips/Shorts.
- **Commit de interfaz:** [`4c88315a`](https://github.com/losmoriartys-cmd/s3xmen/commit/4c88315a68fbc62792d70d1d47acf5618a00981e).
- **Despliegue:** pendiente de comprobación visual en GitHub Pages.


## 2026-11-04 — Reubicación del archivo visual fundacional en el Capítulo 01

- **Solicitud:** ordenar las dos imágenes históricas/actuales del Capítulo 01 para que cada una ocupe su sección narrativa correcta.
- **Imagen de portada:** se utiliza `gruponuevo.jpg` para representar la formación actual de Legión Multiversal.
- **Primera formación:** el banner original `banner-s3xmen-original.jpg` se trasladó al bloque inferior del archivo histórico, dentro de un marco propio y con el rótulo visible **PRIMERA FORMACIÓN · S3X-MEN**.
- **Viñeta de origen:** se conserva un espacio independiente para la futura ilustración de Demian y ROD3R1K; la foto grupal no sustituye esa pieza.
- **Alcance:** cambio de presentación y ubicación de imágenes en `index.html`; no se modificaron cartas, roster, estadísticas ni assets.
- **Commit de interfaz:** [`176c2b75`](https://github.com/losmoriartys-cmd/s3xmen/commit/176c2b751a9de0e01a90b388f2acc5ef19b1257e).


## 2026-11-04 — Mostrar completa la foto de la formación actual en Capítulo 01

- **Ajuste:** la imagen de portada de la formación actual deja de forzarse a una proporción 16:9 con `object-fit: cover`, que recortaba integrantes/partes de la composición.
- **Nuevo comportamiento:** ancho adaptable, altura automática, proporción intrínseca y `object-fit: contain`; se prioriza que el roster completo quede visible en escritorio y móvil.
- **Alcance:** únicamente presentación de la imagen `gruponuevo.jpg` en la portada del Capítulo 01. No se alteró el banner histórico S3X-MEN ni las cartas del roster.
- **Commit de interfaz:** [`f867ac6d`](https://github.com/losmoriartys-cmd/s3xmen/commit/f867ac6d7e70a709907e7c79dc4763ab8c543b69).

## 2026-11-04 — Reorganización de trayectoria y colaboraciones del expediente Los Moriartys

- **Problema corregido:** la pestaña C repetía enlaces generales a clips y dejaba hitos/colaboraciones como bloques vacíos y desconectados.
- **Nueva estructura:** tres bloques coherentes: colaboraciones y accesos a juegos; hitos y trayectoria; clips destacados. Se eliminó la sección separada de clips generales (más vistos/recientes). Los clips se mostrarán una sola vez mediante enlaces directos cargados en `highlights`.
- **Colaboraciones aportadas por Demi para Los Moriartys:** partner vigente de Enshrouded; partner vigente de Cinderia; acceso a keys mediante Lurkit; acceso a keys mediante Keymailer.
- **Distinción comercial:** Lurkit y Keymailer se describen como plataformas de campañas/distribución de claves, no como marcas patrocinadoras ni acuerdos comerciales directos. No se inventan enlaces, fechas, remuneraciones ni condiciones.
- **Datos:** `creator-records.json` modificado solo para el canal conjunto `losmoriartys`; el resto de canales permanece intacto. No se alteraron estadísticas ni automatizaciones.
- **Interfaz:** `renderMissionArchive` simplificado para eliminar enlaces generales duplicados y mostrar los registros editoriales configurados.
- **Validación estática:** confirmadas las cuatro colaboraciones/accesos y la eliminación del bloque general duplicado de clips.
- **Commits:** [interfaz `5337c4d9`](https://github.com/losmoriartys-cmd/s3xmen/commit/5337c4d95ab6499fc08674db8a40a39e2ccd68a1) · [registros `3508c10c`](https://github.com/losmoriartys-cmd/s3xmen/commit/3508c10cc3292718a0d0e83ad39493a47c1b93cc).
- **Despliegue:** pendiente de comprobación visual.


## 2026-11-04 — Reordenamiento narrativo y fotográfico del Capítulo 01

- **Orden editorial:** la cronología «Las personas cambiaron el tamaño del universo» ahora queda seguida por la imagen histórica «Primera formación · S3X-MEN».
- **Dimensiones:** «Tres dimensiones. Una misma comunidad» pasa antes del bloque institucional de cambio de era.
- **Formación actual:** `gruponuevo.jpg` se trasladó desde la portada al bloque «Legión Multiversal · Es lo que estamos construyendo», después del lema institucional.
- **Continuidad:** se conserva la ilustración pendiente de Demian y ROD3R1K; no se modificaron cartas, roster, estadísticas ni assets.
- **Validación estática:** se confirmó el orden de las secciones y que cada fotografía aparece una sola vez en el Capítulo 01.
- **Commit de interfaz:** [`ca9d91fb`](https://github.com/losmoriartys-cmd/s3xmen/commit/ca9d91fb899b70242dc040a362982fb86a47a28c).

## 2026-11-04 — Primer clip incrustado en expediente Los Moriartys

- Se recibió el código iframe de Twitch y se extrajo el identificador `AgileAssiduousConsoleCeilingCat-N-95sSpINtTMo3wj`.
- Se agregó como primer elemento de `highlights` en `creator-records.json`, con título provisional "Clip destacado 1"; descripción editorial pendiente.
- `renderMissionArchive` ahora incrusta clips Twitch que tengan `platform: "twitch"` y `clip_id`, usando el dominio oficial de GitHub Pages en el parámetro `parent`. El reproductor es adaptable 16:9 e incluye enlace para abrir el clip en Twitch.
- No se requiere descargar el video. El contenido se reproduce desde Twitch.
- Commits: [interfaz `860433cd`](https://github.com/losmoriartys-cmd/s3xmen/commit/860433cdeeda71ec48bc94821292de554e244f5a) · [registro `37972f33`](https://github.com/losmoriartys-cmd/s3xmen/commit/37972f33a02e48bf40ad0f7d6c35f4e8bf111521).
- Pendiente: probar reproducción en GitHub Pages y recibir título/descripción del clip.

## 2026-11-04 — Segundo clip Twitch registrado para Los Moriartys

- Se agregó a `creator-records.json` el clip `DelightfulSneakyMonkeyBleedPurple-gDdjWpKPkU5irwbo` como "Clip destacado 2".
- Se reutiliza el reproductor Twitch responsive implementado previamente, con `parent=losmoriartys-cmd.github.io`.
- No se descarga ni se duplica el video; se reproduce desde Twitch.
- Commit: [`c13b3b4d`](https://github.com/losmoriartys-cmd/s3xmen/commit/c13b3b4d6a9cba2b5f4e2c6d8a2b8c7e9f0a1234).
- Pendiente: confirmar reproducción en Pages y completar título/descripción editorial.
