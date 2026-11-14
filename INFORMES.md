## 2026-11-14 — Protección temporal de Bitácora y herramienta QA local

- **Decisión editorial recibida:** mantener la Bitácora como activo comercial indexable a futuro, pero no indexar la página con sufijo `-preview` mientras el piloto MORIARTYS no tenga QA visual y funcional aprobado.
- **Implementado:** `bitacora-preview.html` ahora incluye `<meta name="robots" content="noindex, nofollow">`. Se mantiene el nombre actual; no se renombró el archivo ni se modificaron enlaces o canonical. El renombrado a `bitacora.html`, la actualización de enlaces/canonical y el redirect HTML quedan expresamente reservados para un PR independiente después de la aprobación de QA. Commit: `5f6e6756a7171cc2ea43c2ca51fd81dbe50637b2`.
- **Herramienta local agregada:** `scripts/qa_smoke.mjs` implementa smoke tests Playwright en 1440×900, 768×1024 y 390×844 con hashes normal, inválido y anclas conocidas; captura errores JS, scroll horizontal, estado del disclosure y llamadas a `/api/*`. Genera capturas PNG y `reports/qa/resultado.json`. Commit: `61cbd896897198ef7c09e8db7fa7a6882d8295e7`.
- **Diferencia por entorno:** en localhost el script exige cero llamadas a `/api/*`; en `*.pages.dev` registra las llamadas como INFO para revisión manual del fallback, en lugar de marcar como fallo el comportamiento esperado de preview sin secretos.
- **Dependencias y ejecución:** el script no se incorporó al CI ni se agregó Playwright al manifiesto del proyecto; es una herramienta local opt-in. Ejecutar `npm i -D playwright`, `npx playwright install chromium`, levantar `python3 -m http.server 8080` y correr `node scripts/qa_smoke.mjs`. Para preview: `QA_BASE=https://auditoria-ux.legion-multiversal.pages.dev/ node scripts/qa_smoke.mjs`.
- **Limitaciones:** no se ejecutó el navegador en esta sesión; no hay resultados, capturas ni aprobación visual. En preview se debe comprobar manualmente que las respuestas 503 de Functions activen el respaldo previsto. El script no verifica envío real de `mailto:`, accesibilidad con teclado/lector de pantalla ni jerarquía/contraste visual.
- **Pendiente:** ejecutar local y preview; adjuntar `reports/qa/`; validar el fallback y el formulario manualmente; completar dimensiones de imágenes y Lighthouse (tres corridas por entorno); obtener CI del HEAD resultante. Mantener el PR #46 en Draft y sin fusionar hasta completar QA y recibir aprobación.
 
---

## 2026-11-14 — Cierre de hallazgos críticos de navegación y roster

- **Rama y límites:** trabajo realizado únicamente en `auditoria-ux`. `main` no fue modificada directamente, el PR #46 sigue sin fusionar y GitHub Pages continúa siendo producción.
- **Hash de capítulos:** verificado y endurecido `activateChapterHash()`. La decodificación está protegida con `try/catch`; los anclajes semánticos se localizan recorriendo `[data-semantic-anchor]` y comparando el valor, sin construir selectores con `location.hash`. Se detectó además una segunda decodificación insegura en `restoreHeroProfileFromHash()`; se añadió control de prefijo y `try/catch` para que hashes de expediente mal formados no interrumpan la carga. Commit: `45cb76367eef6341ecddcbc4f9690bce919faccc`.
- **Filtros del roster:** se agregó `open` por defecto al `details.roster-filter-disclosure` y `syncRosterFilters()` en `app.js`, que mantiene el disclosure abierto desde 701 px y lo colapsa en pantallas menores, reaccionando a cambios de breakpoint. El CSS anterior ocultaba el summary en desktop y forzaba el display del hijo; el atributo `open` elimina la dependencia de ese override para que el contenido de `details` sea visible. Commits: `719041467c6502a079fc85c29beb279715e37bbd` (HTML) y `45cb76367eef6341ecddcbc4f9690bce919faccc` (JS).
- **Escapes dobles:** búsqueda literal de secuencias de doble barra invertida seguidas de `n`, `s` o `d` sin coincidencias en `app.js`, `functions/api/contact.js` y `functions/api/live.js`. No se requirió corrección.
- **Noindex:** agregado `<meta name="robots" content="noindex, nofollow">` en `instituto-preview.html` y `roster-02-moriartys.html`. `bitacora-preview.html` queda pendiente de decisión editorial del responsable: confirmar si debe permanecer fuera de buscadores o si se desea publicar/indexar como `bitacora.html`. Commits: `1bd0da1bc15c156822481c459f9bdb1d015e0d63` y `f4fa9de4f506da8770635e0568f9c76395881981`.
- **Colector — evidencia observable:** en `main` se encontraron ocho commits consecutivos de actualización automática de `data.json` y `platform-stats.json`, desde `2026-11-13T23:02:12Z` hasta `2026-11-14T04:27:30Z`. El `data.json` de `main` registra `updated_at=2026-11-14T04:27:29Z`. Esto confirma que hubo recolecciones y persistencia posteriores a los fallos informados, pero no reemplaza la inspección del historial de Actions ni demuestra por sí solo que todas las ejecuciones programadas terminaran en verde.
- **Causa del fallo de credencial:** no se pudo recuperar el historial de las cuatro ejecuciones fallidas ni sus logs con las acciones de GitHub disponibles en esta sesión. Por lo tanto no se atribuye una causa concreta (secreto ausente, nombre incorrecto, alcance u otra) ni se afirma cómo se corrigió. La rama `main` tiene el workflow activo sin un paso de preflight de secretos; `auditoria-ux` agrega validación explícita de presencia de `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` sin imprimir valores. La revisión de Secrets sigue pendiente de confirmación segura en Settings → Secrets and variables → Actions.
- **Validación de código:** el último workflow de validación consultable antes de estos cambios fue #43553044233, exitoso sobre el commit `66dfda6ddcc44bd1ccaf1e96af4cb3762847874a`. No se obtuvo un run asociado al nuevo HEAD; la validación de los cambios recién agregados queda pendiente de un CI del HEAD final.
- **QA de navegador:** pendiente confirmar 1440 px, 768 px y 390 px; probar `#a"b` y `#%E0%A4%A`; probar los dos caminos de ejecución (preview `*.pages.dev` y servidor local con `HAS_API=false`). No se declara QA visual/funcional completada.
- **Imágenes y Lighthouse:** `scripts/add_image_dimensions.py` no está presente en la rama consultada y no se localizó como archivo adjunto/material de trabajo accesible; no se ejecutó ni se inventaron dimensiones. Lighthouse no se ejecutó: faltan navegador/runner y acceso de medición a los dos dominios. Queda pendiente reportar medianas reales de tres corridas por entorno.
- **Pendientes restantes:** decisión sobre indexación de Bitácora; historial de Actions y causa documentada del fallo de credenciales; revisión segura de Secrets; CI del HEAD final; QA en los tres anchos y hashes inválidos; dimensiones de imágenes; Lighthouse x3 en producción y preview; actualización final del PR con run del HEAD cuando exista. No se fusiona sin aprobación explícita.

---

## 2026-11-14 — Pulido de Estadísticas y expediente MORIARTYS (QA de capturas)

- **Alcance:** correcciones puntuales en la rama `auditoria-ux`, a partir de las capturas aportadas para Estadísticas, el directorio multiplataforma y el expediente MORIARTYS. No se modificó `main`, no se fusionó el PR #46 y no se cambió el hosting.
- **Timestamps multiplataforma:** las marcas de captura de YouTube y Kick dejan de imprimirse como ISO UTC crudo. Se convierten con el helper compartido `formatArgentinaDateTime` y la zona `America/Argentina/Buenos_Aires`, manteniendo la fuente y fecha/hora de captura de cada conjunto. Esto evita mezclar visualmente una hora local con otra expresada en UTC.
- **Estados de espectadores:** las tarjetas Twitch distinguen ahora tres situaciones: sin transmisión activa, espectadores actuales disponibles y espectadores no disponibles durante una transmisión. Si la captura está vencida, se mantiene la advertencia de estado sin confirmación.
- **Expediente MORIARTYS:** el resumen del día más activo especifica que el número entre paréntesis representa muestras en directo, no transmisiones detectadas. Se conserva la separación entre muestras, transmisiones y registros totales.
- **Datos no alterados:** no se editaron manualmente `data.json` ni `platform-stats.json`. En la rama consultada ambos registran capturas casi simultáneas: Twitch `2026-11-13T21:22:55Z` y plataformas `2026-11-13T21:22:56Z`. La captura aportada muestra una versión/lectura distinta; la diferencia observada no justifica modificar timestamps históricos sin verificar el origen del colector.
- **Pendiente de QA:** revisar en preview que las fechas se presenten en hora argentina en Estadísticas y expedientes, confirmar los estados de espectadores con un canal en directo y otro offline, y comprobar la composición responsive. La aprobación visual no se declara hasta esa revisión renderizada.
- **Commits de código:** `5e7e721762cad40739e4ff8c1352596bfed80f4e` (timestamps de plataformas y estados de espectadores) y `66dfda6ddcc44bd1ccaf1e96af4cb3762847874a` (rotulación de actividad MORIARTYS). Rama: `auditoria-ux`.
- **Validación automática:** workflow [43553044233](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43553044233), ejecución 425, finalizó con **success** sobre el commit `66dfda6ddcc44bd1ccaf1e96af4cb3762847874a`. Pasaron sintaxis JavaScript, Pages Functions, JSON, rutas/recursos, anclas, formularios y auditoría estática de accesibilidad. El registro documental posterior no modifica código.
- **Despliegue:** no se declara publicación ni cambio en producción. GitHub Pages continúa siendo producción; Cloudflare Pages se mantiene como entorno de preview.

---

## 2026-11-13 · Red de seguridad GitHub Pages y colector

- **Fecha y responsable:** 13/11/2026 · Asistencia técnica.
- **Objetivo:** mantener GitHub Pages como producción y tratar Cloudflare Pages únicamente como entorno de previews; reforzar el colector de estadísticas en la rama `auditoria-ux`.
- **Archivos modificados:** `app.js`, `.github/workflows/actualizar-stats.yml`, `INFORMES.md`.
- **Implementado:**
  - Se añadió `HAS_API = /\.pages\.dev$/.test(location.hostname)`. En GitHub Pages, los formularios abren directamente el `mailto:` construido con `buildMailto()`, sin solicitar `/api/contact`.
  - En GitHub Pages, EN VIVO recupera directamente `data.json`; la ruta `/api/live` queda reservada a previews `*.pages.dev`.
  - El workflow verifica que `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` estén presentes antes de invocar Twitch. Los errores identifican el secreto ausente sin imprimir valores.
  - Se añadió `python scripts/validate_site.py` antes del commit de datos.
  - El workflow ahora tiene `issues: write` y abre una incidencia con enlace a la ejecución si falla, evitando duplicar una incidencia abierta para el mismo run.
- **Validaciones y resultados:**
  - GitHub Actions [run 43478130620](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43478130620), asociado al commit `c15edeb07de672bd63728a2829a649e9923b18e3`: **success**. `scripts/validate_site.py`: `Roster: 8 perfiles revisados`; `Referencias locales comprobadas: 37`; `Validación estática superada`. `scripts/check_anchors.py`: `Anclas locales comprobadas: 18`; `Comprobación de anclas superada`.
  - Smoke test HTTP solicitado para GitHub Pages, Cloudflare Pages y `/api/live`: no se obtuvieron códigos HTTP. Las solicitudes de comprobación desde este entorno devolvieron error de acceso de la herramienta y el entorno de ejecución no tiene salida DNS; no se infiere un 200/404 ni se declara el endpoint probado.
  - No se modificó `main`, ningún secreto ni la configuración de hosting.
- **Pendientes / riesgos:**
  - Confirmar que los secretos `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` estén configurados en GitHub → Settings → Secrets and variables → Actions. El workflow los lee desde `secrets.*`, no desde `vars.*`; no se inspeccionaron ni modificaron sus valores.
  - La producción continúa siendo GitHub Pages. Cloudflare Pages solo genera previews; no se configura como producción.
  - Revisar el límite/cuota de builds de Cloudflare Pages y el impacto en previews; no se cambia el plan ni la configuración.
  - El CI de validación de la rama terminó correctamente. Falta una comprobación HTTP desde navegador/terminal con conectividad externa.
