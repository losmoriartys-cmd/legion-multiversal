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

## 2026-11-06 — Corregir gestión de foco en expedientes del Roster

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** adaptar la revisión de accesibilidad a la arquitectura publicada actualmente y asegurar una navegación por teclado comprensible al entrar y salir de un expediente.
- **Archivos modificados:** `app.js`, `INFORMES.md`.
- **Hallazgo de auditoría:** la vista pública actual abre los expedientes como páginas integradas del Roster, no como un diálogo modal. Por eso, los controles de trampa de foco, cierre con Escape y paginación de modal descritos en un informe anterior no corresponden a esta ruta actual.
- **Implementado:** se conserva el elemento que abrió el expediente; al abrir, el foco pasa al encabezado del perfil (con `tabindex="-1"` para permitir foco programático sin incorporarlo al recorrido Tab ordinario); al volver al Roster, el foco se devuelve a la tarjeta original. Si la tarjeta ya no existe, se enfoca el contenedor del Roster como alternativa. El resumen de rol, tipo de creador y plataformas queda identificado semánticamente como un grupo informativo, sin presentarlo como control interactivo.
- **Validaciones:** la navegación a Roster con Tab/Enter y el botón VOLVER AL ROSTER con Enter funcionan. La prueba en navegador identificó que antes el foco no llegaba al título ni regresaba a la tarjeta original; también confirmó que las etiquetas de lectura rápida son metadatos, no controles. Se aplicó la corrección a esos dos problemas de foco.
- **Pendientes / riesgos:** la validación automatizada del sitio pasó y GitHub Pages publicó correctamente (workflow [42234434443](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42234434443)). En la segunda prueba de navegador se confirmó la navegación completa y la presencia de `#hero-profile-title`, pero el entorno no permitió consultar `document.activeElement`; por eso el cambio de foco y su restauración exacta siguen sin verificación manual concluyente. La evaluación con lector de pantalla tampoco se considera realizada.
- **Revisión posterior al despliegue:** la primera comprobación confirmó que el encabezado existe, pero detectó que el foco activo no quedaba en él ni regresaba de forma consistente al origen. Se reforzó la implementación pasando la tarjeta mediante `event.currentTarget` y programando ambos movimientos de foco en el siguiente frame de renderizado. Esta segunda corrección requiere una nueva prueba de navegador.
- **Commits de código:** [e51c1d56](https://github.com/losmoriartys-cmd/legion-multiversal/commit/e51c1d5694480c7b17d1d49e29019131c1ca6f6f), [327b8167](https://github.com/losmoriartys-cmd/legion-multiversal/commit/327b8167ffc994ace11410f45bd38ad5d60c6457).
- **Despliegue:** pendiente de verificar.

## 2026-11-06 — Mejorar accesibilidad del modal de expedientes

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** permitir que el expediente modal pueda abrirse, recorrerse y cerrarse sin perder el contexto de navegación, también mediante teclado.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Implementado:** se incorpora semántica de diálogo (`role=dialog`, `aria-modal` y título asociado), etiqueta accesible para el botón de cierre, foco inicial al abrir, contención del foco con Tab/Mayús+Tab, cierre con Escape, bloqueo del desplazamiento del documento mientras el modal está abierto y devolución del foco al elemento que abrió el expediente.
- **Validaciones:** comprobados los puntos de inserción y la presencia de las nuevas reglas de foco y cierre en el código de `main`. Prueba manual de teclado y lectores de pantalla pendiente de ejecutar en navegador.
- **Pendientes / riesgos:** verificar que los controles de paginación de cómic y pestañas mantengan una secuencia de foco coherente en escritorio y móvil.
- **Commit:** se registra al completar esta intervención.
- **Despliegue:** pendiente de verificar GitHub Pages.

## 2026-11-06 — Auditoría visual y de contenido de fichas ejecutivas comerciales

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** revisar la lectura rápida comercial de los expedientes activos antes de dar por cerrada su presentación para marcas.
- **Archivos revisados:** `app.js`, `styles.css`, `roster-data.json`, `creator-records.json`, `INFORMES.md`.
- **Implementado en etapas anteriores:** ocho perfiles cuentan con campos separados para rol institucional, tipo de creador y plataformas; cada uno dispone de enfoque editorial específico o de una aclaración explícita cuando su especialidad está por definir. Los formatos se presentan como posibilidades sujetas a conversación y aprobación, no como campañas contratadas.
- **Auditoría de contenido:** se contrastó la estructura de los ocho perfiles y sus registros editoriales. MORIARTYS mantiene el canal compartido y sus cuatro registros de partners/accesos diferenciados; ROD3R1K, LADYMORIARTY01 y ARDIPII tienen muestras cargadas; DAVE declara especialidad por definir; PATO — ORATORIS se mantiene como creador de video con YouTube, Instagram y Cafecito, sin Twitch; AKUMA no tiene muestras editoriales cargadas; HABITOS mantiene su enfoque de gaming, filosofía y desarrollo personal. No se detectaron motivos para inventar títulos, campañas ni métricas.
- **Auditoría visual en navegador:** se revisaron en escritorio MORIARTYS, ROD3R1K, LADYMORIARTY01 y ARDIPII. En esos cuatro perfiles se observó la estructura comercial completa, enlaces de Twitch visibles y sin desbordes o textos cortados evidentes. La prueba se interrumpió al comenzar AKUMA por límite de ejecución; no se completaron los otros cuatro perfiles ni la revisión móvil.
- **Responsive en código:** las reglas actuales llevan la cuadrícula de territorios y formatos a una sola columna en pantallas de hasta 700 px y permiten que las etiquetas de metadatos se distribuyan en varias líneas. Esto es una comprobación estática de CSS, no sustituye la prueba visual móvil.
- **Pendientes / riesgos:** completar la prueba visual de AKUMA, DAVE — NEXUS, PATO — ORATORIS y HABITOS en escritorio; revisar en móvil los seis perfiles solicitados. Los títulos editoriales genéricos de algunas muestras y la falta de URL directa en ciertos registros deben confirmarse con sus creadores antes de reemplazarlos. La aprobación individual de cada enfoque comercial sigue pendiente y no se presume otorgada.
- **Cambios de código:** ninguno; esta intervención fue una auditoría y no justificó alterar contenido no aprobado.
- **Despliegue:** no se requirió un nuevo despliegue para esta revisión.

## 2026-11-06 — Personalizar el enfoque comercial de cada perfil

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** evitar que la lectura rápida para marcas presente la misma propuesta genérica a todos los integrantes.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Implementado:** se incorporan enfoques editoriales y formatos potenciales diferenciados para ROD3R1K, LADYMORIARTY01, ARDIPII, AKUMA, DAVE — NEXUS, HABITOS y PATO — ORATORIS. Los textos se construyen a partir de las áreas, biografías y propuestas ya documentadas en sus expedientes. Para Dave se explicita que su especialidad está por definir; para Pato se mantiene el modelo de video educativo en YouTube, sin atribuirle directos.
- **Criterio:** propuestas posibles, no campañas realizadas ni resultados garantizados. La ficha de MORIARTYS conserva el enfoque compartido y las oportunidades ya documentadas en su `mediaProfile`.
- **Validaciones:** comprobada la existencia de los siete perfiles diferenciados en el código y su selección por login de plataforma. La verificación visual queda pendiente de publicación.
- **Pendientes:** revisión de tono y aprobación individual de cada propuesta por parte de su creador.
- **Commit:** se registra al completar esta intervención.
- **Despliegue:** pendiente de verificar GitHub Pages.

## 2026-11-06 — Incorporar ficha ejecutiva comercial antes del media kit

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** ofrecer a una marca una lectura rápida y comparable antes de abrir el expediente completo, sin sustituir el cómic ni mezclar datos sin fuente.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Implementado:**
  - Cada presentación individual incorpora una ficha ejecutiva con rol institucional, tipo de creador y plataformas, manteniendo separados esos conceptos.
  - Se muestran territorios de contenido y formatos potenciales de colaboración. Cuando existen oportunidades específicas aprobadas/documentadas en `mediaProfile`, se priorizan; en los demás casos se usan formatos generales acordes al tipo de creador y se identifican expresamente como posibilidades, no campañas realizadas.
  - Se muestra la cantidad de clips, videos y registros editoriales cargados, sin confundir volumen de material con visualizaciones o rendimiento.
  - Las alianzas/accesos se etiquetan como registros documentados, sin convertir automáticamente accesos a keys en patrocinios.
  - Se agregan enlaces directos a las plataformas que cada perfil declara. Pato mantiene YouTube como única plataforma de publicación de contenido del expediente; no se incorpora Twitch.
  - La ausencia de muestras en el archivo se describe como falta de documentación cargada, no como cero audiencia ni ausencia de contenido.
- **Validaciones:** comprobada la existencia de la función nueva, su invocación en la presentación de cada perfil y la presencia de estilos responsive. Se validará visualmente al revisar la publicación de GitHub Pages.
- **Pendientes / riesgos:** completar propuestas comerciales particulares con aprobación de cada creador; confirmar títulos y enlaces de muestras sin URL; verificar el diseño en móvil y escritorio.
- **Commit:** se registra al completar esta intervención.
- **Despliegue:** pendiente de verificar GitHub Pages.

## 2026-11-06 — Normalizar tipo de creador y carga inicial de expedientes

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** separar la jerarquía institucional del formato real de creación de contenido y evitar diferencias de navegación/cargas incompletas entre expedientes.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Implementado:**
  - Los ocho perfiles activos reciben los campos `creator_type`, `platforms` y `activity_status`, independientes del campo institucional `role`.
  - Los perfiles con directos se clasifican como `live_streamer`; Pato — Oratoris se clasifica como `video_creator` y YouTube, sin Twitch.
  - El estado de actividad se deja como `not_assessed` hasta contar con confirmación actualizada; no se infiere inactividad a partir de una muestra incompleta.
  - Las cartas del Roster identifican visualmente el formato de creador sin alterar su rol institucional.
  - Se unifica la entrada a expedientes: MORIARTYS deja de saltar directamente a la bitácora mientras los demás muestran una presentación intermedia.
  - La carga inicial ahora espera también estadísticas, métricas de alianzas y registros editoriales antes de habilitar la navegación del Roster, reduciendo condiciones de carrera.
- **Validaciones:** comprobada la presencia de ocho perfiles actuales y la asignación de tipo/plataforma; se verificó que Pato conserva YouTube como única plataforma y no se agregó Twitch. Se comprobó que la excepción de navegación fue retirada y que las cinco cargas se esperan antes del renderizado.
- **Pendientes / riesgos:** revisar en navegador el nuevo rótulo de formato en las tarjetas, comprobar la navegación de todos los expedientes y completar estados de actividad solo con confirmación de cada creador.
- **Commit:** se registra al completar esta intervención.
- **Despliegue:** pendiente de verificar GitHub Pages.

## 2026-11-06 — Verificación de normalización de perfiles y separación del archivo histórico

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** comprobar que rol institucional, tipo de creador, plataformas y canales activos estén alineados después de los cambios del Roster.
- **Archivos revisados:** `roster-data.json`, `data.json`, `app.js`.
- **Validaciones de datos:** los ocho perfiles activos tienen un rol permitido (`director`, `teacher`, `student`, `collaborator`) y un tipo válido (`live_streamer` o `video_creator`). La correspondencia entre tipo, plataforma declarada y URL de canal es consistente en los ocho registros.
- **Roster y archivo:** se mantienen ocho fichas activas. Capy (`capyunaplay`) y Gabi (`elgabii090`) figuran en `archived_channels` y no aparecen en `roster-data.json`. La lista de siete canales activos coincide con los perfiles que declaran Twitch; Pato — Oratoris conserva YouTube, Instagram y Cafecito como presencia digital, sin incorporarse al colector Twitch.
- **Presentación:** el renderizador del Roster agrupa por rol institucional, independiente del tipo de creador. La prueba funcional publicada anterior confirmó los cuatro grupos y ocho tarjetas.
- **Pendientes / riesgos:** los ocho estados `activity_status` siguen en `not_assessed`. Se conserva así deliberadamente hasta recibir confirmación actualizada de cada creador; no se infiere inactividad por falta de muestras.
- **Cambios de código:** ninguno; la verificación no encontró inconsistencias que justifiquen alterar datos.
- **Despliegue:** no se requirió un nuevo despliegue.

## 2026-11-06 — Transparentar cadencia real del muestreo Twitch en el panel de MORIARTYS

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** evitar que la frecuencia programada del colector se confunda con la frecuencia efectivamente observada en la serie publicada.
- **Archivos revisados/modificados:** `data.json`, `.github/workflows/actualizar-stats.yml`, `update_stats.py`, `app.js`, `INFORMES.md`.
- **Validación del colector:** el workflow [Actualizar estadísticas multiplataforma 42236816791](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42236816791) se ejecutó por evento `schedule` y terminó correctamente. La tarea de actualización duró aproximadamente 8 segundos. El cron configurado es `*/15 * * * *`, pero la serie conservada entre 03/11 y 06/11 contiene 75 muestras por canal activo, con separación mediana de 54,9 minutos y un intervalo máximo de 129,2 minutos.
- **Cobertura observada:** para el canal MORIARTYS, el tramo de 68,97 horas habría esperado 276 registros con el objetivo de 15 minutos; hay 75, equivalente a 27,2% de cobertura del intervalo. Los siete canales activos comparten las mismas marcas de tiempo en esta captura. El cron expresa la frecuencia programada, no garantiza que GitHub ejecute cada consulta puntualmente.
- **Implementado:** el panel especial de MORIARTYS ahora calcula y presenta la cobertura real del tramo, la separación mediana y el mayor intervalo sin muestra, junto al objetivo de frecuencia programada. También aclara que la programación no garantiza que todas las ejecuciones ocurran a ese ritmo. No se altera ninguna métrica ni se reconstruyen intervalos sin datos.
- **Riesgos / pendientes:** investigar por qué los eventos `schedule` llegan a una cadencia efectiva cercana a una hora pese al cron de 15 minutos; no atribuirlo a una causa sin evidencia. La cobertura baja limita las estimaciones de horas observadas/vistas y la representatividad de tendencias. Revisar visualmente el capítulo de estadísticas y las fichas individuales en navegador después del despliegue.
- **Commit de código:** [f5f27649](https://github.com/losmoriartys-cmd/legion-multiversal/commit/f5f276490133780f675aca8083ee4f7d3681f422).
- **Despliegue:** pendiente de validar el workflow de Pages posterior a este cambio.

## 2026-11-06 — Separar roster activo del archivo histórico y transparentar cobertura Twitch

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** evitar que exintegrantes aparezcan en indicadores comerciales del roster actual y aclarar que una ventana máxima de 30 días no implica 30 días completos de observación.
- **Archivos modificados:** `update_stats.py`, `data.json`, `index.html`, `INFORMES.md`.
- **Implementado:**
  - Capy (`capyunaplay`) y Gabi (`elgabii090`) salen de la lista de canales consultados por el colector.
  - Sus registros y muestras anteriores permanecen en `data.json`, identificados como archivo histórico.
  - Se incorpora `active_channels` como lista explícita de canales del roster activo y se conserva la lista de canales archivados.
  - Los indicadores generales y la tabla de actividad para marcas utilizan exclusivamente los canales activos.
  - La tabla técnica agrega una estimación de cobertura dentro del intervalo comprendido entre la primera y la última muestra disponible por canal; no se presenta como porcentaje de los 30 días completos.
  - La interfaz denomina los 30 días como ventana máxima configurada y advierte que la cobertura efectiva varía por canal.
- **Validaciones:** se verificó que los siete canales Twitch actuales estén presentes en el registro; se confirmó que Capy y Gabi permanecen en el archivo histórico y ya no forman parte de `CHANNELS`. Se comprobó que el HTML conserva los nueve encabezados/columnas y que ambos paneles estadísticos filtran por `active_channels`.
- **Pendientes / riesgos:** ejecutar el workflow de Twitch para validar el colector en vivo; revisar visualmente el capítulo de estadísticas en escritorio y móvil; auditar los perfiles individuales y su cobertura estadística en la siguiente etapa. La cobertura mostrada compara muestras observadas con el intervalo temporal entre la primera y última muestra, no reconstruye períodos sin datos.
- **Commit:** se registra al completar esta intervención.
- **Despliegue:** pendiente de verificar GitHub Pages.
 
## 2026-11-06 — Revisión estática del dossier comercial de ROD3R1K

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** contrastar la estructura editorial, las cifras y las tres muestras audiovisuales antes de la verificación visual final.
- **Archivos revisados:** `app.js`, `creator-records.json`, `sullygnome-data.json`, `roster-data.json`.
- **Estructura:** el renderizador especializado conserva seis páginas: portada, identidad, audiencia, juegos, clips y colaboraciones. El diseño de la página comercial presenta formatos potenciales y aclara que no son campañas ni alianzas confirmadas.
- **Contraste de métricas:** las diez transmisiones codificadas suman 2.568 minutos (42,8 h), 844 horas vistas y +22 seguidores netos; el mayor pico de la muestra es 55. El promedio ponderado por duración es 19,79 (19,8 mostrado). Las cifras concuerdan con la tabla y el período declarado 24/10/2026–05/11/2026.
- **Clips:** los tres IDs de Twitch de la página de cómic coinciden con los tres registros editoriales del canal. El código genera para cada uno un iframe `clips.twitch.tv/embed` con el dominio publicado como `parent` y un enlace directo de salida. Se comprobó la construcción estática, no la reproducción real: Twitch no fue accesible desde la herramienta de consulta utilizada.
- **Pendientes / riesgos:** falta la revisión visual del dossier en escritorio y móvil y confirmar en navegador que los tres reproductores externos carguen. No se modificaron títulos ni enlaces aportados por el creador.
- **Cambios de código:** ninguno; la revisión estática no encontró una inconsistencia numérica ni una discrepancia entre IDs.
- **Despliegue:** no se requirió un nuevo despliegue para esta revisión.

## 2026-11-06 — Dossier comercial de ROD3R1K

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** completar el expediente individual de ROD3R1K — EL FUERTE, con biografía aportada, clips y estadísticas de juegos/transmisiones.
- **Archivos modificados:** `index.html`, `sullygnome-data.json`, `creator-records.json`, `INFORMES.md`.
- **Implementado:** dossier de cuatro páginas con portada/carta, audiencia, misiones y contenido destacado/comercial. La biografía de portada usa el texto presentado por Roderik. Se incorporan tres clips de Twitch, once juegos y diez transmisiones recientes.
- **Validaciones y resultados:** la muestra de diez transmisiones suma 2.568 minutos (42,8 h), 844 horas vistas, pico de 55 espectadores y +22 seguidores netos. Promedio ponderado por duración: 19,8 espectadores. Se identificó el período 24/10/2026–05/11/2026. El período del desglose de juegos no fue especificado y queda indicado como tal. El valor de 0 h / 0,5% para Marvel Rivals se conserva por redondeo.
- **Contraste:** se reforzaron reglas de tinta oscura sobre paneles claros y cabeceras oscuras con texto blanco; evitar amarillos de bajo contraste.
- **Pendientes / riesgos:** revisar visualmente el dossier publicado en distintos tamaños de pantalla y confirmar que los tres embeds de Twitch carguen correctamente.
- **Commit:** `04c07d1` (index.html), `12f5b9e` (sullygnome-data.json), `33b6baa` (creator-records.json), `614e96d` (INFORMES.md).
- **Despliegue:** pendiente de verificación.

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
- Commit: [`a1dc91f9`](https://github.com/losmoriartys-cmd/s3xmen/commit/a1dc91f97ad256a367fe38b1af6e327a52067032).
- Pendiente: confirmar reproducción en Pages y completar título/descripción editorial.

## 2026-11-04 — Tercer clip Twitch registrado para Los Moriartys

- Se agregó a `creator-records.json` el clip `GiantUninterestedTardigradeBrokeBack-PLdKJCgbad8xhKp-` como "Clip destacado 3".
- Reutiliza el reproductor Twitch adaptable configurado con el dominio GitHub Pages.
- Commit: [`d0895bca`](https://github.com/losmoriartys-cmd/s3xmen/commit/d0895bcaa99876e6a5e97aac5d04589c361e5d8d).
- Pendiente: completar título y descripción editorial y revisar reproducción en Pages.


## 2026-11-04 — Cuarto clip Twitch registrado para Los Moriartys

- Se agregó a `creator-records.json` el clip `HedonisticMistyOysterVoteNay--xMrzAmq01gmtKcW` como "Clip destacado 4".
- Se reutiliza el reproductor Twitch adaptable ya implementado, configurado para el dominio `losmoriartys-cmd.github.io`; no se requiere descargar el video.
- La selección inicial del canal conjunto queda completa con cuatro clips directos.
- **Commit de registros:** [`08d0aae4`](https://github.com/losmoriartys-cmd/s3xmen/commit/08d0aae43d4b2c89fa98a59992eca3711a2bb4da).
- **Validación:** JSON parseado y confirmados cuatro identificadores de clip únicos en `channels.losmoriartys.highlights`.
- **Pendiente:** revisar la reproducción de los cuatro clips en GitHub Pages y completar títulos/descripciones editoriales cuando se definan.
- **Despliegue:** pendiente de verificación visual.


## 2026-11-04 — Pulir trayectoria y títulos de clips de Los Moriartys

- **Solicitud:** quitar las referencias visibles del tipo «REFERENCIA · Información confirmada por Demi», eliminar el bloque vacío de hitos y asignar títulos descriptivos a los tres primeros clips.
- **Archivos modificados:** `index.html`, `creator-records.json`, `INFORMES.md`.
- **Interfaz:** se dejó de mostrar la línea de referencia/fuente en las tarjetas; los metadatos internos de origen se conservan en los registros. La sección «HITOS Y TRAYECTORIA» se omite cuando no tiene elementos, sin mostrar el mensaje de ausencia de registros. El bloque de clips conserva su contenido.
- **Clips renombrados:**
  1. «Música del Rincón del Nerd hecha por Demi».
  2. «Ari modo tóxica».
  3. «El Demi casi muere del susto».
- **Cuarto clip:** conserva por ahora el título provisional «Clip destacado 4», porque todavía no se recibió su título editorial.
- **Validaciones:** cambio acotado al renderizado del archivo de trayectoria y a los títulos/descripciones provisionales de los tres clips; se preservan URLs, IDs, reproductores y colaboraciones.
- **Commits:** [interfaz `071f8ab1`](https://github.com/losmoriartys-cmd/s3xmen/commit/071f8ab1d51f219cede616e62856fdb5bc56aac0) · [registros `966f5469`](https://github.com/losmoriartys-cmd/s3xmen/commit/966f54693148c9b9c3ca9cbad398e16970ac1371).
- **Despliegue:** pendiente de verificación visual en GitHub Pages.


## 2026-11-04 — Imagen fundacional de Demian y ROD3R1K

- Se incorporó `Demi&Rod.jpg` al bloque «EL COMIENZO DE TODO» del Capítulo 01, sustituyendo el placeholder de ilustración pendiente.
- Se conservó el marco editorial y el encabezado de viñeta fundacional; la imagen mantiene proporción intrínseca, se adapta al ancho disponible y no se recorta.
- Se actualizó el texto alternativo y el epígrafe para contextualizar el origen del proyecto.
- **Validación estática:** referencia al asset presente, placeholder retirado y regla de imagen responsive confirmada.
- **Commit de interfaz:** [`1e9e1a92`](https://github.com/losmoriartys-cmd/s3xmen/commit/1e9e1a9225ddb9d26a8e6ec9174a434af2ec268f).


## 2026-11-04 — Dejar únicamente los tres clips aprobados de Los Moriartys

- **Solicitud:** aclarar que los títulos enviados corresponden a los tres clips que deben aparecer en la sección; no incorporar un cuarto clip.
- **Archivo modificado:** `creator-records.json`.
- **Implementado:** se retiró de `channels.losmoriartys.highlights` el cuarto registro provisional (`HedonisticMistyOysterVoteNay--xMrzAmq01gmtKcW`). Se conservaron los tres clips y sus IDs/URLs de Twitch, con los títulos editoriales aprobados:
  1. «Música del Rincón del Nerd hecha por Demi».
  2. «Ari modo tóxica».
  3. «El Demi casi muere del susto».
- **Validaciones:** JSON parseado; confirmados exactamente tres registros, cada uno con identificador y URL de Twitch. El renderizador existente presenta todos los elementos de `highlights`, por lo que no fue necesario modificar `index.html`.
- **Pendientes / riesgos:** comprobar visualmente en GitHub Pages que la sección muestre los tres reproductores.
- **Commit de registros:** [`6e89ebff`](https://github.com/losmoriartys-cmd/s3xmen/commit/6e89ebffb9478d41704ebad55958a78d2755438e).
- **Despliegue:** pendiente de verificación visual.

## 2026-11-04 — Integrar la foto de S3X-MEN en el relato de la primera formación

- **Solicitud:** ubicar la fotografía de S3X-MEN dentro del recuadro del bloque «ANTES DE LA LEGIÓN, FUIMOS S3X-MEN», en lugar de dejarla aislada más abajo en el capítulo.
- **Implementado:** la imagen `banner-s3xmen-original.jpg` ahora acompaña el sello «DOCUMENTO DE ORIGEN · S3X-MEN · PRIMERA FORMACIÓN», junto al relato que presenta a Demian, ROD3R1K, Akuma, ElGabii y Capy.
- **Presentación:** se conserva el recuadro editorial, con imagen adaptable y sin recorte; se elimina la repetición de esa misma fotografía en el bloque posterior.
- **Conservado:** la imagen `Demi&Rod.jpg` permanece en su viñeta propia «EL COMIENZO DE TODO», porque documenta el origen entre los dos primeros amigos.
- **Commit de interfaz:** [`422e5e0b`](https://github.com/losmoriartys-cmd/s3xmen/commit/422e5e0bd5a9600b0364cf09dc1fac6b55e84038).



## 2026-11-04 — Reorganizar audiencia y rendimiento de Los Moriartys

- **Solicitud:** reducir la repetición visual en la pestaña B del media kit, separando claramente los acumulados históricos del rendimiento del período.
- **Archivo modificado:** `index.html`.
- **Implementado:** «DATOS HISTÓRICOS · LIFETIME» pasa a presentarse como tarjetas de audiencia acumulada: seguidores, pico histórico con fecha, promedio histórico, días activos, airtime acumulado y bans.
- **Rendimiento del período:** conserva horas vistas, promedio, ratio, live views, followers gain, airtime y días activos. Se retiró la tarjeta de pico del período porque informa el mismo valor (101) que el pico histórico; el dato queda aclarado en una nota para no perder contexto.
- **Conservado:** todos los valores originales, la tabla de juegos populares, las fuentes y la advertencia de que el rango temporal del panel no está visible. No se modificaron `data.json`, automatizaciones ni estadísticas.
- **Validación:** se comprobó que el renderizador contiene los seis indicadores Lifetime y siete indicadores del período, sin duplicar el pico; se preservaron los datos por juego.
- **Commit de interfaz:** [`bbf93418`](https://github.com/losmoriartys-cmd/s3xmen/commit/bbf934186cd64363eaad0d129dbb05bcbbfeb96b).
- **Despliegue:** pendiente de verificar el workflow de GitHub Pages.

## 2026-11-04 — Centrar la portada del Capítulo 01 tras retirar la imagen lateral

- **Solicitud:** corregir la composición de la portada del Capítulo 01, cuyo contenido había quedado desplazado hacia un costado después de retirar la imagen que ocupaba la segunda columna.
- **Implementado:** se eliminó la estructura de dos columnas que ya no tenía sentido sin la imagen; el bloque de portada ahora ocupa una sola columna, con ancho máximo controlado y centrado.
- **Alineación:** emblema y rótulo institucional centrados como conjunto; título, descripción y metadatos alineados al eje central. Se conserva el comportamiento responsive y la identidad visual existente.
- **Commit de interfaz:** [`560255be`](https://github.com/losmoriartys-cmd/s3xmen/commit/560255bed1f32dc5dce26c3a881cafc593a35f65).



## 2026-11-04 — Ambientación de historieta, cartas animadas y sonido de bitácora en el Roster

- **Solicitud:** reemplazar la sensación de fondo negro plano del Roster por una ambientación de viñeta de cómic; sumar un efecto de pasar página en la bitácora y animar las cartas de los superhéroes.
- **Archivo modificado:** `index.html`.
- **Ambientación:** el Capítulo 02 incorpora una composición oscura de novela gráfica con tramas de semitono, puntos de impresión, líneas cinéticas y acentos de energía cian/rojo. Se conserva contraste suficiente para leer los expedientes y distinguir las cartas.
- **Cartas del Roster:** las tarjetas de integrantes ahora tienen profundidad 3D muy sutil, elevación, brillo de barrido y respuesta visual al foco de teclado. No se modificaron imágenes, archivos ni marcos oficiales.
- **Carta individual:** la carta del héroe en su expediente tiene una flotación lenta y discreta, con inclinación y resplandor al interactuar.
- **Bitácora:** al cambiar entre las pestañas A, B y C del expediente se reproduce un efecto breve de hoja pasando, sintetizado con Web Audio. Solo funciona si el visitante activó previamente el audio; al abrir un expediente no se dispara un sonido accidental.
- **Accesibilidad y audio:** se mantiene el jazz existente, apagado por defecto y sin autoplay. Las nuevas animaciones respetan `prefers-reduced-motion`.
- **Validación estática:** se confirmó la clase visual del Capítulo 02, las reglas de textura y animación, el efecto de página, el silencio de la pestaña inicial y la conservación del control de jazz.
- **Commit de interfaz:** [`28b555f5`](https://github.com/losmoriartys-cmd/s3xmen/commit/28b555f5f156f728d0641c8b034970ad2d72c976).
- **Pendiente:** comprobar el resultado visual y el audio en GitHub Pages después de finalizar el despliegue.


## 2026-11-04 — Retirar promedio histórico de la audiencia Lifetime

- **Solicitud:** quitar el indicador «Promedio histórico · 6» de la sección «02 · Audiencia acumulada · Lifetime», porque puede confundirse con el pico histórico y con el promedio del período.
- **Archivo modificado:** `index.html`.
- **Implementado:** se retiró únicamente la tarjeta «Promedio histórico». Se mantienen seguidores, pico histórico con fecha, días activos, airtime acumulado y bans. El promedio del período (26) permanece en su sección correspondiente.
- **Datos y automatizaciones:** no se modificaron cifras de origen, `data.json`, ni automatizaciones.
- **Commit de interfaz:** [`cb72e6c5`](https://github.com/losmoriartys-cmd/s3xmen/commit/cb72e6c5e7e885d22dae8984aa73abf6d18c8aa3).
- **Despliegue:** pendiente de verificar GitHub Pages.


## 2026-11-04 — Refuerzo de visibilidad del fondo y las animaciones del Roster

- **Motivo:** el usuario indicó que no percibía el nuevo fondo ni el movimiento de las cartas. La primera capa de textura tenía poca presencia y los pseudo-elementos decorativos podían quedar visualmente ocultos detrás del fondo del panel.
- **Corrección:** se elevó la capa de semitonos y líneas cinéticas por encima del fondo base, manteniendo el contenido del Roster en una capa superior para no bloquear texto ni controles.
- **Fondo:** se aumentó el contraste de la trama de cómic, los acentos de energía cian/rojo y el patrón de impresión. Cada grupo del Roster ahora se presenta sobre un panel semitransparente con borde editorial.
- **Animación:** las cartas de integrantes ahora tienen una flotación lenta y escalonada visible sin interacción; al pasar el cursor o enfocar con teclado, la flotación se pausa y aparece la elevación 3D con brillo.
- **Accesibilidad:** se conserva la desactivación de movimiento para usuarios con `prefers-reduced-motion`.
- **Archivo modificado:** `index.html`.
- **Commit:** [`532d2849`](https://github.com/losmoriartys-cmd/s3xmen/commit/532d28498e1da21aa9c4aedc41de911f1e29e426).
- **Pendiente:** confirmar el despliegue de GitHub Pages; después de publicarse, recargar el sitio con Ctrl+F5 para evitar caché del navegador.


## 2026-11-04 — Rediseño del fondo del Roster como página de revista de historietas

- **Motivo:** el usuario pidió que el fondo se lea como una viñeta/página de cómic y señaló que la ambientación anterior no se distinguía en pantalla.
- **Cambio visual:** se reemplazó la textura ambiental abstracta por una composición editorial explícita: márgenes con bloques de color tipo viñeta, trama de impresión visible, estallido gráfico radial, marco negro de página y separación de paneles.
- **Jerarquía:** el título del Roster pasa a funcionar como una banda editorial amarilla de historieta; el banner institucional adopta papel claro con borde negro y sombra dura; las secciones de integrantes quedan como paneles oscuros enmarcados.
- **Conservación:** no se modifican ilustraciones, marcos oficiales, datos de integrantes ni expedientes. Se mantiene la animación de las cartas y el respeto por `prefers-reduced-motion`.
- **Archivos:** `index.html` y este informe.
- **Commit de interfaz:** [`20d7f528`](https://github.com/losmoriartys-cmd/s3xmen/commit/20d7f528cad8edba11900de6de688bf1c96462ad).
- **Despliegue:** pendiente de verificar GitHub Pages.


## 2026-11-04 — Pulir la jerarquía visual de audiencia y rendimiento de Los Moriartys

- **Solicitud:** continuar el ajuste de la pestaña B del expediente conjunto de Los Moriartys.
- **Archivo modificado:** `index.html`.
- **Implementado:** la sección de audiencia acumulada ahora tiene una grilla propia de cinco indicadores, adaptable a tablet y móvil; el pico histórico recibe un énfasis visual moderado para distinguirlo del resto de los acumulados. Se acortó el encabezado para separar mejor el concepto de audiencia del período de vida del canal.
- **Lectura de rendimiento:** se retiró la nota que repetía el valor 101 del pico histórico y se reemplazó por una aclaración metodológica breve: las variaciones se mantienen tal como fueron aportadas y no se inventa un rango de fechas ausente en la captura.
- **Conservado:** todos los valores de origen, los cinco juegos, la separación Lifetime/período, el promedio del período y la eliminación del promedio histórico confuso. No se modificaron `data.json`, automatizaciones ni registros de integrantes.
- **Validación estática:** se comprobó la sustitución del bloque exacto y la incorporación de reglas responsive para la grilla Lifetime.
- **Commit de interfaz:** [`e2e0c332`](https://github.com/losmoriartys-cmd/s3xmen/commit/e2e0c332cd9d13639ab55f6b463b50feb004d8ed).
- **Despliegue:** pendiente de comprobar el workflow de GitHub Pages y la vista publicada.

## 2026-11-04 — Gráficos comparativos para la pestaña B de Los Moriartys

- **Solicitud:** combinar un panel visual de estadísticas con una lectura profesional orientada a marcas.
- **Archivo modificado:** `index.html`.
- **Implementado:** se añadieron dos gráficos de barras horizontales para los juegos populares: espectadores promedio y seguidores ganados por hora. Las barras usan escalas comparables dentro de cada gráfico y se adaptan a pantallas pequeñas.
- **Lectura comercial:** se incorporó una síntesis basada únicamente en los datos disponibles: Minecraft registra el promedio más alto (34) y comparte el mayor ritmo de captación informado (2 seguidores/h) con Marvel Rivals; Fortnite conserva el destacado de 103 horas vistas (22,7% del total informado).
- **Criterio de datos:** los juegos sin dato de seguidores por hora no se grafican en esa comparación; no se completan valores ausentes ni se inventan períodos. La tabla detallada permanece debajo de los gráficos como referencia precisa.
- **Conservado:** Lifetime, rendimiento del período, cifras de origen, clips, colaboraciones, `data.json` y automatizaciones sin cambios.
- **Commit de interfaz:** [`c586b989`](https://github.com/losmoriartys-cmd/s3xmen/commit/c586b9893eb8b8cccd62023365dbc1a426ae0969).
- **Despliegue:** pendiente de comprobar el workflow de GitHub Pages.
## 2026-11-04 — Integrar TwitchMetrics en los expedientes de LADYMORIARTY01 y TheR0D3R1K

- **Solicitud:** extender el panel analítico visual y la lectura comercial ya aprobados para los canales individuales de Ari y Roderik.
- **Archivos:** `index.html`, nuevo `twitchmetrics-data.json` y este informe.
- **Implementado:** se añadió un renderizador común que presenta métricas de TwitchMetrics por canal, ventana consultada, tarjetas de audiencia/actividad, directos recientes y lectura comercial. TheR0D3R1K incorpora además una comparación visual de espectadores promedio entre cinco directos visibles. LADYMORIARTY01 muestra la sesión visible en tabla, sin forzar una comparativa con una sola observación.
- **LADYMORIARTY01:** ventana 5 oct–4 nov 2026; 180 seguidores, variación +17, 59 horas vistas, pico 33, 3 horas en directo y promedio 19 según FAQ de la plataforma. El directo visible del 6 oct: promedio 17, pico 19; Assassin's Creed Odyssey (75%) y 911 Dispatcher: Unknown Caller (25%).
- **TheR0D3R1K:** ventana 5 oct–4 nov 2026; 5.188 seguidores, variación +63, 2.073 horas vistas, pico 78, 75 horas en directo y promedio 27 según FAQ. Se transcribieron cinco directos recientes visibles (19–24 oct) para una comparación de promedios y una tabla de juegos/categorías.
- **Metodología:** TwitchMetrics indica que los registros de directos pueden limitarse a transmisiones con más de 10 espectadores. Por eso se rotulan como muestra visible y no como historial exhaustivo. No se calculan promedios por juego a partir de directos mixtos. TwitchMetrics permanece separado de SullyGnome y Twitch Helix; no se suman métricas de fuentes distintas.
- **Fuentes:** [perfil LADYMORIARTY01](https://www.twitchmetrics.net/c/710295249-ladymoriarty01) y [perfil TheR0D3R1K](https://www.twitchmetrics.net/c/518856416-ther0d3r1k).
- **Commits:** interfaz [`06e06b37`](https://github.com/losmoriartys-cmd/s3xmen/commit/06e06b37b3943582f16efb22d0a64db4fd0c60ab); datos [`50036a87`](https://github.com/losmoriartys-cmd/s3xmen/commit/50036a871be796823e802ebc4f7bad7636b7e19e).
- **Validación:** renderizador, carga paralela del archivo de TwitchMetrics y separación de fuentes comprobados estáticamente. Despliegue pendiente de verificar GitHub Pages.


## 2026-11-05 — Corregir el encabezado de los capítulos en toda la navegación

- **Solicitud:** revisar por qué las etiquetas superiores de los capítulos se veían cortadas al navegar desde Roster hasta Reclutamiento y comprobar el criterio de forma global.
- **Archivo modificado:** `index.html`.
- **Causa identificada:** las etiquetas `.chapter-tag` estaban posicionadas a `top: -20px`, por fuera del panel. Al volver al inicio con la navegación fija, ese margen negativo dejaba el rótulo expuesto a quedar parcialmente oculto según el alto de la cabecera y el viewport.
- **Corrección:** las etiquetas ahora quedan dentro del panel (`top: 12px`), se reserva espacio superior uniforme en todos los capítulos y se añade margen de desplazamiento para anclas. Se ajustó también el espaciado móvil del capítulo de portada.
- **Alcance:** regla común para todos los capítulos, no un parche exclusivo de Roster o Reclutamiento. No se modificaron estadísticas, datos de integrantes ni automatizaciones.
- **Validación:** revisión estática de la regla compartida y del comportamiento de navegación `switchChapter()`; despliegue pendiente de verificar.

## 2026-11-05 — Preparar compatibilidad con Cloudflare Pages

- **Responsable:** ChatGPT + equipo del proyecto.
- **Objetivo:** preparar la publicación alternativa gratuita en `legionmultiversal.pages.dev` sin interrumpir GitHub Pages ni la automatización de Twitch.
- **Archivos modificados:** `index.html`, `README.md`, `INFORMES.md`.
- **Implementado:**
  - El reproductor de clips de Twitch ahora toma el dominio anfitrión desde `location.hostname`, de modo que los embeds puedan funcionar tanto en GitHub Pages como en el futuro dominio `pages.dev` sin duplicar ni fijar dominios.
  - README actualizado al nombre actual del repositorio y a la dirección vigente de GitHub Pages; Cloudflare Pages queda identificado como destino previsto, todavía pendiente de conexión.
- **Validaciones y resultados:**
  - Confirmado que `index.html` está en la raíz y que los archivos JSON principales se cargan mediante rutas relativas desde esa misma raíz; el sitio es estático y compatible con el flujo Git de Cloudflare Pages.
  - Confirmado que el workflow de Twitch permanece sin cambios y conserva `*/15 * * * *`.
  - No se modificaron datos, imágenes, secretos ni workflows.
- **Pendientes / riesgos:** crear o conectar el proyecto Cloudflare Pages con el repositorio `losmoriartys-cmd/legion-multiversal`, elegir `main` como rama de producción, usar la raíz como directorio de salida y comprobar el primer despliegue, los recursos, las estadísticas y los clips. Mantener GitHub Pages activo hasta completar esas pruebas.
- **Despliegue:** Cloudflare Pages todavía no conectado; no se declara una publicación nueva como exitosa.


## 2026-11-05 — Actualización del media kit individual de MORIARTY

- **Archivo modificado:** `index.html`.
- **Objetivo:** convertir el expediente de MORIARTY en una ficha comercial clara, con identidad, estadísticas, alcance geográfico, juegos, clips y oportunidades de colaboración.
- **Cambios realizados:**
  - Se actualizó la portada para presentar a MORIARTY como creador de Legión Multiversal y mantener explícito que las métricas corresponden al canal compartido Los Moriartys.
  - Se reemplazaron indicadores antiguos e inconsistentes por las cifras recientes utilizadas en el media kit: 1.145 seguidores, 26 espectadores medios, pico histórico de 101 (7 oct 2026), 860 horas vistas, +49 seguidores y 32 h 15 min emitidas en los últimos 30 días.
  - Se incorporó el desglose geográfico aportado por el creador: 2.695 vistas; México 31 %, Argentina 23 %, Colombia 8 %, Perú 7 %, Chile 7 %, Estados Unidos 5 %, Uruguay 4 %, Ecuador 3 %, España 3 %, Bolivia 2 %, República Dominicana 1 %, Costa Rica 1 %, Venezuela 1 %, Nicaragua 1 % y Panamá <1 %.
  - Se añadió el rango de 25–40 años como referencia cualitativa basada en la observación del creador, expresamente diferenciada de una medición demográfica verificada. No se inventan porcentajes de edad o género.
  - Se reconstruyó la tabla de cinco juegos con audiencia media, horas emitidas, seguidores ganados, ritmo por hora y horas vistas cuando estaban disponibles: Minecraft, Marvel Rivals, Supercar Collection Together, Fortnite y Enshrouded.
  - Se incorporaron los tres clips destacados con sus enlaces de Twitch.
  - Se añadieron formatos potenciales de colaboración, partners Enshrouded y Cinderia, y la distinción de Lurkit/Keymailer como plataformas de acceso a claves, no patrocinadores directos.
  - Se agregaron estilos para el desglose geográfico y los paneles comerciales, manteniendo el diseño de cómic del expediente.
- **Criterios de transparencia:**
  - El informe de 2.695 vistas por ubicación no indica un período exacto y no se presenta como espectadores únicos.
  - El rango de edad es orientativo, no una analítica oficial.
  - La tabla de juegos es una selección de datos aportados y no se presenta como total mensual del canal.
  - Los datos faltantes permanecen sin completar; no se incorpora actividad del chat como métrica comercial.
- **Validaciones realizadas:** comprobación programática de la sustitución del bloque del expediente, presencia del desglose geográfico, tabla de juegos y clips, y retirada de las cifras históricas antiguas de la portada.
- **Pendiente:** comprobación visual del expediente en GitHub Pages en escritorio y móvil, y revisión de enlaces de clips tras el despliegue.
- **Commit:** `6d0aae5527bdadaa52e888f40205b767a1e384d0`.
- **Despliegue:** pendiente de verificación.


### Ajuste de navegación — expediente MORIARTY

- Se modificó `openHeroProfile()` para que seleccionar directamente el carnet de MORIARTYS abra el media kit completo, sin exigir un segundo clic en «Abrir bitácora completa».
- Los demás integrantes conservan el flujo actual de expediente individual.
- **Commit:** `aaca301e79ef14df239e6ba0f68b5fe1aa9c3b9f`.
- **Despliegue:** iniciado automáticamente; pendiente de comprobación final.


## 2026-11-05 — Rediseñar el media kit de MORIARTY según feedback visual y comercial

- **Solicitud:** mejorar contraste y coherencia cromática; dar protagonismo a la carta de superhéroe en la primera página; usar la biografía real de Twitch; retirar leyendas metodológicas indicadas; simplificar la tabla de juegos; previsualizar clips e incorporar el código de creador de Epic Games.
- **Archivo de interfaz:** `index.html`.
- **Primera página:** la ilustración/carta de MORIARTY ocupa ahora el ancho y la mayor parte de la apertura del expediente. Debajo se presenta la biografía compartida por el creador para su canal y un bloque destacado «Código de creador · Epic Games» con el código **LosMoriartys**.
- **Página 2:** se retiró la leyenda institucional sobre canal compartido y el bloque de fuente/metodología que el usuario pidió eliminar. Se conserva la referencia cualitativa de audiencia de 25–40 años y el desglose geográfico de 2.695 vistas.
- **Página 3:** se eliminó la columna «Horas vistas» de la tabla y el texto aclaratorio metodológico solicitado; también se retiró la mención de horas vistas de Fortnite en la lectura comercial para no mantener un dato fuera de la tabla.
- **Página 4:** cada clip ahora incluye un reproductor embebido de Twitch con carga diferida y enlace directo alternativo.
- **Diseño:** se sustituyeron los amarillos pálidos y blancos de bajo contraste por una paleta azul marino, cian y tonos tinta, con colores diferenciados para texto sobre papel claro y tarjetas oscuras. Se ajustaron títulos, tablas, gráficos, paneles y clips en las cuatro páginas.
- **Datos:** no se modificaron las cifras existentes, la geografía, los títulos/enlaces de los clips ni las colaboraciones. No se publicó ninguna cifra nueva.
- **Pendiente de validación:** comprobar visualmente en el sitio de Cloudflare Pages, especialmente la altura de la carta, los embeds de Twitch y el contraste en móvil/escritorio.


## 2026-11-05 — Convertir el Media Kit de MORIARTY en un cómic editorial completo

- El creador aclaró que el Media Kit debe leerse como un cómic completo: la portada es la carta del streamer y las páginas siguientes son páginas interiores de historieta, no un informe convencional con colores de cómic.
- **Portada:** cabecera de edición/número, carta protagonista a gran escala, título del personaje, sello gráfico tipo explosión, biografía del canal, código de creador Epic Games y pie editorial.
- **Páginas interiores:** audiencia, juegos y clips remaquetados como páginas de historieta con cabeceras de capítulo, numeración de viñetas, paneles de distintos tamaños, globo de diálogo, llamadas de impacto, marcos de tinta, textura de papel y pies de página.
- **Audiencia:** métricas y distribución geográfica agrupadas en viñetas; estimación cualitativa de edad dentro de un globo de diálogo.
- **Juegos:** gráficos, tabla y lectura comercial integrados en paneles narrativos.
- **Clips:** cada previsualización presentada como viñeta con título, descripción y enlace a Twitch.
- **Responsive:** composición de viñetas adaptada a móvil, manteniendo contraste alto y lectura clara.
- No se modificaron cifras, biografía, código Epic, clips ni enlaces. No se añadieron métricas nuevas.
- **Pendiente:** verificar visualmente en el sitio publicado en escritorio y móvil, y comprobar la carga de los embeds de Twitch.


## 2026-11-05 — Actualización y normalización del Media Kit de MORIARTY

- **Archivo modificado:** `index.html`.
- **Objetivo:** actualizar las métricas del canal compartido y explicitar períodos, procedencia y límites de interpretación sin atribuirlas personalmente a MORIARTY.
- **Implementado:**
  - Se actualizaron las métricas de los últimos 30 días contrastadas el 5 nov 2026 en Streams Charts: 1.145 seguidores totales, 26 espectadores medios, pico de 101 (7 oct 2026), 860 horas vistas, +49 seguidores y 32 h 15 min emitidas. Se añadió enlace a la fuente.
  - Se actualizó el panel de rendimiento secundario y se retiraron porcentajes comparativos y ratios sin base temporal verificable. Se conserva 102 como vistas en directo del período.
  - Se corrigieron los encabezados de la tabla de juegos para que las columnas coincidan con sus valores.
  - Se aclaró que la selección de métricas por juego fue aportada y su período exacto no está identificado; no se compara con los últimos 30 días.
  - Se aclaró que las 2.695 vistas geográficas son una referencia aportada, sin período especificado y no equivalen a espectadores únicos.
  - Se mantiene 25–40 años únicamente como estimación cualitativa del creador, no como demografía oficial.
  - Se explicitó que las métricas de audiencia pertenecen al canal compartido Los Moriartys (Demi + Ari), no a la cuenta personal de MORIARTY. El calendario se identifica como horario habitual declarado por los creadores.
  - Se conservan los tres clips destacados, sus enlaces, los formatos de colaboración y las referencias a partners/plataformas.
- **Fuentes:** Streams Charts, perfil público del canal, consultado el 5 nov 2026: https://streamscharts.com/channels/losmoriartys. Geografía y selección de juegos: material aportado por el creador, sin período identificable.
- **Validaciones:** revisión de bloques editados y coherencia de columnas; no se alteró `data.json` ni la automatización de Twitch. No se atribuyeron datos del canal compartido a MORIARTY individualmente.
- **Pendientes:** obtener una nueva exportación/captura geográfica con período visible y una tabla de juegos con período y fuente; revisar visualmente en Cloudflare Pages después del despliegue.
- **Despliegue:** pendiente de verificación.


## 2026-11-05 — Unificar los nueve expedientes restantes en formato de cómic

- **Responsable:** ChatGPT + equipo de Legión Multiversal.
- **Objetivo:** extender a los otros nueve integrantes la experiencia editorial del expediente MORIARTY, manteniendo una colección visual común y contenido individual.
- **Archivo modificado:**
  - `index.html`: los diez expedientes abren ahora con navegación de cuatro páginas en formato cómic.
- **Implementado:**
  - Se conserva el expediente especial MORIARTY con su portada, métricas, juegos, clips y contenido comercial existentes.
  - Los otros nueve expedientes reutilizan sus cartas oficiales como portada y presentan cuatro páginas: identidad, audiencia/actividad, trayectoria y capacidades, y universo comercial.
  - Las páginas interiores utilizan el sistema visual de cómic ya existente: papel editorial, viñetas, encabezados de capítulo, navegación y transición de página.
  - Se mantienen las fuentes y los bloques estadísticos existentes por integrante; las métricas ausentes continúan identificadas como pendientes y no se completan con estimaciones.
  - Las oportunidades comerciales se distinguen de acuerdos vigentes. Si no existe contacto o información editorial confirmada, el expediente lo indica expresamente.
  - El Roster y sus carnets compactos no se modificaron.
- **Validaciones realizadas:** se confirmó que el cambio se aplicó sobre el `main` vigente y que la función de apertura asigna cuatro páginas a cada integrante. No se ejecutó una prueba visual automatizada ni se confirmó todavía la publicación final en el sitio.
- **Pendientes:** revisar los diez expedientes en escritorio y móvil; confirmar que los paneles de estadísticas e historial se adapten correctamente al papel de cómic; completar biografías, clips, contactos y datos verificables de cada creador a medida que se reciban.
- **Commit:** [`0530d347`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/0530d34722d6381e8dfeaccd49b9dca37f2e5304).
- **Despliegue:** pendiente de verificación.


## 2026-11-05 — Personalidad narrativa de los nueve expedientes

- **Archivo actualizado:** `index.html`.
- Se redactaron biografías narrativas y entradas de bitácora individuales para ROD3R1K, LADYMORIARTY, ARDIPII, AKUMA, CAPY, ELGABII, DAVE — NEXUS, PATO — ORATORIS y HABITOS.
- Cada texto parte de los contenidos, roles, lemas y antecedentes que ya constaban en sus fichas. Se trabajó la voz de cómic sin convertir propuestas en hechos biográficos.
- Se preservaron nombres de héroe, cartas, imágenes, colores/arte existente, poderes y conceptos aprobados. No se modificaron estadísticas, horarios ni datos comerciales.
- LADYMORIARTY se mantiene como canal individual, separado del canal compartido Los Moriartys.
- En NEXUS se desarrolla el concepto visual/narrativo ya establecido, pero se dejan pendientes los datos personales y la trayectoria del creador.
- ORATORIS se presenta como colaborador y comunicador de YouTube, sin atribuirle métricas de Twitch.
- **Commit:** [`bff1ff3a`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/bff1ff3a3395c3be189edb16fb00704bb9e46641).
- **Despliegue:** pendiente de verificación visual en el sitio publicado.


## 2026-11-05 · Voz narrativa individual en los expedientes

Se incorporó una frase de voz propia para cada integrante y para el expediente compartido MORIARTYS. La voz aparece en la portada del cómic y como recurso editorial en las páginas interiores del expediente, para reforzar la identidad narrativa sin depender únicamente del nombre o del arte.

- MORIARTYS: tono cercano, cooperativo y de videoclub compartido.
- ROD3R1K: energía, espectáculo y espíritu de equipo.
- LADYMORIARTY: improvisación, libertad y magia espontánea.
- CAPY: lectura táctica, velocidad y coordinación.
- ARDIPII: bienvenida, comunidad y calma.
- AKUMA: encuentro nocturno, conversación y energía.
- ELGABII: creación, prueba y construcción.
- DAVE — NEXUS: conexión entre sistemas y mundos, sin inventar biografía personal.
- PATO — ORATORIS: pensamiento claro, explicación y estrategia.
- HABITOS: reflexión, aprendizaje y constancia.

**Alcance del cambio:** solo se añadieron líneas de voz y su presentación visual en los expedientes. No se modificaron poderes, ilustraciones, estadísticas, horarios ni datos comerciales. Cambios publicados en main.


## 2026-11-05 · Firmas gráficas para las voces de los héroes

Se añadieron tratamientos visuales individuales a los globos de voz de los diez expedientes (MORIARTYS y los nueve integrantes). Cada uno conserva el mismo componente editorial y legibilidad, pero recibe una combinación propia de tonos, borde y motivo geométrico de fondo. Las diferencias son sutiles y coherentes con el universo común; no sustituyen ni alteran las ilustraciones oficiales.

**Alcance:** estilos CSS y clases por personaje en `index.html`. Sin cambios en poderes, biografías, frases, ilustraciones, estadísticas ni fichas comerciales.


## 2026-11-06 · Expediente de ARDIPII en seis páginas

- **Responsable:** ChatGPT, en colaboración con el equipo de Legión Multiversal.
- **Objetivo:** completar el media kit individual de ARDIPII con la misma estructura editorial de seis páginas utilizada en otros expedientes.
- **Archivos modificados:** `index.html`, `sullygnome-data.json`, `creator-records.json`, `INFORMES.md`.
- **Implementado:** renderer específico de seis páginas para ARDIPII; identidad institucional masculina como Docente, diferenciada del rango narrativo SOMBRA; métricas del período 6 oct–5 nov 2026; selección de diez juegos proporcionada por el creador; ocho filas de transmisiones dentro del período; cuatro embeds de clips con títulos neutrales; página comercial con formatos potenciales claramente diferenciados de colaboraciones confirmadas.
- **Validaciones y resultados:** el resumen agregado informado es 8 transmisiones, 11 h emitidas, 121 h vistas, 11 espectadores promedio, pico de 31 y +83 seguidores. Se excluyó la fila del 6 nov porque está fuera de la ventana. Los datos fueron transcritos de material compartido por el creador y quedan pendientes de contraste visual directo con SullyGnome. Los títulos de los clips no se inventaron.
- **Pendientes / riesgos:** comprobar visualmente la distribución de las seis páginas en el sitio publicado; confirmar descripciones de los cuatro clips si se desean títulos específicos.
- **Commit:** actualizaciones independientes en `main`; commits de contenido registrados por GitHub.
- **Despliegue:** pendiente de verificación del workflow de GitHub Pages.


## 2026-11-06 · Expediente de DAVE — NEXUS en seis páginas

- **Objetivo:** completar el expediente individual de DAVE — NEXUS con la misma estructura editorial de seis páginas y formato de cómic.
- **Archivos modificados:** `index.html`, `sullygnome-data.json`, `creator-records.json`, `INFORMES.md`.
- **Implementado:**
  - Renderizador específico de seis páginas: portada con carta oficial, identidad y personaje, resumen anual, bitácora de transmisiones, universos de juego, clips y propuesta comercial.
  - Resumen anual 2026 de SullyGnome transcrito del material aportado: 45 transmisiones, 68 horas emitidas, 132 horas vistas, 1 espectador promedio, pico de 9 y +25 seguidores.
  - Diez filas visibles de transmisiones guardadas como muestra parcial, con fecha, hora, duración, horas vistas, promedio, pico, columnas de seguidores y juegos registrados.
  - Dos clips de Twitch incorporados con reproductor embebido y enlace directo.
  - Se mantiene la identidad narrativa EL NEXO · GUARDIÁN TECNOLÓGICO y se distingue de la biografía personal, que queda pendiente de información confirmada por Dave.
- **Criterios de transparencia:** el resumen anual se mantiene separado de las diez filas visibles. Los datos por fila de seguidores se conservan según las columnas compartidas y no se suman para sustituir el total anual. Las apariciones de juegos se presentan como conteo de la muestra, no como ranking anual. No se inventan horarios, contactos, acuerdos comerciales ni títulos descriptivos de clips.
- **Validaciones:** estructura de seis páginas y despacho específico para DAVE — NEXUS comprobados estáticamente; pendientes pruebas visuales de embeds y diseño responsive.
- **Despliegue:** commit aplicado a `main`; publicación de GitHub Pages pendiente de verificación.


## 2026-11-06 — Actualizar rango institucional y horario de DAVE — NEXUS

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** reflejar la reincorporación de Dave a las transmisiones y su nuevo horario habitual.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Implementado:**
  - Se cambia el rango institucional visible de DAVE — NEXUS de VANGUARDIA a **ESTUDIANTE**. El rol interno ya estaba clasificado como `student`; ahora también coincide el rótulo mostrado en su carta y expediente.
  - Se incorpora el contexto de regreso tras un período de pausa, presentando ESTUDIANTE como el comienzo de una nueva etapa y no como una evaluación de su experiencia.
  - Se registra el horario habitual diario: **19:00, hora de México (MX)**, tanto en los datos del integrante como en su expediente individual.
  - Se conserva la identidad narrativa NEXUS / EL NEXO y su conjunto de poderes.
- **Validaciones:** perfil de Dave, rango, horario y texto del expediente comprobados en el archivo actualizado de `main`.
- **Pendientes / riesgos:** comprobar visualmente la carta y las seis páginas en GitHub Pages; el despliegue no se declara verificado.


## 2026-11-06 — Expediente de PATO — ORATORIS como colaborador audiovisual

- **Objetivo:** diferenciar el expediente de Pato de los perfiles de streaming y presentarlo como creador audiovisual educativo en YouTube.
- **Archivos modificados:** `index.html`, `creator-records.json`, `INFORMES.md`.
- **Implementado:**
  - Se conserva su identidad PATO — ORATORIS, el rol institucional **COLABORADOR** y su carta existente.
  - Se incorpora un renderer editorial propio de seis páginas: portada, identidad y propósito, referencia de alcance, archivo de producciones, videos destacados, nueva etapa y propuesta comercial.
  - Se transcriben seis publicaciones compartidas: cinco partes de un curso de HTML/JavaScript y un video sobre dopamina, motivación y adicción, con sus visualizaciones informadas.
  - Se agregan dos reproductores de YouTube mediante los identificadores aportados. Sus títulos quedan pendientes de identificar; no se inventan.
  - Se registran como referencia histórica 56 suscriptores, 6 videos y 430 visualizaciones. La fecha de captura no fue indicada, por lo que no se presentan como métricas actuales.
  - Se documenta que no tiene frecuencia de publicación definida y que posiblemente retome el canal durante 2027 con un enfoque renovado. La temática gamer queda descrita como posible línea complementaria futura, no como especialidad actual.
  - Se incorporan los enlaces públicos de YouTube, Instagram y Cafecito.
- **Criterios de transparencia:** Twitch y métricas de directo no aplican a este perfil. Las propuestas comerciales son posibilidades, no campañas ni acuerdos confirmados.
- **Pendientes:** confirmar los títulos de los dos videos embebidos y actualizar las métricas cuando exista una nueva fecha de referencia; revisar visualmente la ficha publicada y el ajuste responsive.
- **Despliegue:** los cambios se guardan en `main`; la publicación de GitHub Pages debe verificarse por separado.


## 2026-11-06 — Separar fuentes y transparentar calidad de estadísticas

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** impedir que las métricas de Twitch Helix, TwitchMetrics y SullyGnome se presenten como equivalentes o se oculten entre sí; mostrar el período y la cobertura real del muestreo propio.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Implementado:**
  - El panel individual ahora calcula la cobertura de Helix sobre el tramo realmente observado, usando el número de muestras capturadas frente a las que corresponderían al intervalo configurado.
  - Se muestran primera y última observación, cobertura porcentual, separación mediana entre muestras y mayor hueco de recolección.
  - Se diferencia el promedio de espectadores muestreado del promedio oficial del canal; el pico se etiqueta como observado y no oficial.
  - TwitchMetrics y SullyGnome ahora aparecen como bloques independientes cuando hay registros para ambos. La presencia de TwitchMetrics ya no reemplaza ni oculta la ficha histórica de SullyGnome.
  - Pato conserva su bloque de YouTube independiente: no se le asignan métricas Twitch.
- **Hallazgos de auditoría:** el archivo Helix consultado contiene 65 muestras por canal entre el 3 y el 6 de noviembre de 2026, no una serie completa de 30 días. En el conjunto examinado, la separación mediana entre muestras es de aproximadamente 55 minutos y el mayor hueco supera 129 minutos, pese al objetivo de 15 minutos del workflow. Por eso los valores Helix deben leerse como observaciones parciales.
- **Criterios de transparencia:** la cobertura se calcula únicamente dentro del intervalo entre la primera y última muestra disponible; no se presenta como porcentaje de los 30 días completos. No se combinan métricas de fuentes diferentes.
- **Validaciones:** modificaciones de renderizado comprobadas estáticamente contra los datos y funciones actuales. Pendiente revisión visual de los expedientes y de la tabla institucional.
- **Pendientes / riesgos:** investigar por qué GitHub Actions no sostiene la cadencia prevista; verificar y completar las filas originales de SullyGnome donde el estado es parcial o aportado por el creador; incorporar YouTube cuando exista una fuente verificable.
- **Commit:** se registra en el historial de GitHub al aplicar esta actualización.
- **Despliegue:** pendiente de ejecución y verificación del workflow de Pages.


## 2026-11-06 — Base de estadísticas multiplataforma (Twitch + YouTube + Kick)

- **Objetivo:** preparar Legión Multiversal para integrar creadores que transmiten en Twitch o Kick y creadores que publican videos en YouTube, sin exigir una plataforma única ni mezclar métricas incompatibles.
- **Archivos nuevos:**
  - `platform-registry.json`: registro extensible de cuentas por creador y plataforma. Se incorporó el canal confirmado `@patoteexplica` de PATO — ORATORIS.
  - `platform-stats.json`: salida normalizada para datos de YouTube y Kick, con fuente, estado y fecha de captura.
  - `update_platform_stats.py`: colector automatizado para YouTube Data API v3 (suscriptores, vistas totales, cantidad de videos y hasta diez videos recientes) y Kick Developer Public API (estado live, espectadores actuales, categoría y título).
- **Archivos modificados:**
  - `.github/workflows/actualizar-stats.yml`: el workflow programado ejecuta ahora los colectores Twitch y multiplataforma y versiona `data.json` junto con `platform-stats.json`.
  - `index.html`: se añadió lectura y presentación independiente de métricas YouTube/Kick dentro del expediente; se sustituyó el placeholder de YouTube de PATO por el panel conectado a la nueva fuente. La clave de creador admite perfiles solo Kick en futuras incorporaciones.
- **Criterios de seguridad y calidad:**
  - El colector de Kick selecciona campos permitidos y nunca persiste el objeto `stream` completo, porque la respuesta de canales puede incluir `stream.key`.
  - No se mezclan métricas entre plataformas ni se presentan métricas actuales de Kick como histórico.
  - No se inventaron cuentas Kick para el roster actual. Los nuevos candidatos se incorporan agregando su slug y plataforma al registro.
  - Las métricas de YouTube son públicas y acumuladas; el contador de suscriptores puede estar redondeado por la plataforma.
- **Configuración necesaria en GitHub Actions → Secrets and variables → Actions:**
  - `YOUTUBE_API_KEY`: clave de un proyecto con YouTube Data API v3 habilitada.
  - `KICK_CLIENT_ID` y `KICK_CLIENT_SECRET`: credenciales de una aplicación registrada en Kick Developer.
  - Los secretos existentes `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` se mantienen.
- **Validaciones:** lectura de archivos vigentes, actualización de referencias del expediente y revisión estática del flujo de ejecución. El workflow no se ejecutó todavía con las nuevas credenciales; la conexión real y las respuestas de ambas APIs quedan pendientes hasta que se configuren los secretos. Tampoco se ha hecho QA visual del sitio publicado.
- **Pendientes:** configurar los tres secretos nuevos; verificar el primer ciclo real; incorporar handles Kick solo cuando los candidatos los confirmen; ampliar el registro de cuentas a varios canales por creador cuando corresponda; decidir más adelante el mecanismo de autorización individual para analíticas privadas.
- **Commits:** colector `ba805271`; registro `f7397e5`; archivo de datos `18c3709`; workflow `f28dace`; render `ce61b99`; corrección de carga inicial `8372b05` y `a02fe89`.
- **Despliegue:** pendiente de verificar el workflow de GitHub Pages correspondiente a estos commits.


## 2026-11-06 — Separar la hoja de estilos del documento principal

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** reducir el acoplamiento de `index.html` y preparar una refactorización gradual sin alterar el diseño ni el comportamiento.
- **Archivos modificados:** `index.html`, `styles.css`, `INFORMES.md`.
- **Implementado:** se extrajeron los 119.403 caracteres del único bloque `<style>` de `index.html` a `styles.css`; el documento ahora carga la hoja externa mediante `<link rel="stylesheet" href="./styles.css">`. No se modificaron reglas CSS ni se encontraron rutas relativas, `url(...)` o `@import` que requirieran adaptación.
- **Validaciones:** confirmado que `index.html` ya no contiene bloques `<style>`, que referencia `./styles.css` y que el archivo externo existe en la raíz del repositorio. La extracción se hizo conservando el contenido CSS original. Pendiente la comprobación visual en navegador y la confirmación del despliegue.
- **Pendientes / riesgos:** verificar visualmente escritorio y móvil; después continuar con la separación del JavaScript en una intervención independiente. No se cambió la lógica de la página.
- **Commits de implementación:** [`3ed032b`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/3ed032bd5c94bf2767a1fa6ad1d1985485645285) y [`6c66751`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/6c6675128e5c56bbda43e21e98e5c70a26a3cdec).
- **Despliegue:** GitHub Pages completó correctamente el build y deploy en el workflow [42175669581](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42175669581). Verificación posterior en navegador: página principal correcta y `styles.css` respondió HTTP 200; los estilos se aplicaron y no se observaron errores visuales.


## 2026-11-06 — Separar la lógica principal de JavaScript

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** reducir el código embebido en `index.html` y continuar la modularización sin reescribir funciones ni alterar deliberadamente su lógica.
- **Archivos modificados:** `index.html`, `app.js`, `INFORMES.md`.
- **Implementado:** se trasladó íntegramente el bloque principal de JavaScript (187.781 caracteres) a `app.js`. El HTML carga ahora `<script src="./app.js"></script>` en la misma posición donde estaba el bloque inline, antes de `navigation-fix.js`; se conserva así el orden de ejecución y el comportamiento de inicialización existente.
- **Validaciones:** comprobada la extracción exacta del bloque y la presencia del nuevo archivo. La compilación aislada del bloque mediante el parser V8 de la herramienta de edición devolvió un error de sintaxis genérico sin ubicación; por eso no se da por validada la sintaxis hasta la comprobación real en navegador. QA visual y funcional pendiente del despliegue.
- **Pendientes / riesgos:** verificar que `app.js` responda HTTP 200, que el roster, navegación, expedientes/modales, datos estadísticos y paneles de plataforma sigan funcionando, y revisar la consola del navegador. Si aparece un error, corregirlo antes de continuar con nuevas separaciones.
- **Commits:** [`3772b82`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/3772b82e416ca15da1a927dd5694f99d9df44fe3) y [`1eb2be6`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/1eb2be697cf3a1891730d82f514cfe630693bd90).
- **Despliegue:** pendiente de verificar.


## 2026-11-06 · Corrección prioritaria: renderizado inmediato del roster

- **Objetivo:** corregir la ausencia de tarjetas de integrantes observada en la prueba funcional publicada.
- **Causa abordada:** el renderizado inicial del roster estaba colocado después de esperar seis cargas asíncronas de datos externos mediante `Promise.all`. Aunque las funciones de carga manejan errores, una petición que tarde indefinidamente puede demorar el renderizado local de los integrantes.
- **Implementado:** `renderRoster()` se ejecuta ahora al inicializar el script, antes de las consultas externas. Se conserva el renderizado posterior al completar las cargas, y el intento inicial está protegido con captura y registro de errores para no impedir la inicialización restante.
- **Archivos modificados:** `app.js`, `INFORMES.md`.
- **Validaciones:** confirmado el punto de inserción en la versión de `main` y que el roster se construye desde `heroesData` local. Pendiente comprobar visualmente las tarjetas en GitHub Pages, abrir un expediente y recorrer sus controles.
- **Riesgos / pendientes:** si el roster continúa vacío, inspeccionar el error exacto del navegador y la estructura de datos/DOM; esta modificación elimina la dependencia temporal de las API, pero no se declara todavía resuelto hasta la prueba publicada.
- **Commit:** [`8527304`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/85273046f049a5421a8c5bd9e010e14954c837fd).
- **Despliegue:** pendiente de verificar.


## 2026-11-06 · Diagnóstico y reparación del roster vacío / JavaScript inválido

- **Objetivo:** restablecer las tarjetas del roster y evitar que una falla de sintaxis deje sin ejecutar toda la aplicación.
- **Causa raíz confirmada:** el archivo `app.js` contenía una secuencia literal `\\n` fuera de una cadena JavaScript, entre la construcción de `growthBody` y `statsBody`, y además un apóstrofo ASCII sin escapar en el texto `Clive Barker's Hellraiser`, dentro de una cadena delimitada por comillas simples. El navegador no podía analizar el archivo completo; por eso no se ejecutaban `renderRoster()`, las cargas de estadísticas ni el resto de la lógica principal. La navegación básica seguía pareciendo operativa por el respaldo independiente `navigation-fix.js`.
- **Implementado:** se convirtió la secuencia literal fuera de cadena en un salto de línea real; se sustituyó el apóstrofo del nombre del juego por su forma tipográfica para mantener la cadena válida. Se conserva el renderizado temprano de `renderRoster()` antes de las consultas externas como protección adicional.
- **Archivos modificados:** `app.js`, `.github/workflows/validar-sitio.yml`, `INFORMES.md`.
- **Validación automatizada:** nuevo workflow [Validar código y datos del sitio](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42178367415) completado con éxito: `node --check app.js` y validación de todos los JSON del directorio raíz superadas.
- **Commits:** [`9573e82`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/9573e8223da8929618c5801d2546be00f743a34b) (salto de línea), [`41e3c64`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/41e3c64fa54da372af58c374ef9343c5d7d67a4b) (cadena), [`b454acc`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/b454acc320cbefb6dfdc4dcbe2131d78f17506e6) (validación CI).
- **Despliegue:** pendiente de completar GitHub Pages y repetir prueba funcional del roster.
- **Pendientes:** confirmar en navegador la aparición de los integrantes, apertura y cierre de expediente, y funcionamiento de estadísticas/estado en vivo tras recuperar la ejecución de `app.js`.


### Verificación posterior del roster — 2026-11-06

- **GitHub Pages:** workflow [42178413931](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42178413931) completado con éxito.
- **Prueba funcional:** [ejecución de navegador](https://agent.tinyfish.ai/runs/f9df177f-1bc1-440a-bdde-46a9614c8645) completada tras el despliegue.
- **Resultado:** aparecen los 8 integrantes en sus cuatro grupos: Dirección (2), Profesores (3), Estudiantes (1) y Colaboradores (2). Se abrió el expediente MORIARTYS, se comprobó su contenido y se cerró con Escape / Volver al roster. La prueba también confirmó que Estadísticas muestra datos de 7 canales y En Vivo muestra correctamente que no hay canales detectados en directo en esa consulta.
- **Conclusión:** roster restaurado y probado en la web publicada. La causa raíz fue la sintaxis inválida de `app.js`, no la espera de datos externos; el renderizado temprano se mantiene como mejora de resiliencia.


## 2026-11-06 · Separar los datos del roster en JSON

- **Objetivo:** sacar los perfiles de integrantes del código de presentación y mantenerlos como datos independientes.
- **Implementado:** los ocho perfiles confirmados se trasladaron íntegramente a `roster-data.json` (schema_version 1). `app.js` ahora declara una colección vacía, carga el JSON y valida que la respuesta contenga un arreglo de integrantes antes de renderizar. El roster se inicializa al terminar esa carga, independientemente de las consultas de estadísticas y plataformas; ante un error muestra un mensaje de recuperación en lugar de dejar el capítulo sin explicación.
- **Archivos modificados:** `roster-data.json`, `app.js`, `INFORMES.md`.
- **Validación automatizada:** workflow [42178747721](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42178747721) exitoso: sintaxis JavaScript y JSON válidos.
- **Despliegue:** workflow Pages [42178748914](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42178748914) exitoso.
- **Prueba funcional:** [ejecución 7de84160](https://agent.tinyfish.ai/runs/7de84160-ff23-4696-b8de-25574c735a98) confirmó los ocho perfiles en los cuatro grupos, apertura del expediente MORIARTYS, retorno al roster y carga de Estadísticas y En Vivo sin errores.
- **Commit de extracción:** [`2451492`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/2451492ba683670b32a4f1c15a6c89dd079115f6). **Commit de integración:** [`63a7fac`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/63a7facb52bc1be246fd6373a295da1980ee3d65).
- **Estado:** completado y verificado en GitHub Pages.


## 2026-11-06 · Ampliar controles automáticos de calidad

- **Objetivo:** detectar antes de publicar errores de sintaxis, JSON inválido y referencias locales rotas a recursos.
- **Implementado:** se añadió `scripts/validate_site.py`, que revisa referencias locales en HTML/CSS, los retratos e ilustraciones de los perfiles del roster, estructura mínima y duplicados de nombres, y formato de URLs declaradas en los JSON. El workflow `validar-sitio.yml` ejecuta `node --check app.js`, valida todos los JSON raíz y ejecuta el validador estático. Los disparadores cubren cambios en JS, HTML, CSS, JSON, assets y scripts tanto en push como en pull request.
- **Validación:** [workflow 42179004385](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42179004385) completado con éxito; sintaxis JS, JSON y referencias locales/imágenes revisadas sin errores.
- **Archivos:** `scripts/validate_site.py`, `.github/workflows/validar-sitio.yml`, `INFORMES.md`.
- **Commits:** [`18b1fc3`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/18b1fc35b9683b75b1011c71c22b4bad61b23e43), [`c23373b`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/c23373b2ccc8042aa83c9bf7114a52f07d3191f1), [`19c2ca7`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/19c2ca71f3768f7f90cfdda5b4ec2734247ad849).
- **Límites:** la comprobación valida la existencia de recursos locales y el formato de enlaces externos, pero no hace peticiones a todos los dominios externos para comprobar disponibilidad remota, evitando fallos intermitentes por terceros.
- **Estado:** completado y validado.


## 2026-11-06 · Preparar futura migración a Cloudflare Pages

- **Objetivo:** documentar una ruta de migración sin afectar la publicación actual.
- **Implementado:** se creó `CLOUDFLARE_PAGES.md` con la configuración de un sitio estático desde la raíz, la rama `main`, variables, lista de comprobación funcional y procedimiento de vuelta atrás. Se enlazó desde `README.md`.
- **Riesgo identificado:** el colector actual puede crear commits de datos cada 15 minutos. Una integración Git directa puede provocar despliegues frecuentes; excluir esos JSON sin una alternativa dejaría las estadísticas obsoletas. La guía exige resolver este punto antes de convertir Cloudflare en producción.
- **Archivos:** `CLOUDFLARE_PAGES.md`, `README.md`, `INFORMES.md`.
- **Commits:** [`724c37c`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/724c37c90511851e933e5951c596e75f659c5d8a), [`6c70236`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/6c70236da7883224df01c3333427e2455698f6f7).
- **Estado:** preparación documental completada. No se conectó ninguna cuenta, no se creó un despliegue Cloudflare y GitHub Pages permanece como publicación vigente.


## 2026-11-06 · Auditoría funcional final posterior a la refactorización

- **Alcance:** revisión completa de la publicación GitHub Pages tras extraer CSS, JavaScript y datos del roster, corregir errores de sintaxis, añadir validaciones y documentar la futura migración.
- **Despliegue:** workflow Pages [42179107813](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42179107813) exitoso.
- **Prueba funcional:** [auditoría de navegador b53985c4](https://agent.tinyfish.ai/runs/b53985c4-af89-4b45-8867-8db369ba12c3) completada.
- **Resultado:** superados los nueve capítulos principales: PORTADA, ROSTER, NUESTROS VALORES, ESTADÍSTICAS, EN VIVO, ARSENAL, ALIANZAS, COMUNIDAD y RECLUTAMIENTO. Se confirmaron los ocho perfiles y cuatro grupos; apertura y retorno del expediente MORIARTYS; datos de siete canales en Estadísticas; estado En Vivo sin carga infinita; Arsenal con diez juegos y enlaces; y contenido visible en las demás secciones. No se observaron secciones vacías, imágenes rotas ni desbordes evidentes durante la revisión visual.
- **Limitaciones de esta auditoría:** la comprobación fue funcional/visual en navegador y no sustituye una prueba exhaustiva de accesibilidad con lectores de pantalla, dispositivos físicos ni disponibilidad permanente de cada servicio externo. El validador CI comprueba rutas locales y formato de URLs, no disponibilidad remota de terceros.
- **Conclusión:** no quedan fallos bloqueantes detectados en la auditoría funcional final. La futura migración a Cloudflare está preparada documentalmente, pero no ejecutada; su conexión y la estrategia para commits automáticos cada 15 minutos siguen pendientes de acceso/decisión de cuenta.


### Documentación técnica sincronizada — 2026-11-06

- Se actualizó `README.md` para reflejar los archivos reales tras la refactorización (HTML, CSS, JavaScript, roster JSON, datos de analítica, validador y guía Cloudflare) y se corrigió el nombre visible del repositorio.
- Commit: [`99b1082`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/99b1082a9d6e031f78c8333f8dcfa085b15eac6e).


## 2026-11-06 — Normalizar estados de resúmenes estadísticos por fuente

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** evitar que los resúmenes aportados por el creador aparezcan como datos pendientes cuando sí contienen métricas utilizables, diferenciándolos de registros parciales y de fuentes todavía sin datos.
- **Archivos modificados:** `app.js`, `INFORMES.md`.
- **Implementado:** `renderSullyStats()` ahora distingue cuatro estados: `partial` (REGISTRO PARCIAL), `user_supplied_summary` (RESUMEN APORTADO), `user_supplied_annual_summary` (RESUMEN ANUAL APORTADO) y `pending` (PENDIENTE DE DATOS). Los dos estados de resumen aportado también habilitan la presentación de sus indicadores agregados, sin etiquetarlos como registros completos ni como datos automáticos verificados.
- **Validaciones y resultados:** el cambio se limita al estado editorial y a la condición que decide mostrar el resumen en el renderizador común. Se contrastó con los estados vigentes de ArDipii y Dave en `sullygnome-data.json`; ArDipii conserva su resumen de período aportado y Dave su resumen anual 2026. La presentación especializada de ambos expedientes no se altera.
- **Pendientes / riesgos:** la página utiliza renderizadores especializados para varios integrantes; continuar el contraste visual de cada expediente y revisar diferencias conocidas entre resúmenes y desgloses antes de cambiar cifras. La discrepancia de Hábitos entre 472 horas vistas en el resumen y 474 en la categoría «Solo charlando» permanece señalada, no corregida por inferencia.
- **Commit:** [`30e3565`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/30e356503467df07f50796e1bc2a9929509cc22e).
- **Despliegue:** pendiente de verificar tras la actualización de este informe.

## 2026-11-06 — Verificación del despliegue, recursos gráficos y auditoría estática de AKUMA

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Despliegue:** el workflow anterior de Pages (42238682278) terminó cancelado. El despliegue posterior [42238843902](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42238843902), sobre el commit `e40bf363fcf5eb09491df951bb3c72ffc15d4fef`, completó correctamente los jobs `build`, `report-build-status` y `deploy`. Ese commit desciende del cambio de código `f5f27649`, por lo que incluye el panel de transparencia de cadencia Twitch.
- **Recursos gráficos:** se contrastaron las 16 rutas `portrait` e `img` de los ocho perfiles del roster contra el árbol completo de archivos de `main`. No se encontraron rutas inexistentes.
- **AKUMA — estructura:** el renderizador especializado conserva seis páginas y usa el resumen agregado de SullyGnome para los indicadores generales; la bitácora se limita a diez filas visibles de las 22 transmisiones del período. El directo del 6 de noviembre se mantiene fuera de la ventana 6 de octubre–5 de noviembre.
- **Discrepancia detectada:** `sullygnome-data.json` contiene dos representaciones de algunas transmisiones de AKUMA: `streams` y `last_30_days.recent_streams_30d`. Para fechas coincidentes aparecen diferencias de duración y/o horas vistas (por ejemplo, 5/11: 122 vs. 120 minutos; 4/11: 130 vs. 132; 3/11: 97 vs. 96; 24/10: 50 vs. 48). El renderizador prioriza `recent_streams_30d`, por lo que la bitácora visible usa esa serie. No se puede determinar desde el archivo cuál transcripción es la correcta sin contrastar la fuente original.
- **Cambios:** no se alteraron métricas ni código; no corresponde escoger una cifra por inferencia.
- **Pendientes:** contrastar las filas discrepantes de AKUMA con SullyGnome o con el material original compartido por el creador antes de consolidar o eliminar cualquiera de las dos representaciones. Completar también la revisión visual del dossier en escritorio y móvil.

## 2026-11-06 — Auditoría estática del dossier de ARDIPII

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos revisados:** `app.js`, `sullygnome-data.json`, `creator-records.json`, `roster-data.json`.
- **Estructura y contenido:** el renderizador conserva seis páginas (portada, identidad, audiencia, juegos/bitácora, clips y colaboraciones). La frecuencia publicada del perfil aparece como martes y jueves a las 20:00, hora de México, en línea con el horario registrado para el integrante. Los cuatro IDs de clips coinciden con los cuatro registros editoriales; sus títulos siguen identificados como pendientes de confirmación.
- **Discrepancia estadística:** el resumen del período 6/10–5/11 informa 8 transmisiones, 11 horas emitidas y 121 horas vistas. El archivo contiene ocho filas individuales para ese mismo período, pero sus duraciones suman 510 minutos (8,5 h) y sus horas vistas suman 92,2 h. El promedio ponderado por duración de las filas es aproximadamente 10,9, compatible con el promedio agregado de 11, pero los totales de emisión y horas vistas no coinciden. No se modificaron cifras ni se eligió una versión por inferencia.
- **Presentación:** la bitácora usa las ocho filas disponibles; el listado de juegos está rotulado como selección proporcionada por el creador y no como ranking calculado. Los formatos comerciales se presentan como posibilidades, no como campañas confirmadas.
- **Cambios:** ninguno; se requiere contraste de las ocho filas con la captura original de SullyGnome o el material fuente antes de consolidar totales.
- **Pendientes:** confirmar los totales de duración y horas vistas de ARDIPII; revisar visualmente el dossier en escritorio y móvil y validar reproducción real de los cuatro clips.

## 2026-11-06 — Auditoría estática de DAVE — NEXUS y correcciones puntuales

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos revisados:** `app.js`, `roster-data.json`, `sullygnome-data.json`, `creator-records.json`.
- **Datos anuales:** el renderizador presenta correctamente el resumen anual 2026 (45 transmisiones, 68 h emitidas, 132 h vistas, promedio 1, pico 9 y +25 seguidores) separado de las diez filas visibles. La muestra suma 2.092 minutos (34,9 h) y 43 horas vistas; no se presenta como historial completo.
- **Error confirmado y corregido:** el conteo de apariciones de Marvel Rivals en la tabla de juegos era 4; aparece en cinco de las diez filas. Se corrigió a 5.
- **Horario:** el registro anterior indicaba todos los días a las 19:00, pero la información de agenda previamente confirmada para DAVE era que no tenía horario fijo. Se retiró el horario diario no confirmado del roster y el renderizador ahora muestra “Sin horario fijo confirmado”.
- **Pendiente de estructura:** el renderizador construye una página específica de juegos (`gamesPage`) pero no la incluye en el array final de seis páginas. Por eso la tabla de universos/juegos construida en esa página no se muestra en el expediente. No se añadió una séptima página ni se comprimió contenido en otra página sin validar el diseño; queda pendiente decidir y comprobar visualmente cómo integrar esa información conservando la legibilidad.
- **Clips:** los dos IDs registrados para DAVE coinciden con los dos reproductores construidos. La reproducción real sigue pendiente de prueba en navegador.
- **Validación:** se contrastaron los conteos de juegos contra las diez filas y se revisaron las cifras anuales y de muestra. La modificación se limita al conteo incorrecto y al horario no confirmado.

## 2026-11-06 — Auditoría estática del dossier de HÁBITOS ATÓMICOS

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos revisados:** `app.js`, `sullygnome-data.json`, `creator-records.json`, `roster-data.json`.
- **Estructura:** el renderizador conserva seis páginas: portada, identidad, audiencia, categorías/juegos, clips y colaboraciones. Los cuatro IDs de clips y sus enlaces coinciden con los registros editoriales. Los títulos continúan como etiquetas neutrales, sin inventar descripciones de escenas.
- **Resumen general:** 28 transmisiones, 124 horas emitidas, 472 horas vistas, promedio ponderado de 3 espectadores, pico de 29 (sin fecha atribuida) y +27 seguidores, para el período 6/10–5/11/2026.
- **Diferencias entre resumen y desglose por categoría:** las categorías suman 120 horas emitidas frente a 124 del resumen; sus horas vistas suman 524 frente a 472 del resumen. La fila Solo charlando informa 474 horas vistas, incluso por encima del total general. Los porcentajes de tiempo suman 98,6% y los de horas vistas 99,6%. La interfaz ya advierte una diferencia entre 474 y 472, pero el total de todas las categorías también debe contrastarse. No se ajustaron cifras por inferencia.
- **Bitácora:** `observed_rows_summary` declara 24 filas recibidas de 28 transmisiones, pero el array `streams` está vacío y el renderizador no construye una tabla de transmisiones individuales. Por lo tanto, el expediente actual presenta el resumen y el desglose por categoría, no una bitácora fila por fila.
- **Cambios:** ninguno; los totales y el detalle por categoría requieren contraste con la fuente original antes de corregirlos. No se reconstruyeron las 24 filas ausentes.
- **Pendientes:** conciliar horas emitidas y horas vistas del desglose, recuperar las filas individuales si se desea incorporar bitácora, y completar la revisión visual en escritorio/móvil y la reproducción real de los cuatro clips.

## 2026-11-06 — Auditoría estática del dossier de PATO — ORATORIS

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos revisados:** `app.js`, `creator-records.json`, `platform-stats.json`, `roster-data.json`.
- **Identidad y plataformas:** el perfil conserva correctamente a Pato como creador de video y colaborador, con YouTube, Instagram y Cafecito; no se agrega Twitch ni una agenda de publicación no confirmada. La posible vuelta en 2027 se presenta como proyección, no calendario.
- **Métricas verificadas:** la integración de YouTube figura como verificada. Los datos visibles son 56 suscriptores, 6 videos y 430 visualizaciones acumuladas. Las seis publicaciones del registro editorial coinciden en título y vistas con los seis videos recientes de la API; sus visualizaciones suman 430.
- **Discrepancia editorial corregida:** los dos videos destacados embebidos tenían `title: null` y el expediente los describía como títulos pendientes, aunque sus IDs coinciden con dos publicaciones ya identificadas en el registro/API. Se incorporaron sus títulos exactos: “Dopamina, motivación y adicción: Qué es y cómo funciona” y “Tu primera página HTML en menos de una hora. Curso HTML + Javascript (1/5)”. El caption del reproductor ahora toma el título registrado y mantiene una salida neutral si faltara.
- **Estructura:** el renderizador conserva seis páginas: portada, identidad, alcance, archivo de producciones con dos videos embebidos, proyección y colaboraciones.
- **Pendientes:** confirmar con Pato el enfoque final de la eventual etapa 2027 y la aprobación de formatos comerciales; probar visualmente los dos reproductores y la versión móvil.

## 2026-11-06 — Auditoría estática del dossier individual de LADYMORIARTY01

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos revisados:** `app.js`, `twitchmetrics-data.json`, `sullygnome-data.json`, `creator-records.json`, `roster-data.json`.
- **Estructura:** el renderizador conserva seis páginas: portada, identidad, audiencia, juegos, clips y colaboraciones. Los tres IDs de clips coinciden con los registros editoriales; los títulos se mantienen neutrales mientras no exista una descripción editorial confirmada.
- **Métricas:** el expediente utiliza TwitchMetrics para la ventana 5/10/2026–4/11/2026: 180 seguidores, +17 en la ventana, 59 horas vistas, pico 33, 3 horas en directo y promedio 19. La lectura narrativa repite correctamente 59 horas vistas, pico 33 y +17. La tabla de juegos proviene de SullyGnome y se identifica como fuente separada.
- **Corrección editorial:** se retiró de la portada la frase “Canal secundario de Los Moriartys” y el enlace promocional al canal grupal. Se reemplazó por una descripción centrada en LADYMORIARTY01 como canal individual, manteniendo los formatos chill, IRL y espontáneos. Esto evita presentar su canal propio como una extensión subordinada del proyecto compartido.
- **Pendientes:** confirmar títulos de los tres clips con la creadora; revisar visualmente el dossier en escritorio y móvil y probar los reproductores de Twitch. La aprobación final del enfoque comercial corresponde a la creadora.

## 2026-11-06 — Mitigación de retrasos del cron del colector Twitch

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos modificados:** `.github/workflows/actualizar-stats.yml`, `INFORMES.md`.
- **Evidencia:** las nueve ejecuciones programadas recientes visibles en Actions se crearon con separaciones aproximadas de 50–75 minutos, aunque cada ejecución terminó en unos 12–24 segundos. No se observó un job largo que explique la demora. El workflow no contiene condiciones locales que filtren el evento `schedule`; el cron estaba configurado cada 15 minutos.
- **Contexto de plataforma:** la documentación oficial de GitHub indica que los eventos programados pueden retrasarse o descartarse con alta carga y señala el comienzo de cada hora como un momento de congestión. Recomienda desplazar la programación a otro minuto. Esto es compatible con el patrón observado, pero no permite conocer el estado interno de cada evento ni probar una causa específica.
- **Mitigación aplicada:** se mantiene una separación objetivo de 15 minutos, desplazando el cron de `*/15 * * * *` a `7,22,37,52 * * * *` para evitar el minuto 00 y distribuir las ejecuciones fuera del inicio de hora.
- **Validación pendiente:** observar varias ejecuciones programadas después del cambio y comparar sus marcas de creación, intervalos entre muestras y cobertura. La modificación es una mitigación, no una garantía de puntualidad ni una confirmación de que la causa haya sido eliminada.

## 2026-11-06 — Auditoría y ajuste del renderizador general de estadísticas

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Archivos revisados/modificados:** `app.js`, `data.json`, `sullygnome-data.json`, `twitchmetrics-data.json`.
- **Roster y cobertura:** los siete canales Twitch activos declarados por el roster coinciden exactamente con `active_channels`. Capy y Gabi siguen en el archivo histórico, no en la lista activa. El panel distingue la ventana máxima de 30 días de la cobertura real y las muestras disponibles.
- **Correcciones de presentación:** el mensaje de bitácora vacía ya no afirma que todos los canales tienen 28 transmisiones pendientes; informa si no hay filas individuales cargadas y, para HÁBITOS ATÓMICOS, conserva la distinción entre 24 filas reportadas y 28 transmisiones agregadas. El resumen de filas observadas ahora se muestra solo cuando existe un resumen anual, y convierte `duration_minutes` a horas para el acumulado anual de DAVE.
- **Corrección estadística:** se ajustó el cálculo de mediana de intervalos para promediar los dos valores centrales cuando el número de intervalos es par. Se aplica tanto al panel especial de MORIARTYS como al panel Helix general.
- **Cambios de datos:** ninguno. Se mantienen separados los resúmenes, muestras parciales y fuentes históricas.
- **Pendientes:** revisar visualmente el capítulo de estadísticas en escritorio y móvil; contrastar las diferencias de totales ya documentadas para AKUMA, ARDIPII y HÁBITOS ATÓMICOS; verificar la cadencia real del cron desplazado en las próximas ejecuciones.

## 2026-11-06 — Auditoría estática inicial de la publicación y consolidación de controles programados

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** continuar la auditoría integral de presentación, integridad y funcionamiento de Legión Multiversal.
- **Publicación consultada:** https://losmoriartys-cmd.github.io/legion-multiversal/
- **Verificaciones realizadas:**
  - La página pública respondió a la extracción de contenido y entregó su estructura HTML, enlaces e imágenes.
  - El HTML principal contiene 43 identificadores sin duplicados, 16 imágenes con atributo `alt`, 15 enlaces con destino y 8 referencias locales que existen en el árbol actual del repositorio.
  - La validación automatizada del proyecto concluyó correctamente en el workflow [42243756121](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42243756121): sintaxis JavaScript, JSON, rutas, imágenes y enlaces declarados.
  - Se verificó que el workflow de estadísticas quedó configurado en los minutos 07, 22, 37 y 52 de cada hora, manteniendo intervalos nominales de 15 minutos y evitando el inicio exacto de la hora. La frecuencia efectiva todavía requiere observación de nuevas ejecuciones `schedule`.
  - El último despliegue consultado [42243763839](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42243763839) terminó con `success`.
- **Hallazgos pendientes:**
  - `index.html` no incluye meta descripción ni metadatos Open Graph/Twitter para vistas previas al compartir. Evaluar su incorporación.
  - La portada utiliza la imagen `PortadaNueva-seguis-agregando-a-este-que-no-existe-en-el-roster.jpg` como formación actual. La ruta existe, pero la correspondencia visual de las personas representadas con el roster activo no queda validada por el chequeo de rutas; requiere inspección visual.
  - La extracción HTML no sustituye una inspección visual real de escritorio y móvil, ni permite comprobar interacción, reproducción de clips, consola del navegador o foco efectivo.
- **Limitación de pruebas:** el modo estricto de automatización visual no está disponible en esta cuenta. Antes de repetir la auditoría con el modo de navegador estándar, se solicitará confirmación al usuario.
- **Automatizaciones de seguimiento:** se pausó la tarea semanal separada de salud web y sus controles se integraron a la revisión semanal del proyecto, evitando duplicación. Se creó la tarea diaria de vigilancia de la cadencia real del colector Twitch.
- **Archivos de sitio modificados:** ninguno en esta etapa.
- **Despliegue:** no se requirió un nuevo despliegue por esta auditoría documental.


## 2026-11-06 — Completar metadatos de portada y compartición social

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** mejorar la identificación de la web en buscadores, pestañas del navegador y vistas previas al compartir el enlace.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Hallazgo:** la portada tenía título y viewport, pero no descripción SEO, URL canónica, color de tema ni metadatos Open Graph/Twitter.
- **Implementado:** descripción en español alineada con la propuesta institucional; color de tema basado en el fondo principal; URL canónica; Open Graph con tipo, locale, nombre del sitio, título, descripción y URL; tarjeta de Twitter tipo `summary`. No se declaró una imagen social porque no se verificó un recurso horizontal optimizado para compartir; evitar reutilizar a ciegas una foto de roster o una imagen de identidad histórica.
- **Validaciones:** inserción acotada dentro de `<head>`; se mantuvieron el título, viewport, fuentes y hoja de estilos existentes. La validación automática y el despliegue de Pages se comprobarán después del commit.
- **Pendientes / riesgos:** crear y verificar una imagen social horizontal específica (idealmente 1200×630) y comprobar visualmente la vista previa en plataformas externas. La auditoría visual de escritorio, móvil y tablet sigue pendiente por falta de saldo de la herramienta de navegador; no se presenta como realizada.
- **Commit de portada:** [95af81e6](https://github.com/losmoriartys-cmd/legion-multiversal/commit/95af81e625804fb6caa08e5c722905ba40433e97).
- **Despliegue:** pendiente de verificar.

## 2026-11-06 — Integrar portada social oficial en metadatos

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** incorporar la portada social creada por el equipo a las vistas previas al compartir el sitio.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Recurso utilizado:** `og-legion-multiversal.jpg`, ya presente en la raíz del repositorio en `main`; se reutilizó sin moverlo ni duplicarlo.
- **Implementado:** se agregó `og:image`, dimensiones declaradas (2048 × 1077), texto alternativo y metadatos de Twitter Cards con formato `summary_large_image`; se mantuvieron los metadatos generales, canonical y Open Graph existentes.
- **Validaciones y resultados:** la ruta del archivo fue comprobada en el contenido del repositorio. GitHub Pages publicó correctamente el commit de este informe: workflow [42249250007](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42249250007), con build, deploy y reporte de estado en éxito. La presencia del archivo y los metadatos quedó confirmada en el repositorio; el navegador de verificación disponible no pudo abrir el dominio público para comprobar la respuesta HTTP directa de la imagen. La actualización del preview en plataformas externas puede quedar sujeta a sus cachés.
- **Pendientes / riesgos:** no se realizó una prueba visual de las tarjetas en WhatsApp, Discord, X u otras plataformas; tampoco se verificó manualmente el recorte en cada una.
- **Commit de implementación:** 460527a6044d36b2b6f3c2cf332838637d9448e5.
- **Despliegue:** GitHub Pages exitoso; workflow 42249250007.

## 2026-11-06 — Auditoría integral inicial de identidad, lore, contenido y enfoque comercial

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** evaluar la coherencia editorial y narrativa de Legión Multiversal y detectar oportunidades de mejora en experiencia, identidad visual, navegación, música y presentación comercial.
- **Archivos revisados:** `index.html`, `styles.css`, `app.js`, `roster-data.json`, `creator-records.json`, `platform-registry.json`, `platform-stats.json`, `sullygnome-data.json` y estructura de recursos del repositorio.
- **Alcance de la revisión:** inspección estática del contenido, datos, referencias, estructura, CSS y lógica JavaScript. El usuario informó que comprobó en PC la ficha de MORIARTYS (cuatro páginas) y los demás paneles, y que los encontró funcionando correctamente. No se realizó una nueva prueba visual independiente en navegador, ni una auditoría móvil/tablet, ni una comprobación externa de reproductores o sonido.

### Fortalezas confirmadas

- La web tiene una narrativa reconocible: origen, evolución, roster, valores, estadísticas, arsenal, transmisiones, reclutamiento, alianzas y comunidad.
- El proyecto diferencia ocho perfiles activos y conserva las etapas históricas separadas.
- Las ocho rutas de retrato y arte principal declaradas en `roster-data.json` existen en el repositorio.
- Los expedientes comerciales distinguen formatos potenciales de campañas contratadas y explican límites de las métricas.
- El capítulo de estadísticas aclara la fuente, la ventana de observación, las limitaciones del muestreo y que las horas vistas son estimaciones.
- Los expedientes modales incorporan cierre con Escape, contención de foco y devolución del foco al control que los abrió.
- La música no se reproduce automáticamente: se activa mediante una acción explícita y puede apagarse.

### Hallazgos prioritarios de contenido y coherencia

1. **Imagen de formación actual pendiente de validación visual.** La portada del capítulo 01 usa `PortadaNueva-seguis-agregando-a-este-que-no-existe-en-el-roster.jpg` y su texto alternativo la presenta como formación actual. El nombre del recurso sugiere que podría contener una figura ajena al roster. No se debe seguir presentando como fotografía/ilustración fiel de la formación hasta contrastarla con los ocho perfiles activos y aprobarla.
2. **Horario contradictorio en el expediente de DAVE — NEXUS.** `roster-data.json` declara “Sin horario fijo confirmado”, pero el texto de trayectoria todavía afirma una agenda diaria a las 19:00 de México. Retirar esa afirmación del relato o reemplazarla únicamente con información confirmada.
3. **Asunto de reclutamiento desactualizado.** El formulario prepara un correo con el asunto “Solicitud de ingreso al Instituto S3X-MEN”, aunque la identidad vigente es Legión Multiversal. El encabezado también usa “S.H.I.E.L.D.”, referencia externa reconocible que conviene sustituir por una denominación original del universo de la Legión.
4. **Cronología sin fechas ni respaldo editorial suficiente.** La línea de tiempo ordena hitos, pero no muestra fechas ni fuentes. Expresiones como “pioneros” y “primera mujer en sumarse” requieren confirmación explícita y contexto para que no se lean como afirmaciones históricas verificadas sin respaldo. El registro de hitos en `creator-records.json` está vacío para los canales consultados.
5. **Clips todavía no curados para uso comercial.** Varios expedientes muestran títulos genéricos (“Momento destacado 01…”) o slugs automáticos en inglés; AKUMA no tiene clips incorporados. Para una marca, cada muestra debería tener título editorial aprobado, breve contexto y enlace probado. No inventar títulos a partir del identificador.
6. **Diferenciar rol narrativo de credencial real.** Dirección, Profesores, Estudiantes, Colaboradores, rangos y poderes son parte del universo ficticio. En la presentación comercial debe quedar inequívoco que no son cargos laborales, certificaciones ni indicadores de experiencia profesional.
7. **Revisión de cifras antes de convertirlas en argumentos de venta.** Permanecen discrepancias ya documentadas en los expedientes de AKUMA, ARDIPII y HÁBITOS ATÓMICOS entre resúmenes y tablas de detalle. Mantener la advertencia de fuente/periodo y resolver las diferencias antes de destacar esos valores en una propuesta a marcas.

### Hallazgos de identidad visual y experiencia

- La portada social nueva trabaja una estética azul/cian/violeta, mientras que la interfaz conserva un uso muy frecuente del amarillo intenso, cian, rojo de estado, bordes negros gruesos y recursos de cómic clásico. La mezcla puede funcionar si se define una jerarquía; actualmente falta una guía común de color y aplicación.
- La hoja de estilos tiene 39 bloques `@media`, 16 animaciones `@keyframes`, 30 usos de `!important` y numerosos colores literales además de las variables globales. Hay selectores repetidos y reglas de `body` en distintas etapas. No demuestra por sí solo fallos visuales, pero evidencia deuda de cascada y aumenta el riesgo de que una corrección futura sea anulada por otra regla.
- Se importa Roboto Condensed, Bangers, Special Elite y Permanent Marker. También se declara Montserrat en una regla inicial, pero esa familia no se carga y luego el cuerpo vuelve a Roboto Condensed. Conviene eliminar la declaración muerta y definir usos limitados para la tipografía display, lectura y metadatos.
- La navegación por capítulos cambia el panel y desplaza la página, pero `switchChapter()` no actualiza la URL ni el historial del navegador. El acceso directo por hash existe para expedientes, no como mecanismo general de capítulos. Evaluar enlaces compartibles por capítulo y comportamiento coherente con Atrás/Adelante.
- La identidad sonora es una pieza jazz sintetizada en tiempo real mediante Web Audio, no un archivo musical. Está apagada por defecto y no tiene control de volumen; el temporizador continúa activo mientras está habilitada. Evaluar volumen, pausa al ocultar la pestaña y una descripción clara de que es una ambientación opcional.
- El formulario de reclutamiento utiliza `mailto:`: prepara un correo en el cliente del visitante, no envía datos a un servidor de la web. Conviene explicarlo junto al botón y añadir una nota breve sobre el tratamiento de la información compartida.

### Oportunidades para el enfoque de marcas

- El capítulo de alianzas comunica formatos posibles, pero todavía funciona más como declaración institucional que como portfolio demostrable. Puede ganar fuerza con casos breves verificables: objetivo, creadores participantes, formato, entregables publicados y evidencia disponible.
- Mostrar por separado la experiencia colectiva y la oferta individual de cada creador; no atribuir al grupo métricas, campañas o partners que pertenecen a un canal específico.
- Convertir clips aprobados, colaboraciones respaldadas y datos con periodo/fuente en pruebas de capacidad. No presentar solicitudes de keys ni plataformas de distribución como patrocinios.
- Añadir un recorrido claro para marcas: qué ofrece la Legión, qué puede contratarse con el grupo, qué puede contratarse individualmente, ejemplos reales y contacto comercial.

### Orden recomendado de intervención

1. Corregir datos y referencias inequívocamente desactualizadas (horario de DAVE y asunto de reclutamiento); validar la imagen de formación.
2. Resolver y etiquetar las discrepancias estadísticas antes de usar cifras como argumento comercial.
3. Confirmar la cronología y las afirmaciones históricas con el equipo; separar lore de hechos comprobables.
4. Curar clips y muestras con cada creador; dejar visible lo pendiente sin usar placeholders como si fueran piezas editoriales.
5. Aprobar una guía visual: paleta institucional, colores de estado, tipografía, fondos, bordes, tarjetas, imágenes y movimiento.
6. Consolidar CSS y corregir la navegación por URL/historial.
7. Refinar música opcional, controles y explicación del formulario.
8. Reestructurar el capítulo de alianzas como portfolio con pruebas verificables y ofertas diferenciadas.

- **Implementado en esta auditoría:** diagnóstico y prioridades documentados; no se modificó el diseño ni el contenido público.
- **Pendientes / riesgos:** validación visual independiente en móvil/tablet; contraste visual de la portada de formación; confirmaciones editoriales de integrantes; revisión externa de embeds y de la reproducción sonora.
- **Commit:** se registrará al guardar esta entrada.
- **Despliegue:** no corresponde; esta entrada es documental y no altera el sitio publicado.

## 2026-11-06 — Primera evolución del lenguaje visual y carta piloto MORIARTY 047

### Dirección conceptual aprobada para la implementación
- Evolución gradual de la identidad: universo editorial cinematográfico y coleccionable, con expedientes y personajes como piezas centrales. Se conserva el ADN narrativo de multiverso/cómic, pero se reduce el aspecto de plantilla clásica mediante fondos profundos, superficies más limpias, bordes contenidos, luz ambiental y acentos cian/hielo/violeta.
- No se reemplaza el enfoque de superhéroes ni se rehace la arquitectura completa en esta primera etapa. Se establece una dirección visual que puede extenderse capítulo por capítulo tras validar el prototipo.

### Implementación
- El roster incorpora una primera carta coleccionable interactiva para MORIARTYS, número 047. Usa la ilustración de carta existente (hero.img) en lugar del retrato tipo carnet y mantiene nombre, rol y tipo de creador.
- La carta tiene inclinación 3D controlada por el puntero, reflejo holográfico y retorno suave al estado neutro. Solo se activa para puntero fino/ratón; no requiere permisos de giroscopio ni sensores del dispositivo.
- Se conservan el botón accesible, la acción existente de abrir el expediente y el recorrido hacia la bitácora de cuatro páginas. El resto de integrantes conserva su presentación anterior, aunque recibe ajustes suaves de superficie, borde y color dentro del roster.
- Se añade una primera capa del sistema visual a la portada, fondo general y roster: azul noche, cian frío, hielo y violeta moderado, con menor dependencia del amarillo y de sombras negras duras.

### Validación y límites
- Revisión estática de los puntos de inserción y preservación de openHeroProfile(index, event.currentTarget).
- Se comprobarán sintaxis JavaScript, estructura CSS y publicación de GitHub Pages después del commit.
- No se afirma prueba visual en navegador ni validación real de interacción táctil/ratón en esta etapa. La evaluación visual final de la carta y la imagen de portada queda pendiente de la revisión del usuario.
- No se cambian imágenes fuente ni se eliminan recursos.

- **Archivos:** app.js, styles.css, INFORMES.md.
- **Estado:** implementación inicial; pendiente validación automatizada y revisión visual del usuario.


## 2026-11-06 — Capítulo 02: coherencia del Roster y recorrido hacia las bitácoras

### Objetivo
Alinear el Roster con la arquitectura visual ya creada por el equipo: carnet como identificación de entrada y carta ilustrada completa como pieza principal dentro de la bitácora individual. Mejorar la lectura de las áreas y la adaptación de las tarjetas sin sustituir recursos existentes.

### Cambios implementados
- Se corrigió la excepción de MORIARTYS: el Roster vuelve a tomar el campo portrait, igual que los otros siete integrantes. La carta ilustrada del campo img queda reservada para la bitácora.
- Se retiró la carta completa de la pantalla intermedia de presentación del expediente. Esa pantalla funciona ahora como acceso editorial a la bitácora y evita repetir la misma ilustración antes de abrirla.
- Se mantuvieron las ocho fichas y sus recursos existentes; no se generaron, borraron ni renombraron imágenes.
- Se actualizaron las descripciones de las áreas para hablar de la Legión y no del antiguo Instituto.
- Se ajustaron jerarquía, separación, proporciones y grilla de carnets, con un diseño adaptable a pantallas angostas y controles de movimiento reducido ya existentes.
- Se conservó el número de colección y el efecto holográfico de MORIARTY como detalle de su carnet, pero sin reemplazar su imagen de identificación.

### Validación y límites
- Comprobación estática de las ocho entradas de roster-data.json: todas conservan portrait e img.
- Comprobación de la lógica: el Roster utiliza portrait como fuente prioritaria para todos; la portada de la bitácora de MORIARTY conserva hero.img.
- No se declara prueba visual independiente en navegador ni prueba física en móvil/tablet. Debe revisarse el resultado publicado en ambos tamaños antes de dar por cerrado el capítulo.
- No se modificaron cifras, biografías, roles ni recursos gráficos originales.

### Archivos
- app.js
- styles.css
- INFORMES.md


## 2026-11-06 — Roster: cartas coleccionables reversibles para los ocho integrantes

### Concepto e interacción
- El carnet del roster se convierte en una carta coleccionable premium, con frente y dorso para cada integrante.
- Frente: retrato existente, identidad, número de expediente y clasificación.
- Dorso: designación/codename disponible, función en la Legión, tipo de creador y presentación breve basada en la biografía ya registrada.
- Giro de 180 grados mediante interacción explícita; el reverso ofrece un botón separado para abrir la bitácora. Así se evita anidar botones y se mantiene un recorrido accesible.
- Inclinación 3D suave con mouse y reflejo holográfico reactivo. En pantallas táctiles se gira con toque; el movimiento no depende del hover.
- Se respetan preferencias de movimiento reducido.

### Integridad de datos y recursos
- Se utilizan los ocho retratos carnet existentes en roster-data.json; no se crean imágenes ni se reemplazan recursos.
- Los números y clasificaciones proceden de los campos ya presentes. Si falta un número, se muestra S/N.
- No se agregan poderes, estadísticas ni credenciales no confirmadas.
- La ilustración hero completa continúa reservada para la portada de la bitácora individual.

### Validación
- Pendiente de validación automática de sintaxis y rutas tras el commit.
- Pendiente de revisión visual en navegador de las ocho cartas, con especial atención a la legibilidad del reverso en móvil y a la proporción de los retratos.


## 2026-11-06 — Roster: doble arte coleccionable y acabado premium

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** elevar el tratamiento visual de las cartas del Roster sin limitar la experiencia al retrato tipo carnet.
- **Archivos modificados:** `app.js`, `styles.css`, `INFORMES.md`.
- **Implementado:** el frente conserva el retrato carnet con marco metálico y acabado premium; el reverso ahora incorpora la ilustración completa original del integrante como arte principal, con degradado cinematográfico para mantener legibles la identidad, clasificación, función, perfil de creación y presentación. Se refuerzan profundidad de bordes, brillos, foil holográfico, reflejos que siguen el puntero, microzoom de imagen y sombras multicapa. Se reutilizan los archivos existentes de `roster-data.json`; no se generan ni sustituyen retratos.
- **Criterio de movimiento:** la inclinación 3D y el reflejo responden al puntero en escritorio; el giro de carta sigue disponible mediante toque/clic. Se conserva la preferencia de movimiento reducido del sistema.
- **Validaciones:** revisión estática del flujo de renderizado y de los campos de datos; pendiente ejecutar comprobación de sintaxis, comprobar las ocho rutas de imagen en el árbol del repositorio y confirmar el workflow de Pages. No se declara prueba visual en navegador.
- **Pendientes / riesgos:** revisar en el sitio publicado el encuadre de las ocho ilustraciones en el reverso, la legibilidad de las fichas y el giro en pantallas pequeñas; ajustar `object-position` si alguna composición lo necesita.
- **Commits:** app.js `0493a9b49e77648418a2c63fbc1ae75f749c390e`; styles.css `e51dee9bc15ceb8833fae2eeaf55ab7c3055ea71`.
- **Despliegue:** pendiente de verificar el workflow generado por los commits.


## 2026-11-06 — Roster: identidad visual singular para cada carta

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** convertir las ocho cartas en piezas distinguibles de una misma colección, evitando una plantilla idéntica con solo el retrato cambiado.
- **Archivos modificados:** `app.js`, `styles.css`, `INFORMES.md`.
- **Implementado:** se asigna a cada integrante un tema cromático/material propio, manteniendo la misma estructura, proporciones, tipografía y lenguaje de la Legión. MORIARTYS usa cian y metal cálido; ROD3R1K acero con acento rojo; LADYMORIARTY violeta arcano y cian; ARDIPII azul espectral; AKUMA brasa y cobre; DAVE — NEXUS energía teal-violeta; PATO — ORATORIS oro editorial y acero; HABITOS jade y bronce. Los temas afectan el marco, el halo, el foil, las líneas de información y los botones; cada carta incorpora además una pequeña marca de edición con su número.
- **Criterio:** la diferenciación es puramente artística y no añade poderes, estadísticas, rangos ni afirmaciones biográficas. Se mantiene la unidad de colección y el comportamiento de movimiento reducido.
- **Validaciones:** mapeo de temas vinculado a los ocho nombres del roster; comprobación estática de que el render asigna tema y marca. Pendiente de sintaxis automatizada, despliegue y revisión visual real en escritorio/móvil. No se declara prueba de navegador.
- **Pendientes / riesgos:** comprobar en publicación que cada firma cromática conserve contraste y no compita con el arte del reverso; ajustar intensidades si algún retrato ya contiene colores muy dominantes.
- **Commits:** app.js `160ff760669cfeff85fc9f80f460d00c94ac2a31`; styles.css `fa0bde302f742e7d3446ec23e033041b7eeaf1a6`.
- **Despliegue:** pendiente de verificar GitHub Pages.


## 2026-11-06 — Bitácora: portada editorial con ilustración oficial reutilizada

- Se corrigió la pantalla de entrada al expediente individual, que antes mostraba únicamente texto y acciones.
- Ahora presenta la ilustración completa ya existente (`hero.img`) en un marco editorial vertical, con número de expediente, tratamiento cinematográfico y composición adaptable a escritorio y móvil.
- Se conserva el carnet para el frente de la carta y la ilustración completa para el reverso; la Bitácora reutiliza esa misma ilustración con una tercera función de diseño, sin exigir generar otro archivo.
- Se agregó alternativa de respaldo si la imagen no está disponible y texto alternativo descriptivo.
- Validación realizada: reemplazo del bloque exacto, presencia de clases y reglas CSS añadidas, revisión de estructura textual. No se realizó prueba visual en navegador.


## 2026-11-07 — Identidad institucional: referencias vigentes de Legión Multiversal

- Se actualizaron los textos activos de «Nuestros valores» para presentar a Legión Multiversal como comunidad creativa y espacio de encuentro, aprendizaje y colaboración, sin denominarla Instituto.
- Se reemplazó el encabezado de reclutamiento que aludía a S.H.I.E.L.D. por «Reclutamiento · Legión Multiversal».
- Se corrigieron el asunto del correo de postulación y la pregunta de motivación para que nombren a la Legión.
- Los paneles de seguimiento Twitch ahora atribuyen la observación técnica a Legión Multiversal, sin cambiar los datos ni la lógica de medición.
- Se conservaron deliberadamente las referencias a S3X-MEN en el capítulo histórico de origen: identifican la etapa fundacional y el material de archivo, no la identidad vigente.
- Validación estática: comprobadas las sustituciones exactas en index.html y app.js; se revisaron las menciones restantes para separar historia de interfaz activa. No se realizó prueba visual en navegador.
- Commits de interfaz: 4fd62f1d72ca6699526622a2233b45c7b77c7453 (index.html) y 5d908a81b46cf44af9d51905bae35c2b73666844 (app.js).


## 2026-11-07 — Integridad de datos: horario de DAVE y revisión de métricas individuales

### Corrección aplicada
- Se detectó una contradicción en el expediente de DAVE — NEXUS: el campo `schedule` indicaba «Sin horario fijo confirmado», mientras que la bitácora afirmaba que transmitía diariamente a las 19:00 de México.
- Se corrigió el texto de la bitácora para dejar claro que no existe un horario fijo confirmado y que los anuncios se comunicarán cuando cada transmisión esté programada.
- No se inventó ni se trasladó un horario desde otro integrante.

### Revisión de métricas
- **AKUMA:** el resumen de SullyGnome informa 22 transmisiones, 43 horas emitidas, 190 horas vistas, promedio de 4 espectadores, pico de 41 y +34 seguidores para el período 6 oct–5 nov de 2026. La bitácora individual distingue correctamente ese resumen de las diez transmisiones visibles en el detalle. El directo del 6 nov se mantiene separado por quedar fuera de la ventana. No se detectó una contradicción numérica que justifique alterar las cifras.
- **ARDIPII:** el resumen informa 8 transmisiones, 11 horas emitidas, 121 horas vistas, promedio de 11 espectadores, pico de 31 y +83 seguidores en la ventana 6 oct–5 nov de 2026. Las ocho filas cargadas corresponden a ese período. La página individual presenta los mismos indicadores. Se mantiene la atribución a SullyGnome y no se mezclan con el muestreo propio de Twitch Helix.
- **HÁBITOS ATÓMICOS:** el resumen general informa 472 horas vistas, mientras que la suma de las filas del desglose por categoría llega a 474. Se conserva la diferencia explícita en la página, sin modificar ninguno de los valores de origen. El resumen indica 28 transmisiones, pero solo se recibieron 24 filas individuales; no se reconstruyen ni inventan las cuatro faltantes. El pico de 29 espectadores permanece sin fecha por la discrepancia del registro recibido. La cifra de ranking «Seguidores ganan rango» se excluye de los seguidores del canal porque representa una posición del directorio, no una cantidad.
- Las métricas de SullyGnome, TwitchMetrics y el muestreo propio de Twitch Helix permanecen separadas por fuente, período y metodología. No se comparan como si fueran mediciones equivalentes ni se suman entre sí.

### Estado y pendientes
- La contradicción del horario de DAVE queda corregida.
- La revisión estática no encontró motivo para alterar las cifras principales de AKUMA o ARDIPII.
- La diferencia de 472/474 horas vistas de HÁBITOS y la falta de cuatro filas requieren contraste con el resumen o la captura original de SullyGnome para poder conciliarlas. Hasta entonces, ambas advertencias deben permanecer visibles.
- No se realizó una verificación visual independiente en navegador ni una consulta autenticada a los paneles privados de los creadores.

### Archivos
- `roster-data.json`
- `INFORMES.md`

### Commit
- `roster-data.json`: `f619531dbb667aaa2fd632f73349a597f69b6015`


## 2026-11-07 — Actualización de métricas de HÁBITOS ATÓMICOS con nuevo corte de SullyGnome

- Se recibió una captura más reciente del resumen de SullyGnome, correspondiente al **7 oct — 6 nov 2026**. Este corte reemplaza al resumen anterior (6 oct — 5 nov) para las métricas generales del expediente.
- Valores vigentes incorporados en `sullygnome-data.json` y en la bitácora: **26 transmisiones**, **121 horas emitidas**, **469 horas vistas**, **3 espectadores promedio**, **29 de pico** y **+27 seguidores**.
- La captura del historial incluida en el mensaje muestra diez filas recientes (26 oct — 6 nov), no las 26 transmisiones completas. Se registra como muestra parcial de 10/26; no se inventan las otras 16 filas.
- Se conserva sin fecha el pico agregado de 29. El gráfico compartido señala 24 espectadores durante una transmisión marcada como «Unlisted» el 21/10 a las 21:00. Como las dos vistas no coinciden, no se atribuye una fecha al máximo agregado hasta aclarar qué incluye cada panel.
- El desglose por categorías disponible sigue perteneciendo al corte anterior (6 oct — 5 nov). Se etiqueta con su propio período y no se mezcla con el resumen nuevo. En ese desglose, «Solo charlando» muestra 474 horas vistas, cifra superior a las 469 horas del resumen general actualizado; queda pendiente una tabla de categorías del nuevo período para reconciliarla.
- Se descarta la interpretación de «Follower gain rank» como seguidores ganados: es una posición/rango del directorio. La métrica de seguidores ganados usada en el perfil es +27, tomada del resumen general.
- Se actualizaron las etiquetas y textos del expediente para que el período del resumen y el del desglose por categorías queden claramente diferenciados.

### Archivos modificados
- `sullygnome-data.json`
- `app.js`
- `INFORMES.md`

### Commits
- `sullygnome-data.json`: `67a199aaa95584856fb16101625951ca0bd5ec9c`
- `app.js`: `8e7e74c9aa2918912cd13e1d35695c59f9440a37`


## 2026-11-07 — Desglose de categorías de HÁBITOS ATÓMICOS: últimos 30 días

- El creador confirmó que la tabla de categorías compartida corresponde a «los últimos 30 días», por lo que se actualizó el período del desglose a **7 oct — 6 nov 2026**, en línea con el resumen general ya incorporado.
- Se reemplazó el desglose anterior por las diez categorías visibles en la nueva tabla: Just Chatting, Fortnite, Call of Duty: Warzone, Pro Evolution Soccer 2008, FC Mobile, Clash Royale, EA Sports FC 26, Overcooked! 2, FIFA 23 y Counter-Strike. Se transcribieron horas emitidas, participación, horas vistas, participación, promedio y pico sin crear categorías adicionales.
- La tabla atribuye a Just Chatting **104 horas emitidas (83,5%)**, **469 horas vistas (88,4%)**, promedio 4 y pico 26.
- **Discrepancia pendiente de SullyGnome:** el resumen general del canal informa 469 horas vistas totales, pero la fila de Just Chatting también informa 469 horas vistas como 88,4% del total. Las diez categorías visibles suman 525 horas vistas. Por otra parte, suman 119 horas emitidas, frente a 121 del resumen general. Se preservan los valores originales y se explica la inconsistencia en la bitácora; no se estima ni reemplaza el resumen general.
- Se mantiene el resumen general: 26 transmisiones, 121 horas emitidas, 469 horas vistas, promedio 3, pico 29 y +27 seguidores. La diferencia de pico 29 vs. 24 en el gráfico del 21/10 continúa pendiente de aclaración.
- Validación estática prevista: diez categorías en el JSON, período etiquetado como últimos 30 días, sumas de control 525 horas vistas y 119 horas emitidas, textos de discrepancia presentes en la página. No se realizó una revisión visual en navegador.

### Archivos modificados
- `sullygnome-data.json`
- `app.js`
- `INFORMES.md`

### Commits
- `sullygnome-data.json`: `4198c8a8e8f2847532c9217edde0d54d2fd078ae`
- `app.js`: `8dfa21e1aa64a3db6b160c3073cab162239f8603`


## 2026-11-07 — Capítulo 01: relato fundacional S3X-MEN → Legión Multiversal

- Se reescribió el relato del Capítulo 01 para presentar con claridad la secuencia histórica confirmada por el creador: **S3X-MEN fue la primera formación de cuatro integrantes** y, con el tiempo, el proyecto evolucionó hacia Legión Multiversal.
- Se reforzó el tono de archivo/historieta: primera identidad, expansión del universo, idea colectiva más amplia y cambio de era. Se dejó explícito que la Legión no borra ni desacredita la etapa S3X-MEN.
- Se retiraron afirmaciones cronológicas o personales que no estaban suficientemente verificadas en el relato anterior (por ejemplo, hitos individuales presentados como hechos cerrados). La cronología ahora describe etapas del proyecto sin inventar fechas ni adjudicar méritos no confirmados.
- Se eliminaron tres referencias a imágenes con nombres de archivo que no existían en la raíz del repositorio y que podían provocar imágenes rotas. No se reutilizó una imagen distinta como si fuera la nueva formación.
- **Pendiente de integración visual:** las cuatro imágenes nuevas compartidas en la conversación deben incorporarse al directorio `assets/` y luego ubicarse en la portada de transición, la primera formación S3X-MEN, la portada «Orígenes #0001» y el banner de la Legión actual. En este commit se avanzó el relato y se evitó dejar enlaces rotos; las cuatro imágenes todavía no están publicadas en el repositorio.
- El Roster conserva su estructura principal de ocho cartas y accesos a bitácoras. Se mantiene pendiente una pasada posterior de revisión visual y de contenido fino; esta tarea no bloquea el avance del Capítulo 01.
- Validación estática: bloque del capítulo reemplazado; referencias antiguas a archivos inexistentes retiradas; estructura de secciones conservada. No se realizó prueba visual en navegador.

### Archivos modificados
- `index.html`
- `INFORMES.md`

### Commit
- `index.html`: `8878155219f56e731511f768ffc9a05ccd5cc39a`


## 2026-11-07 — Capítulo 01: secuencia fundacional detallada e integración de imágenes

- Se amplió el relato histórico con la secuencia acordada por el creador: Demi y Roderik comparten la idea inicial; Roderik convoca a Akuma; Demi invita a Lady Moriarty y Patricio; Demi y Roderik buscan a Ardipii; más adelante se incorporan Dave como estudiante y Hábitos como colaborador.
- Se reforzó que el origen fue una iniciativa compartida entre Demi y Roderik, evitando atribuir la creación a una sola persona.
- Se añadió la fotografía de Demi y Roderik frente a las computadoras como viñeta de la noche fundacional.
- Se integraron las cuatro imágenes compartidas en la raíz del repositorio: portada de la primera formación, portada de la etapa ampliada, imagen de archivo del grupo y composición épica de Legión Multiversal. Se conservaron sus nombres originales y no se movieron ni renombraron archivos.
- La narrativa distingue el origen S3X-MEN de la identidad posterior Legión Multiversal: la segunda continúa la historia sin borrar la primera.
- Se añadieron estilos específicos para las nuevas viñetas y figuras, manteniendo la paleta y el lenguaje visual existente del Capítulo 01.
- Validación estática: comprobada la existencia de los cinco archivos de imagen en la raíz de `main`; comprobadas las referencias nuevas en el HTML y los estilos correspondientes. No se declara prueba visual en navegador ni despliegue verificado.

### Archivos modificados
- `index.html`
- `styles.css`
- `INFORMES.md`

### Despliegue
- Pendiente de comprobar el workflow de GitHub Pages y revisar el resultado visual publicado.


## 2026-11-07 — Capítulo 01: confirmación de la primera formación y misión inaugural

- El creador confirmó expresamente que la primera formación de S3X-MEN estuvo integrada por **Demian, Rod3r1k, Akuma y Ardipii**. Se incorporaron los cuatro nombres en la viñeta documental y en el texto alternativo de la fotografía.
- Se corrigió el orden cronológico: la imagen documental de la primera formación ahora aparece después de la portada ilustrada de «Orígenes #0001» y antes del bloque de nuevas incorporaciones. Dave (estudiante) y Hábitos (colaborador) quedan narrados como incorporaciones posteriores.
- Se aclaró que «Orígenes #0001» es una portada ilustrada que representa el nacimiento del primer equipo, mientras que el archivo fotográfico de la primera formación funciona como registro documental.
- La portada de Legión Multiversal dejó de funcionar como banner genérico y pasó a encabezar la **MISIÓN 001 · PRIMERA MISIÓN: LEGIÓN MULTIVERSAL**. El texto presenta como primera misión la unión de identidades, talentos y comunidades bajo la nueva identidad, sin inventar una aventura o acontecimiento externo.
- Se añadió un puente de presentación comercial al cierre del Capítulo 01, con accesos directos al Roster y a Alianzas. Se incorporó el dato operativo de 8 perfiles y 7 canales activos de Twitch, diferenciando perfiles de canales.
- Se añadió a Alianzas el formato «Keys, lanzamientos y primeras impresiones», dirigido a estudios y publishers, sin prometer resultados garantizados.
- Se agregaron estilos responsivos para la nueva viñeta de misión y el CTA doble. Validación estática: se comprobaron los bloques y referencias reemplazados en el HTML; no se realizó inspección visual en navegador ni se declara verificación visual del despliegue.

### Archivos modificados
- `index.html`
- `styles.css`
- `INFORMES.md`

### Commit
- `index.html`: `8491b54fb105624413c6747f2f3a5e3aeb204ee8`
- `styles.css`: `4eff89659073b3da4593133fb397599cfc524f3c`
- `INFORMES.md`: esta actualización de bitácora registra los commits anteriores.


## 2026-11-07 — Nuevo capítulo 12: Colaboraciones · Expediente 001 Bar Fender

- **Objetivo:** crear un capítulo independiente para documentar colaboraciones reales de los integrantes de Legión Multiversal como bitácora viva, con expedientes individuales por actividad.
- **Implementación:** se incorporó «COLABORACIONES» a la navegación principal y se creó el Capítulo 12 con portada editorial, explicación del archivo, principios de documentación, campaña destacada, participantes, métricas, VOD, clips identificados, valor para marcas y contacto comercial.
- **Expediente 001 — Bar Fender:** documentado el encuentro del 5 de noviembre de 2026 con Demian (Los Moriartys), Lady Moriarty01, TheR0D3R1K y akumazoldyck. Se describe como una sesión colaborativa transmitida simultáneamente desde cuatro canales, con una duración aproximada de una hora y media.
- **Contexto comercial:** se incorporan los datos editoriales registrados para Bar Fender: publisher Rock Paper Publisher, desarrollador Photo Division y acceso al juego facilitado mediante Keymailer. No se presenta como patrocinio remunerado ni se atribuyen ventas, conversiones o ROI.
- **Material audiovisual:** se reutilizan barfe.jpg y 1batalla.jpg, ya presentes en el repositorio. Se enlazan los tres VOD públicos documentados (Los Moriartys, Lady Moriarty01 y TheR0D3R1K), con sus duraciones registradas. Akuma queda correctamente identificado como participante simultáneo sin VOD público localizado.
- **Clips:** se incorporan los ocho títulos recuperados y se agrupan por canal (2 Los Moriartys, 4 Lady Moriarty01, 2 TheR0D3R1K). Los enlaces individuales no se inventan: el archivo histórico indica que faltaba recopilar sus URLs.
- **Métricas:** se separan los indicadores del VOD completo de Los Moriartys (25 promedio, 40 pico, 80 espectadores únicos, 97 usuarios en chat, 154 vistas en vivo, +2 seguidores, 1 suscripción, duración 2:27:20) del dato de 98 espectadores compartidos únicos del panel Shared Viewership. Se aclara que el VOD cubre la transmisión completa, no solo el tramo de Bar Fender, y que 98 no equivale a audiencia total deduplicada entre los cuatro canales.
- **Enlaces de navegación:** se añadió acceso al capítulo desde la portada histórica y desde Alianzas, además de la entrada en la navegación principal.
- **Validación:** comprobadas estáticamente las referencias de imágenes existentes, los tres enlaces de VOD, los ocho títulos de clips, las etiquetas de métricas y la presencia del capítulo 12 y sus accesos. El workflow «Validar código y datos del sitio» finalizó correctamente y GitHub Pages completó el despliegue asociado al commit del informe (run 42346974240). No se declara inspección visual independiente en navegador.
- **Archivos modificados:** index.html, styles.css, INFORMES.md.
- **Commits:** index.html 8f775166fa080eaae836464f0f916555ed46f9be; styles.css 1c4bbde61be384609f39beb9c6aebb70deff6fb2.


## 2026-11-07 — Tarea 01: nueva Portada ejecutiva independiente

- **Arquitectura:** se creó el panel chapter-0 como Inicio ejecutivo y se conservó chapter-1 exclusivamente para el origen S3X-MEN. No se renumeraron ni eliminaron capítulos existentes.
- **Navegación principal:** Inicio, Roster (02), Estadísticas (03), Alianzas (08), Colaboraciones (12), Comunidad (09) y Origen (01).
- **Accesos secundarios preservados:** Nuestros Valores (11), En Vivo (10), Arsenal (05) y Reclutamiento (06), agrupados en un desplegable accesible que mantiene los mismos identificadores y acciones.
- **Contenido de Inicio:** presentación institucional, dos recorridos de entrada, consola ejecutiva, caso documentado Bar Fender, presentación humana de la comunidad, cuatro formatos de colaboración, puente al origen y contacto comercial directo.
- **Integridad editorial:** la Portada deriva a los capítulos existentes; no duplica fichas, estadísticas, contenido comercial extendido ni la bitácora de campañas. Bar Fender se presenta como experiencia documentada y enlaza al Capítulo 12.
- **Accesibilidad y adaptación:** etiquetas semánticas, títulos asociados, estados aria-current, foco visible, controles operables por teclado y ajustes responsive; se respeta prefers-reduced-motion.
- **Archivos modificados:** index.html, styles.css, app.js, INFORMES.md.
- **Validación inicial:** se verifican por inspección estática los identificadores de capítulos y destinos, las acciones de navegación, la preservación de los cuatro accesos secundarios y las referencias de imágenes ya existentes. Esta anotación no declara todavía una auditoría visual independiente ni un despliegue publicado; ambos quedan sujetos a los workflows y comprobaciones posteriores.


### Ajuste de navegación posterior — fragmentos y menú secundario

- Se corrigió navigation-fix.js para actualizar la URL con #chapter-N también cuando está disponible la función principal switchChapter() de app.js.
- Al elegir una sección desde «Otras secciones», el desplegable se cierra después de navegar, evitando que quede abierto sobre el contenido del capítulo.
- Se conserva la compatibilidad con la navegación de respaldo y con accesos directos por fragmento.


## 2026-11-07 — Auditoría estática inicial de la nueva Portada ejecutiva

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** continuar la aceptación de la Tarea 01 sobre la implementación publicada en `main`, sin confundir validación de código con validación visual del sitio.
- **Estado del repositorio:** se verificó que `main` apunta al commit `a26505e70e50ab0a8c414dc413b79b51d89a1e40`, precedido por `0bd56675668e098f2ee73c4d839bb0429d1468de`.
- **Arquitectura revisada:** `chapter-0` existe como Inicio y es el panel activo inicial; `chapter-1` sigue siendo el Origen S3X-MEN. No se renumeraron los capítulos.
- **Navegación revisada:** los once paneles existentes (`0, 1, 2, 3, 5, 6, 8, 9, 10, 11, 12`) coinciden con los once destinos declarados en la navegación principal y secundaria. No se detectaron paneles sin acceso ni destinos que apunten a paneles inexistentes.
- **Integridad HTML estática:** no se detectaron identificadores duplicados ni enlaces internos por fragmento que apunten a identificadores ausentes.
- **Navegación por código:** `navigation-fix.js` intercepta los accesos a capítulos, delega en `switchChapter()` cuando está disponible, actualiza el fragmento `#chapter-N`, mantiene un respaldo independiente y cierra el desplegable «Otras secciones» tras seleccionar un destino. La prueba real de clics y recarga con fragmentos queda pendiente.
- **Responsive y movimiento:** existen reglas específicas para reorganizar el hero, la consola, los formatos y la navegación en anchos reducidos; también hay reglas `prefers-reduced-motion`. Esto es evidencia estática, no una comprobación visual.
- **Imágenes:** el HTML declara 28 referencias de imagen, 23 con `loading="lazy"` y una con `fetchpriority="high"`. No se realizó en esta auditoría una verificación independiente de cada archivo ni de sus dimensiones/peso.
- **Estado de checks:** la consulta de estados combinados del commit `a26505e` no devolvió checks publicados; por tanto, no se utiliza como prueba de que GitHub Pages haya terminado el despliegue.
- **Limitación de validación:** no se pudo completar una sesión independiente de navegador para inspeccionar el sitio publicado. No se declara probada la apariencia visual, el funcionamiento real de los clics, el comportamiento en 390 px, el foco por teclado ni el estado final de GitHub Pages.
- **Resultado:** auditoría estática inicial favorable, sin incidencias estructurales detectadas en los identificadores y destinos revisados. La Tarea 01 permanece **En curso**, no Completada.
- **Archivos modificados en esta intervención:** `BIBLIA_EVOLUCION_LEGION_MULTIVERSAL.md`, `INFORMES.md`.
- **Commit de seguimiento:** se registra al guardar este informe y el estado operativo de la hoja de ruta.
- **Pendientes / riesgos:** inspección visual y funcional del sitio publicado en escritorio y móvil; comprobación del despliegue de Pages; prueba de accesos directos por URL y navegación por teclado.
- **Despliegue:** no confirmado en esta intervención.


## 2026-11-07 — Corrección editorial y de encuadre · Capítulo 12 / BarFender

- **Nombre del juego:** normalizado como **BarFender** en los textos del expediente y sus referencias editoriales.
- **Encuadre de imágenes:** se corrigió el comportamiento de la imagen de portada del archivo para mostrar la fotografía completa, centrada y sin recortes por `object-fit: cover`. Se reforzó también el centrado de la imagen panorámica del expediente y se identificó el retrato de Lady para ajustar su punto de encuadre en la ficha de participantes.
- **Métricas del VOD de Los Moriartys:** el pico de **40** queda rotulado expresamente como **“PICO MÁXIMO · CANAL LOS MORIARTYS”**. Se actualiza el dato de usuarios en chat a **91**, según la corrección facilitada por el responsable del canal. Los **80 espectadores únicos** permanecen como indicador independiente.
- **Límite de validación:** los cambios están preparados para revisión visual en el sitio publicado. El encuadre definitivo de Lady debe comprobarse en navegador; si la fotografía fuente tiene el rostro ya cortado, será necesario sustituirla por una imagen original con más margen.


## 2026-11-07 — Incorporación de clips de Los Moriartys · BarFender

- Se incorporan dos clips de Twitch proporcionados por el responsable del canal, con sus reproductores embebidos, títulos y enlaces directos de respaldo.
- Clip 01: **“Ojo ojo ojo vomita... alv vomitó”**.
- Clip 02: **“Se boxean en nuestro bar”**, con contexto de participación de @TheR0D3R1k, @Akumazoldyck y @LadyMoriarty01.
- Los embeds usan como dominio padre `losmoriartys-cmd.github.io`, correspondiente al sitio GitHub Pages, en lugar del valor de ejemplo `www.example.com`.
- Los demás clips de Lady Moriarty01 y TheR0D3R1K permanecen listados sin enlaces inventados.


## 2026-11-07 — Incorporación de cuatro clips de Lady Moriarty01 · BarFender

- Se reemplaza el listado textual de cuatro momentos de Lady Moriarty01 por sus cuatro reproductores embebidos de Twitch y enlaces directos.
- Títulos conservados del registro editorial previo y asociados en el mismo orden en que se entregaron los enlaces:
  1. **“Le pegué a Harry Potter”**
  2. **“No me dejan bailar a Kame”**
  3. **“Te voy a pegar, boludo”**
  4. **“Quería pelear”**
- Los embeds usan `parent=losmoriartys-cmd.github.io`. Se conserva la grilla responsive compartida con los clips de Los Moriartys.


## 2026-11-07 — Incorporación de dos clips de TheR0D3R1K · BarFender

- Se reemplaza el listado textual de TheR0D3R1K por dos reproductores embebidos de Twitch con enlaces directos.
- Títulos asociados en el mismo orden de los enlaces entregados:
  1. **“Se busca empleado para el bar”**
  2. **“Pero qué pasó”**
- Los embeds usan `parent=losmoriartys-cmd.github.io` y la grilla responsive existente.
- Se actualiza el texto de continuidad del caso para reflejar **ocho clips identificados** en total: dos de Los Moriartys, cuatro de Lady Moriarty01 y dos de TheR0D3R1K; sin sumar de nuevo los dos clips de TheR0D3R1K que ya figuraban en el recuento anterior.


## 2026-11-07 — Ampliación del expediente BarFender con ficha oficial del juego

- Se incorpora el header gráfico de Steam aportado por el usuario, enlazado a la ficha oficial de **Barfender: COOP Bar Simulator**.
- Se añade una presentación contextual del juego: simulador cooperativo caótico para 1–4 jugadores, con tareas de servicio, limpieza, gestión de peleas y mantenimiento del bar.
- Se incorporan los datos facilitados de Steam: lanzamiento **12/10/2026**, desarrollador **Proto Division**, editor **Rock Paper Publisher** y valoración **Muy positivas (330 reseñas)**.
- Se corrige el crédito de desarrollador en la ficha de la campaña: **Proto Division** (en lugar de Photo Division).
- Se añade diseño responsive para la cabecera y la ficha informativa. El enlace de reseñas apunta al apartado de opiniones de Steam.
- La fecha de lanzamiento del juego se distingue de la fecha de la sesión colaborativa, que se mantiene como **05/11/2026**.