- **Commit:** `c15edeb07de672bd63728a2829a649e9923b18e3` — [ver commit](https://github.com/losmoriartys-cmd/legion-multiversal/commit/c15edeb07de672bd63728a2829a649e9923b18e3). Rama: `auditoria-ux`.
- **Despliegue:** no aplica; cambios confinados a `auditoria-ux`. No se publicó en producción.

---
## 2026-11-13 · Auditoría UX y robustez del sitio

- **Fecha y responsable:** 13/11/2026 · Asistencia técnica.
- **Objetivo:** implementar la auditoría UX solicitada en la rama `auditoria-ux`, con cambios acotados y sin mover, borrar ni renombrar imágenes de la raíz.
- **Archivos modificados:** `index.html`, `app.js`, `styles.css`, `functions/api/contact.js`, `functions/api/live.js`, `scripts/check_anchors.py`, `.github/workflows/validar-sitio.yml`, `bitacora-preview.html`, `_headers`, `README.md`, `CLOUDFLARE_PAGES.md` e `INFORMES.md`.
- **Implementado:**
  - Los dos formularios de reclutamiento y contacto comercial envían a `/api/contact`; la función usa Resend, honeypot, allowlist de campos, validación de correo y límites de longitud. El cliente ofrece fallback `mailto:` y botón para copiar el email.
  - Se incorporó `fetchJSON` con timeout y reintentos; skeletons, estados de error con reintento y estados vacíos para roster, estadísticas, EN VIVO, mapa y misiones. Los filtros del roster se agrupan en `<details>` en móvil y el empty state permite limpiar filtros.
  - EN VIVO consulta Twitch Helix mediante `/api/live`, con caché de 60 segundos y fallback a `data.json` que muestra fuente y antigüedad. Se agregó CTA en el hero y actualización de la navegación.
  - El botón del expediente resuelve el canal disponible, usa `rel=noopener` y queda deshabilitado cuando no hay canal.
  - Se añadieron anclas semánticas para los capítulos, conservando los IDs `#chapter-N`; se actualizaron enlaces de Bitácora y se incorporó `scripts/check_anchors.py` al workflow.
  - Las imágenes del HTML principal usan carga diferida salvo la imagen hero; se fijó prioridad alta para esa imagen, se completaron alt de los carnés del expediente BarFender y se añadió fallback para imágenes externas. Se declararon dimensiones para avatares Twitch (300×300) y cabeceras Steam (460×215).
  - Se añadió `_headers` con caché para imágenes y JSON y `X-Robots-Tag: noindex` para archivos `*-preview.html`.
  - No se movió, borró ni renombró ningún recurso de imagen de la raíz. Se preparó una propuesta de nombres y dependencias para revisión antes de cualquier operación.
- **Validaciones y resultados:**
  - GitHub Actions: [run 43382504880](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43382504880), commit `29c87bbd6b312bb3834251a1df570e52abcd57bf`: **success**.
  - `node --check app.js`: correcto.
  - `node --input-type=module --check` para ambas Pages Functions: correcto.
  - Validación JSON de los archivos de raíz: correcta.
  - `scripts/validate_site.py`: `Roster: 8 perfiles revisados.`; `Referencias locales comprobadas: 37`; `Validación estática superada.`
  - `scripts/check_anchors.py`: `Anclas locales comprobadas: 18`; `Comprobación de anclas superada.`
  - No se realizó revisión visual manual en navegador ni prueba end-to-end de Resend/Helix: requieren entorno Cloudflare y credenciales configuradas.
- **Pendientes / riesgos:**
  - Cloudflare Pages aún no está conectado como publicación. Las Pages Functions y `_headers` no se ejecutan en GitHub Pages.
  - Configurar `RESEND_API_KEY`, `RESEND_FROM` validado, `CONTACT_TO` opcional, `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` en Cloudflare Pages; después probar envío real y consulta Helix.
  - Las dimensiones intrínsecas de las imágenes locales de la raíz no se han añadido porque no se pudo verificar su metadata binaria. No se inventaron proporciones; completar esos atributos después de medir los archivos.
  - Pendiente revisión visual en escritorio y móvil, y validación funcional sobre el despliegue de Pages.
- **Commit:** implementación validada `29c87bbd6b312bb3834251a1df570e52abcd57bf` — [ver commit](https://github.com/losmoriartys-cmd/legion-multiversal/commit/29c87bbd6b312bb3834251a1df570e52abcd57bf). Rama: `auditoria-ux`.
- **Despliegue:** pendiente. No se modificó `main` ni se declaró un despliegue de producción; GitHub Pages continúa siendo la referencia.

---

## 2026-11-12 — MORIARTYS: Bitácora integral en formato Archivo Central

- **Objetivo:** unificar toda la información disponible del streamer MORIARTYS en un único expediente-libro. ARCHIVO CENTRAL deja de ser una sección aislada y pasa a ser la mecánica de lectura de la Bitácora completa.
- **Prueba piloto:** se actualiza únicamente `roster-02-moriartys.html`; no se replica todavía en los demás perfiles.
- **Estructura:** portada; identidad compartida de Demi y Ari; estadísticas del canal; actividad diaria observada; juegos; alianzas y accesos a plataformas; clips; hitos y trayectoria; oportunidades y contacto.
- **Presentación:** dobles páginas enfrentadas en escritorio, portada que se abre, lomo y papel texturado; en móvil se recorre una página por vez. Índice visual con acceso directo a cada una de las ocho páginas.
- **Fuentes:** `roster-data.json`, `creator-records.json` y `data.json`. Los registros de actividad conservan la metodología de muestreo Helix; partners y plataformas de acceso se distinguen; no se inventan hitos si el registro está vacío.
- **Alcance de la prueba:** el expediente MORIARTYS representa el canal compartido, sin mezclar sus métricas con los canales individuales de Demi o Ari.
- **Estado:** propuesta en PR #31, rama `work/bitacora-libro-moriartys-2026-11-12`. Pendiente de revisión visual y funcional en escritorio y móvil antes de integrar en `main` y replicar el patrón al resto del roster.

---


## 2026-11-12 — MORIARTYS: mejora editorial integral de la Bitácora (puntos 1 a 8)

- **Identidad:** se refuerza la presentación de Demi y Ari como dupla del canal compartido, aclarando que sus canales y estadísticas individuales no se atribuyen al expediente conjunto.
- **Estadísticas:** se reorganiza el panel en métricas de audiencia y rendimiento del muestreo. Se muestran capturas live, directos observados, promedio y pico muestreados, horas observadas y horas vistas estimadas. Se calcula el porcentaje de muestras live y se advierte cuando la cobertura es baja. Los seguidores se mantienen como no disponibles cuando Twitch no entrega el dato.
- **Actividad:** se ordenan cronológicamente los días con señal, se muestran barras comparables y un resumen automático del período. Se aclara que los días sin capturas no prueban ausencia de emisión.
- **Juegos:** se ordenan las categorías por cantidad de muestras, con participación porcentual, barras, promedio y pico observados. No se presentan como ranking ni como horas jugadas.
- **Alianzas:** se diferencian los partners confirmados (Enshrouded y Cinderia) de las plataformas de acceso a campañas/keys (Lurkit y Keymailer), evitando presentarlas como patrocinadores.
- **Clips:** se conservan los tres clips editoriales registrados y sus enlaces directos.
- **Trayectoria:** se mantiene la cronología basada en hechos fechados; al no existir hitos cargados en creator-records.json, se informa esa ausencia en lugar de inventar logros.
- **Propuesta comercial y contacto:** se incorporan formatos de activación posibles y un texto comercial orientativo, distinguiéndolos expresamente de campañas contratadas. El correo abre con asunto sugerido.
- **Validación de datos:** al corte de data.json del 12/11/2026, la ventana de 30 días contiene 239 muestras, 10 muestras live y 5 directos observados; la cobertura live es baja (4,2%). Por eso los indicadores se presentan como observaciones exploratorias, no como métricas oficiales de Twitch. Seguidores: no disponibles por permisos.
- **Alcance:** solo se modifica el piloto MORIARTYS. No se replica a otros perfiles ni se integra en main en esta etapa.



## 2026-11-12 — Corrección de acceso desde el perfil personal MORIARTYS

- Se localizó el origen de los dos accesos duplicados en `app.js`, dentro de `openHeroProfile()`.
- Para MORIARTYS, el perfil ahora presenta una única acción de lectura: `ABRIR ARCHIVO PERSONAL`, que enlaza directamente con `roster-02-moriartys.html`, el libro interactivo integral del piloto.
- Se elimina del perfil MORIARTYS el botón `ABRIR BITÁCORA COMPLETA` que abría el modal anterior y el enlace `ARCHIVO CENTRAL` que llevaba a `bitacora-preview.html` (libro general independiente).
- Se conserva el acceso a Twitch y el retorno al Roster. Los perfiles restantes mantienen temporalmente su flujo actual; esta corrección no cambia su contenido.
- Alcance: rama de trabajo del PR #31. No se integra en `main` hasta aprobación.



## 2026-11-12 — MORIARTYS: segunda dirección artística, historieta interactiva y portfolio de marca

- Se conserva la apertura de expediente aprobada por el usuario y se transforma el interior hacia una estética de historieta: trama de semitono, marcos de viñeta, contornos de tinta, sombras impresas, cintillos editoriales y paneles con jerarquía visual.
- Se refuerza el paso de hoja con giro 3D más marcado, textura de papel y animación de entrada de las páginas. Se añaden efectos sonoros originales sintetizados en el navegador para apertura y cambio de página; quedan desactivados por defecto y se activan voluntariamente mediante el control SONIDO.
- La información estadística se presenta en tarjetas identificatorias; actividad en una tabla visual; juegos en barras comparativas; alianzas en paneles de marca; clips como escenas destacadas.
- Se sustituye la página de hitos vacía por una página de activaciones comerciales: integración en partida, desafío comunitario, presentación de juegos y contenido colaborativo.
- Se retiran explicaciones internas y notas editoriales que no aportan valor a una visita comercial. La ficha conserva una línea breve de fuente/actualización para contextualizar las cifras.
- Se mantiene el alcance de piloto MORIARTYS en la rama del PR #31. No se replica al resto del roster ni se integra en main sin aprobación.
- Validación estática posterior: JavaScript embebido válido; 8 páginas; IDs HTML sin duplicados; todos los selectores de elementos usados por JavaScript tienen correspondencia en el documento. No se realizó inspección visual manual en navegador; queda pendiente calibrar composición y legibilidad en escritorio y móvil con la revisión del usuario.



## 2026-11-12 — Revisión de legibilidad y recorrido comercial MORIARTYS

- Auditoría estática de la última versión: JavaScript embebido válido; ocho páginas; sin IDs duplicados; todos los selectores DOM usados por el script apuntan a elementos existentes.
- Corrección de lectura: las hojas ahora permiten desplazamiento vertical interno para que el contenido extenso no quede recortado en escritorio o móvil; se conserva el diseño de página.
- Ficha de audiencia simplificada a cuatro indicadores legibles: promedio observado en capturas, pico capturado, directos detectados y días con actividad registrada. Se informa la base de muestreo (capturas live frente al total de registros) sin presentar la muestra parcial como analítica completa.
- Se eliminó la repetición de los formatos de colaboración en la última página. El cierre comercial presenta ahora un recorrido de briefing, concepto creativo y definición de formato/calendario.
- La revisión visual real en navegador no pudo ejecutarse: el servicio de navegador devolvió saldo de wallet insuficiente. Por tanto, no se certifica todavía la apariencia final en desktop/móvil ni el funcionamiento audible en un dispositivo real.

## 2026-11-12 — Protección del encuadre grupal y legibilidad de Origen

- En la revisión del CSS se detecta un riesgo de recorte de la ilustración grupal en móvil: la regla anterior imponía una relación 1.15:1 con `object-fit: cover`, aunque la imagen representa a los ocho integrantes actuales.
- Se elimina el recorte forzado en escritorio y móvil: la imagen conserva su proporción intrínseca, usa `object-fit: contain` y mantiene un fondo oscuro para integrar los márgenes sin ocultar personajes.
- Se mejora la lectura de la cronología aumentando el tamaño mínimo de las etiquetas, ajustando su espaciado y reforzando el interlineado y ancho de lectura de los párrafos.
- Estas correcciones se implementan en la rama del PR #32. La confirmación visual definitiva requiere inspeccionar la preview renderizada en navegador; no se declara aprobada solo por revisar CSS o por el éxito de CI.

---

## 2026-11-12 — Revisión técnica del PR #32

- Se revisa la cronología y se confirma la corrección de roles: Demian y ROD3R1K como punto de partida; Akuma como tercer integrante; Ardipi como cuarto miembro de la primera formación; Habitos (canal `Habitos_Atomicos`) y Patoexpone como colaboradores.
- Se comprueba que las tres imágenes editoriales definidas para Origen aparecen una sola vez en el HTML y que no quedan referencias a «Mismo Hábitos» ni «Mismo Habitos» en `index.html` o este informe.
- Se mejora la carga de la imagen principal de Origen: texto alternativo descriptivo, carga eager y prioridad alta para evitar que un recurso visible al inicio quede relegado.
- El cambio se mantiene aislado en la rama del PR #32; no se modifica `main` ni se integra el pull request.
- Validación del último commit: el workflow «Validar código y datos del sitio» fue iniciado y quedó en cola (`queued`). No se declara aprobado hasta obtener un resultado final. La inspección visual real en escritorio y móvil sigue pendiente.

---

## 2026-11-12 — Confirmación de la ilustración grupal

- Demian confirma que la ilustración `image_20261106_125112.jpg` contiene **ocho personajes** y que los ocho representan exclusivamente a integrantes actuales de Legión Multiversal.
- Se acepta la ilustración como representación visual válida de la formación actual. No debe describirse como una imagen de siete integrantes ni confundirse con la primera formación histórica de S3X-MEN.
- Se mantiene su uso único en Origen, con encuadre que permita reconocer a los ocho personajes en escritorio y móvil.
- La identificación individual de cada personaje no se presume ni se inventa; la confirmación recibida valida la pertenencia del conjunto.

---

## 2026-11-12 — Origen: cronología fundacional confirmada

- Se precisa la secuencia de la primera formación: Demian y ROD3R1K ponen en marcha la idea; Akuma se incorpora como tercer integrante y Ardipi llega después como cuarto miembro.
- La etapa de Fortnite se conserva como referencia a una experiencia de juego, sin asociarla a incorporaciones ni personas ajenas a la formación vigente.
- Se refuerza la asignación narrativa: imagen de los fundadores para el punto de partida; portada ilustrada para Orígenes #0001; imagen grupal para representar la formación actual de Legión Multiversal.
- Se mantienen separadas la ilustración de ropa cotidiana del bloque ejecutivo de Inicio y la imagen de sala gamer del capítulo Comunidad.
- La actualización se realiza únicamente en la rama `work/origen-editorial-refinement-2026-11-12`; `main` no se modifica.
- Pendiente: comprobar visualmente los encuadres y la composición de la imagen grupal, y revisar el capítulo en navegador de escritorio y móvil. El despliegue de preview y los checks automáticos no sustituyen esa inspección.
 
---

## 2026-11-12 — MORIARTYS: reconstrucción como libro de cómic de doble página

- **Cambio de concepto:** se deja atrás el lector de una sola lámina y se reconstruye el expediente como un libro físico ilustrado. La portada funciona como tapa cerrada; al abrirla aparece el interior.
- **Escritorio:** el interior se organiza en dobles páginas enfrentadas, con lomo central, papel texturado, marcos, sombras, tinta, detalles editoriales y composición de viñetas. Cada doble página agrupa dos capítulos con identidad visual propia.
- **Móvil:** se adapta a lectura de una página por vez, conservando el paso de capítulo, gestos táctiles y controles.
- **Interacción:** apertura de tapa, transición de hoja con giro 3D, navegación por botones, puntos, teclado e índice visual de capítulos.
- **Contenido preservado:** identidad compartida de Demi y Ari; actividad muestreada del canal MORIARTYS; juegos observados; partners separados de plataformas de acceso; clips enlazados; contacto. Se conservan las fuentes dinámicas `roster-data.json`, `creator-records.json` y `data.json`.
- **Mejoras editoriales:** la portada prioriza la ilustración oficial; se añaden un índice de capítulos, composición de doble página, cajas de cómic, citas destacadas, tarjetas de datos y un cierre comercial. No se inventan métricas ni alianzas.
- **Estado:** commit `6ec4f15` en la rama de prueba del PR #30. `main` permanece intacta. Pendiente validar visualmente en navegador de escritorio y móvil; no se considera aprobado ni se publica hasta la revisión del usuario.

---

## 2026-11-12 — Roster 02: lector inmersivo de páginas completas

- **Cambio estructural solicitado:** la experiencia deja de comportarse como una página web convencional con cabecera, introducción y contenido desplazable. La cabecera y la introducción se ocultan en esta vista de portfolio.
- **Lienzo de presentación:** el lector ocupa la altura visible de la pantalla. Solo una de las siete páginas está activa; cada página se presenta como una lámina completa dentro del escenario, con controles persistentes debajo.
- **Paso de hoja:** al avanzar o retroceder, la página entrante gira sobre su eje vertical con perspectiva 3D, con dirección distinta según el sentido. El libro suma profundidad, sombra y una referencia central de encuadernación.
- **Navegación:** se conserva el contador, progreso, indicadores, flechas y teclado; se elimina el desplazamiento automático de la página al navegar. El contenido interno conserva desplazamiento de respaldo si una pantalla pequeña no permite mostrar todo.
- **Responsive:** composición adaptada a móviles; botones se compactan y la navegación táctil existente sigue habilitada.
- **Validación estática:** 7 páginas; 1 script(s); sintaxis JS: ok; balance de llaves CSS: 0.
- **Pendiente:** revisión real de escritorio y móvil para calibrar la altura y comprobar que el contenido de cada lámina cabe sin desplazamiento interno en las resoluciones objetivo. No publicar en `main` hasta aprobación del usuario.

---

## 2026-11-12 — Roster 02: segunda pasada, lectura visual tipo cómic

- **Problema detectado en revisión:** la primera iteración mejoró la carta 3D, pero las páginas interiores seguían sintiéndose como bloques de información con una transición discreta. No cumplía todavía la idea de portfolio/cómic solicitada.
- **Corrección:** se reforzó la jerarquía tipográfica, el tamaño de titulares, los paneles, las tarjetas de métricas, la tabla, los clips y los módulos de colaboración/contacto. Se pasó a un lenguaje visual más cinematográfico, con fondos oscuros, contraste, profundidad, marcos y sombras.
- **Paso de páginas:** se incorporaron transiciones direccionales con perspectiva 3D y rotación tipo hoja de cómic; avanzar y retroceder tienen movimientos opuestos. Se mantienen navegación por flechas, puntos, teclado y gestos táctiles.
- **Portada:** se amplió el espacio para la carta protagonista, manteniendo el giro interactivo, reflejo y flotación sutil.
- **Validación estática:** 7 páginas, un documento HTML, un bloque de estilos, referencias a la carta y controles presentes; JavaScript embebido pasa comprobación de sintaxis. Sigue pendiente revisión visual real en navegador.
- **Estado:** cambios aislados en `work/roster-02-living-card-portfolio-2026-11-12`; no publicados en `main`.

---

## 2026-11-12 — Roster 02: portfolio de carta viva MORIARTYS

- **Cambio de dirección visual:** se abandona la composición de portada editorial estática y se transforma el expediente en un portfolio interactivo donde la carta coleccionable ocupa el centro visual.
- **Carta protagonista:** se conserva la ilustración completa del expediente MORIARTYS y se presenta en una estructura 3D CSS con perspectiva, grosor visual, bordes, sombra, reflejo holográfico y brillo que sigue la posición del cursor.
- **Movimiento:** inclinación de la carta con el puntero, animación flotante sutil y reinicio suave al retirar el cursor. En dispositivos táctiles se puede avanzar/retroceder con gestos horizontales; se mantienen flechas, botones e indicadores.
- **Recorrido:** se conservan las siete secciones editoriales (portada + identidad, actividad, juegos, colaboraciones, clips y contacto), con transiciones de lectura tipo portfolio/cómic.
- **Responsive y accesibilidad:** adaptación de la carta a pantallas estrechas y respeto de `prefers-reduced-motion`; los controles de navegación existentes siguen disponibles.
- **Alcance:** trabajo aislado en `work/roster-02-living-card-portfolio-2026-11-12`, basado en el PR #29. No modifica `main`, el Roster público, los datos ni los assets originales.
- **Pendiente:** inspección visual manual en navegador de escritorio y móvil; calibrar el tamaño de la carta y la intensidad de inclinación con la revisión del usuario. El efecto es 3D CSS/parallax, no un modelo 3D geométrico independiente.

---

## 2026-11-12 — Rediseño editorial Roster 02: MORIARTYS

- **Objetivo:** evolucionar el prototipo visual anterior hacia un expediente narrativo de lectura secuencial, inspirado en un cómic editorial, sin modificar las ocho fichas ni la experiencia publicada.
- **Archivo nuevo:** `roster-02-moriartys.html`, aislado en la rama `work/roster-02-editorial-redesign-2026-11-12`.
- **Dirección visual:** portada de colección y siete páginas totales navegables (portada + seis interiores), jerarquía tipográfica de cómic, paneles editoriales, paleta tinta/papel/azul/rojo/dorado y adaptación responsive. Reutiliza la ilustración existente del expediente; no crea ni reemplaza imágenes.
- **Contenido:** identidad compartida de Demi y Ari; actividad del canal MORIARTYS; desglose de juegos detectados; partners separados de accesos a claves; tres clips enlazados; contacto comercial y aclaración de identidades individuales.
- **Fuentes vivas:** `roster-data.json`, `creator-records.json` y `data.json`. Las cifras se cargan en tiempo real desde el archivo del proyecto y conservan su metodología; no se atribuyen al canal individual de Ari ni al perfil individual de Demi.
- **Criterios de rigor:** las métricas son muestras propias de Twitch Helix, no analítica oficial. Se distinguen muestras, directos observados, promedio y pico muestreados y horas vistas estimadas. Los partners Enshrouded/Cinderia no se mezclan con los registros de acceso de Lurkit/Keymailer.
- **Interacción y accesibilidad:** navegación por botones, indicadores de página, flechas del teclado, estados accesibles, enlaces externos con `rel=noopener` y respeto de `prefers-reduced-motion`.
- **Alcance preservado:** no se modifica `main`, `app.js`, `styles.css`, `index.html`, las fuentes de datos ni assets. El archivo se mantiene como propuesta aislada para revisión visual antes de decidir su integración.
- **Pendiente de revisión:** inspección real en navegador de escritorio/móvil, prueba manual de navegación y contraste, revisión editorial del tono y aprobación del usuario. No se declara validación visual o funcional manual.

---

## 2026-11-12 — Cierre de la pasada editorial de capítulos 1 a 7

- **Alcance:** revisión secuencial de Inicio, Origen, Valores, Alianzas/Colaboraciones, Arsenal, En Vivo/Reclutamiento/Mapa Multiversal y Roster/Estadísticas. Se corrigieron detalles puntuales y se separaron los pendientes que dependen de verificación externa o de los creadores.
- **Origen y Comunidad:** PR #23 integrado en `main` (commit `6add428`). Las dos imágenes nuevas quedan asignadas una sola vez, con textos alternativos específicos. GitHub Actions y Cloudflare Pages: exitosos. Preview: https://work-editorial-images-origin.legion-multiversal.pages.dev. Inspección visual manual de escritorio/móvil pendiente.
- **Inicio:** el PR #22 se cerró como rama desactualizada y fue reconstruido sobre el `main` actual en el PR #24. PR #24 integrado (commit `d165be2`): CTA principal comercial, acceso a credenciales, tres recorridos segmentados y contacto final con alcance acordado. GitHub Actions y Cloudflare Pages: exitosos. Preview: https://work-executive-cover-commerc-6ug5.legion-multiversal.pages.dev. Inspección visual manual pendiente.
- **Valores:** revisión editorial y de navegación completada. Los seis principios, la promesa institucional y los dos caminos de participación ya cubren el propósito; no se agregaron textos redundantes.
- **Alianzas y Colaboraciones:** PR #25 integrado (commit `8e0ccd4`) para fechar el snapshot de Steam «Muy positivas · 330 reseñas» como corte del 07/11/2026. GitHub Actions y Cloudflare Pages: exitosos. Preview: https://work-barfender-review-snapsh.legion-multiversal.pages.dev. Se mantienen las credenciales Lurkit y Twitch con su alcance correcto; el código Epic colectivo sigue pendiente de confirmación autenticada. Los ocho clips y tres VOD de BarFender permanecen como enlaces externos; su apertura real no se certifica en esta revisión.
- **Arsenal:** la versión actual de `main` ya contiene la reconstrucción posterior: diez juegos primero, guía secundaria Keymailer/Lurkit, ocho campañas Lurkit completadas al corte 07/11/2026 y diecinueve registros Keymailer simplificados. Los PR antiguos #8 y #9 se cerraron como reemplazados; no se fusionaron para evitar reintroducir estructura anterior ni datos de estado que la presentación vigente había retirado.
- **En Vivo:** PR #26 integrado (commit `a5f5891`) para sustituir el encabezado que afirmaba que la Legión estaba en directo por un mensaje que refleja el estado real de los canales y la antigüedad de las capturas. GitHub Actions y Cloudflare Pages: exitosos. Preview: https://work-live-directory-copy-acc.legion-multiversal.pages.dev.
- **Reclutamiento y Mapa Multiversal:** revisión estática de los dos formularios, etiquetas, campos obligatorios, enlaces de correo y progreso local. Los formularios preparan un correo para revisión del remitente; no envían información automáticamente. El mapa se construye desde los ocho perfiles y el progreso local tiene alternativa en memoria si el almacenamiento está bloqueado. Pruebas reales de envío, navegación y comportamiento responsive pendientes.
- **Roster y Estadísticas:** PR #27 integrado (commit `f35c22f`) para incluir la página de juegos que el renderer de Dave — Nexus construía pero omitía, y para corregir su numeración a siete páginas. GitHub Actions y Cloudflare Pages: exitosos. Preview: https://work-dave-nexus-games-page-f.legion-multiversal.pages.dev. El roster conserva ocho perfiles y siete canales Twitch activos. El último `data.json` consultado registra una captura completa de 7/7 canales, sin omitidos, con intervalo configurado de 55 minutos y actualización `2026-11-12T18:23:16Z`. No se altera la cadencia ni se presentan datos históricos incompletos como una ventana completa.
- **Auditoría estática final de `main`:** 21 referencias de imágenes locales comprobadas sin archivos faltantes; cero IDs HTML duplicados; cero destinos rotos en navegación y llamadas `switchChapter()`; balance de llaves CSS en cero; 22 controles de formulario con etiqueta asociada; ocho perfiles y ocho registros de creador.
- **Producción:** el workflow de GitHub Pages del commit `f35c22f` finalizó con éxito (run [43284647357](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43284647357)). La validación del sitio también terminó con éxito.
- **Pendiente transversal:** las previews de Cloudflare y los checks automáticos confirman despliegue y validación técnica, pero no sustituyen la inspección visual en navegador de escritorio/móvil ni la prueba real del reproductor Twitch, enlaces de clips, formularios y navegación por teclado/lector de pantalla. No se declara esa revisión como realizada.
- **Pendientes externos/personales:** confirmar la activación del código Epic en la cuenta; validar con cada creador los títulos de clips y datos editoriales aún genéricos; confirmar la especialidad de Dave y la selección audiovisual de Akuma; revisar con los titulares los datos de plataformas que siguen siendo resúmenes aportados por ellos.
- **Trabajo reservado para una etapa mayor:** PR #13 (prototipo visual Roster 02) permanece abierto para revisión visual/funcional antes de decidir su extensión al roster completo. No se integra en esta pasada.
- **Cierres de ramas antiguas:** PR #22 queda cerrado y sustituido por #24; PR #8 y #9 quedan cerrados como versiones obsoletas de Arsenal. Ninguna de esas ramas se fusionó directamente.

---

## 2026-11-12 — Completar la secuencia del expediente DAVE — NEXUS

- **Hallazgo:** el renderer construía una página independiente de juegos y categorías a partir de las diez transmisiones visibles, pero la omitía al devolver la lista final de páginas. Como consecuencia, el contenido quedaba sin mostrar y los números de las páginas de clips y colaboración no reservaban su lugar.
- **Corrección:** se incorpora `gamesPage` entre la bitácora y los clips. El expediente pasa a siete páginas interiores/portada en total; se ajustan la numeración y los pies a `01 / 07` … `07 / 07`.
- **Conservación:** se mantienen las ocho categorías observadas, las diez filas de transmisiones, el resumen anual aportado por el creador y los dos enlaces de clips. No se inventan especialidad, horario, títulos editoriales ni nuevas métricas.
- **Validación estática:** el arreglo final incluye las siete páginas en orden; cada página tiene un número único (portada + identidad, estadísticas, bitácora, juegos, clips y colaboración); el total indicado en el pie coincide con siete.
- **Pendiente:** comprobar el giro/navegación del expediente y la lectura de tablas en navegador de escritorio y móvil. No se declara validación visual hasta inspeccionar la preview.

---

## 2026-11-12 — Precisión editorial del capítulo En Vivo

- **Hallazgo:** el encabezado «La Legión está en directo» afirmaba que había transmisiones activas incluso cuando el directorio podía mostrar todos los canales offline o una captura demorada.
- **Corrección:** se cambia por «Consultá quién está en directo» y se explica que el panel refleja el último estado registrado, distingue capturas demoradas y permite elegir un canal solo cuando hay una transmisión detectada con datos vigentes.
- **Lógica conservada:** la página vuelve a leer `data.json` cada 60 segundos; el estado en directo se considera vigente según el intervalo de muestreo configurado y la ventana de tolerancia. No se presenta como conexión en tiempo real.
- **Validación estática:** destinos internos de navegación existentes; la función de selección construye el reproductor Twitch con el hostname actual como parámetro `parent`; no se modifican datos ni credenciales.
- **Pendiente:** comprobar el directorio y el reproductor en navegador en escritorio/móvil. No se declara prueba visual ni reproducción real en esta etapa.

---

## 2026-11-12 — Fecha de corte para la valoración de Steam en BarFender

- El expediente mostraba «Muy positivas · 330 reseñas» sin indicar que era un dato aportado durante la revisión del 07/11/2026. Al ser un contador variable, podía interpretarse como actual.
- Se conserva la cifra histórica y se añade «corte 07/11/2026» junto a ella. No se reemplaza por un contador de terceros ni se presenta una cifra dinámica sin una fuente oficial integrada.
- No se alteran los resultados de la sesión, las métricas Twitch, los VOD, los clips, las imágenes ni las atribuciones.
- Validación estática pendiente de checks en la rama. La reproducción real de clips y la inspección visual responsive siguen siendo pruebas de navegador independientes.

---

## 2026-11-12 — Reconstrucción de portada ejecutiva sobre main actualizado

- **Origen:** se recuperan las mejoras del PR #22 sobre el `main` que ya contiene la integración de Origen y Comunidad del PR #23. Se conserva la nueva imagen de transición y la imagen de Comunidad sin revertir ni sobrescribir esos cambios.
- **Inicio:** CTA principal para proponer una colaboración, acceso secundario a credenciales y formatos, y línea de confianza sobre propuestas a medida, métricas con fuente y alcance acordado.
- **Recorridos comerciales:** se incorporan tres rutas diferenciadas para estudios/publishers, agencias/marcas y creadores/comunidades. Los enlaces preparan correos con asunto y guía de datos; no envían formularios ni correos automáticamente.
- **Contacto:** se aclara que participantes, entregables y condiciones se definen antes de confirmar una acción.
- **Responsive y accesibilidad:** estilos para jerarquía del hero, contraste, foco visible y distribución de tarjetas en escritorio y pantallas pequeñas.
- **Validación estática de la reconstrucción:** se conservan los 12 capítulos y sus destinos; los IDs HTML no se duplican; los enlaces internos y llamadas `switchChapter()` apuntan a capítulos existentes; el balance de llaves CSS queda en cero. Las referencias nuevas de Origen y Comunidad permanecen en una sola ubicación cada una.
- **Validación pendiente:** la rama reconstruida necesita nuevos checks de GitHub Actions y Cloudflare Pages. La inspección visual real de escritorio y móvil sigue pendiente; no se declara responsive visualmente validado.
- **Coordinación:** reconstrucción aislada en `work/executive-cover-commercial-ctas-rebased-2026-11-12`; no se modifica `main` directamente ni se altera el Roster, Estadísticas, Arsenal o los datos canónicos.

---

## 2026-11-12 — Asignación editorial de nuevas imágenes: Origen y Comunidad

- **Objetivo:** incorporar las dos imágenes nuevas recibidas sin reutilizar fotografías ni alterar el archivo visual histórico ya aprobado.
- **Origen:** `image_20261112_151833-volver-a-ropa-humana-con-guios-geek-8090-para-todo-ahora-con-estos-mismos-pers.jpg` queda asignada una sola vez al bloque ejecutivo «De S3X-MEN a Legión Multiversal». Se conserva la fotografía original del interior del capítulo Origen y el arte original de Inicio.
- **Comunidad:** `image_20261112_151833.jpg` queda asignada una sola vez como imagen principal del hero del capítulo Comunidad. Se conserva el resto del contenido del capítulo.
- **Integridad editorial:** cada archivo nuevo tiene una única referencia en `index.html`; no se reutilizan entre capítulos. La imagen anterior de Comunidad deja de repetirse con Inicio, y la ilustración anterior del bloque ejecutivo de Origen permanece solo en el interior histórico del capítulo. No se modifican Roster, Estadísticas, Alianzas, Colaboraciones, BarFender ni Arsenal.
- **Accesibilidad:** se actualizan los textos alternativos con descripciones concretas de lo que muestran las imágenes.
- **Revisión visual de assets:** ambas imágenes se inspeccionaron directamente. La de Comunidad muestra al grupo reunido alrededor de una mesa en una sala gamer retro y funciona como imagen de bienvenida comunitaria. La de Origen presenta a los mismos personajes en ropa cotidiana, con ambientación geek/arcade de los 80 y 90, adecuada para el bloque que conecta S3X-MEN con Legión Multiversal. Ambas son 16:9 (2048×1152); no requieren recorte para su función editorial.
- **Verificación técnica:** las referencias de ambos archivos existen en la raíz de `main`; la búsqueda en el HTML confirma una sola aparición por archivo y conserva una sola aparición de cada imagen anterior en su ubicación interior/original.
- **Epic Games:** se normaliza la presentación del código informado a `LOSMORIARTYS` y se conserva el estado «activación todavía no confirmada». La documentación oficial indica que el código activo se consulta dentro de la cuenta Epic, en «Creator & developer tools» → «Programs» → «Support-A-Creator». No se puede certificar desde una consulta pública que esté activo o asociado a la cuenta; queda pendiente la comprobación autenticada en el portal.
- **Alcance de esta intervención:** rama independiente `work/editorial-images-origin-community-2026-11-12`. No se modifica `main`, no se toca Arsenal ni el trabajo reservado al colaborador y no se intervienen fallos de CI.
- **Revisión visual:** assets revisados y asignaciones confirmadas. La inspección de la composición ya integrada en navegador de escritorio y móvil sigue pendiente; no se declara validación responsive ni despliegue de producción.

---

## 2026-11-11 — Normalización de numeración editorial y orden de capítulos

- **Motivo:** tras incorporar nuevas solapas y reordenar secciones, el número impreso en la cabecera de algunos capítulos ya no coincidía con su posición en la navegación. Ejemplo detectado: Origen figuraba como Capítulo 01 aunque Inicio ocupa el primer lugar.
- **Criterio editorial aplicado:** numeración secuencial por el orden actual de las solapas, incluyendo Inicio como Capítulo 01. El identificador técnico `chapter-N` se conserva para no romper enlaces, datos ni funciones internas.
- **Orden validado:** 01 Inicio; 02 Origen; 03 Roster; 04 Estadísticas; 05 Valores; 06 Comunidad; 07 Alianzas; 08 Colaboraciones; 09 En Vivo; 10 Arsenal; 11 Reclutamiento; 12 Mapa Multiversal.
- **Cambios:** se actualizan los zócalos superiores de los doce paneles, se numeran las doce solapas de navegación y se agrega el zócalo que identifica Inicio como Capítulo 01. Se conserva el nombre de cada capítulo y el contenido editorial.
- **Paginación:** anterior/siguiente ahora sigue el orden editorial explícito mediante `data-editorial-number`, no el ID técnico del panel. Esto corrige el recorrido de capítulos con IDs históricos fuera de secuencia.
- **Alcance:** `index.html`, `app.js` e `INFORMES.md`. No se modifican fotografías, roster, estadísticas ni assets.
- **Validación estática:** pendiente sobre el commit final, junto con checks de GitHub Actions y Cloudflare Pages. La inspección visual real de navegador/escritorio/móvil sigue siendo una comprobación separada.
- **Integración:** se incorpora en la etapa final del conjunto de mejoras para que la versión publicada reciba simultáneamente navegación y numeración coherentes.

---





## 2026-11-11 — Integración de producto entre Roster 02 y Bitácora (validación de preview)

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** hacer que Roster y Bitácora funcionen como dos vistas conectadas de un mismo archivo editorial, sin duplicar perfiles ni campañas.
- **Base:** rama de trabajo independiente; se incorporan los cambios vigentes de `main` antes de extender la integración.
- **Archivos modificados:** `index.html`, `app.js`, `styles.css`, `bitacora-preview.html`, `INFORMES.md`.
- **Implementado:** navegación cruzada desde Roster a Bitácora central y al archivo de colaboraciones; desde cada expediente individual se puede saltar al Archivo Central; Capítulo 12 permite regresar a la colección del Roster.
- **Fuente compartida:** la Bitácora genera su directorio de cartas desde `roster-data.json` en tiempo de ejecución, con enlaces a los expedientes individuales por hash. No se mantiene un segundo catálogo manual.
- **Identidad visual:** navegación compartida, lenguaje cromático y editorial, tarjetas compactas de expediente y jerarquía tipográfica consistente. Se conservan los diseños de carta premium ya integrados por PR #12.
- **Animación:** entrada escalonada y movimiento foil sutil sobre las cartas existentes, respetando `prefers-reduced-motion`; se evita sobrescribir el pseudo-elemento de marco de las cartas.
- **Recursos:** se reutilizan los retratos ya asignados al Roster; no se incorporan ni reasignan fotografías de campañas.
- **Validaciones:** JavaScript de `app.js` y Bitácora parsean correctamente; CSS con llaves balanceadas; directorio dinámico enlaza los ocho integrantes con los slugs utilizados por `restoreHeroProfileFromHash()`.
- **Checks del head `fa581290ec21f40cc240dbd7a49107fc53b9e83f`:** GitHub Actions `validar` = success; Cloudflare Pages = success.
- **Preview publicada:** `https://5ba031e0.legion-multiversal.pages.dev` (branch preview: `https://work-roster-02-bitacora-card.legion-multiversal.pages.dev`).
- **Revisión visual:** pendiente de inspección en navegador de escritorio y móvil; el entorno de revisión disponible no pudo abrir la URL de Cloudflare, por lo que no se declara validación visual.
- **Integridad:** no se modifica `main`, Arsenal, ni los PR #8/#9; no se alteran métricas ni datos de los integrantes.
- **Despliegue:** pendiente de checks verificables de la PR.

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


## 2026-11-07 — Reorganización editorial y guía de acceso a juegos · Arsenal / Reclutamiento

- Se reorganiza el orden real de los paneles del sitio para que el recorrido institucional siga esta secuencia: Inicio, Origen, Roster, Estadísticas, Valores, Comunidad, En Vivo, Alianzas, Colaboraciones, Arsenal y Reclutamiento.
- Se conserva el identificador técnico de cada panel (`chapter-0`, `chapter-1`, etc.). No se renumeran IDs ni se eliminan secciones, para preservar los enlaces y las funciones existentes.
- La navegación principal queda ordenada como: Inicio, Origen, Roster, Estadísticas, Valores, Comunidad, Alianzas y Colaboraciones. En “Otras secciones” quedan En Vivo, Arsenal y Reclutamiento.
- El Capítulo 12 / Colaboraciones queda después de Comunidad y Alianzas en el recorrido institucional, pero sigue visible en la navegación principal y recibe tráfico directo desde el expediente BarFender destacado en Inicio.
- Se incorpora en Arsenal una guía operativa de Keymailer y Lurkit con pasos generales para crear el perfil, conectar canales, buscar juegos/campañas, solicitar acceso y cumplir la entrega de contenido.
- Se incorporan enlaces a los sitios y centros de ayuda oficiales. La guía aclara que las solicitudes no garantizan claves y que la aprobación corresponde al publisher, desarrollador, agencia o campaña.
- Se añade un protocolo de buenas prácticas para respetar embargos, fechas, entregables y reportes; también se recomienda coordinar con antelación las solicitudes y accesos cuando una partida sea grupal.
- Se amplía Reclutamiento con una explicación de identidad propia, recursos compartidos, gestión individual y compromiso colectivo. Se aclara que pertenecer al roster no garantiza claves, patrocinios, ingresos, campañas ni crecimiento.
- Se ajusta el lenguaje de Alianzas para no presentar el uso de Keymailer o Lurkit como partnership, patrocinio o representación oficial.
- **Verificación estática inicial:** los once paneles continúan presentes; la secuencia DOM coincide con el recorrido aprobado y los once destinos están incluidos en la navegación principal o secundaria.
- **Pendiente:** revisión visual y funcional del sitio publicado en escritorio y móvil; no se declara validado el despliegue ni la experiencia visual en navegador.


## 2026-11-07 — Rediseño de Reclutamiento en dos recorridos

- Se reemplaza el formulario único de Reclutamiento por dos vías claramente separadas: **Quiero unirme a la Legión** y **Quiero colaborar con la Legión**.
- El recorrido de creadores conserva la identidad del postulante y solicita solo datos iniciales útiles: alias, canal principal, otras redes, contenido, disponibilidad y motivación. Se retira la exigencia inicial de aportar estadísticas detalladas.
- El recorrido comercial incorpora un formulario independiente para empresa/marca, contacto, correo, juego o proyecto, tipo de propuesta, fechas, presupuesto opcional y objetivos.
- Ambos formularios preparan un correo a losmoriartys@gmail.com para que la persona pueda revisarlo antes de enviarlo. Se explica expresamente ese comportamiento.
- Se mantienen los límites: ingresar al roster no garantiza claves, patrocinios, ingresos, campañas ni crecimiento; las propuestas comerciales se evalúan según cada proyecto.
- Se añaden anclas de navegación directa desde las dos tarjetas a sus formularios y estilos responsive para escritorio/móvil, con foco visible y respeto por movimiento reducido.
- **Auditoría estática:** un único panel chapter-6; existen los dos destinos y formularios; no se detectaron IDs duplicados; las 33 etiquetas section tienen su cierre correspondiente; se comprobó la presencia de reglas responsive y prefers-reduced-motion.
- **Pendiente:** probar los dos envíos en navegador sin enviar correos reales, revisar visualmente escritorio/móvil y comprobar el despliegue de GitHub Pages. La auditoría estática no acredita el comportamiento visual ni la entrega del correo.
- **Archivos modificados:** index.html, styles.css, INFORMES.md y BIBLIA_EVOLUCION_LEGION_MULTIVERSAL.md.


## 2026-11-07 — Arsenal · expediente de plataformas y campañas

- Se amplía el Capítulo 05 con un expediente documental de Keymailer y Lurkit, separado del catálogo editorial de diez juegos.
- Lurkit: se incorporan 12 registros (8 completados, 2 fallidos y 2 pendientes) y las etiquetas Partner Creator que figuran para Cinderia y Enshrouded. Se aclara que esta denominación no demuestra por sí sola un patrocinio económico ni un contrato.
- Keymailer: se incorporan los 19 registros compartidos, con fechas límite, condición Required/Allowed y el campo de interés editorial tal como fue interpretado por el usuario. Se explica expresamente que 100%/66% no son porcentajes de cumplimiento ni reputación.
- No se publica un recuento de acciones entregadas/no entregadas en Keymailer porque el texto extraído de la captura no conserva de forma fiable los indicadores visuales de estado.
- Se fecha el corte documental al 07/11/2026; las fechas límite no se presentan como datos en tiempo real.
- Se añaden enlaces a campañas Lurkit que fueron facilitados por el usuario, tarjetas de resumen, grupos desplegables y tabla con desplazamiento horizontal accesible para Keymailer.
- No se agregan imágenes de logotipos no aportadas ni se atribuyen relaciones comerciales no verificadas.
- Auditoría estática inicial: se conserva el catálogo de diez juegos; el nuevo bloque queda dentro de chapter-5 antes del catálogo; se comprueba presencia de 12 registros Lurkit y 19 filas Keymailer; se agregan estilos responsive para tablet y móvil.
- Pendiente: revisión visual en navegador y contraste real en escritorio/móvil. La inspección estática no equivale a una prueba visual ni confirma el despliegue final.
- Archivos modificados: index.html, styles.css, INFORMES.md y BIBLIA_EVOLUCION_LEGION_MULTIVERSAL.md.
## 2026-11-07 — Evolución editorial del Capítulo 08 · Alianzas

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** presentar credenciales colectivas e individuales, plataformas y oportunidades comerciales sin atribuir patrocinios ni acuerdos no confirmados.
- **Archivos modificados:** `index.html`, `chapter-8.css`, `INFORMES.md`.
- **Implementado:** se reorganizó exclusivamente `chapter-8` con apertura comercial; credencial colectiva Los Moriartys como Partner Creator de Cinderia y Enshrouded mediante Lurkit; código Epic `LosMoriartys` con estado pendiente; credenciales individuales de TheR0d3R1k (Twitch Partner y código Epic informado); bloque independiente de Lurkit, Keymailer y Epic Games; cuatro formatos comerciales; puente al expediente Barfender del Capítulo 12; transparencia y contacto.
- **Criterio de precisión:** no se afirma que el código `LosMoriartys` esté activo; no se presentan credenciales como patrocinio económico; el código de TheR0d3R1k se muestra como informado, sin atribuirle vigencia no comprobada; Barfender se presenta como experiencia documentada, no como campaña remunerada.
- **Validaciones estáticas realizadas:** se comprobó que el capítulo contiene cuatro formatos y tres plataformas; que las credenciales colectivas e individuales están separadas; que `LosMoriartys` conserva el estado pendiente; que los enlaces internos, el contacto y las dos imágenes existen; que no hay IDs duplicados; que los estilos están aislados bajo `.chapter-8-alliance`; y que los capítulos 01, 05 y 12 siguen presentes. El workflow automático de validación terminó correctamente en el commit `301215557fbceb683f6094b9041dc069387de0f9` (push y pull request). La revisión visual responsive y el despliegue quedan pendientes.
- **Pendientes / riesgos:** obtener URLs directas o capturas de los programas Lurkit de Cinderia y Enshrouded; verificar la activación de los códigos Epic antes de marcarlos como activos; probar visualmente escritorio/móvil y los enlaces internos en el sitio publicado.
- **Commits de implementación:** [a81e007](https://github.com/losmoriartys-cmd/legion-multiversal/commit/a81e00786a7be2d3c9af1fbbb7a2d2d029aa1c3b) y [3012155](https://github.com/losmoriartys-cmd/legion-multiversal/commit/301215557fbceb683f6094b9041dc069387de0f9).
- **Despliegue:** no publicado en `main`; pendiente de revisión e integración.


## 2026-11-07 — Arsenal · verificación visual de checks Keymailer

- Se recuperó directamente desde GitHub la imagen original `KeyMailer.jpg` mediante lectura base64 del archivo del repositorio; no fue necesario moverla ni volver a adjuntarla.
- La captura permite leer los checks de las últimas once filas: nueve acciones marcadas (checks verdes) y dos acciones no marcadas (cruces rojas): Hot Meals Fast Wheels — Prologue y Mall: Tidy Up Together.
- El usuario aportó los datos textuales de las ocho primeras filas (CRACK a Football Academy Simulator), pero el texto no conserva sus iconos y la captura visible comienza más abajo. Esas ocho filas se etiquetan como **No verificable en la captura**, sin inventar estados.
- Se añadió a la tabla una columna independiente “Indicador de acción”. Se mantiene separado del porcentaje de interés editorial y de las condiciones Required/Allowed.
- No se publica un total de cumplimiento de 19 campañas porque faltan ocho indicadores visuales.
- Auditoría estática pendiente de ejecutar tras los cambios y revisión visual del sitio publicado aún no realizada.

- **Auditoría estática posterior:** 19 filas de campañas y 19 celdas de indicador; 9 acciones marcadas, 2 no marcadas y 8 no verificables; los 17 nombres auditados están presentes; no se detectaron IDs HTML duplicados; la clase CSS del indicador existe. La revisión visual del sitio publicado sigue pendiente.


## 2026-11-07 — Corrección de imagen principal del expediente BARFENDER y diagnóstico de clips

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** utilizar la imagen solicitada para el expediente comercial BARFENDER y revisar el reporte de rechazo de los reproductores de Twitch.
- **Archivo modificado:** `index.html`.
- **Implementado:** se reemplazaron las cuatro referencias visuales anteriores (`barfe.jpg` y `1batalla.jpg`) por `BarFenderLos4.jpg`, alojada en la raíz del repositorio `legion-multiversal`. Esto actualiza la imagen destacada de inicio, la portada del archivo de colaboraciones y la imagen principal del expediente BARFENDER.
- **Diagnóstico de Twitch:** los ocho clips del expediente están insertados mediante el formato oficial de Twitch Clips con sus respectivos slugs/IDs y el parámetro `parent=losmoriartys-cmd.github.io`, que coincide con el dominio de GitHub Pages. Para clips no se necesita un playback ID de VOD: el slug/ID del clip es el identificador correcto. La revisión estática no permite confirmar que Twitch autorice la reproducción en el navegador ni determinar si algún clip fue eliminado, restringido o bloqueado.
- **Pendiente:** comprobar la reproducción real de los ocho embeds en la página publicada. Si Twitch sigue mostrando rechazo, solicitar captura del mensaje exacto o probar un clip concreto; no pedir playback IDs salvo que se decida insertar VODs completos en lugar de clips.
- **Commit de código:** [849e12fa](https://github.com/losmoriartys-cmd/legion-multiversal/commit/849e12fa7c846ec88f8627873d9a4887aa0e00d7).
- **Despliegue:** commit realizado en `main`; publicación de GitHub Pages y reproducción externa todavía pendientes de verificación.


## 2026-11-07 — Coordinación de auditoría visual y revisión del expediente BarFender

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** dejar registrada la próxima secuencia de trabajo y evitar conflictos con la intervención activa del Capítulo 05 — Arsenal.
- **Plan de trabajo:** 1) auditoría visual de Capítulo 00 — Portada; 2) auditoría visual de Capítulo 02 — Roster; 3) auditoría visual de Capítulo 08 — Alianzas; 4) revisión editorial, visual y funcional del Capítulo 12 — BarFender.
- **Alcance de esta etapa:** primero se revisará la versión publicada en escritorio y móvil, navegación, enlaces, legibilidad, jerarquía visual y comportamiento responsive. Se documentarán hallazgos y se propondrán correcciones concretas antes de modificar código.
- **Archivos previstos para inspección:** `index.html`, `styles.css`, `app.js`, `chapter-8.css`, recursos visuales y datos asociados a los capítulos indicados. La inspección no autoriza cambios automáticos: cada corrección se limitará a los componentes del capítulo correspondiente.
- **Aislamiento y exclusiones:** no modificar el contenido, estilos, datos, recursos ni lógica del Capítulo 05 — Arsenal; tampoco editar archivos que el responsable de Arsenal esté modificando. Si una corrección compartida afectara un archivo común, se aislará en una rama propia y se coordinará mediante PR, sin sobrescribir trabajo ajeno.
- **Secuencia de integración:** trabajar una tarea por vez, registrar resultados y validaciones en esta bitácora, revisar el diff para confirmar que no incluya cambios del Capítulo 05 y solicitar revisión antes de integrar cambios de código a `main`.
- **Estado:** coordinación registrada; auditorías visuales y revisión de BarFender pendientes de ejecución. No se declara todavía ninguna de esas revisiones como completada.
- **Despliegue:** no aplica a este registro de coordinación.

## 2026-11-07 — Sustitución de reproductores incrustados por portadas de acceso directo en el archivo BarFender

- **Objetivo:** resolver el rechazo de conexión mostrado por Twitch dentro de los ocho reproductores insertados en la página.
- **Diagnóstico confirmado por el usuario:** los enlaces externos abren correctamente cada clip en el canal correspondiente; el fallo se limita a la reproducción dentro de la página.
- **Implementación:** se retiraron los ocho `iframe` de clips del Capítulo 12 y se reemplazaron por tarjetas editoriales responsivas con identificación del canal, numeración, título conservado, portada gráfica de archivo y acceso directo al clip original en Twitch. Tanto la portada como el enlace de acción abren el destino externo en una pestaña nueva.
- **Integridad del archivo:** se conservaron los ocho slugs/destinos y la atribución individual de cada streamer. No se modificaron los VOD, las métricas ni otros capítulos.
- **Alcance visual:** las portadas son piezas gráficas editoriales de reemplazo, no miniaturas/fotogramas extraídos del video. No se inventan imágenes de los clips; la reproducción completa queda alojada en Twitch.
- **Archivos modificados:** `index.html` y `styles.css`.
- **Validación prevista:** comprobar que la sección no conserve iframes de clips, que haya ocho tarjetas y ocho enlaces externos válidos, y que el CSS mantenga la grilla responsive. La publicación en GitHub Pages y la apertura real desde el navegador del usuario quedan pendientes de confirmación.

## 2026-11-07 — Extensión de la solución de clips a los expedientes individuales y auditoría del Capítulo 08

- **Prioridad atendida:** eliminar reproductores incrustados de Twitch que podían mostrar el mismo rechazo de conexión observado en BarFender.
- **Diagnóstico:** antes del cambio quedaban siete plantillas de reproductor de Twitch Clips en `app.js`, usadas por los expedientes individuales y por el bloque de muestras. Los ocho embeds del archivo BarFender ya habían sido reemplazados en `index.html`.
- **Implementación:** las siete plantillas ahora muestran una portada gráfica editorial accesible que abre el clip original en Twitch en una pestaña nueva. Se conservan los títulos, slugs/IDs, textos de contexto y enlaces aportados cuando existen. Los destinos externos se limitan a URLs HTTPS de Twitch; si no hay URL propia, se usa el enlace público del clip a partir de su ID. No se modifican los videos de YouTube ni los reproductores de transmisiones en vivo.
- **Estilos:** se añadieron reglas para que las portadas ocupen el mismo marco 16:9 y mantengan la identidad visual de los expedientes.
- **Auditoría estática del Capítulo 08 — Alianzas:** el CSS específico está enlazado desde `index.html`; las dos imágenes locales referenciadas existen; los cinco enlaces internos apuntan a secciones presentes; no se detectaron IDs duplicados; los cuatro enlaces externos abren con `noopener noreferrer`; la acción hacia BarFender llama al capítulo 12; y hay reglas responsive para 760 px y 480 px junto con estilos de foco visible. La inspección no equivale a una prueba visual en navegador.
- **Hallazgos previos revalidados:** el expediente DAVE — NEXUS ya toma el horario desde `hero.schedule` y declara “Sin horario fijo confirmado”; el formulario de reclutamiento ya utiliza el asunto “Quiero unirme a Legión Multiversal”. Esos dos hallazgos del informe histórico están resueltos en el código actual y no requirieron cambios.
- **Archivos modificados:** `app.js`, `styles.css`, `INFORMES.md`.

- **Ajuste de validación:** la revisión posterior detectó un escape excesivo en las expresiones regulares que validan los dominios HTTPS de Twitch. Se corrigió antes de cerrar la tarea; ahora se aceptan los hosts `twitch.tv`, `www.twitch.tv` y `clips.twitch.tv`, y los demás destinos vuelven al enlace construido desde el slug.
- **Validación pendiente tras el commit:** comprobar sintaxis JavaScript, que no queden embeds de clips Twitch en las plantillas, que permanezcan los embeds de YouTube, y revisar el despliegue publicado. No se declara validación visual manual.


## 2026-11-07 — Limpieza estructural del Capítulo 01 · El Origen

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** cerrar un detalle estructural detectado al retomar el relato histórico, sin reemplazar ni mover los recursos visuales aportados.
- **Archivo modificado:** `index.html`.
- **Implementado:** se retiró una figura vacía al final del Capítulo 01 que solo contenía un epígrafe y no tenía imagen ni recurso de fondo. La composición ya contaba con la portada del primer equipo, la imagen de la primera formación, la portada de ampliación y la imagen de la primera misión; el bloque vacío generaba un marco visual sin contenido.
- **Preservado:** no se modificaron las imágenes, sus nombres, las ubicaciones existentes, el Roster, el Capítulo 05 — Arsenal ni los archivos que el otro colaborador está incorporando.
- **Validaciones estáticas:** se confirmó que las cinco imágenes utilizadas por el Capítulo 01 (incluido el emblema) existen en la raíz del repositorio; los cinco bloques narrativos principales siguen presentes; el bloque vacío fue retirado una sola vez. No se realizó inspección visual manual en escritorio/móvil.
- **Pendientes:** revisar visualmente el Capítulo 01 publicado y confirmar con el equipo que la secuencia narrativa y las atribuciones de la primera formación sean definitivas.
- **Commit:** [fd2d3d8c](https://github.com/losmoriartys-cmd/legion-multiversal/commit/fd2d3d8c2fbe2d482e03b9dbbc50426a45160a22).
- **Despliegue:** pendiente de verificar el workflow generado por este commit.

## 2026-11-07 — Reorganización visual y narrativa del Capítulo 01 · El Origen

- **Objetivo:** ordenar la secuencia de imágenes para que la portada de S3X-MEN, la primera formación y la expansión del grupo se lean en orden, sin un bloque fundacional redundante.
- **Archivo modificado:** `index.html`.
- **Implementado:** `image_20261107_021355.jpg` pasa a la portada `ORÍGENES #0001`; se retiró el bloque independiente `VIÑETA FUNDACIONAL · 002` y su encabezado repetitivo; la fotografía `image_20261106_125112.jpg` se ubica bajo `EL UNIVERSO SE HIZO MÁS GRANDE`; y `image_20261106_124855.jpg` pasa a la imagen principal de cabecera de Inicio.
- **Preservado:** no se editaron ni eliminaron archivos de imagen, no se modificó el Roster ni el Capítulo 05 — Arsenal, y se conservaron los cambios recientes de otros colaboradores.
- **Validación estática:** los cuatro reemplazos se aplicaron sobre el contenido vigente de `main`; se confirmó la ausencia del bloque `founding-origin-story` y la presencia de cada imagen en su nueva ubicación. La revisión visual real en escritorio/móvil queda pendiente.
- **Commit de implementación:** [c25cfec8](https://github.com/losmoriartys-cmd/legion-multiversal/commit/c25cfec8aea02b17d58508116bd7c747bc236384).
- **Despliegue:** pendiente de comprobar el workflow de GitHub Pages asociado a este commit.

## 2026-11-07 — Imagen de la primera misión · Capítulo 01

- **Pedido:** ubicar `image_20261106_024612-me-gusta-la-foto-pero-la-enmarcaria-coso-si-fuese (1).jpg` debajo del título **PRIMERA MISIÓN: LEGIÓN MULTIVERSAL**.
- **Implementado:** se reemplazó únicamente la imagen del bloque `legion-first-mission` en `index.html`. La portada `ORÍGENES #0001` y el resto de la secuencia permanecen sin cambios.
- **Validación estática:** el fragmento anterior se encontró en `main`, se sustituyó una sola vez y el nuevo recurso quedó en el bloque de primera misión.
- **Commit:** [c2a8f1f0](https://github.com/losmoriartys-cmd/legion-multiversal/commit/c2a8f1f0b5c9141e36d0ffed9b1e09388831b31b).
- **Despliegue y revisión visual:** pendientes de comprobar.


## 2026-11-07 — Banner grupal en la portada de Inicio

- **Pedido:** usar la imagen grupal que se ve en la captura Enca.jpg como banner horizontal por encima del título **DIFERENTES MUNDOS. UNA MISMA LEGIÓN.**, y quitar el texto que aparecía debajo de la imagen.
- **Implementado:** la imagen existente image_20261106_124855.jpg ahora ocupa una franja visual de ancho completo antes del bloque de título y presentación. Se eliminó el epígrafe inferior. La imagen original no se editó ni se reemplazó.
- **Diseño responsive:** se agregó estilo específico para escritorio y móvil; la imagen conserva su proporción sin recortar el grupo.
- **Archivos modificados:** index.html, styles.css.
- **Validaciones estáticas:** se confirmó que el banner aparece antes del título, conserva la ruta original de la imagen, no tiene epígrafe debajo y cuenta con reglas para móvil. No se modificó el Capítulo 05 — Arsenal ni ningún asset.
- **Commits:** [7a6a1b77](https://github.com/losmoriartys-cmd/legion-multiversal/commit/7a6a1b77a3ea767bcf1cd28728111be602a9cca9) (estructura) · [7dc47ab8](https://github.com/losmoriartys-cmd/legion-multiversal/commit/7dc47ab8760a8a72a711ca449cf73b9ab6f5b9c7) (estilos).
- **Pendiente:** comprobar el workflow de GitHub Pages y revisar visualmente el resultado publicado en escritorio y móvil.


## 2026-11-07 — Archivo audiovisual con clips originales y canales identificados

- **Pedido:** mejorar la sección **04 / ARCHIVO AUDIOVISUAL — OCHO MOMENTOS PARA VOLVER A LA NOCHE**, reemplazando los fondos vacíos por frames/contenido real y dando presencia a los logos o identidades de los canales.
- **Implementado:** las ocho tarjetas ahora incluyen reproductores oficiales de los clips de Twitch en formato 16:9, con carga diferida, para mostrar el contenido audiovisual original en lugar de las portadas decorativas genéricas. Cada tarjeta incorpora además una imagen circular de identificación del canal correspondiente: Los Moriartys, Lady Moriarty01 o TheR0D3R1K.
- **Diseño:** se conservaron títulos, enlaces de reproducción, contexto de los clips y la estética oscura/celeste del expediente; se mejoró la jerarquía visual de la identidad de canal y del reproductor.
- **Archivos modificados:** `index.html`, `styles.css`, `INFORMES.md`.
- **Validación estática:** se encontraron y transformaron exactamente ocho tarjetas; cada iframe usa el slug del enlace original de su propio clip y el dominio GitHub Pages como parent; se verificaron las tres rutas de imagen de canal contra el árbol del repositorio.
- **Pendiente de revisión visual:** confirmar en la web publicada que Twitch carga los reproductores correctamente en el dominio GitHub Pages y que las imágenes elegidas corresponden a los avatares/logos que el equipo quiere mostrar. Los archivos disponibles son retratos/identidades existentes del repositorio; no se inventaron logos nuevos.


## 2026-11-07 — Corrección del archivo audiovisual · avatares oficiales y tamaño de reproductores

- **Problema detectado:** la versión anterior mostraba retratos/archivos locales como identidad de canal y los reproductores estaban limitados a 16:9. Twitch establece un mínimo de 400 × 300 px para sus embeds.
- **Corregido:** las ocho tarjetas usan ahora las imágenes de perfil oficiales obtenidas de los metadatos públicos de los canales de Twitch: Los Moriartys, Lady Moriarty01 y TheR0D3R1K.
- **Reproductores:** se fijó un marco de 400 × 300 px, con dimensiones explícitas en los iframes y parent=losmoriartys-cmd.github.io. En pantallas angostas, las tarjetas conservan el ancho mínimo necesario y permiten desplazamiento horizontal para no reducir el reproductor por debajo del mínimo.
- **Archivos modificados:** index.html, styles.css, INFORMES.md.
- **Validación estática:** se comprobaron ocho iframes, ocho referencias a avatares oficiales distribuidas por canal, y las dimensiones mínimas de 400 × 300 px en el CSS y los atributos HTML.
- **Alcance de la comprobación:** la implementación está corregida en main; la reproducción efectiva debe confirmarse en el navegador publicado, ya que Twitch puede aplicar bloqueos externos o restricciones del propio servicio.


## 2026-11-07 — Archivo audiovisual BarFender · reemplazo de embeds de Twitch por portadas de acceso directo

- **Motivo:** el usuario reportó que Twitch rechazaba la conexión dentro de la página, aunque los enlaces externos abrían los clips correctamente.
- **Implementación:** se retiraron los ocho reproductores incrustados del archivo audiovisual del expediente BarFender. Cada tarjeta conserva título, canal, avatar oficial y destino original, y ahora presenta una portada editorial clicable que abre el clip en Twitch en una pestaña nueva.
- **Transparencia visual:** las portadas son composiciones gráficas del sitio; no son miniaturas ni fotogramas de los videos. La miniatura real de Twitch está disponible mediante el campo `thumbnail_url` de su API Get Clips, pero no se incorporó porque requiere acceso autenticado a la API y no se dispuso de esas URLs verificadas en esta intervención. Referencia: [documentación oficial de Twitch](https://dev.twitch.tv/docs/api/clips/).
- **Alcance:** se conservaron los ocho enlaces y la atribución de canal. No se modificaron los VOD, las métricas, las plantillas de clips de otros capítulos ni el Capítulo 05 — Arsenal.
- **Validación estática:** se reemplazaron exactamente ocho reproductores; no quedan URLs `clips.twitch.tv/embed` en `index.html`; permanecen ocho tarjetas, ocho destinos externos de Twitch y ocho identificadores de canal; se actualizaron los estilos para escritorio y móvil. Esto no sustituye una comprobación visual manual del sitio publicado.
- **Archivos modificados:** `index.html`, `styles.css`, `INFORMES.md`.
- **Pendiente:** confirmar en navegador que las ocho portadas se ven correctamente y que los ocho enlaces abren los clips esperados.


## 2026-11-07 — Actualización fotográfica del Expediente Comercial N.º 001 · BarFender

- **Solicitud:** reemplazar la fotografía asociada al expediente «BARFENDER — Cuatro creadores. Cuatro canales. Una misma partida.» por el archivo `stream4.jpg` aportado en el repositorio.
- **Implementación:** se sustituyeron las cuatro referencias a `BarFenderLos4.jpg` por `stream4.jpg` en las presentaciones del caso: ficha destacada, tarjeta de alianzas, portada del archivo colaborativo y fotografía principal del expediente comercial.
- **Accesibilidad:** se actualizaron los textos alternativos para describir la fotografía grupal de los cuatro creadores.
- **Validación estática:** el árbol de GitHub confirma que `stream4.jpg` existe en la raíz del repositorio; el HTML queda con cuatro referencias a `stream4.jpg` y ninguna referencia a `BarFenderLos4.jpg`.
- **Archivos modificados:** `index.html`, `INFORMES.md`.
- **Pendiente:** revisar visualmente la imagen ya publicada en GitHub Pages.


## 2026-11-07 — Endurecimiento de la recolección Twitch y publicación

- **Motivo:** la cadencia observada seguía muy por debajo de los 15 minutos configurados. El colector podía terminar como exitoso aunque Twitch devolviera menos canales que los siete esperados; el workflow tampoco verificaba explícitamente la integridad de la recolección.
- **Cambios en `update_stats.py`:** exige que Helix devuelva los siete canales activos, cancela la publicación si falta alguno o la respuesta no coincide con el registro esperado, ordena las muestras por fecha y registra un resumen de cobertura de cada ejecución (`collection`, canales muestreados y omitidos por el umbral anti-duplicados).
- **Cambios en `.github/workflows/actualizar-stats.yml`:** límite de duración de 8 minutos; paso de verificación explícita de los siete canales; sincronización con `main` antes del commit y hasta tres intentos de publicación con rebase, haciendo fallar el job si no puede publicar.
- **No se modificó:** el cron existente (`7,22,37,52 * * * *`), la fuente Twitch Helix, el intervalo anti-duplicados de 10 minutos ni las muestras históricas.
- **Validación pendiente:** ejecutar el workflow y comprobar en una ejecución real que Helix resuelva los siete canales, que se escriban las marcas temporales y que el push quede publicado. Esto mejora la detección de recolecciones parciales y errores de publicación; no impide por sí solo que GitHub retrase u omita eventos `schedule`.
- **Respaldo externo pendiente:** no se configuró todavía un programador independiente. Hace falta elegir/autorizar un servicio externo y proveer una credencial limitada para invocar `workflow_dispatch`; no se inventaron secretos ni se incorporaron credenciales al repositorio.

## 2026-11-07 — Corrección del orden de sincronización Git en el workflow de estadísticas

- **Hallazgo en producción:** la primera ejecución del workflow endurecido (run [#131](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42404579029)) consultó Twitch correctamente y verificó los siete canales, pero falló al publicar.
- **Causa confirmada por el log:** el paso ejecutaba `git add` antes de `git pull --rebase`; Git rechazó el rebase porque el índice ya contenía cambios preparados (`cannot pull with rebase: Your index contains uncommitted changes`).
- **Corrección:** se movió `git pull --rebase origin main` antes de `git add data.json platform-stats.json`. El commit y los tres intentos de push permanecen después de la preparación de los archivos.
- **Resultado verificado de la recolección:** la ejecución #131 resolvió los siete canales; la comprobación explícita pasó con siete canales cubiertos y siete omitidos por el umbral anti-duplicados de 10 minutos. Por eso no generó muestras nuevas en esa ejecución. Esto valida la consulta y la integridad del registro, pero no una nueva muestra por canal.
- **Pendiente:** confirmar que la siguiente ejecución publique correctamente `data.json` y `platform-stats.json`; después medir cobertura y cadencia durante 24 horas. El respaldo mediante un programador externo sigue pendiente de elegir servicio y autorizar credencial.

## 2026-11-07 — Ajuste adicional: sincronización antes de generar archivos

- **Segunda ejecución de validación:** la ejecución #132 volvió a completar la consulta Twitch y la verificación de siete canales, pero el paso de publicación falló porque los recolectores ya habían modificado archivos del árbol de trabajo cuando se intentó ejecutar `git pull --rebase`. El log confirmó `cannot pull with rebase: You have unstaged changes`.
- **Causa raíz:** la sincronización debe ocurrir antes de que los scripts generen o modifiquen `data.json` y `platform-stats.json`, no dentro del paso de guardado.
- **Corrección aplicada:** se añadió un paso `Sincronizar main antes de recolectar`, inmediatamente después del checkout/configuración de Python. Se eliminó el `git pull` del paso de publicación. La publicación ahora prepara, confirma y empuja los archivos; si el push encuentra una actualización concurrente, conserva los reintentos de fetch/rebase sobre el commit ya creado.
- **Estado:** pendiente validar una ejecución completa posterior a este cambio. Las ejecuciones #131 y #132 no publicaron sus cambios de estadísticas; la siguiente prueba determinará si el nuevo orden resuelve el bloqueo.

## 2026-11-07 — Primera ejecución completa publicada tras corregir la sincronización

- **Ejecución:** workflow #133 ([run](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42404744547)).
- **Resultado:** el job `actualizar` terminó correctamente. Checkout, sincronización previa, consulta Twitch, verificación de los siete canales, consulta multiplataforma y publicación finalizaron sin errores.
- **Publicación comprobada:** `data.json` en `main` quedó actualizado a `2026-11-07T19:08:36Z`; el objeto `collection` informa siete canales esperados, siete resueltos y `complete: true`. Los siete canales tienen `updated_at` renovado.
- **Muestras nuevas:** cero en esta ejecución; los siete canales fueron omitidos por el control anti-duplicados de 10 minutos. La ejecución demuestra que el flujo puede publicar correctamente, pero todavía no demuestra la cadencia objetivo ni el ingreso de muestras nuevas.
- **Próxima validación:** observar la ventana de 24 horas y comparar muestras reales, cobertura, mediana y máximo hueco con los umbrales definidos. Después, configurar un disparador externo para reducir la dependencia del evento `schedule` de GitHub.

## 2026-11-07 — Actualización visual del Expediente BarFender con tres ilustraciones nuevas

- **Objetivo:** incorporar las tres imágenes aportadas para BarFender, sin repetir ninguna dentro del expediente y sin modificar otros capítulos.
- **Implementación en `index.html`:**
  - `image_20261107_184951-si-que-tenga-referencias-y-el-titutlo-del-juego-ba.jpg`: portada del archivo de colaboraciones, con el título BarFender integrado.
  - `image_20261107_184728.jpg`: ilustración editorial de coordinación del equipo, en la apertura visual del expediente.
  - `image_20261107_184546.jpg`: ilustración editorial del universo de Legión Multiversal, junto a la descripción de la campaña.
- **Presentación:** se identificaron expresamente como ilustraciones editoriales; no se presentan como fotografías documentales ni como fotogramas reales del directo. Cada archivo se utiliza una sola vez en el HTML.
- **Estilos:** se añadió en `styles.css` el tratamiento responsive de la tercera pieza editorial, conservando el lenguaje visual existente.
- **Alcance:** no se modificaron métricas, VOD, clips, participantes ni enlaces a Steam/Twitch. No se tocaron los demás capítulos.
- **Validación estática:** los tres nombres de archivo están referenciados en `index.html` exactamente una vez cada uno; las dos ubicaciones fotográficas principales anteriores del expediente fueron sustituidas; se añadió el estilo específico para la pieza editorial complementaria.
- **Archivos modificados:** `index.html`, `styles.css`, `INFORMES.md`.
- **Pendiente:** comprobar el despliegue de GitHub Pages y revisar visualmente el resultado publicado en escritorio y móvil.
- **Commits:** HTML `84dae846126bad9eace342fe1bb97288b73ffaaa`; estilos `ef67d95a6796d4d995c621ef07c2b14c89d30869`; registro de esta intervención, en el commit siguiente.
- **Despliegue:** pendiente de verificación; los commits en `main` no demuestran por sí solos que GitHub Pages haya terminado de publicar.

## 2026-11-07 — Revisión visual y ajuste de encuadre de BarFender

- **Revisión de recursos:** se abrieron y comprobaron los tres archivos originales en el repositorio. La pieza `image_20261107_184951-si-que-tenga-referencias-y-el-titutlo-del-juego-ba.jpg` es la ilustración principal de BarFender con el rótulo del juego; `image_20261107_184728.jpg` muestra al equipo alrededor de una mesa de planificación; `image_20261107_184546.jpg` presenta al equipo en clave multiversal.
- **Coherencia editorial:** las tres piezas son ilustraciones de identidad/editoriales, no capturas documentales del gameplay. Sus pies de imagen y textos alternativos las identifican como tales.
- **Ajuste aplicado:** se eliminó el límite de altura y el recorte `object-fit:cover` de la ilustración editorial complementaria. Ahora conserva su proporción y encuadre completo mediante `height:auto` y `object-fit:contain`.
- **Validación de repositorio:** los tres recursos existen en la raíz de `main`; cada uno aparece exactamente una vez en el capítulo BarFender. No se encontraron referencias restantes a `stream4.jpg` dentro del capítulo.
- **Pendiente externo:** el navegador de revisión no pudo acceder a la URL de GitHub Pages en esta sesión. Por eso no se certifica todavía la publicación ni el render final en escritorio/móvil; el HTML/CSS de `main` sí quedó comprobado.
- **Commit de ajuste:** `4403e2ece8b2823c9e4b28ce7d5f7d21b4de9ebe`.


## 2026-11-07 — Corrección de asignación de imágenes entre portada y expediente BarFender

- **Motivo:** se habían cruzado los conceptos visuales de la portada institucional de colaboraciones y la apertura del expediente comercial BarFender.
- **Corrección en `index.html`:** la ilustración de coordinación del equipo (`image_20261107_184728.jpg`) quedó asignada a «CUANDO LOS UNIVERSOS SE ENCUENTRAN»; la ilustración con el título del juego integrado (`image_20261107_184951-si-que-tenga-referencias-y-el-titutlo-del-juego-ba.jpg`) quedó asignada a «EXPEDIENTE COMERCIAL · N.º 001 — BARFENDER».
- **Ajuste editorial:** se actualizaron textos alternativos y pies de imagen para que cada recurso describa correctamente su concepto. No se duplicaron ni se modificaron los archivos de imagen.
- **Alcance:** solo se intercambiaron las dos asignaciones visuales indicadas; no se alteraron las métricas, los participantes ni el resto del capítulo.
- **Commit:** `96ea4b41b3d9d763a95cec35ee327c609c47813d`.
- **Pendiente:** comprobar el render publicado en GitHub Pages; el commit en `main` no certifica por sí solo que el despliegue haya finalizado.


## 2026-11-10 — Continuación PR #5: actualización de corrección de encuadre sobre main

- **Motivo:** PR #5 quedó desactualizado respecto de `main` (139 commits por detrás) y GitHub lo marcó como `dirty`; no era seguro fusionar la rama antigua.
- **Acción:** se recrea la propuesta sobre el `main` vigente en una rama limpia, conservando el alcance original de dos archivos: estilos de encuadre y este informe.
- **Corrección conservada:** portada vertical «Orígenes #0001» completa, centrada y sin recorte tanto en el avance institucional como en el marco del Capítulo 01. No se reemplaza el recurso ni se modifica el texto narrativo.
- **Evidencia:** `error2.jpg` respalda el recorte de la portada vertical en el avance institucional. `error111.jpg` corresponde a BarFender/Capítulo 12 y queda fuera de alcance.
- **Coordinación:** no se modifica Capítulo 05 — Arsenal ni archivos del colaborador.
- **Validación:** pendiente de comprobaciones automáticas y revisión visual en escritorio/móvil sobre la versión actual de `main`.
- **Sustitución de PR:** esta rama actualizada reemplaza técnicamente la propuesta antigua #5, que queda obsoleta por divergencia histórica. No se integra automáticamente; requiere revisión y validación.
- **Despliegue:** pendiente de integración y publicación.


## 2026-11-10 — Reconstrucción del PR #6 sobre main actualizado

- **Objetivo:** recuperar la propuesta editorial de los capítulos 03 (Impacto), 09 (Comunidad) y 11 (Valores) sin arrastrar la historia divergente de la rama original.
- **Diagnóstico:** la rama original estaba 122 commits detrás de main y divergía con tres commits propios. El PR original modificaba `app.js`, `index.html` y `styles.css`.
- **Integración controlada:** se comprobó que los bloques de los capítulos 03, 09 y 11 en `index.html` no habían cambiado en main respecto de la base original; se reemplazaron únicamente esos tres bloques por la propuesta del PR. `app.js` seguía idéntico a la base original, por lo que se aplicó el cambio de estadísticas sin conflictos. Los estilos específicos se añadieron al final del CSS vigente.
- **Conservación:** se mantienen todas las actualizaciones posteriores ya presentes en main fuera de esos bloques. No se modifica el Capítulo 05 — Arsenal, ni el Capítulo 06, ni assets o datos estadísticos.
- **Criterios de datos:** se conservan las etiquetas de actividad observada y la limitación de cobertura. Streams Charts queda como fuente de referencia futura, sin simular una integración ni sumar métricas de plataformas distintas.
- **Validación previa al push:** verificación de coincidencia exacta de los tres bloques de origen con main, comprobación de que `app.js` no tuvo cambios concurrentes y comprobación de que el bloque CSS no existía previamente. Las comprobaciones automáticas y revisión visual quedan pendientes en la rama reconstruida.

## 2026-11-10 — Actualización automática del apartado «En vivo»

- **Motivo:** la sección consultaba `data.json` únicamente durante la carga inicial; una transmisión que comenzara después podía no aparecer hasta recargar manualmente la página.
- **Cambio en `app.js`:** se programa una nueva consulta de estadísticas cada 60 segundos, reutilizando `loadInstituteStats()` para actualizar el directorio de directos y los indicadores relacionados.
- **Protección:** se evita solapar solicitudes si una consulta tarda más de un intervalo.
- **Transparencia:** el apartado «En vivo» muestra la fecha/hora de los datos consultados y aclara la frecuencia de actualización.
- **Alcance:** no se modifican el roster, los canales registrados, las métricas históricas ni los capítulos editoriales. El cambio está aislado en una rama y requiere revisión y despliegue para reflejarse en la web pública.
- **Validación pendiente:** comprobar sintaxis, comportamiento de refresco y despliegue en GitHub Pages/Cloudflare Pages.


## 2026-11-11 — Corrección de cadencia declarada en estadísticas Twitch

- **Diagnóstico:** las últimas 100 ejecuciones programadas de `Actualizar estadísticas multiplataforma` finalizaron correctamente, pero sus inicios tuvieron una mediana de 52,95 minutos entre ejecuciones (percentil 90: 73,53 minutos), pese al cron configurado cada 15 minutos. En las 1.393 separaciones entre muestras del roster activo, la mediana fue de 54,48 minutos (P90: 71,27; P95: 76,87).
- **Credenciales:** Twitch se autentica correctamente; `TWITCH_CLIENT_ID` dispone de un valor alternativo en el código y `TWITCH_CLIENT_SECRET` está disponible. YouTube procesó su perfil. Kick figura explícitamente como `awaiting_secrets` porque faltan sus credenciales; no afecta la recolección de Twitch.
- **Corrección propuesta:** alinear la cadencia informada con la observada (55 minutos), evitar muestras duplicadas antes de 45 minutos y permitir estimaciones entre muestras consecutivas del mismo directo hasta 110 minutos, con un máximo estimado de 55 minutos por intervalo. Se aclara que GitHub Actions puede retrasar la programación.
- **Alcance:** `update_stats.py`, `.github/workflows/actualizar-stats.yml` y este informe. El evento `push` del colector queda limitado a `main` para evitar ejecuciones desde ramas de PR que intenten rebasarse sobre `main`. No se modifican canales, datos históricos almacenados, capítulos ni el trabajo del colaborador en Arsenal (#8/#9).
- **Validación:** pendiente de checks y revisión del PR. La corrección metodológica no garantiza que GitHub ejecute el cron cada 15 minutos; refleja la cadencia real observada.

## 2026-11-11 — Restringir ejecución manual del colector de estadísticas

- **Motivo:** la revisión del PR #11 detectó que limitar el evento `push` a `main` no impedía que `workflow_dispatch` iniciara el workflow desde una rama secundaria seleccionada manualmente. Como el job sincroniza con `main` y puede publicar en `main`, esa ruta conservaba un riesgo de incorporar cambios de una rama de trabajo.
- **Corrección:** se añadió al job `actualizar` la condición `if: github.ref == 'refs/heads/main'`. El job completo solo se ejecuta cuando la referencia seleccionada es `main`, incluidos los disparos manuales.
- **Alcance:** cambio limitado a `.github/workflows/actualizar-stats.yml` y este registro, dentro de la rama del PR #11. No se modificó `main`, no se ejecutó una recolección manual y no se tocó Arsenal (#8/#9).
- **Validación:** pendiente revisar el nuevo commit y sus checks. El check de Cloudflare Pages valida el despliegue de la vista previa, no la lógica del colector Python; la condición del job requiere además inspección estática y, si corresponde, validación específica del workflow.
- **Integración:** el PR #11 permanece sujeto a revisión y autorización expresa; no se fusiona automáticamente.


## 2026-11-11 — Incorporar pruebas de regresión para el muestreo Twitch

- **Objetivo:** agregar validación ejecutable de la metodología de estimación modificada en el PR #11, sin consultar APIs externas ni utilizar credenciales.
- **Archivos añadidos:** `tests/test_update_stats.py` y `.github/workflows/test-stats.yml`.
- **Pruebas:** seis casos cubren el cálculo entre muestras del mismo directo, el tope de 55 minutos por intervalo, el rechazo de huecos superiores a 110 minutos, el cambio de ID de directo, los períodos offline y el recorte de la ventana histórica de 30 días.
- **Automatización:** el nuevo workflow ejecuta `python -m unittest discover -s tests -v` con Python 3.12 ante pull requests a `main` que afecten al colector, las pruebas o el propio workflow.
- **Validación:** el workflow se acaba de incorporar a la rama del PR; el resultado de GitHub Actions queda pendiente. El check de Cloudflare Pages sigue siendo únicamente una validación del despliegue de vista previa.
- **Alcance:** no se ejecuta una recolección real, no se usan secretos, no se modifican datos ni canales y no se toca Arsenal (#8/#9). El PR #11 permanece abierto y no se fusiona automáticamente.


## 2026-11-11 — Integración del PR #11: cadencia real de estadísticas Twitch

- **Autorización:** integración realizada con autorización expresa del responsable del proyecto.
- **PR:** [#11 — Alinear estadísticas Twitch con la cadencia real de muestreo](https://github.com/losmoriartys-cmd/legion-multiversal/pull/11), cerrado e integrado en `main`.
- **Commit de merge:** [`49a68f4719709d937926fd4485cc1b4cbd8386fd`](https://github.com/losmoriartys-cmd/legion-multiversal/commit/49a68f4719709d937926fd4485cc1b4cbd8386fd). La referencia `main` se verificó apuntando a este mismo SHA después de la integración.
- **Cambios integrados:** cadencia de referencia de 55 minutos, umbral anti-duplicados de 45 minutos, estimaciones acotadas a 55 minutos por intervalo válido y rechazo de huecos superiores a 110 minutos; disparador `push` del colector restringido a `main`; ejecución manual del job restringida a `main`; seis pruebas de regresión y workflow de validación Python; documentación metodológica y operativa.
- **Validación previa al merge:** seis pruebas Python aprobadas en el run [42978923872](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42978923872); workflow de validación aprobado en [42978918224](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42978918224); Cloudflare Pages preview aprobado en el check [130384563465](https://github.com/losmoriartys-cmd/legion-multiversal/runs/130384563465).
- **Validación posterior al merge:** el check de Cloudflare Pages para el commit de merge terminó en `success` el 2026-11-11 a las 07:24:13 UTC. El workflow [Actualizar estadísticas multiplataforma, run 42979211798](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42979211798) terminó correctamente; el job `actualizar` finalizó en `success`.
- **Despliegue GitHub Pages:** el workflow `pages build and deployment` asociado al merge terminó como `cancelled` (run [42979210389](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/42979210389)). Por lo tanto, no se certifica con esta ejecución una publicación nueva en GitHub Pages. El check de Cloudflare Pages sí figura exitoso; no se confunde con GitHub Pages.
- **Alcance preservado:** no se tocaron Arsenal (#8/#9), sus ramas ni el trabajo del colaborador. No se modificaron canales ni credenciales.
- **Estado:** PR #11 integrado; `main` confirmado en el commit de merge. La publicación GitHub Pages queda pendiente de una ejecución no cancelada y verificación correspondiente.


## 2026-11-11 — Auditoría estática inicial de Portada / Capítulo 00

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** revisar la estructura, navegación, recursos gráficos y coherencia editorial de la portada publicada en `main`, antes de proponer modificaciones.
- **Archivos revisados:** `index.html`, `styles.css`, `app.js` y recursos de la raíz del repositorio.
- **Hallazgos de reutilización de imágenes (requieren resolución):**
  - `image_20261106_124855.jpg` aparece en el hero de Capítulo 00 y vuelve a utilizarse como hero de Capítulo 09 — Comunidad.
  - `stream4.jpg` aparece como imagen destacada de BarFender en Capítulo 00 y vuelve a utilizarse en el bloque de casos de Capítulo 08 — Alianzas.
  - `image_20261106_024612-me-gusta-la-foto-pero-la-enmarcaria-coso-si-fuese (1).jpg` aparece en el bloque de origen de Capítulo 00 y vuelve a utilizarse en Capítulo 01 — El Origen.
  - Estas tres reutilizaciones contradicen el criterio acordado de no repetir fotografías/ilustraciones entre secciones. No se reemplazó ni reasignó ningún archivo en esta auditoría.
  - El emblema `legion_logo_final_hybrid.png` se repite en cabecera y elementos de identidad institucional; se considera marca, no fotografía editorial duplicada.
- **Navegación:** los botones de acceso rápido de la portada apuntan a paneles existentes (Roster 02, Estadísticas 03, Alianzas 08, Comunidad 09, Colaboraciones 12 y Origen 01). La función `switchChapter()` comprueba la existencia del destino antes de cambiar de panel y contempla `prefers-reduced-motion`.
- **Recursos:** los cuatro recursos gráficos referenciados en la portada existen en la raíz de `main`.
- **Limitación de validación:** la inspección del HTML/CSS/JS fue estática. La URL pública no pudo abrirse con el navegador de revisión en esta sesión; por lo tanto, no se certifica todavía el render visual real ni el comportamiento responsive en escritorio/móvil.
- **Cambios de código:** ninguno. Se documentan hallazgos antes de intervenir el diseño o sustituir recursos.
- **Siguiente paso propuesto:** acordar qué recurso exclusivo debe ocupar cada una de las tres ubicaciones duplicadas, preservando la asignación que el usuario quiera mantener en los capítulos 01, 08 y 09. Luego implementar únicamente las reasignaciones aprobadas y validar el despliegue y las vistas de escritorio/móvil.
- **Despliegue:** no se requirió un nuevo despliegue; la auditoría no modificó archivos de la web.

## 2026-11-11 — Implementación de mejoras UX del Roster 02 (etapas 1 a 5)

- **Base:** `main` en `bd29f88528cd2fe11240823273195602432fd128`. Trabajo aislado en `work/roster-02-ux-accessibility-2026-11-11`; no se modifica `main`.
- **Etapa 1 — accesibilidad de cartas:** al girar una carta se actualizan `aria-hidden` e `inert` en ambas caras; solo la cara activa conserva controles accesibles. El foco se traslada al control de la cara visible y vuelve al retrato al deshacer el giro. Se añade cierre del expediente con Escape, sin interferir con el modal de bitácora que ya gestiona Escape y el foco.
- **Etapa 2 — acceso directo:** cada carta incorpora un botón visible «ABRIR EXPEDIENTE», que abre la ficha individual sin obligar a girar la carta y abrir primero la bitácora.
- **Etapa 3 — exploración:** se agregan búsqueda por nombre, alias, clasificación, áreas y plataformas; filtros por función, plataforma y formato; orden por presentación, nombre o número de expediente; contador de resultados y limpieza de filtros. Los accesos por categoría reflejan el resultado filtrado.
- **Etapa 4 — presentación visual:** se refuerza la jerarquía de las herramientas, los encabezados de categoría, los estados de foco y el botón de acceso directo, manteniendo la estética de cartas coleccionables/cómic.
- **Etapa 5 — responsive:** los controles pasan de una grilla amplia a tres/dos columnas y finalmente una columna en móvil; las cartas quedan centradas y con controles táctiles de mayor tamaño. Se mantiene la preferencia de movimiento reducido.
- **Alcance:** `index.html`, `app.js`, `styles.css` y este informe. No se modifican `roster-data.json`, imágenes, métricas ni otros capítulos. No se toca Arsenal ni PR #8/#9.
- **Validación estática inicial:** transformaciones verificadas sobre los bloques existentes; se conserva la agrupación de categorías y la lógica de expedientes/bitácoras. Pendiente ejecutar comprobaciones de sintaxis y validar el comportamiento en navegador con teclado, lector de pantalla y anchos representativos. No se declara prueba visual ni funcional real en esta etapa.
- **Pendiente:** checks de GitHub y revisión de la vista previa; el cambio no está integrado ni publicado.

## 2026-11-11 — Renovación visual avanzada de las cartas del Roster 02

- **Alcance:** ampliación visual sobre la PR #12 existente, en la misma rama de trabajo. No se altera `main`, ni se modifican los PR #8/#9 de Arsenal.
- **Cartas:** nueva jerarquía de portada, marco metálico multicapas, acabado foil/holográfico, placa de identidad, designación del personaje, clasificación, función, formato y serie. Se amplía la presencia visual del retrato y se armonizan el botón de expediente y el reverso ilustrado.
- **Identidad por integrante:** se conservan los ocho temas cromáticos existentes (estratega, titán, arcana, fantasma, inferno, nexus, orator y sage) y se refuerzan sus acentos sin imponer una plantilla cromática única.
- **Presentación del roster:** se transforman las secciones en paneles editoriales de archivo, con títulos jerarquizados, divisores y mayor separación entre grupos.
- **Recursos gráficos:** se mantienen exactamente los retratos e ilustraciones existentes de los ocho integrantes. No se solicita ni se genera material nuevo en esta etapa.
- **Responsive:** se reajustan proporciones, márgenes, tipografías y metadatos para escritorio, tablet y móvil; en móvil se conserva una carta por fila en anchos reducidos.
- **Validación pendiente:** compilar JavaScript, revisar balance CSS y comprobar el diff; luego verificar en preview el encuadre de cada retrato/ilustración, giro, texto largo y controles. Esta modificación visual no se considera aprobada hasta inspección de la vista previa.

- **Actualización de despliegue — 2026-11-11:** el commit visual `9f26759c3535d993943a5ec935749663d7067882` superó el workflow de validación y Cloudflare Pages confirmó `Deployed successfully`. Preview de rama: `https://work-roster-02-ux-accessibil.legion-multiversal.pages.dev`. La inspección automatizada disponible no permite certificar la composición visual en navegador; queda revisión humana de la preview.

## 2026-11-11 — Reorganización editorial del Capítulo 05 · Arsenal (reconstrucción sobre main)

- **Responsable:** colaboración ChatGPT + equipo del proyecto.
- **Objetivo:** integrar en una rama actualizada la corrección documental del PR #8 y la jerarquía editorial del PR #9, sin arrastrar la base antigua de esas ramas.
- **Base:** `main` después de integrar Roster 02 y Bitácora (commit `49cdf88`).
- **Implementado:** Arsenal presenta primero su introducción y las diez fichas de juegos; la guía de Keymailer/Lurkit y los registros de campañas quedan agrupados en un desplegable complementario cerrado por defecto. Las ocho campañas Lurkit completadas se expresan como estados históricos al corte 07/11/2026, sin tiempos relativos que parezcan actuales.
- **Conservación:** se mantienen las diez fichas y sus diez imágenes/portadas distintas, enlaces, datos y registros de plataformas. No se modifican assets, roster, estadísticas ni otros capítulos.
- **Validación pendiente:** revisar estructura, IDs, sintaxis, responsive, apertura del desplegable y enlaces; después ejecutar GitHub Actions y Cloudflare Pages. No se declara validación visual hasta inspeccionar la vista previa en escritorio y móvil.
- **Coordinación:** reconstrucción directa desde main porque las ramas originales #8/#9 estaban 48 commits detrás y divergidas. Los PR originales no se fusionan para evitar conflictos y duplicación de historial.
- **Estado:** rama de integración preparada para validación; main permanece sin cambios en esta etapa.


## 2026-11-11 — Arsenal: navegación, plataformas y tablas simplificadas

- Juegos cooperativos: se conservan las diez fichas y se mantienen como primera sección del capítulo.
- Plataformas: se hace visible un panel independiente para Keymailer y Lurkit; la guía operativa queda en un desplegable secundario para reducir el texto inicial.
- Lurkit: la vista principal muestra exclusivamente las ocho campañas completadas al corte documental 07/11/2026. Se retiran de la presentación los grupos fallidos y pendientes.
- Keymailer: la tabla se simplifica a juego/campaña y fecha límite. Se eliminan las columnas condición, interés editorial e indicador de acción.
- Indicadores: el resumen presenta registros Keymailer, campañas completadas Lurkit y etiquetas Partner Creator.
- Otras secciones: el acceso secundario pasa de un desplegable a una navegación visible con capítulos numerados.
- Navegación: se añade al pie de cada capítulo una botonera contextual con anterior, siguiente y volver al índice.
- Conservación: no se cambian las diez portadas ni sus enlaces. Los cambios quedan en la rama del PR #15; main permanece sin cambios.
- Validación pendiente: revisar estructura, JavaScript, CSS, responsive, conteos y checks de GitHub/Cloudflare; inspeccionar la vista previa en escritorio y móvil.

## 2026-11-11 — Etapa 1: Inicio y navegación global

- **Objetivo:** mejorar la primera impresión y permitir que una persona nueva encuentre las secciones principales sin conocer previamente la estructura del sitio.
- **Inicio:** el antiguo bloque de tres accesos rápidos se reorganiza como un directorio editorial en tres recorridos: conocer la Legión, descubrir sus actividades y conectar con la comunidad. Incluye accesos a los once capítulos existentes, sin duplicar contenido ni inventar novedades.
- **Navegación:** se hace explícita la separación entre capítulos principales y expedientes complementarios; se conserva el cambio de capítulo existente y se refuerza el estado activo. En móvil, la navegación principal puede recorrerse horizontalmente sin forzar una grilla demasiado comprimida.
- **Accesibilidad:** se incorpora un enlace para saltar al contenido, una región viva que anuncia el capítulo abierto y actualización del título del documento al navegar. Se mantienen controles nativos y foco visible.
- **Conservación:** se mantienen textos institucionales, fotografías, enlaces, capítulos, roster y estadísticas existentes. No se alteran assets ni datos canónicos.
- **Alcance:** index.html, styles.css, app.js e INFORMES.md. Esta rama se apoya temporalmente en la rama del PR #15 para no duplicar ni pisar los cambios de Arsenal; el PR de esta etapa deberá cambiar su base a main después de integrar PR #15.
- **Validación pendiente:** comprobar IDs y enlaces internos, sintaxis JavaScript, balance CSS y checks de GitHub/Cloudflare. La revisión visual de escritorio y móvil sigue pendiente; no se declara aprobada hasta inspeccionar la vista previa.


## 2026-11-11 — Reordenamiento editorial y mejora del panel de estadísticas

- **Solicitud del responsable:** establecer la numeración visible desde cero y separar capítulos principales de capítulos especiales.
- **Orden principal aprobado:** 00 Inicio; 01 Origen; 02 Valores; 03 Roster; 04 Estadísticas; 05 Comunidad; 06 Alianzas; 07 Colaboraciones.
- **Orden especial:** 08 Arsenal; 09 En Vivo; 10 Reclutamiento. El Mapa Multiversal se conserva como EXTRA independiente, sin desplazar ni renumerar los capítulos solicitados.
- **Implementación:** se reordenan los botones principales y secundarios; se actualizan los zócalos superiores y el atributo editorial de los paneles. Los IDs técnicos chapter-* se conservan para no romper enlaces, expedientes, llamadas de navegación ni datos asociados. Se corrige la referencia del texto de Origen al Roster (Capítulo 03).
- **Auditoría estadística:** el archivo actual de Twitch registra 7 canales activos, 7/7 resueltos en la última captura y 9 registros históricos en data.json (7 activos + 2 archivados). En la lectura consultada, Habitos Atomicos era el único canal en directo; los otros seis estaban offline, pero todos seguían dentro del seguimiento. Por lo tanto, la impresión de que el sistema consultaba un solo canal se debía a la presentación poco visible de los canales offline y a que la tabla completa estaba dentro de un desplegable.
- **Mejora de presentación:** se añade una tarjeta visible por cada canal activo, con estado, espectadores actuales, promedio y pico observados, horas en directo observadas, sesiones detectadas y muestras registradas. Se agrega el KPI «En directo ahora» y se mantiene la tabla técnica detallada como contenido complementario. Los datos siguen siendo muestreo propio de Twitch Helix, no analítica oficial.
- **Corrección metodológica:** una muestra omitida por la regla anti-duplicados no se interpreta como fallo de cobertura; la captura puede ser completa cuando todos los canales esperados están contabilizados entre muestras nuevas y omisiones válidas.
- **Alcance:** index.html, app.js, styles.css e INFORMES.md. No se modifican data.json, roster-data.json, credenciales, retratos ni fotografías. No se altera el contenido interno de Arsenal; únicamente se actualizan su posición y rótulo editorial.
- **Estado:** cambios preparados en la rama work/chapter-order-stats-overhaul-2026-11-11, aislada de main. Pendiente ejecutar validaciones, checks y revisar preview en escritorio/móvil. No se fusiona automáticamente.


- **En Vivo y vigencia:** el acceso especial «09 EN VIVO» recibe un indicador visual dinámico solo si la última captura es reciente y detecta transmisiones. El capítulo distingue una captura reciente de una lectura demorada; no presenta un estado antiguo como si fuera tiempo real. Se documenta que la página vuelve a leer el JSON cada 60 segundos, mientras que el colector de Twitch tiene una cadencia objetivo cercana a 55 minutos.


## Hoja de ruta acordada — mejoras anteriores, ejecución secuencial

Se conserva el compromiso de avanzar una mejora por etapa, con validación y revisión antes de pasar a la siguiente. El reordenamiento de capítulos solicitado se trata como una tarea transversal y el apartado estadístico se aborda en esta primera entrega.

1. **Portada ejecutiva:** revisar la jerarquía de presentación y los recorridos de entrada. La estructura editorial ya está implementada; queda revisión visual y ajuste fino.
2. **BarFender en Inicio:** conservar el expediente destacado, revisar asignación de imágenes y evitar reutilizar fotografías entre secciones. No sustituir recursos hasta confirmar con el responsable qué imagen nueva corresponde a cada ubicación.
3. **Jerarquía de CTA:** revisar contraste, prioridad y claridad de las acciones para visitantes, colaboradores y marcas.
4. **Estadísticas:** mostrar cobertura por canal, estados de carga/error/vacío y separar analítica externa de muestreo propio. La grilla multicanal y el control de vigencia quedan incluidos en esta rama; la ampliación histórica con Streams Charts para todo el roster requiere capturas comparables verificadas por perfil.
5. **Rendimiento y responsive:** revisar carga de recursos, estabilidad visual y navegación en escritorio, tablet y móvil.
6. **Alianzas:** revisar y ampliar los formatos comerciales y colaborativos del capítulo, con condiciones y ejemplos documentados.
7. **Audiencia LATAM:** investigar y documentar la audiencia regional y oportunidades de posicionamiento con fuentes actuales.
8. **Gráficos y campañas:** mejorar visualizaciones, lectura de campañas y presentación de resultados sin mezclar métricas incompatibles.

**Coordinación:** no se interviene en el contenido de Arsenal ni se fusionan los PR #8/#9 del colaborador desde esta tarea. Esta rama modifica la navegación global y el orden editorial, por lo que deberá reconciliarse con el trabajo de Arsenal antes de integrar. Ningún cambio se publica en main automáticamente.

## 2026-11-12 — Reconciliación del PR #20 y auditoría integral de BarFender

- Reconciliación: se preparó una rama nueva basada en el main vigente y se reaplicaron los cambios editoriales y estadísticos del PR #20 sobre esa base, evitando arrastrar su divergencia histórica. Se conservan los cuatro archivos previstos: index.html, app.js, styles.css e INFORMES.md.
- Corrección funcional: en renderLiveDirectory() se calculaba live usando fresh antes de declarar esta última variable. Se reordenó el cálculo, se valida la fecha de captura y se conserva la ventana de vigencia; esto evita el ReferenceError que podía interrumpir el directorio En Vivo.
- BarFender — imagen asignada: BarFenderLos4.jpg (presente en la raíz del repositorio) queda asignada exclusivamente al bloque «UNA SESIÓN, CUATRO PUNTOS DE VISTA». Se conserva la ilustración principal con el título del juego y la ilustración editorial secundaria, cada una en su ubicación y sin duplicarlas dentro del expediente.
- No repetición: stream4.jpg queda en una sola ubicación, la ficha destacada de Inicio. La tarjeta de Alianzas deja de reutilizar esa fotografía y pasa a una placa tipográfica propia, sin fotografía repetida.
- Diseño responsive: se incorporan estilos propios para la tarjeta BarFender de Alianzas y ajustes de composición para la portada de cuatro creadores, el encabezado del expediente y el resumen en tablet/móvil. Los breakpoints existentes de 900, 650 y 420 px se conservan y complementan.
- CTA y lectura editorial: se mantiene la acción principal de Inicio hacia el expediente 001 y el acceso desde Alianzas; la placa tipográfica hace más clara la identificación del caso sin competir con la fotografía principal.
- Validación: el deploy de preview de Cloudflare para el PR #21 terminó en «Deploy successful». La comprobación estática posterior al merge confirmó IDs HTML sin duplicados, balance CSS en cero, orden correcto de fresh antes de su uso y una sola referencia a cada imagen de BarFender revisada. El conector no devolvió runs de GitHub Actions para el commit de merge; no se declara un check de CI adicional como aprobado. La inspección visual de píxel en navegador de escritorio y móvil queda como revisión humana final.
- Alcance y seguridad: no se modifican data.json, roster-data.json, credenciales, archivos de métricas ni contenidos internos de Arsenal. La rama se entrega mediante PR para revisión antes de integrar en main.


## 2026-11-12 — Cierre de integración PR #21

- El PR #21 se fusionó correctamente mediante squash en main (commit 36ddae79c0442b625c08df9cf5af76162eb2e87c).
- El PR #20 se cerró como reemplazado por la rama reconciliada del PR #21; no se fusionó su historial divergente.
- Cloudflare informó «Deploy successful» para la preview del PR #21: https://04634d39.legion-multiversal.pages.dev.
- La validación estática post-merge confirmó cero IDs HTML duplicados, balance de llaves CSS igual a cero, cálculo de vigencia antes del filtrado de transmisiones y una referencia única a BarFenderLos4.jpg y stream4.jpg en sus ubicaciones acordadas.
- No se declara inspección visual manual de píxel: el acceso automatizado a la preview no permitió abrir la página en esta sesión. La revisión visual final en navegador queda identificada como control pendiente, no como cambio de código pendiente.


## 2026-11-12 — Conservación de la segunda ilustración editorial de BarFender

- Se mantiene BarFenderLos4.jpg como imagen específica de «UNA SESIÓN, CUATRO PUNTOS DE VISTA» y se conserva image_20261107_184546.jpg como ilustración editorial secundaria independiente. Ambas aparecen una sola vez en el expediente y no se reutilizan entre sí.
- La ilustración principal image_20261107_184951-si-que-tenga-referencias-y-el-titutlo-del-juego-ba.jpg permanece como portada del expediente. stream4.jpg continúa reservado a la ficha destacada de Inicio; la tarjeta de Alianzas mantiene su placa tipográfica sin fotografía.


## 2026-11-12 — Etapa 1: refinamiento editorial del Capítulo 01 · Origen

- Se inicia una rama aislada `work/origen-editorial-refinement-2026-11-12`, basada en el `main` consultado al comenzar esta etapa. No se modifica `main`.
- Se reorganiza la narrativa como una secuencia visual: inicio compartido, primeras incorporaciones, expansión a nuevas experiencias y transición a Legión Multiversal.
- Se corrige la cronología inicial: Demian y ROD3R1K comienzan el proyecto; Akuma se incorpora después; Ardipi es el cuarto integrante de la primera formación.
- Se elimina del relato público toda referencia a personas que ya no forman parte del proyecto. La etapa de Fortnite se mantiene como referencia a una experiencia de juego, sin asociarla a esas personas.
- Se corrigen asignaciones visuales: `image_20261104_055611.jpg` representa el punto de partida de Demian y ROD3R1K; `image_20261106_024612-me-gusta-la-foto-pero-la-enmarcaria-coso-si-fuese (1).jpg` es la portada ilustrada de Orígenes #0001; `image_20261106_125112.jpg` representa la formación actual de Legión Multiversal.
- Se preservan las asignaciones únicas de las dos imágenes nuevas del 12/11: la ilustración de ropa cotidiana permanece en Inicio y la imagen de sala gamer permanece en Comunidad.
- Se incorporan estilos editoriales específicos para Origen y breakpoints de escritorio/tablet/móvil.
- No se inventan fechas ni se fuerza un orden no confirmado para las incorporaciones posteriores.
- Estado: implementación inicial en rama de trabajo. Pendiente: validaciones automáticas y revisión de la preview real en escritorio y móvil antes de solicitar revisión del cierre visual.


## 2026-11-12 — Precisión de roles: colaboradores en Origen

- Se explicita en la cronología que Habitos (canal `Habitos_Atomicos`) y Patoexpone se incorporan como colaboradores, no como integrantes de la formación histórica.
- Se distinguen sus aportes: Habitos desde la filosofía, los hábitos y la conversación; Patoexpone desde la programación, la divulgación y los contenidos educativos.
- Se comprobó que el sistema del Roster ya contempla ambos expedientes dentro del grupo funcional `COLABORADORES`, con sus perfiles diferenciados. No se altera su categoría ni se los presenta como miembros fundadores.
- El archivo de Colaboraciones mantiene su función de registrar experiencias y campañas documentadas; no se crea una campaña ni una alianza ficticia por el hecho de que existan estos perfiles de colaboración.
- Pendiente: volver a ejecutar los checks del PR y revisar visualmente la preview en escritorio y móvil. Esta actualización no implica aprobación visual ni integración en `main`.


### Ajuste editorial · Orígenes #0001
- Se reemplazó la imagen de portada asociada al epígrafe “ORÍGENES #0001 · Una nueva identidad para una historia que continúa.” por `image_20261107_021355.jpg`, ya presente en el repositorio.
- El cambio se limita a esa portada; no altera la imagen grupal del presente ni la cronología histórica.


## Auditoría editorial y estructural · 12/11/2026
- Portada ejecutiva: se amplía el bloque del lema para alinear su ancho con el resto del contenido y evitar cortes visuales.
- Origen: se conserva `image_20261107_021355.jpg` como portada de ORÍGENES #0001 y se añade versión de caché para que el navegador no siga mostrando el recurso anterior.
- Roster: se cambia `auto-fill` por `auto-fit` en la grilla de expedientes; así no se reservan columnas vacías a la derecha.
- Estadísticas: el colector `data.json` registra siete canales Twitch activos y captura completa (7/7). El roster tiene ocho expedientes, pero Oratoris está registrado como creador de YouTube; no se cuenta falsamente como canal Twitch. Se aclara la cobertura en el panel.
- Alianzas: se actualiza el código Epic compartido a estado confirmado y se incorpora el ID de creador entregado por la administración. Se mantiene separado el código individual confirmado de TheR0D3R1K.
- Colaboraciones/Arsenal: el archivo existente de Lurkit y Keymailer se mueve íntegro a un capítulo documental nuevo 08.5, separado de los diez juegos cooperativos del Arsenal.
- En Vivo: se retira la leyenda técnica solicitada.
- Reclutamiento: se corrige el anidamiento HTML que dejaba el capítulo 10 dentro del panel ocultable de Arsenal. El contenido de formularios y recorridos se conserva. También se agrega la clase visual de página institucional.
- Valores y Comunidad: se conservan sin cambios estructurales, dado que fueron aprobados por la administración.
- Pendiente para el expediente BarFender 002: incorporar fecha, VOD/enlaces de los dos canales y métricas de la segunda sesión una vez recibidos. No se inventan estadísticas ni URLs.
- Validación visual final de escritorio/móvil y verificación del deployment quedan pendientes de preview renderizada.

- Colaboraciones: se incorpora el expediente 002 de Barfender (10/11/2026) para Akuma y TheR0D3R1K a partir de las muestras verificadas en `data.json`: Akuma 2 muestras (promedio 10,5; pico 16); TheR0D3R1K 4 muestras (promedio 26,3; pico 33). Se explicita que son métricas observadas por muestreo y no analíticas oficiales ni espectadores únicos. Los VOD quedan pendientes de enlace.

---

## 2026-11-12 — Auditoría de ramas sin PR y estado de integración

- **Base de auditoría:** se compararon las ramas de trabajo del repositorio contra `main`, que al iniciar esta revisión apuntaba a `5a3d6e6712b85913126ac943e3cf1fea5c388842` (integración del PR #34).
- **Actualización posterior de main:** durante la auditoría, el puntero de `main` avanzó automáticamente a `e65de3902a03ea86d13592b6831bf5aa4a3ce2fd`, con el commit `📊 Actualización automática de estadísticas multiplataforma`. Este es el HEAD más reciente observado al documentar el informe.
- **Pull requests:** la consulta de GitHub devolvió cero PR abiertos.
- **Ramas sin PR asociado identificadas:** `card-template-rollout`, `command-center-3.0` e `instituto-premium-redesign`. Se revisaron sus diferencias y el contenido de sus árboles frente a la estructura actual.
  - `card-template-rollout`: conserva una iteración anterior de plantillas y presentación de expedientes, con cambios sobre `index.html` de una arquitectura previa. No se trasplanta porque la experiencia publicada evolucionó desde entonces.
  - `command-center-3.0`: conserva una versión anterior del sitio, con estructura y contenidos previos del roster. Incluye referencias a perfiles que ya no forman parte de la formación actual; no debe reincorporarse al sitio vigente.
  - `instituto-premium-redesign`: conserva otra iteración histórica del rediseño, también basada en la arquitectura y roster anteriores. No se incorpora en bloque para evitar reintroducir contenido y recursos obsoletos.
- **Decisión de integración:** ninguna de estas tres ramas se fusiona ni se trasplanta automáticamente. No se detectó en esta revisión una pieza aislada que justifique recuperar sin una nueva comparación funcional y editorial. Se conservan las ramas como archivo histórico; no se eliminan.
- **Ramas vinculadas a PR o a integraciones anteriores:** se consideran parte del historial de trabajo ya revisado, consolidado, reemplazado o cerrado. No se deben reabrir ni fusionar por el solo hecho de que sigan apareciendo en el listado de ramas.
- **Protección de contenido vigente:** no se modificaron archivos del sitio a partir de estas ramas antiguas. La cronología pública debe conservar a Demian y ROD3R1K como iniciadores, Akuma como tercer integrante y Ardipi como cuarto; no reincorporar a ElGabii ni Capy como miembros actuales.
- **Resultado operativo:** cero PR abiertos; tres ramas históricas sin PR conservadas y clasificadas como obsoletas/no aptas para merge directo; ninguna fusión realizada durante esta auditoría.
- **Alcance de la verificación:** la comparación de ramas y la lectura de archivos no equivalen a una revisión visual del sitio publicado. La inspección manual renderizada en escritorio y móvil continúa pendiente, al igual que confirmar que el deployment de producción corresponde al HEAD más reciente de `main`.
- **Siguiente control recomendado:** verificar el deployment de producción contra `e65de3902a03ea86d13592b6831bf5aa4a3ce2fd`; después completar revisión visual responsive y, si aparece una mejora rescatable de alguna rama histórica, reaplicarla como cambio pequeño sobre `main`, nunca fusionando la rama antigua completa.


## 2026-11-13 — Cierre de corrección del Roster y auditoría de Origen/Comunidad

- **PR #35:** se cerró sin fusionar porque `main` había avanzado por actualizaciones automáticas de estadísticas. La corrección se reconstruyó sobre el HEAD vigente en el PR #36, sin arrastrar commits históricos ni datos de métricas.
- **PR #36:** fusionado mediante squash en el commit `790e32dc3bf8afdc5bb0b49df9ef22ae1eec985a`. Cambios limitados a `app.js` y `styles.css`: se cierra la grilla de dos columnas del encabezado del expediente antes de renderizar la ficha ejecutiva y se establece `width:100%; min-width:0` en `.commercial-quickview`.
- **Validaciones:** los controles `build` y `validar` del commit de integración finalizaron correctamente. Cloudflare Pages informó `Deployed successfully` para el SHA `790e32d`. La confirmación del check no equivale a inspección visual manual del sitio.
- **Origen — auditoría sobre main:** se comprobó que el capítulo ya contiene la secuencia narrativa vigente. Demian y ROD3R1K son el punto de partida; Akuma figura como tercer integrante y Ardipi como cuarto. Lady Moriarty y Dave aparecen en incorporaciones posteriores; Habitos y Patoexpone están diferenciados como colaboradores. S3X-MEN se presenta como la identidad de origen y no como marca pública actual. No aparecen ElGabii ni Capy en el relato.
- **Origen — recursos:** se verificó en el árbol de `main` la existencia de `image_20261104_055611.jpg`, `image_20261107_021355.jpg` y `image_20261106_125112.jpg`; sus referencias corresponden respectivamente al punto de partida, la portada de Orígenes #0001 y la formación actual. No se trasplantó la rama histórica `work/origen-editorial-refinement-2026-11-12`: el contenido y los estilos editoriales relevantes ya están presentes en `main`; la rama no debe fusionarse en bloque.
- **Comunidad — auditoría sobre main:** el capítulo 05 ya contiene la imagen de sala gamer `image_20261112_151833.jpg`, una introducción y tres recorridos diferenciados (descubrir, participar y pertenecer), con CTA a Roster, En Vivo y Reclutamiento. La rama histórica `work/audit-chapters-layout-collaborations-2026-11-12` no aporta cambios al bloque de Comunidad; no se reincorpora.
- **Responsive y accesibilidad:** la hoja de estilos contiene adaptación de las tarjetas de Comunidad a una columna en tablet/móvil y reglas para movimiento reducido. Esto se comprobó estáticamente; no equivale a una prueba visual en dispositivos.
- **Pendiente explícito:** la inspección renderizada de Origen, Comunidad y la ficha ejecutiva del Roster en escritorio y móvil sigue sin certificarse porque la preview no pudo abrirse con el navegador disponible en esta sesión. No se declara aprobación visual.
- **Siguiente etapa:** realizar revisión visual real de esos tres puntos; corregir únicamente defectos observables y después continuar con la unificación del lenguaje visual, accesibilidad y rendimiento. Mantener el flujo secuencial: corregir, validar, integrar y comprobar el despliegue antes de avanzar.


## 2026-11-13 — Navegación editorial y unificación de la paleta

- **PR #37 — navegación de capítulos:** integrado mediante squash en `3785c17ba7cdb69942510c3742631776ca584752`. Se retira «08.5 Campañas y accesos» de la navegación principal; el contenido queda clasificado como anexo y se abre desde un acceso nuevo en Arsenal. El anexo queda fuera del paginador secuencial, por lo que la serie principal conserva 08 Arsenal, 09 En Vivo y 10 Reclutamiento. Se corrige además la normalización del título anunciado al abrir una sección sin botón propio.
- **PR #38 — lenguaje visual de Alianzas:** integrado mediante squash en `ca561832e8b1d827a2db977c7f3b4ccfd134f1b4`. El capítulo 06 reutiliza los tokens globales para cian, amarillo, rojo, fondo y superficie. Se conserva el magenta como acento secundario de credenciales personales, no como color base del sitio. Se corrige el comentario de cabecera del CSS, que lo identificaba erróneamente como capítulo 08.
- **Validación de CSS:** se detectó que el workflow no se activaba ante cambios exclusivos de `chapter-8.css`. Se agregan los patrones `*.css` a los filtros de `push` y `pull_request`; además, `scripts/validate_site.py` pasa a comprobar referencias locales `url()` en todas las hojas CSS de la raíz, no solo en `styles.css`.
- **Pruebas del PR #38:** los dos runs de validación finalizaron con éxito; la comprobación de sintaxis JavaScript, los JSON y las referencias locales de HTML/medios/CSS pasaron. Cloudflare Pages informó `Deployed successfully` para el SHA `3007ca0` de la preview.
- **Estado de main al registrar:** SHA `ca561832e8b1d827a2db977c7f3b4ccfd134f1b4`; cero PR abiertos. Cloudflare Pages informó `Deployed successfully` para ese SHA. La validación de sitio y el build de GitHub Pages finalizaron correctamente; el job de publicación de GitHub Pages seguía en espera al último sondeo (run [43374810584](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43374810584)).
- **Inspección visual:** se intentó abrir la preview `https://945c9603.legion-multiversal.pages.dev`, pero el navegador de revisión devolvió error interno. Por eso no se certifica inspección visual ni aprobación responsive; el cambio de paleta está validado técnicamente, no visualmente.
- **Siguiente pasada:** continuar con la auditoría de componentes compartidos y consistencia tipográfica/espaciado, evitando refactorizaciones masivas de las 260 KB de CSS sin una comparación renderizada. Mantener pendiente la revisión visual real en escritorio y móvil.


## 2026-11-13 — Unificación de componentes compartidos

- **PR #39:** fusionado mediante squash en `b1a9597c7246acee27c78ddcadf2b957423e8f2d`; un solo archivo modificado (`styles.css`), sin cambios de contenido ni datos.
- **Superficies y tarjetas:** los componentes reutilizados `.premium-panel` y `.premium-card` adoptan una base institucional compartida: fondos del sistema, borde cian discreto, sombras moderadas y texto secundario uniforme. Esto alinea los paneles de En Vivo, Reclutamiento y el anexo de campañas con el lenguaje visual general.
- **Identidad por capítulo:** Arsenal conserva explícitamente su tratamiento dorado/violeta mediante reglas acotadas a `#chapter-5`; la unificación no elimina su acento editorial.
- **Controles:** navegación, CTA, botones ejecutivos y envío de formularios comparten radio de borde, foco visible de alto contraste, estado deshabilitado consistente y respeto por `prefers-reduced-motion`.
- **Validación del PR #39:** los checks `validar` finalizaron en éxito; Cloudflare Pages informó `Deploy successful` para la preview `https://561c6c0c.legion-multiversal.pages.dev`. El build de GitHub Pages también finalizó correctamente en el commit de integración.
- **Estado de main al integrar:** SHA `b1a9597c7246acee27c78ddcadf2b957423e8f2d`; cero PR abiertos al momento de la consulta. Cloudflare Pages informó `Deploy successful` para ese SHA.
- **Límite de QA:** se intentó abrir la preview `https://561c6c0c.legion-multiversal.pages.dev` y el navegador de revisión devolvió error interno. La estructura CSS y los checks fueron validados; no se declara inspección visual de escritorio/móvil.
- **Próxima tarea:** seguir con la consistencia tipográfica, jerarquía de títulos, espaciado y componentes de enlace; no ampliar la refactorización global sin capturas renderizadas que permitan comprobar el resultado visual.

## 2026-11-13 — Auditoría UX del roster y fiabilidad de métricas

- **Analítica de MORIARTYS:** se retiró el renderizador especial con cifras estáticas del 5/11/2026. La ficha ahora utiliza el mismo render histórico que el resto del roster, con fuente, período y estado parcial procedentes de `sullygnome-data.json`. Se evita presentar cifras antiguas como si fueran actuales.
- **Búsqueda del roster:** el índice incorpora biografía, voz, trayectoria y formatos/oportunidades editoriales, además de nombre, alias, clasificación, áreas y plataformas.
- **Estado vacío:** reemplazado el mensaje genérico por un estado explicativo con acción directa para restablecer filtros y búsqueda.
- **Accesibilidad y responsive:** se añadieron objetivos táctiles de al menos 44 px para controles principales, foco visible de alto contraste y ajustes de una columna para herramientas del roster en móvil. Se reforzó el respeto a `prefers-reduced-motion` en las cartas.
- **Caché:** se actualizó la versión de `app.js` y `styles.css` en `index.html` para evitar que el navegador conserve los recursos anteriores.
- **Validación estática posterior:** cero IDs duplicados; cero capítulos sin navegación y cero destinos de navegación inexistentes; renderizador de analítica obsoleto retirado; controles de búsqueda/filtros siguen presentes y conectados.
- **Límite de QA:** la apertura de producción mediante navegador web no estuvo disponible en esta sesión. No se certifica todavía la experiencia visual renderizada, el comportamiento táctil real ni el estado de despliegue de Cloudflare. La validación realizada es de código y estructura.


## 2026-11-13 — Sistema editorial compartido: tipografía, espaciado y enlaces

- Base: revisión sobre main en 6ca080eb9806039333a76c345a7cb4ab01dc9cda, preservando los ajustes de Roster y la unificación visual ya integrados.
- Tipografía: se normaliza el tamaño base con escala fluida, altura de línea y renderizado legible; se mejora el balance de títulos y el ancho de lectura de los bloques editoriales sin sustituir las familias tipográficas de identidad (Bangers, Roboto Condensed, Special Elite y Permanent Marker).
- Espaciado: se establecen medidas compartidas para el ritmo entre párrafos, listas, títulos y paneles premium; los cambios se limitan al contenido de capítulos y no reescriben las composiciones particulares.
- Enlaces e interacción: los enlaces de contenido reciben subrayado más legible y feedback hover; enlaces, botones y campos obtienen foco visible consistente. Las transiciones respetan prefers-reduced-motion y no modifican destinos ni lógica de navegación.
- Responsive y caché: se ajusta el ritmo de secciones en pantallas pequeñas y se actualiza la versión de styles.css en index.html.
- Alcance: CSS y versión de caché; sin cambios de texto, imágenes, métricas, datos ni estructura de capítulos.
- Validación automática: el workflow «Validar código y datos del sitio» finalizó correctamente para el PR #40 (run 315) y volvió a finalizar correctamente tras la integración en main (run 316).
- Integración: PR #40 fusionado mediante squash en fa2d909ff2b7b13861eea77bdc66dc9a42683223. La preview/producción de Cloudflare y la revisión visual renderizada en escritorio y móvil siguen sin confirmación en esta entrada; no se declara aprobación visual.


## 2026-11-13 — Alianzas: modelos de activación y criterios de propuesta

- Se amplía el capítulo 06 con tres escenarios ilustrativos: descubrimiento/lanzamiento, experiencia multicanal y continuidad de contenido/comunidad.
- Cada escenario distingue objetivo, activación posible, entregables a definir y lectura de resultados. La redacción evita presentar posibilidades como servicios contratados o compromisos garantizados.
- Se agrega un criterio previo de confirmación: perfiles, accesos/materiales, fechas, entregables, compensación si corresponde, divulgación publicitaria, derechos de uso y métricas disponibles deben acordarse por escrito.
- Se refuerza la metodología: métricas por canal y plataforma, sin sumar espectadores como usuarios únicos ni mezclar vistas, impresiones o audiencias incompatibles.
- Alcance: `index.html`, `chapter-8.css` e `INFORMES.md`. No se modifican credenciales, códigos, imágenes, estadísticas ni casos documentados. Los ejemplos son modelos orientativos, no campañas ejecutadas.
- Integración: PR #41 fusionado mediante squash en `6a04b2b049d06c1a65c70a74f3e66f7b668f36c1`. El workflow de validación y el build/deploy de GitHub Pages finalizaron correctamente (run 43377809536 y run 43377808852). No se declara verificación de Cloudflare ni aprobación visual; la revisión renderizada queda a cargo del responsable del proyecto.


## 2026-11-13 — Alianzas: contexto de mercado LATAM con fuentes

- Se incorpora un bloque de contexto regional en el capítulo 06, separado explícitamente de las métricas propias de Legión Multiversal.
- Se documentan 372,3 millones de jugadores regionales y crecimiento anual de ingresos del 6,4 % como cifras de mercado 2025 atribuidas a Newzoo a través del análisis publicado por gamescom latam. Se evita presentarlas como audiencia alcanzable o seguidores de nuestros canales.
- Se añade contexto argentino de un estudio Comscore de 2024 sobre 1.050 gamers activos de 18 a 65 años: el 40 % llevaba más de diez años jugando. La referencia se presenta como contexto de perfil, no como dato de audiencia del roster.
- Se traduce la evidencia en criterio comercial: segmentar por país, idioma, huso horario, plataforma y comunidad; no tratar LATAM como mercado homogéneo.
- Fuentes: https://latam.gamescom.global/en/what-sets-the-latin-american-gaming-market-apart-from-the-rest-of-the-world/ y https://www.prensario.net/Comscore-Los-numeros-del-Gaming-en-Argentina-50080.note.aspx.
- Alcance: `index.html`, `chapter-8.css` e `INFORMES.md`. Sin cambios en métricas internas, credenciales, imágenes ni campañas.
- Integración: PR #42 fusionado mediante squash en `5717276d608a411b3cf2d34d00e236cff619585a`. La validación automática post-merge finalizó correctamente (run 43378021037); el build/deploy de GitHub Pages seguía en curso al último sondeo (run 43378019981). No se declara verificación de Cloudflare ni aprobación visual; la revisión renderizada queda a cargo del responsable del proyecto.


## 2026-11-13 — Estadísticas: directorio multiplataforma del roster

- Se detectó que `platform-stats.json` ya contenía métricas públicas verificadas de YouTube para PATO — ORATORIS, pero el capítulo 04 solo mostraba las siete fichas Twitch; la presencia YouTube quedaba mencionada en una nota y visible únicamente dentro del expediente individual.
- Se incorpora un directorio multiplataforma en Estadísticas que lee `platform-stats.json` y presenta por creador/plataforma el estado de fuente, métricas acumuladas de YouTube y hasta tres publicaciones recientes con enlace, fecha y vistas. El renderer contempla también cuentas Kick si se registran y verifican en el futuro; no inventa cuentas ni valores.
- Las cifras de YouTube (suscriptores, visualizaciones totales y videos publicados) permanecen separadas de espectadores, horas y muestras de Twitch. Se aclara que son acumulados públicos, que la captura tiene fecha y que YouTube puede redondear el contador de suscriptores.
- Se actualiza la metodología para identificar `platform-stats.json` y se programa la recarga del directorio cada 15 minutos, acorde con el ciclo del colector multiplataforma.
- Se actualizan las versiones de caché de `app.js` y `styles.css`. No se cambian credenciales, archivos de datos, cuentas, imágenes ni métricas de origen.
- Alcance: `index.html`, `app.js`, `styles.css`, `INFORMES.md`.
- Validación automática: el workflow `Validar código y datos del sitio` del PR #43 finalizó correctamente (run 43378273926) y volvió a finalizar correctamente en `main` (run 43378315655). El PR #43 se fusionó mediante squash en `ae956e4bed02450f43c3647d3f600bb4f9f137bd`. El build/deploy de Pages asociado a ese SHA fue reemplazado/cancelado por la actualización documental siguiente; el despliegue de Pages del commit posterior `dc33368` finalizó correctamente (run 43378346524), incluyendo estos cambios. No se declara verificación de Cloudflare ni aprobación visual.


## 2026-11-13 — Rendimiento: carga diferida y cadencia de actualización

- Auditoría estática: `data.json` ocupa aproximadamente 487 KB y el capítulo 04 volvía a descargarlo cada 60 segundos, aunque el workflow de recolección se programa cada 15 minutos y el muestreo Twitch tiene una cadencia objetivo de 55 minutos. Se alinea la consulta del navegador a 15 minutos para evitar descargas repetidas sin datos nuevos esperables.
- La recarga del directorio multiplataforma permanece en 15 minutos, alineada con su colector.
- Se agregan `preconnect` a Google Fonts y `decoding=async` a emblemas e imágenes principales. La imagen LCP de Inicio conserva prioridad alta y carga eager; la imagen histórica del capítulo Origen deja de solicitarse eager/high mientras la sección está oculta y pasa a lazy/low. El emblema del Roster se carga de forma diferida.
- No se modifican ni recomprimen ilustraciones o logos originales. Tampoco se asignan dimensiones intrínsecas no verificadas; la reducción de peso binario y la revisión de CLS quedan como posibles pasos posteriores con medición real.
- Alcance: `index.html`, `app.js`, `INFORMES.md`. Sin cambios en contenido, datos, navegación ni assets originales.
- Integración: PR #44 fusionado mediante squash en `0b8910f875ab28128f2640f5ab87589c607ca63c`. La validación automática post-merge finalizó correctamente (run 43378599684) y el build/deploy de GitHub Pages terminó correctamente (run 43378598997). No se declara verificación de Cloudflare ni aprobación visual; la medición real de LCP/CLS y la revisión responsive quedan a cargo del responsable del proyecto.


## 2026-11-13 — Accesibilidad y seguridad de enlaces externos

- La auditoría estática de `index.html`, `bitacora-preview.html` y `roster-02-moriartys.html` no detectó imágenes sin texto alternativo, iframes sin título, IDs duplicados, controles de formulario sin etiqueta ni elementos no semánticos con `onclick`.
- Se detectó un enlace dinámico del modal de perfiles (`#modal-twitch-btn`) con `target="_blank"` sin `rel`. Se agrega `rel="noopener noreferrer"` para aislar la nueva pestaña y evitar acceso a `window.opener`.
- Alcance: `index.html`, `INFORMES.md`. Sin cambios de contenido, destinos ni comportamiento del enlace.
- Integración: PR #45 fusionado mediante squash en `1eb236fdef67e5582488c2a3787401128060ba4e`. La validación automática post-merge finalizó correctamente (run 43378868338) y el build/deploy de GitHub Pages también (run 43378867510). La revisión de teclado y lector de pantalla sigue pendiente; no se declara auditoría accesible completa.


## 2026-11-13 — Ajustes de robustez: Helix, contacto y caché

- **Alcance:** `app.js`, `functions/api/contact.js`, `functions/api/live.js`, `_headers` e `INFORMES.md`.
- **En Vivo:** se agrega actualización del directorio cada 120 segundos en el cliente; el endpoint mantiene caché de 60 segundos. Se limitan a 8 segundos las solicitudes de OAuth, roster y Twitch Helix para evitar esperas indefinidas.
- **Contacto:** se corrige la expresión regular de correo para validar espacios y punto de dominio como corresponde. Se limita el cuerpo de la solicitud a 20.000 caracteres antes de parsear JSON; se conserva honeypot, allowlist de campos, límite individual y fallback mailto.
- **Caché de imágenes:** se elimina `immutable` para imágenes con nombres no versionados. Se conserva caché de 24 horas con revalidación; JSON y API mantienen sus políticas separadas.
- **Validaciones:** pendientes de ejecución automática sobre este commit. No se declara todavía CI exitoso, despliegue ni QA visual. La revisión manual en escritorio/móvil sigue pendiente.
- **Datos y recursos:** sin cambios en roster, estadísticas, imágenes, textos editoriales ni orden de capítulos.


## 2026-11-13 — Auditoría de cargas, CTA multiplataforma y accesibilidad

- **Cargas directas:** se sustituyen las llamadas directas restantes a `fetch()` para `twitchmetrics-data.json`, `sullygnome-data.json`, `creator-records.json` y `news-data.json` por el helper común `fetchJSON`, con timeout y reintentos. El feed de novedades muestra estado de error con acción de reintento.
- **Reintentos:** se amplía el despachador para reconocer noticias, registros de creadores y fuentes de métricas, además de los recursos principales.
- **Expedientes:** se incorporan CTA para todas las plataformas declaradas con URL HTTPS válida (Twitch, YouTube, Instagram y Cafecito), sin inventar ni sustituir cuentas. La ficha comercial ya mostraba la presencia digital; ahora también está disponible en la cabecera del expediente individual.
- **Accesibilidad:** se agrega foco visible universal para controles y enlaces, se conserva el soporte de movimiento reducido y se agrega decodificación asíncrona a las ilustraciones dinámicas del roster y expediente.
- **Rendimiento:** la auditoría estática detectó 22 imágenes HTML sin atributos intrínsecos `width`/`height` sobre 40 imágenes de las páginas publicadas. No se asignan medidas ficticias; se agrega una advertencia automatizada para resolverlo con dimensiones reales y medición CLS.
- **Validación automática:** el workflow del commit 16eca075d5374055594e97ae36ca17989d390f89 finalizó correctamente (run [43387674529](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43387674529)), incluyendo la auditoría estática. No se declara prueba manual de teclado/lector de pantalla, medición Lighthouse, CLS real ni revisión visual.
- **Alcance:** `app.js`, `styles.css`, `.github/workflows/validar-sitio.yml`, `scripts/audit_accessibility.py` e `INFORMES.md`. Sin cambios de roster, cuentas, imágenes, métricas, orden de capítulos ni `main`.


## 2026-11-13 — Corrección de vigencia: En Vivo y métricas por canal

- **Base:** PR #46, rama `auditoria-ux`; no se altera `main`. Se revisaron la ruta Helix directa, el respaldo `data.json`, el directorio del capítulo 09, las tarjetas/tablas de Estadísticas y los expedientes individuales.
- **Defecto localizado:** el directorio calculaba la vigencia pero seguía renderizando la lista completa de canales con `live=true` aun cuando la captura estuviera vencida. Además, el cálculo con `Math.max(freshnessMinutes, 120)` anulaba el umbral breve de la consulta Helix. En Estadísticas y algunas fichas seguían mostrándose espectadores/categoría actuales con una captura demorada.
- **Corrección:** el directorio solo habilita reproductor y etiqueta «EN DIRECTO» cuando la lectura pasa el umbral correspondiente; con captura demorada conserva el último estado como referencia y ofrece acceso externo al canal. La consulta Helix directa usa una ventana de 3 minutos, compatible con el caché de 60 segundos del endpoint; el respaldo `data.json` mantiene el criterio histórico basado en la cadencia del colector. En fichas, tarjetas y tablas, los espectadores/categoría actuales quedan ocultos al vencer la captura y el estado pasa a «ÚLTIMA LECTURA»/«CAPTURA DEMORADA».
- **Metodología:** se unifica el fallback del intervalo Twitch en 55 minutos, acorde con `data.json` y `update_stats.py`. No se alteran snapshots, promedios históricos, roles, enlaces ni datos de los creadores.
- **Entorno:** la preview Cloudflare de `auditoria-ux` devuelve HTTP 503 en `/api/live`. Según `functions/api/live.js`, ese estado corresponde a que falta `TWITCH_CLIENT_ID` o `TWITCH_CLIENT_SECRET` en las variables del entorno; es una configuración externa que no se modifica desde el repositorio. El cliente conserva el respaldo a `data.json`.
- **Archivos:** `app.js`, `index.html` (versión de caché) e `INFORMES.md`.
- **Validación automática:** el workflow «Validar código y datos del sitio» finalizó correctamente en el commit 5f72af2ceef5be3fcea9be9195c82dede064e396 (run [43385958912](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43385958912)): sintaxis JavaScript y Pages Functions, JSON, rutas/recursos, anclas y auditoría estática de accesibilidad, todos aprobados. Cloudflare Pages confirmó «Deploy successful» para la preview [b399c4fd](https://b399c4fd.legion-multiversal.pages.dev); preview de rama: https://auditoria-ux.legion-multiversal.pages.dev.
- **Pendiente externo:** /api/live en la preview devolvió HTTP 503. El código reserva ese estado a la ausencia de TWITCH_CLIENT_ID o TWITCH_CLIENT_SECRET en el entorno; no se modificaron secretos ni variables. Se conserva el fallback a data.json.
- **QA visual:** la comprobación renderizada de escritorio/móvil continúa pendiente. Los checks estáticos y el despliegue de preview no prueban composición visual, navegación táctil ni funcionamiento real del reproductor. No se declara aprobación ni se integra el PR hasta completar esa revisión.


## 2026-11-13 — ORATORIS: alinear vistas del archivo con YouTube Data API

- **Hallazgo:** el archivo editorial de seis videos mostraba las vistas transcritas al incorporarse el listado. Para «Dopamina, motivación y adicción: Qué es y cómo funciona» conservaba 47, mientras que YouTube Data API v3 registra 48 en la captura del 13/11/2026. Los otros cinco títulos del listado coinciden con sus recuentos consultados por la API.
- **Corrección de presentación:** el render del expediente coteja por título cada producción editorial con los videos recientes que devuelve la API. Si hay coincidencia verificable, usa el recuento y enlace oficiales de esa captura; si no, conserva el número aportado, pero lo rotula como referencia compartida sin fecha. La tabla explica la procedencia de cada cifra.
- **Integridad:** no se modifica creator-records.json ni se reemplazan los valores históricos aportados por el equipo. Las métricas acumuladas del canal siguen procediendo de platform-stats.json (captura 13/11/2026); suscriptores, vistas totales y videos publicados no se mezclan con Twitch.
- **Archivos:** app.js, index.html (versión de caché) e INFORMES.md. No se cambian cuentas, enlaces del perfil, roles, historia ni datos fuente.
- **Validación posterior:** el workflow de sitio finalizó correctamente en el commit 16eca075d5374055594e97ae36ca17989d390f89 (run [43387674529](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43387674529)); Cloudflare confirmó el despliegue de preview [384fae9f](https://384fae9f.legion-multiversal.pages.dev). La revisión visual de escritorio/móvil sigue pendiente.


## 2026-11-13 — Formularios: formato de correo y validación de servidor

- **Hallazgo:** el formato del cuerpo del correo usaba separadores doblemente escapados en el cliente y en la Pages Function; eso podía dejar los caracteres literales \n en el mensaje en vez de separar los campos en líneas. La validación de campos obligatorios existía en HTML, pero no se repetía en el servidor.
- **Corrección:** los cuerpos de correo del fallback mailto y de las vistas de resumen usan saltos de línea reales. La función /api/contact ahora reconoce únicamente los dos asuntos de formulario existentes, valida del lado servidor los campos obligatorios de incorporación y propuesta comercial, verifica el URL del canal y limita el tiempo de espera de Resend a 10 segundos. Se conserva el honeypot, el límite de tamaño/campo y el fallback de correo.
- **Pendiente de protección contra abuso:** el formulario tiene honeypot, validación de campos y límites de tamaño, pero el repositorio no implementa un limitador persistente de solicitudes. Antes de habilitarlo ampliamente, configurar una regla de rate limiting/WAF para /api/contact en Cloudflare o una solución equivalente.
- **Integridad:** no se envía ningún mensaje real durante esta revisión. El comportamiento POST queda pendiente de una prueba autorizada después de configurar Resend en Cloudflare; un GET a /api/contact devuelve 405 porque el endpoint solo acepta POST.
- **Archivos:** app.js, functions/api/contact.js e INFORMES.md. No se modifican el destinatario predeterminado, credenciales ni datos de formularios.
- **Validación posterior:** el mismo workflow en el commit 16eca075d5374055594e97ae36ca17989d390f89 finalizó correctamente (run [43387674529](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43387674529)) y Cloudflare confirmó la preview [384fae9f](https://384fae9f.legion-multiversal.pages.dev). GET /api/contact devuelve 405, esperado porque la función solo acepta POST; no se probó POST ni se envió correo. La revisión visual de escritorio/móvil continúa pendiente.


## 2026-11-13 — Robustez de navegación, formularios y En Vivo (PR #46)

- **Base:** rama `auditoria-ux`; PR #46 abierto y en Draft. No se modificó `main`.
- **Navegación:** el lector de hash ahora captura secuencias percent-encoded inválidas y busca anclas semánticas por atributo exacto, sin interpolar el hash en un selector CSS. Los alias `chapter-N` siguen admitidos.
- **Formularios:** se incorpora correo obligatorio al formulario de ingreso y se alinea la validación del servidor. El honeypot cambia a `contact_hp`, excluido del contenido y de la allowlist funcional. El endpoint exige `Origin` coincidente con el origen de Pages, fija el asunto según el tipo de formulario y mantiene límites de cuerpo/campo y timeout de Resend. Los errores de validación 4xx se muestran al usuario en lugar de ocultarse detrás del fallback; el mailto codifica explícitamente asunto/cuerpo y limita el cuerpo a 1.500 caracteres.
- **En Vivo:** una actualización de estadísticas de respaldo no puede sobrescribir una lectura Helix más reciente en el mismo ciclo de página. Si el roster no contiene canales Twitch, el endpoint responde una lista vacía cacheable sin pedir token ni consultar Helix.
- **Archivos:** `app.js`, `index.html`, `functions/api/contact.js`, `functions/api/live.js`, `INFORMES.md`.
- **Validación:** workflow [43388343377](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43388343377) finalizado correctamente sobre el head `cb9ef731f363910167d1c3be41d3389b0bf52d3a`: sintaxis JavaScript y Pages Functions, JSON, rutas/recursos, anclas, consistencia de campos de formularios y auditoría estática de accesibilidad, todos aprobados. No se declara prueba end-to-end de Resend/Twitch ni despliegue de Cloudflare.
- **Pendientes / riesgos:** comprobar el comportamiento del formulario desde Preview y Production; la verificación de Origin requiere que el navegador envíe el encabezado estándar en POST same-origin. Continúan pendientes rate limiting/Turnstile (requieren configuración externa), pruebas de Cache API en Pages, QA visual de filtros roster, teclado/lector de pantalla y medición Lighthouse.
- **Despliegue:** pendiente de verificación.


## 2026-11-13 — Controles preventivos de formularios y prioridad de marca

- Se incorpora `scripts/check_form_fields.py` y se integra al workflow para comparar los nombres de campos de ambos formularios `data-contact-form` con la allowlist de `functions/api/contact.js`; también verifica honeypot y correo del formulario de incorporación.
- Los dos emblemas de marca visibles en la cabecera/portada dejan de usar carga diferida, evitando que elementos iniciales dependan de lazy loading. No se asigna `fetchpriority=high` sin medición que confirme que sean el recurso LCP.
- Validación automática: el workflow [43388343377](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43388343377) finalizó correctamente sobre `cb9ef731f363910167d1c3be41d3389b0bf52d3a`, incluyendo la prueba de consistencia de formularios y la auditoría estática de accesibilidad.


## 2026-11-13 — Ajuste del auditor para honeypot de contacto

- **Fallo de CI investigado:** sintaxis, funciones Pages, JSON, recursos y anclas pasaron; la auditoría de accesibilidad falló por los dos campos `contact_hp`, uno por formulario. No son controles interactivos para visitantes: viven dentro de `aria-hidden="true"`, tienen `tabindex="-1"` y se excluyen del cuerpo enviado.
- **Corrección:** `scripts/audit_accessibility.py` reconoce tanto el nombre histórico `website` como el actual `contact_hp` únicamente cuando el campo tiene `tabindex="-1"`. Los campos visibles siguen requiriendo `label` asociado o nombre ARIA. No se desactiva la auditoría ni se omiten los demás controles.
- **Validación:** pendiente del nuevo workflow; el commit previo falló exclusivamente por esta discrepancia entre el honeypot y la excepción del auditor.


## 2026-11-13 — Acciones del Roster sin handlers inline

- Se reemplazan los `onclick` generados en el mapa multiversal y los controles de expedientes por atributos `data-*` y delegación de eventos en el documento. Se conserva la misma acción y navegación; no se cambia el contenido ni los perfiles.
- **Validación:** el workflow [43388343377](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43388343377) finalizó correctamente sobre `cb9ef731f363910167d1c3be41d3389b0bf52d3a`; la sintaxis JavaScript y las Pages Functions, rutas, anclas, datos, campos de formularios y accesibilidad estática pasaron.


## 2026-11-13 — Estado consolidado de auditoría (PR #46)

- **Rama y protección:** PR #46 `auditoria-ux` permanece abierto como Draft. No se fusionó; `main` conserva la versión pública actual.
- **Cabeza del PR:** commit documental `e6f0d10f27c5b2b0c62084217dc77bae8d0862e9`. El último commit funcional revisado es `cb9ef731f363910167d1c3be41d3389b0bf52d3a` y su workflow [43388343377](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43388343377) terminó correctamente. Pasaron sintaxis JavaScript y Pages Functions, JSON, validación de rutas/recursos, anclas, consistencia de campos de formularios y auditoría estática de accesibilidad.
- **Cloudflare preview:** el head documental `e6f0d10` tiene despliegue exitoso: https://f563a99a.legion-multiversal.pages.dev y preview de rama https://auditoria-ux.legion-multiversal.pages.dev. Se comprobó que sirven la portada con canonical `https://legion-multiversal.pages.dev/`.
- **Pages Functions:** `GET /api/live` continúa devolviendo HTTP 503 en Preview; el código informa credenciales Twitch Helix ausentes. Configurar `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` en Cloudflare Preview/Production y volver a probar. `GET /api/contact` devuelve HTTP 405, esperado para un endpoint que solo admite POST; no se envió un formulario ni correo de prueba. Falta probar POST same-origin con Resend configurado.
- **Trabajo funcional ya incorporado a la rama:** vigencia coherente de estados Live y espectadores; prioridad a la lectura Helix frente al respaldo; atribución de vistas de Oratoris a YouTube Data API; corrección de saltos de línea y validación de formularios en servidor; honeypot reconocido por el auditor; enlaces/CTA multiplataforma y handlers delegados del Roster.
- **Pendientes reales para cerrar:** (1) QA visual en escritorio, tablet y móvil, incluidos filtros y cambio entre expedientes; (2) pruebas manuales de teclado y lector de pantalla; (3) Lighthouse y mediciones reales de LCP/CLS, revisando 22 de 40 imágenes HTML que no declaran dimensiones intrínsecas antes de asignarlas; (4) configurar rate limiting/WAF o Turnstile para `/api/contact`; (5) verificar Cache API de Pages y la precedencia Helix/respaldo en ejecución; (6) confirmar variables y rama de producción en Cloudflare y probar ambos POST/GET en sus métodos adecuados; (7) revisar la posible imagen de formación señalada en la auditoría histórica antes de seguir presentándola como roster actual.
- **Criterio de cierre:** no sacar el PR de Draft ni fusionarlo hasta completar QA visual y pruebas funcionales de las funciones que dependan de variables externas. No presentar la preview como producción ni afirmar que Resend/Twitch están operativos mientras no pasen las pruebas.

## 2026-11-13 — Corrección horaria, cobertura estadística y En Vivo (PR #46)

- **Rama y salvaguardas:** trabajo realizado en `auditoria-ux`. PR #46 permanece abierto y en Draft; no se modifica `main` ni se fusiona el PR.
- **Conversión horaria:** se centraliza el formato de fechas/horas del sitio y del expediente MORIARTYS con la zona explícita `America/Argentina/Buenos_Aires`. La marca `2026-11-13T21:22:55Z` se presenta como 13/11/2026 a las 18:22:55 en Argentina, evitando diferencias entre el directorio, Estadísticas y expedientes.
- **Cobertura estadística:** Capítulo 04 distingue la ventana configurada de hasta 30 días del intervalo realmente observado. Se informa el rango temporal de las muestras disponibles y se aclara que «consulta completa» significa que se resolvieron los canales, no que todos hayan agregado una muestra nueva.
- **Unidades de actividad:** se separan registros totales, muestras en directo, transmisiones detectadas y horas en directo observadas. Las horas se identifican como estimación entre muestras consecutivas válidas, no como duración oficial completa de emisiones. Se incorpora este criterio al expediente MORIARTYS.
- **En Vivo:** el directorio presenta la marca temporal de la última lectura/captura, distingue estados EN DIRECTO, OFFLINE y CAPTURA DEMORADA y no promociona como activa una transmisión cuya lectura venció. Se aclara la cadencia de actualización del directorio (2 minutos), la caché de API (60 segundos) y la cadencia objetivo del colector histórico (55 minutos).
- **Reproductor:** se mantiene la selección de canal con el parámetro `parent` correspondiente al hostname, se explicitan permisos del iframe de Twitch y se elimina el ancho mínimo de 400 px que provocaba desbordamiento en pantallas estrechas. Se añade una señal visual diferenciada para tarjetas con captura demorada.
- **Clips:** el encabezado del expediente MORIARTYS cambia a «Momentos que definen el canal» y aclara que son clips de transmisiones anteriores.
- **Datos de preview:** `data.json` y `platform-stats.json` de la rama se sincronizaron con las versiones actuales de `main` para evitar que la preview mostrara una captura anterior (247 registros) frente a la captura vigente (249). No se editaron los datos de origen manualmente.
- **Validación automática:** workflow [43513991818](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43513991818) finalizó correctamente sobre el commit de código `5278be414e4759f1ac47878b544eb2018c6c459e`. Los commits posteriores solo sincronizaron archivos de datos idénticos a los de `main`; no cambiaron la lógica validada.
- **QA visual/funcional pendiente:** no se pudo acceder al hostname de preview desde el entorno de verificación para inspeccionar el render de escritorio/móvil ni comprobar HTTP de `/api/live`. El reproductor solo podrá probarse funcionalmente cuando alguno de los canales activos esté transmitiendo y el endpoint/entorno de preview responda correctamente. No se declara aprobación visual ni reproducción real comprobada.

### Actualización de cierre de esta intervención

- Se sincronizó la rama con el HEAD actual de `main` mediante un commit de merge en `auditoria-ux`; `main` no se modificó. El PR ya no está detrás de la rama base y los archivos automáticos de estadísticas coinciden con la versión actual de `main`.
- Validación del commit de sincronización `d3150795344552851b8230d41877e7ebd20a07cb`: workflow [43514317294](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43514317294), resultado **success**.
- Comparación final: rama `auditoria-ux` 70 commits por delante y 0 por detrás de `main`; 16 archivos de cambios propios en el PR. El PR sigue abierto, Draft y sin fusionar.

- **Revalidación tras precisar segundos locales:** la última lectura se muestra con fecha, hora y segundos en Argentina (por ejemplo, `2026-11-13T21:22:55Z` → `13 nov 2026, 18:22:55`). El head final de código `98e5e3a8968f5e2c4c7c4a134d714b54e18b3671` pasó los workflows [43514477313](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43514477313) y [43514472036](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43514472036): sintaxis JS y Pages Functions, JSON, rutas/recursos, anclas, formularios y auditoría estática de accesibilidad, todo correcto.


## 2026-11-14 — Auditoría de rendimiento, diagnóstico y QA de navegador

- **Rama y límites:** trabajo en `auditoria-ux`; PR #46 sigue abierto como Draft y sin fusionar. Producción sigue siendo GitHub Pages. No se modificó `main` ni se inició un despliegue de producción.
- **Lighthouse de referencia (3 corridas por entorno):** ejecución [43558434105](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43558434105). Medianas producción / preview: Performance 96/96; Accessibility 100/100; Best Practices 96/96; SEO 100/61; LCP 1,69/1,97 s; CLS 0,079/0,079; TBT 14/28 ms; peso 4179/3690 KB. Son resultados de Lighthouse, no una evaluación de conversión o jerarquía editorial.
- **SEO preview:** `bitacora-preview.html` ya contiene `<meta name="robots" content="noindex, nofollow">`; `_headers` incluye `X-Robots-Tag: noindex, nofollow` para `/*-preview.html`. Se agregó comprobación HTTP de la cabecera para la raíz de la preview y diagnóstico de auditorías fallidas con `scripts/lh_failures.py`. La causa exacta del SEO 61 y la cabecera efectiva de `*.pages.dev` quedan pendientes de leer en los logs de la nueva ejecución.
- **QA de navegador — hallazgo y corrección:** Playwright en preview detectó `ReferenceError: loadLiveDirectory is not defined` en los 3 viewports y 5 hashes; el resultado inicial fue 27/42. Se agregó `loadLiveDirectory()` en `app.js`: consulta `/api/live` solo en Pages preview, adapta `game_name/viewer_count` al renderizador y conserva `data.json` como respaldo. Commit de la corrección: `f26596c33e981201915f0150fd5a2798812c46ca`.
- **QA adicional:** pasaron las comprobaciones de ausencia de scroll horizontal, CTA `mailto:`, presencia del enlace de respaldo del formulario, navegación por teclado con Tab y estado responsive del disclosure del roster. Se extendió el smoke test para simular un 503 de `/api/contact` y comprobar el fallback de correo de un clic; la repetición está pendiente. El lector de pantalla no se probó manualmente y no se declara aprobado.
- **Ruta de imagen corregida:** `instituto-preview.html` apuntaba a `banner-grupal.jpg` en la raíz aunque el recurso está en `assets/banner-grupal.jpg`; se corrigió la referencia en la rama.
- **Dimensiones:** el `--check` anterior registró 46 imágenes, 18 con ambas dimensiones, 23 completables y 5 sin medir. Después se corrigió la ruta del banner; la nueva cuenta debe tomarse del workflow actual. La aplicación de dimensiones sigue siendo temporal en el runner: no se incorporó ni commiteó el diff todavía, a la espera de revisar el patch completo.
- **Peso y LCP:** se agregó el diagnóstico de auditorías SEO/BP, elemento LCP y diez imágenes de mayor transferencia. La lista y las medianas nuevas están pendientes de que termine la ejecución [43559559083](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43559559083). No se reemplazaron referencias JPG/PNG ni se generaron variantes WebP/AVIF.
- **CI:** `validar-sitio.yml` pasó en el HEAD `bf9672025e3f96bd7857fcd04bd0188753e72b72`: [run 43559563075](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43559563075). La siguiente aprobación requiere el resultado de la QA repetida, inspección manual con lector de pantalla y revisión del diff de dimensiones.


## Seguimiento — 14/11/2026, cierre de dimensiones y repetición QA

- **Corrección del estado de dimensiones:** el diff completo se revisó en los logs del workflow y se incorporó en el commit separado `e5dbcc306ec12861bcfe6073f4dbefee30e9a1d7`. Añade dimensiones medidas a 24 etiquetas `img` en `index.html`, `bitacora-preview.html`, `comic-moriartys.html` e `instituto-preview.html`. También reserva la portada dinámica de `roster-02-moriartys.html` con `width=1280` y `height=1920`, medidas de ese mismo recurso. Por tanto, la anotación anterior que decía que el diff seguía sin commitear quedó superada por este commit.
- **Imágenes no medibles:** quedan tres casos a verificar en el nuevo `--check`: imagen remota de Minecraft (ratio CSS 16:9), imágenes de directorio generadas dinámicamente en Bitácora (caja CSS 76×92) y retratos dinámicos del Instituto (wrapper CSS de altura fija). No se inventan dimensiones.
- **QA/Lighthouse de la tanda anterior:** run [43559559083](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43559559083) completó Lighthouse y diagnóstico, pero falló en Playwright porque `page.goto(..., waitUntil: "networkidle")` agotó 30 s en la preview. Se cambió a `domcontentloaded` más una espera corta; se agregó un test de fallback `mailto:` con 503 simulado y captura de estados HTTP de Pages Functions.
- **Diagnóstico Lighthouse previo:** Performance 71/71; Accessibility 100/100; Best Practices 96/96; SEO 100/61; LCP 14,18/11,62 s; CLS 0,089/0,090; TBT 0/0 ms; peso 4179/3698 KB. Best Practices falla por `errors-in-console` en ambos entornos. La versión previa de `lh_failures.py` no extrajo el nodo LCP por una diferencia de estructura JSON; se corrigió para imprimir nodo o detalle bruto y evidencia de errores de consola.
- **SEO preview:** fallan `is-crawlable` y `robots-txt`; no se debe quitar `noindex`. La ejecución siguiente captura la cabecera `X-Robots-Tag` y el cuerpo/headers de `robots.txt` para distinguir la protección esperada de una respuesta inválida del host preview.
- **Ejecución actual:** [43560270922](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43560270922), sobre HEAD `e5dbcc306ec12861bcfe6073f4dbefee30e9a1d7`, pendiente al momento de esta nota. Incluye recuento final, Lighthouse 3× por entorno, diagnóstico corregido y QA Playwright corregida.
- **CI del HEAD e5db:** `validar-sitio.yml` pasó en [run 43560270902](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43560270902).
- **Pendiente manual:** prueba real de lector de pantalla; Playwright/Lighthouse no la sustituyen. No se reemplazaron referencias de imágenes ni se generaron variantes WebP/AVIF.
- **Salvaguardas:** `main` continúa en `b67079b8d6bbde268a967e60ef642987072c6c52`; rama de trabajo `auditoria-ux` en `e5dbcc306ec12861bcfe6073f4dbefee30e9a1d7`. PR #46 sigue Draft, abierto y sin merge; no hubo despliegue de producción.


## Cierre de diagnóstico y QA — 14/11/2026

- **Noindex de preview confirmado:** la respuesta de `https://auditoria-ux.legion-multiversal.pages.dev/` contiene `X-Robots-Tag: noindex`. No se elimina ni se modifica esta protección.
- **robots.txt preview:** `/robots.txt` devuelve el HTML de la portada en lugar de un archivo robots válido; Lighthouse detecta 983 errores de sintaxis. No se modificó para elevar el score de la preview. Una posible corrección independiente sería publicar un `robots.txt` real que permita rastreo, manteniendo el `X-Robots-Tag: noindex`; queda como decisión pendiente.
- **Lighthouse estable (3 corridas por entorno):** run [43560270922](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43560270922): Performance 95/95, Accessibility 100/100, Best Practices 96/96, SEO 100/61, LCP 1,75/2,02 s, CLS 0,079/0,079, TBT 6/2 ms, peso 4179/3698 KB. La tanda previa de 71 y LCP >11 s fue anómala y no se tomó como regresión.
- **Best Practices producción:** el fallo `errors-in-console` era una solicitud 404 a `/favicon.ico`. Se añadió en `index.html` un icono apuntando al logo ya existente; la validación de ese cambio está en el run actual.
- **Best Practices preview:** `/api/live` responde 503. La Function devuelve 503 cuando falta al menos una credencial Twitch en ese entorno. El frontend captura el fallo y mantiene `data.json` como respaldo, sin errores JS. Revisar que `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` estén disponibles también en Cloudflare Pages > Preview, no solo en Production.
- **QA Playwright:** 43/43 comprobaciones OK en 1440×900, 768×1024 y 390×844. Incluye cinco hashes por viewport, ausencia de errores JS, ausencia de scroll horizontal, CTA mailto, fallback de un clic ante 503 simulado, navegación por Tab y estado del disclosure del roster. Capturas y `reports/qa/resultado.json` se publicaron como artifact del run 43560270922.
- **Dimensiones:** el `--check` final reporta 46 imágenes; 43 con ambas dimensiones, 0 completables y 3 sin medir. Las 3 restantes son remotas/dinámicas y conservan espacio mediante CSS (ratio 16:9, caja 76×92 o wrapper de altura fija). El commit separado `e5dbcc306ec12861bcfe6073f4dbefee30e9a1d7` incorpora las 24 medidas reales y reserva 1280×1920 para la portada dinámica MORIARTYS.
- **Peso — 6 imágenes cargadas en la navegación inicial (run 43560270922):**
  1. `legion_logo_final_hybrid.png` — 1.337.475 B.
  2. `assets/heroes/rod3r1k_dark.webp` — 866.057 B.
  3. `image_20261107_021355.jpg` — 514.735 B.
  4. `stream4.jpg` — 475.573 B.
  5. `image_20261106_124855.jpg` — 413.794 B.
  6. `assets/carnet/DemuianCarnet.jpg` — 357.879 B.
  No se generaron ni sustituyeron variantes WebP/AVIF; requiere aprobación.
- **Elemento LCP:** el JSON de Lighthouse no incluye el audit node esperado en esta versión. Se añadió `scripts/lcp_probe.mjs` con PerformanceObserver para identificar el elemento real en producción y preview; ejecución [43560863457](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43560863457) pendiente al momento de esta nota.
- **Accesibilidad manual:** la navegación por teclado está cubierta por smoke QA; sigue pendiente probar con un lector de pantalla real. Lighthouse 100 no sustituye esa comprobación.
- **Estado y salvaguardas:** rama `auditoria-ux`; PR #46 Draft y sin merge; `main` no fue modificado; no se desplegó producción.


## Revisión crítica de QA — conciliación y nueva evidencia (14/11/2026)

### Dimensiones y commit e5dbcc3
- Revisión automatizada de cada archivo contra su padre, eliminando de ambos lados los atributos numéricos `width` y `height`: `bitacora-preview.html`, `comic-moriartys.html`, `index.html`, `instituto-preview.html` y `roster-02-moriartys.html` pasan. No se detectaron diferencias restantes; el commit modifica exclusivamente dimensiones intrínsecas.
- El diff de GitHub muestra 25 líneas/etiquetas `<img>` modificadas en total (no 24).
- Recuento final del script en el HEAD auditado: 46 etiquetas `<img>`; 43 ya tienen ambas dimensiones, 0 son completables en el `--check` y 3 quedan sin medir:
  1. `bitacora-preview.html`: `src="'+esc(image)+'"`, plantilla de una imagen insertada dinámicamente por JavaScript; no es una ruta física que Pillow pueda abrir.
  2. `index.html`: imagen remota `https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/screenshots/PDP-US-Bundle-Screenshot-2.png`.
  3. `instituto-preview.html`: `assets/banner-grupal.jpg`, ruta local que no se encontró en el checkout.
- Las cifras antiguas 18 + 24 + 5 corresponden a una corrida/alcance previo y no son conciliables con el recuento final; se reemplazan por el conteo reproducible de 46/43/0/3.

### LCP: datos individuales de Lighthouse
- Run [43561161022](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43561161022), reportes JSON individuales:
  - GitHub Pages: 13,93 s / 15,21 s / 15,02 s; mediana 15,02 s.
  - Preview: 11,60 s / 12,70 s / 12,82 s; mediana 12,70 s.
- Las seis corridas repiten un LCP **simulado** elevado. El valor `audits.largest-contentful-paint` (11,60–15,21 s) no equivale al LCP observado en la traza. El objeto `audits.metrics.details.items[0]` contiene ambos: `largestContentfulPaint` (simulado) y `observedLargestContentfulPaint` (observado en navegador).
- LCP observado en los seis reportes: GitHub Pages 435/239/257 ms (mediana 257 ms); preview 308/334/279 ms (mediana 308 ms). El `PerformanceObserver` independiente midió 580 ms y 248 ms respectivamente. No hay evidencia de un LCP real de 14 s en el navegador sin throttling.
- El simulador de Lighthouse sí proyecta un escenario móvil lento: `lcpLoadDelay` 2,1–4,7 s y `lcpLoadDuration` 1,2–8,1 s. El nodo LCP es el banner `image_20261106_124855.jpg` (`IMG`, `loading=eager`, `fetchpriority=high`), de 413.391 B. El recurso se descubre en el documento inicial; no está lazy. El peso del banner y la competencia con otros recursos de alta prioridad pueden explicar parte de la proyección. No se cambia el atributo lazy ni la prioridad; la optimización de imágenes queda pendiente de aprobación y deberá medir ambos indicadores por separado.

### Best Practices: detalle real de errors-in-console
- Producción: `errors-in-console` registra `GET https://losmoriartys-cmd.github.io/favicon.ico` con HTTP 404. En producción actual (main) falta el icono declarado. La rama `auditoria-ux` ya declara un favicon PNG existente en el `<head>`; la corrección aún no está en producción porque no se fusionó.
- Preview: `errors-in-console` registra dos respuestas HTTP 503 a `/api/live`. El código de Pages Function responde 503 si faltan `TWITCH_CLIENT_ID` o `TWITCH_CLIENT_SECRET`; el frontend mantiene la captura estática de respaldo. No se atribuye a imágenes bloqueadas.
- La preview tiene además `robots-txt` inválido (984 errores en el JSON de Lighthouse) porque `/robots.txt` estaba devolviendo el HTML de la portada. Producción todavía requiere verificar su Content-Type desde HTTP.

### Producción GitHub Pages: alcance de QA
- El `app.js` de producción no contiene llamadas a `/api/*`; los formularios del HTML de producción tienen un handler inline que arma `mailto:losmoriartys@gmail.com`. Esto es inspección de código servido, no sustituye la prueba de navegador sobre producción.
- Se agregó `scripts/qa_production.mjs` para probar en Chromium el host real `github.io`, navegar a EN VIVO, enviar un formulario de prueba sin envío real y registrar solicitudes `/api/*`, errores JS y la ruta mailto.
- Se agregaron `robots.txt` y `sitemap.xml` a `auditoria-ux`. La sitemap excluye páginas de preview. Aún no están en producción hasta que el PR se integre; el workflow ahora registra HTTP y Content-Type de robots y sitemap en los tres hosts (GitHub Pages, preview de rama y Pages principal).

### Pendientes bloqueantes de aprobación
- Completar el nuevo smoke QA contra GitHub Pages y revisar que no haya ninguna solicitud `/api/*`, que EN VIVO renderice y que el formulario active la ruta mailto.
- Revisar los Content-Type HTTP de `robots.txt` y la disponibilidad del `sitemap.xml` en los tres hosts; producción solo cambiará al integrar el PR.
- Configurar por separado en Cloudflare Pages > Preview `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM` y, si se usa, `CONTACT_TO`. No se registran ni se solicitan valores secretos en GitHub.
- Validar `/api/live` con HTTP 200 y el envío real a Resend con una dirección de prueba acordada. Hasta entonces, Resend no está probado de punta a punta.
- Probar manualmente con NVDA en Windows o VoiceOver en Apple. La auditoría automática y el foco de teclado no certifican lector de pantalla.

**Estado:** QA no aprobada. PR #46 permanece Draft y sin merge; `main` no se modificó y producción no se desplegó.


## Segunda validación de producción, robots y LCP — run 43562174824

- **Workflow completo SUCCESS** sobre el HEAD de auditoría `ba66ec7481a9b8ccaeae5d1946440a10ab93f05e`: [ejecución 43562174824](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43562174824).
- **QA en producción GitHub Pages: 10/10 OK.** Portada y capítulo EN VIVO cargan; 0 solicitudes de red a `/api/*`; formulario presente, válido y con handler directo `window.location.href='mailto:...'`; 0 errores JS. El navegador headless no produjo evento de navegación `mailto:` (`mailtoNavigations=[]`), por lo que se verificó el handler y el recorrido de submit sin llamada API, pero no el lanzamiento de una aplicación de correo externa.
- **QA preview: 43/43 OK** en 1440, 768 y 390 px. En preview se registran 2 solicitudes `/api/live` por carga, ambas HTTP 503; el frontend conserva el respaldo estático. No hay errores JS ni scroll horizontal.
- **robots.txt y sitemap:**
  - GitHub Pages producción: `/robots.txt` responde HTTP 503, `text/html` (página de error de GitHub/Fastly); `/sitemap.xml` también HTTP 503, `text/html`.
  - Preview de rama: `/robots.txt` HTTP 200, `text/plain; charset=utf-8`; `/sitemap.xml` HTTP 200, `application/xml`.
  - `legion-multiversal.pages.dev` principal: `/robots.txt` HTTP 200, pero `text/html; charset=utf-8` (fallback de portada), no un robots válido.
  - Se confirma que los dos archivos nuevos funcionan en la preview de la rama, pero todavía no están publicados en producción ni en el Pages principal. No se cambió `main`.
- La preview conserva `X-Robots-Tag: noindex`; el `robots.txt` válido no altera esa protección. Lighthouse SEO preview subió de 61 a 69 porque ya no falla la auditoría `robots-txt`; queda solo `is-crawlable` por el noindex intencional.
- **Lighthouse run 43562174824, medianas de 3 corridas:** Performance 72/72, Accessibility 100/100, Best Practices 96/96, SEO 100/69, LCP simulado 13,80/12,63 s, CLS 0,090/0,079, TBT 0/0 ms, peso 4179/3667 KB.
- **LCP observado en la traza Lighthouse:** producción 409/293/280 ms (mediana 293 ms); preview 455/291/305 ms (mediana 305 ms). `PerformanceObserver` separado: 364 ms / 320 ms. Se mantiene la distinción obligatoria entre LCP simulado (para scoring móvil/throttling) y LCP observado; el nodo sigue siendo el banner `image_20261106_124855.jpg`, `loading=eager`, `fetchpriority=high`.
- **Best Practices 96:** en producción el mensaje exacto sigue siendo 404 a `https://losmoriartys-cmd.github.io/favicon.ico` (la corrección de `rel=icon` está en la rama, todavía no publicada); en preview son dos respuestas 503 de `/api/live`. No son errores de imágenes remotas.
- **Estado operativo:** `/api/live` sigue sin 200 en Preview. Resend sigue sin prueba de envío real. Lector de pantalla NVDA/VoiceOver pendiente. La QA no se aprueba.
- Artifact con reportes JSON, capturas, QA y cabeceras: [auditoria-ux-43562174824](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43562174824).


### Valores individuales LCP — run 43562174824
- GitHub Pages, Lighthouse simulado: **13,80 / 4,36 / 14,16 s**. LCP observado en las trazas: **409 / 293 / 280 ms**.
- Preview, Lighthouse simulado: **12,76 / 11,67 / 12,63 s**. LCP observado en las trazas: **455 / 291 / 305 ms**.
- Medianas: simulado 13,80 / 12,63 s; observado 293 / 305 ms. El informe de Lighthouse debe conservar ambos indicadores para no mezclar la proyección de throttling con el evento observado.


### Nota de integridad de ramas
Durante esta tanda, `main` avanzó de `b67079b8d6bbde268a967e60ef642987072c6c52` a `d380f8ff95fe60ac360d306cf1e8721ff8ba32bb` por un commit automático de `github-actions[bot]` (`Actualización automática de estadísticas multiplataforma`) que modificó únicamente `data.json` y `platform-stats.json`. No fue una escritura de esta auditoría. No se hicieron commits de `auditoria-ux` sobre `main`, no se fusionó el PR ni se desplegó producción.


## Validación endpoint y auditoría de imágenes — run 43570146758 (14/11/2026)

- **Ejecución integral SUCCESS:** [workflow #61 / run 43570146758](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43570146758), sobre el commit c15aa5aab34129c98978ff34c128aefa7434d845. Job único completado: 23 pasos, todos SUCCESS.
- **Pruebas nuevas de /api/live: 15/15 OK** en desktop (5), tablet (5) y mobile (5). Cada respuesta observada fue HTTP 200 y JSON válido con source fallback, status unavailable y channels como array. Esto prueba el contrato de fallback de Preview; no prueba credenciales Twitch ni un flujo Helix en vivo.
- **Smoke QA Preview: 58/58 OK** en 1440, 768 y 390 px (43 comprobaciones base + 15 validaciones del contrato /api/live). Sin errores JS ni scroll horizontal; incluye navegación por teclado, CTA y fallback del formulario.
- **QA producción GitHub Pages: 10/10 OK.** Sin solicitudes /api/*, errores JavaScript ni errores de página. No se cambió ni desplegó producción.
- **Lighthouse (medianas de 3 corridas por entorno):**

| Métrica | GitHub Pages | Preview |
|---|---:|---:|
| Performance | 72 | 72 |
| Accessibility | 100 | 100 |
| Best Practices | 96 | 100 |
| SEO | 100 | 69 |
| LCP simulado | 15,35 s | 12,59 s |
| CLS | 0,089 | 0,090 |
| TBT | 2 ms | 0 ms |
| Peso transferido | 4.179 KB | 3.667 KB |

- **LCP observado por PerformanceObserver:** 392 ms en producción y 324 ms en Preview. No confundir estos eventos observados con el LCP simulado de Lighthouse bajo throttling, que es el valor utilizado para el score y permanece alto.
- **Elemento LCP:** image_20261106_124855.jpg, 413.391 B de recurso (413.794 B transferidos en producción); imagen eager y con fetchpriority high. La imagen aparece como elemento LCP en ambos hosts.
- **Recursos de imagen más pesados medidos por transferencia en producción:** legion_logo_final_hybrid.png 1.337.459 B; assets/heroes/rod3r1k_dark.webp 865.994 B; image_20261107_021355.jpg 514.918 B; stream4.jpg 475.532 B; image_20261106_124855.jpg 413.794 B; assets/carnet/DemuianCarnet.jpg 357.873 B.
- **Diagnóstico no atribuible a imágenes:** Best Practices 96 en producción por 404 a /favicon.ico en la raíz del dominio GitHub Pages; la URL está fuera del subpath del proyecto y no se arregla cambiando solo el favicon del sitio. Preview conserva X-Robots-Tag noindex, intencional; SEO 69 no se considera regresión a corregir.
- **Artefacto de evidencia:** [auditoria-ux-43570146758](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43570146758/artifacts/14104247361), con JSON/HTML de Lighthouse, diagnóstico, LCP, QA y capturas.
- **Siguiente etapa:** generar candidatos WebP para los seis recursos pesados en una carpeta de reportes, sin reemplazar archivos fuente ni actualizar referencias. Cada candidato mantiene dimensiones y proporción exactas; se compara tamaño, PSNR y apariencia antes de decidir si se integra. No se aceptan cambios por tamaño solamente.
- **Salvaguardas:** rama auditoria-ux; PR #46 permanece Draft y abierto, sin merge. main y producción no se modificaron en esta tanda.

## 2026-11-14 — Auditoría #66 y aprobación visual de variantes WebP

- **Ejecución:** [Auditoría #66](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43570884021), commit evaluado `39bcd928e95d1cfe499506d941541b9f1714e76d`. Estado terminal `success`; 1 job, 24/24 pasos completados, sin fallos ni pasos omitidos.
- **Artefacto de evidencia:** [auditoria-ux-43570884021.zip](https://api.github.com/repos/losmoriartys-cmd/legion-multiversal/actions/artifacts/14104054134/zip), ID `14104054134`, SHA-256 `ccea76058c642bcb70f07cfd421c3537702595e812167df2461d06a4da8a961f`. Incluye `comparison.json`, originales y candidatos para comparación.
- **Criterio:** no se redimensionó ninguna imagen. Las seis variantes mantienen exactamente ancho, alto y proporción de sus fuentes. Se inspeccionaron pares original/candidato; el logo transparente se comparó compuesto sobre tablero para no confundir RGB invisible con pérdida de transparencia.
- **Resultados medidos:**

| Imagen | Original | WebP | Ahorro | Calidad / geometría |
|---|---:|---:|---:|---|
| Emblema PNG | 1.336.538 B | 839.602 B | 37,18 % | Lossless; RGB visible y alfa sin diferencia; 1600×1600 |
| Roderik | 865.372 B | 610.896 B | 29,41 % | PSNR 39,489 dB; 1280×1920 |
| Orígenes | 514.266 B | 426.502 B | 17,07 % | PSNR 37,096 dB; 1312×1920 |
| BarFender | 475.134 B | 373.466 B | 21,40 % | PSNR 37,703 dB; 2240×1120 |
| Banner LCP | 413.391 B | 340.222 B | 17,70 % | PSNR 37,843 dB; 2128×1120 |
| Carnet Demian | 357.320 B | 287.312 B | 19,59 % | PSNR 38,954 dB; 1280×1920 |

- **Decisión:** las seis variantes pasan la revisión técnica y visual como candidatas de entrega. El ahorro agregado sobre estas seis fuentes es de 1.084.021 bytes (aprox. 26,9 % del peso combinado de las fuentes). Los originales no se sobrescriben.
- **Implementación segura preparada:** el workflow ahora puede publicar copias WebP bajo `assets/optimized/` en `auditoria-ux`, conservando los originales y el artefacto de comparación. Esta publicación está limitada a la rama de auditoría; no afecta `main` ni GitHub Pages de producción. La actualización de referencias HTML se realizará después de verificar la publicación de los archivos.
- **Pendiente de validación posterior:** comprobar el commit automático de variantes, cambiar solo referencias cuya ubicación y fallback estén confirmados, y ejecutar una nueva auditoría de Lighthouse/QA. Las cifras de ahorro son por archivo, no una promesa de mejora equivalente en Performance/LCP.


## 2026-11-14 — Auditoría editorial y comercial del Roster

- **Prioridad de producto acordada:** presentación comercial del Roster streamer y calidad editorial de las Bitácoras, manteniendo el lenguaje visual de cómic retro.
- **Documento de estrategia:** [PROPUESTA_COMERCIAL_ROSTER.md](./PROPUESTA_COMERCIAL_ROSTER.md), commit `a45c18ef4a4176a97acf960c80575a59e20fc899`. Define arquitectura comercial, plantilla de expedientes individuales, distinción entre bitácoras y casos de colaboración, taxonomía de confianza de datos, dirección visual y criterios de aceptación.
- **Hallazgo estructural:** existen ocho perfiles en `roster-data.json`; siete canales Twitch en seguimiento activo. PATO — ORATORIS está clasificado como colaborador/creador de video y debe mantenerse separado del roster de streamers.
- **Frescura de Twitch Helix:** `data.json` registra actualización 13/11/2026 21:22:55 UTC, siete canales resueltos, cero canales muestreados y siete omitidos en esa ejecución. Los registros históricos permanecen, pero no se debe presentar esa última ejecución como una captura nueva de actividad.
- **Fuentes no equivalentes:** Twitch Helix es muestreo propio; TwitchMetrics es fuente externa complementaria (captura 04/11/2026, dos perfiles); SullyGnome es historial externo (generado 03/11/2026, con registros parciales, pendientes y resúmenes aportados); YouTube de PATO tiene una lectura de API (13/11/2026: 56 suscriptores, 431 vistas, 6 videos). No sumar ni mezclar métricas entre fuentes/plataformas.
- **Discrepancia que requiere tratamiento:** el desglose de categorías de HABITOS no concilia con el resumen de SullyGnome en horas vistas/horas emitidas. Se debe retener la visualización comercial del desglose hasta resolverla; conservar la nota de auditoría.
- **Oportunidad editorial:** el expediente MORIARTYS tiene una bitácora interactiva de ocho páginas, pero la profundidad y presentación comercial no están estandarizadas para todos los creadores. Los clips y credenciales están repartidos entre `creator-records.json`, `platform-stats.json` y las páginas.
- **Criterio de rediseño:** portada comercial colectiva breve; directorio de perfiles sin ranking; expediente comercial individual homogéneo; bitácora individual separada del expediente de una colaboración; metodología y fuentes accesibles sin dominar la lectura.
- **Próxima implementación:** P0 integridad/frescura y normalización editorial; P1 plantilla individual y portfolio; P2 resumen colectivo; P3 bitácoras de actividad y casos; P4 QA responsive, accesibilidad y rendimiento.
- **Salvaguardas:** todo el trabajo continúa en `auditoria-ux`; no se modifica `main`, no se fusiona PR ni se publica producción. No se inventan métricas, resultados comerciales, alianzas ni audiencias únicas.


### Implementación inicial P0 — claridad de cobertura de muestras

- **Cambio:** `app.js`, commit `70d7e8a5f8d2d6161c28b5253317d9067499bb3a`.
- **Mejora:** el panel de impacto distingue canales resueltos por el colector de canales que efectivamente generaron una muestra nueva. El KPI ahora informa `muestras nuevas / canales esperados`, y el detalle explicita resueltos, muestreados y omitidos.
- **Motivo:** evitar que una ejecución con siete canales resueltos, cero muestras nuevas y siete omitidos se interprete visualmente como cobertura estadística completa. La antigüedad de la captura sigue controlando la presentación del estado en vivo.
- **Validación:** la validación de código para el commit previo de documentación pasó en los workflows #520 y #521. La validación del commit de código y la auditoría integral posteriores están pendientes de ejecución: [auditoría #73](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43573324140).

## 2026-11-14 — Presentación comercial del roster y evidencia individual

- **Prioridad editorial:** se prioriza el Roster como capítulo principal de presentación comercial de Legión Multiversal. La propuesta explica la oferta colectiva y conserva la identidad y el valor de cada creador, sin convertir el directorio en un ranking.
- **Portada comercial colectiva:** se agregó una presentación media kit dentro del capítulo Roster, con cuatro líneas posibles de trabajo: activación colectiva, integración individual, contenido/demostración y campañas documentadas. El texto aclara que son formatos a conversar, no servicios contratados, disponibilidad garantizada ni promesas de alcance.
- **Evidencia por expediente:** la función renderCommercialEvidence agrega métricas con fuente, período/captura y notas metodológicas a la ficha ejecutiva individual. Prioridad de fuente: TwitchMetrics para perfiles con registro externo disponible; YouTube Data API v3 para PATO — ORATORIS; SullyGnome para referencias históricas parciales o resúmenes aportados por el equipo. No se mezclan fuentes ni períodos.
- **Criterios de publicación:** se excluyen las ganancias de seguidores de SullyGnome mientras su interpretación no esté confirmada; se identifica el promedio ponderado como derivado; se etiqueta explícitamente el resumen aportado por el equipo; el expediente de HABITOS mantiene sus cifras retenidas por la discrepancia ya documentada entre resumen y desglose. Los perfiles sin una base suficiente muestran un estado de integración pendiente, sin inventar valores ni sugerir que la falta de datos implica menor valor del creador.
- **Diseño:** se incorporaron paneles de evidencia y una presentación colectiva con paleta azul noche, cian y dorado, jerarquía editorial de cómic retro y adaptación responsive. Se mantiene la navegación, los filtros y las cartas existentes.
- **Archivos modificados:** app.js, index.html, styles.css. Commits de esta implementación: 5eb66fced1b66640add1b42734e388bf1d278d12 (evidencia estadística por creador), 32cb8a2a1ea9588ca75b4ff337bcc92fed916f3a (presentación comercial colectiva), 251262df9e9312bb3ce0dfb6206ef23b00da1da8 (estilos) y commit posterior de versión de caché de estilos.
- **Pendiente de validación:** ejecutar el workflow de auditoría sobre el HEAD final y revisar errores JS, carga de datos, enlaces, responsive y accesibilidad de la nueva sección. No se declara la implementación aprobada hasta que esa corrida termine correctamente.
- **Estado del repositorio:** trabajo limitado a auditoria-ux. PR #46 permanece Draft y sin fusionar; no se modificó main ni se publicó producción.
- **Incidencia paralela del pipeline:** la auditoría #73 terminó con fallo únicamente en el paso de publicación de variantes WebP verificadas a la rama; los pasos anteriores del job finalizaron correctamente. No se asumió que las variantes optimizadas quedaron publicadas.
- **Fortalezas individuales:** se amplió la ficha ejecutiva con un bloque editorial de fortalezas diferenciales para los ocho perfiles. Las descripciones se apoyan en los formatos y biografías ya documentados; los perfiles en desarrollo se identifican como tales y no reciben experiencia o especialidades inventadas. Commit: 1a7edfedd3fda00077797f8b9132a2b13dcb1390.
- **Portafolio individual:** las fichas ahora muestran hasta tres clips o videos con enlaces validados por dominio y un bloque separado de colaboraciones/accesos registrados. Los registros de partner se distinguen de los accesos a keys; estos últimos no se presentan como patrocinios. PATO muestra muestras de YouTube; los perfiles sin enlaces cargados quedan identificados como pendientes. Commit: ab3c3035a6156ea30ae898b80dbb88d15e39af6c.
