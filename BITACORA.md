# Bitácora de intervenciones — Legión Multiversal

Este archivo registra cada intervención relevante realizada en el repositorio. Al cerrar cada tarea se debe actualizar con los archivos modificados, el resumen de cambios, las validaciones realizadas y lo que queda pendiente.

## Plantilla para próximas intervenciones

### [AAAA-MM-DD] — [Título de la intervención]
- **Archivos modificados:**
- **Cambios realizados:**
- **Validaciones:**
- **Pendientes / riesgos:**
- **Commit:**
- **Despliegue:** pendiente / exitoso / fallido (incluir enlace o ID del workflow).

---

## 2026-11-03 — Rebranding narrativo del Capítulo 01

- **Archivos modificados:**
  - `index.html`
  - `BITACORA.md` (este registro).
- **Cambios realizados:**
  - Se actualizó el título y la cabecera pública a **Legión Multiversal**.
  - Se incorporó el lema **“Diferentes mundos. Una misma Legión.”**
  - Se reescribió el Capítulo 01 como historia de origen: Demian y ROD3R1K en Marvel Rivals; incorporación de Akuma; expansión a Fortnite con ElGabii y Capy; evolución hacia una comunidad de creadores; llegada de colaboradores; incorporación de Lady Moriarty y Dave.
  - Se integraron en la historia imágenes ya existentes del porfolio: Los Moriartys, ROD3R1K, Akuma, ElGabii, Capy, Lady Moriarty, ArDipii, Hábitos Atómicos y Pato — Oratoris.
  - Se conservó el banner grupal original como pieza de archivo de la etapa S3X-MEN.
  - Se mantuvieron las tres dimensiones de la comunidad: gaming y entretenimiento, conocimiento y tecnología, y desarrollo personal.
  - No se rediseñaron ni reemplazaron las ilustraciones individuales existentes.
- **Validaciones:**
  - Se verificó que las rutas de las imágenes utilizadas existen en el repositorio.
  - Se verificó que la edición se realizó sobre `main` y que GitHub aceptó el commit.
  - El despliegue de GitHub Pages debe verificarse después de esta actualización.
- **Pendientes / riesgos:**
  - Revisar visualmente el Capítulo 01 en escritorio y móvil.
  - Confirmar que la cronología y las descripciones de cada incorporación estén aprobadas por el equipo.
  - Diseñar e incorporar el emblema definitivo de Legión Multiversal cuando esté aprobado.
  - Actualizar progresivamente el resto de la navegación, capítulos, metadatos y textos que todavía mencionen S3X-MEN o Instituto cuando corresponda, sin borrar el valor histórico de la primera etapa.
  - La disponibilidad legal/comercial del nombre y de los perfiles sociales debe verificarse antes de su uso comercial.
- **Commit:** `af16ccb53e328f19a27d2628e76d7fbcef8e6c1c`
- **Despliegue:** pendiente de verificación en GitHub Actions.


## 2026-11-03 — Primera propuesta visual de Legión Multiversal en la web

- **Archivos modificados:**
  - `index.html`
  - `BITACORA.md` (este registro).
- **Cambios realizados:**
  - Se incorporó en la cabecera un emblema geométrico provisional con una M central y un anillo orbital, construido en CSS para que pueda revisarse directamente en la web.
  - Se actualizó el título del roster a **Legión Multiversal — Nuestro roster** y se reemplazó parte del lenguaje institucional antiguo por lenguaje de comunidad.
  - Se añadieron cuatro siluetas neutrales como espacios reservados para futuras incorporaciones, identificadas explícitamente como no confirmadas.
  - Se retiró de la galería del Capítulo 01 la referencia a una imagen de Pato que no existe actualmente en `assets/`; su ficha de colaborador permanece en el roster.
  - Se mantuvieron los retratos originales de los personajes ya disponibles. No se generaron ni sustituyeron ilustraciones.
- **Validaciones:**
  - Se comprobó que las rutas de los retratos conservados apuntan a recursos existentes del repositorio.
  - GitHub aceptó la actualización en `main`.
  - Despliegue pendiente de comprobar.
- **Pendientes / riesgos:**
  - El emblema es una primera propuesta web y debe recibir comentarios antes de considerarse definitivo.
  - Las cuatro siluetas son marcadores visuales, no integrantes anunciados.
  - La imagen individual de Pato — Oratoris no está en `assets/`; agregarla solo cuando el equipo la proporcione y apruebe.
  - Revisar el resultado responsive y continuar la actualización de textos antiguos en los capítulos restantes.
- **Commit:** `159c877e43ed1f75e69bdacaa3155e3303844dc8`
- **Despliegue:** pendiente de verificación en GitHub Actions.


## 2026-11-03 — Conexión del panel web con la automatización Twitch

- **Archivos modificados:**
  - `index.html`
  - `BITACORA.md` (este registro).
- **Cambios realizados:**
  - Se corrigió la discrepancia entre la automatización, que publica `data.json`, y la web, que todavía intentaba leer `stats-data.json`.
  - El Capítulo 03 ahora consume el esquema vigente de Twitch Helix: canales, estado en directo, espectadores actuales, categoría, muestras, promedio/pico observados y horas calculadas a partir de muestras consecutivas.
  - Las fichas individuales del roster consultan el mismo archivo y muestran el período real de hasta 10 días, la frecuencia programada de 15 minutos y las limitaciones de cada dato.
  - El panel de Partners deja de presentar seguidores y promedios oficiales como si estuvieran disponibles; distingue las muestras internas de las métricas oficiales de Creator Dashboard.
  - Se mantiene YouTube/Pato separado del conjunto Twitch.
- **Validaciones:**
  - Se confirmó que `data.json` existe en `main`, contiene 9 canales y declara `window_days: 10` y `sampling_interval_minutes: 15`.
  - Se confirmó que `stats-data.json` y `sullygnome-data.json` no existen en `main`; por eso se eliminó la dependencia del primero para los paneles Twitch.
  - GitHub aceptó la actualización de `index.html`.
  - Pendiente comprobar el despliegue de GitHub Pages y la visualización final en escritorio/móvil.
- **Pendientes / riesgos:**
  - El muestreo recién comienza: los promedios, picos y horas observadas pueden permanecer vacíos hasta que haya directos registrados.
  - Seguidores y analíticas oficiales requieren permisos/reportes adicionales; no se deben completar por inferencia.
  - Revisar visualmente el Capítulo 03 y las fichas individuales tras el despliegue.
- **Commit:** `98d7cea54d23b35113659686a6921532636a9627`
- **Despliegue:** pendiente de verificación en GitHub Actions / GitHub Pages.

### Informe breve para cada intervención futura

Al finalizar cada cambio, registrar: archivos tocados; qué se modificó y por qué; validaciones ejecutadas y resultado; pendientes/riesgos; hash del commit; estado y enlace/ID del despliegue. Diferenciar siempre lo acordado, lo implementado y lo pendiente.


## 2026-11-03 — Rediseño de cartas del roster

- **Archivo modificado:** `index.html`.
- **Objetivo visual:** mostrar únicamente el retrato del héroe dentro del marco nuevo del expediente, sin superponer la carta antigua completa.
- **Cambios realizados:**
  - Se corrigieron las rutas de los retratos disponibles para apuntar a `assets/` (Moriartys, ROD3R1K, LadyMoriarty, Capy, Ardipii, Akuma, ElGabii y Hábitos).
  - Se ajustó el recorte del retrato dentro de la ventana central del marco: ampliación controlada, centrado vertical y máscara de desvanecido sutil para ocultar el marco/título de la carta antigua que venía incorporada en las imágenes.
  - Se retiró la etiqueta de clasificación duplicada porque ya está dibujada en el marco maestro.
  - Dave/Nexus y Pato/Oratoris conservan el placeholder porque no se encontraron archivos de retrato con los nombres actuales en `assets/`; no se les asignó una imagen inventada.
- **Validación de fuentes:** se comprobaron en el repositorio los ocho archivos de retrato referenciados en `assets/`.
- **Pendiente:** revisión visual en GitHub Pages para afinar el encuadre individual si algún personaje queda demasiado cortado; comprobar despliegue.
- **Commit:** `7822c4525739100ac7bb829611817d8ca203f3cf`.


## 2026-11-05 — Primera maqueta del cómic individual de MORIARTYS

- **Archivo creado:** `comic-moriartys.html`.
- **Cambios realizados:**
  - Se inició la colección de cómics individuales de los héroes de Legión Multiversal, reemplazando el enfoque de bitácora/libro para esta presentación.
  - Se conservó la carta original de MORIARTYS como portada, sin regenerarla ni editarla.
  - Se maquetaron seis páginas navegables: portada, origen de la Legión, perfil del héroe, métricas del canal, expediente promocional Bar Fender y continuidad/alianzas.
  - Se incorporaron estadísticas del directo de Los Moriartys del 5/11/2026 y métricas de Twitch Shared Viewership con aclaraciones sobre alcance y fuente.
  - Se documentó Bar Fender con cuatro participantes, tres VOD públicos, 3:43:35 de tiempo efectivo sumado en esos tres VOD y ocho clips identificados por título. No se atribuyeron ventas, ROI ni audiencia única deduplicada.
  - Se incorporaron partners Enshrouded y Cinderia, y se diferenciaron Lurkit/Keymailer como plataformas de acceso a keys.
- **Validaciones:**
  - Se volvió a leer el archivo desde GitHub y se verificó la presencia de portada, capítulos, navegación, estadísticas, enlaces a VOD y sección Bar Fender.
  - Se verificó el despliegue de GitHub Pages asociado al commit `aa258406308a17b7993249bed584a215edb7d5cd`: workflow `pages build and deployment` completado con éxito.
  - Se comprobó en navegador que la página carga, la carta original se visualiza, las seis páginas se pueden recorrer y la página 05/06 muestra el expediente Bar Fender con sus tres VOD.
- **Pendientes / riesgos:**
  - Es una primera maqueta individual; todavía no está enlazada desde la navegación principal.
  - Los ocho clips de Bar Fender están identificados por título, pero faltan sus URLs individuales.
  - Revisar textos y diseño con el usuario antes de replicar la plantilla para los demás héroes.
  - Las estadísticas históricas ampliadas deben seguir incorporándose solo cuando estén verificadas.
- **Commit de la maqueta:** `aa258406308a17b7993249bed584a215edb7d5cd`.
- **Despliegue:** GitHub Pages completado con éxito (workflow run `41989248368`).


## 2026-11-15 — QA integral del Roster y reconciliación de la Bitácora

- **Rama / PR:** `feat/roster-integral-2026-11-14`, PR #47 (Draft, abierto). Sin merge ni cambios en `main`.
- **Archivos modificados:**
  - `creator-records.json`, `app.js`
  - `scripts/check_identity_consistency.py`
  - `tests/test_roster_accessibility_contract.py`
  - `tests/baselines/approved-editorial-updates.json`
  - `package.json`, `playwright.config.js`
  - `tests/browser/roster.spec.js`, `tests/browser/bitacora.spec.js`
  - `.github/workflows/validar-sitio.yml`, `.github/workflows/test-stats.yml`
  - `bitacora-preview.html`
- **Cambios realizados — Roster:**
  - Se sustituyeron los tres títulos automáticos de clips de ROD3R1K por los títulos confirmados: «NO VOY A DECIR NADA xd», «Ff se mueve la puerta» y «Nueva actualización de temporada · Rogue Company», tanto en el registro editorial como en el cómic.
  - Se amplió el detector de accesos legacy para cubrir notación por punto, optional chaining y corchetes; se añadieron casos negativos que demuestran que detecta esas variantes.
  - La aprobación de los tres títulos quedó registrada como una excepción editorial exacta. La línea base histórica previa a la migración no se regeneró ni se sobrescribió.
  - Playwright ahora abre los ocho perfiles y los ocho modales, comprueba sus tres pestañas y verifica que los dos hashes de Lady Moriarty resuelven al mismo expediente.
  - La prueba de navegador detectó y permitió corregir un error real de inicialización en `renderAkumaComicPages()`: `streamBody` se utilizaba antes de declararse.
- **Cambios realizados — Bitácora:**
  - Se alineó el índice del libro con la numeración y los destinos reales de Inicio, Origen, Valores, Roster, Estadísticas, Comunidad, Alianzas, Colaboraciones, Archivo de campañas, Arsenal, En Vivo, Reclutamiento y Mapa Multiversal.
  - Se corrigieron las etiquetas editoriales de los capítulos.
  - El directorio ahora presenta `display_name` y construye enlaces con `slug`/`id` canónicos, en vez de derivarlos del nombre técnico.
  - El índice se distribuye en dos columnas para mantener legibilidad con la navegación ampliada.
- **Validaciones:**
  - 33 pruebas unitarias: OK.
  - 15 pruebas de identidad: OK.
  - Playwright: 4 pruebas de navegador aprobadas (ocho expedientes, ocho modales, ambos hashes de Lady, índice y directorio de Bitácora).
  - Validadores de clips, rutas, imágenes y enlaces: OK.
  - [Workflow de validación completo](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43700075996): SUCCESS en SHA `3b20530f45ba56b9a0bd9bb6ffd69448a89631e2`.
  - [Workflow de estadísticas](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43700075988): los controles de identidad/conservación pasan; falla únicamente el control de frescura/procedencia de `creator-metrics.json` (1413 s de diferencia y falta `source_snapshot`). Se deja deliberadamente pendiente para el último cambio, después de sincronizar con el `main` más reciente.
- **Pendientes / riesgos:**
  - Revisar visualmente la Bitácora en escritorio y móvil.
  - Sincronizar la rama con el último `main` antes de regenerar `creator-metrics.json`; hacerlo como último cambio y repetir CI.
  - PR #47 sigue Draft. No se modificaron secretos, credenciales ni producción; no se ejecutó un despliegue de producción.
- **Commit de código validado:** `3b20530f45ba56b9a0bd9bb6ffd69448a89631e2`.
- **Despliegue:** no realizado; la validación corresponde a CI/preview, no a producción.


## 2026-11-15 — Bitácora Multiversal revisada, ampliada e integrada

- **Rama / PR:** `feat/roster-integral-2026-11-14`, PR #47 abierto y Draft. HEAD validado: `32fee04a6200673724e197954e583349575252d8`.
- **Archivo principal:** `bitacora-preview.html`.
- **Revisión y correcciones:**
  - El libro tenía un índice de 13 destinos, pero el recorrido narrativo desarrollaba solo una parte de los capítulos. Se restituyó el índice como primer folio y se amplió el libro a 15 folios navegables: índice general y 14 entradas editoriales, incluyendo el caso BarFender.
  - Se incorporaron folios para Inicio, Origen, Valores, Roster, Estadísticas, Comunidad, Alianzas, Colaboraciones, BarFender, Archivo de campañas, Arsenal, En Vivo, Reclutamiento y Mapa Multiversal.
  - La numeración se alineó con los IDs reales del sitio principal. El Archivo de campañas figura como anexo, no como capítulo 08.5.
  - El contador de páginas ahora se calcula desde la cantidad real de folios y muestra 00 / 15 en portada.
  - Se corrigió un problema de lectura móvil: la segunda página del pliego estaba oculta en pantallas pequeñas. Ahora las dos hojas se muestran apiladas; el índice pasa a una columna.
  - El directorio conserva los ocho integrantes, sus nombres públicos y sus slugs/IDs canónicos desde `roster-data.json`, sin mantener una segunda copia editorial de esos datos.
  - El error de carga del directorio ahora queda registrado en consola, en vez de ocultarse silenciosamente.
- **Pruebas agregadas / ampliadas:** `tests/browser/bitacora.spec.js` comprueba destinos del índice, los ocho nombres y slugs del directorio, los 15 folios, el final del recorrido y la visibilidad de ambas hojas en móvil. El workflow de validación ahora se activa también cuando cambia `bitacora-preview.html`.
- **CI en el SHA indicado:** [workflow de validación SUCCESS](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43700512037). 33 pruebas unitarias y 5 pruebas Playwright aprobadas; los validadores de Roster, clips, rutas, imágenes y enlaces finalizaron correctamente.
- **Pendiente deliberado:** `creator-metrics.json` no se regeneró. Se mantiene como último cambio, después de sincronizar la rama con el `main` más reciente, y requiere su propio ciclo de validación.
- **Integridad / publicación:** PR #47 sigue Draft; no hubo merge, no se modificó `main`, no se desplegó producción y no se tocaron credenciales.


## 2026-11-21 — Registro maestro compartido de juegos · PR 1

- **Archivos nuevos:** `games.json`, `schemas/games.schema.json`, `scripts/validate_games_registry.py`, `tests/test_games_registry.py`.
- **Archivos actualizados:** `.github/workflows/validar-sitio.yml`, `INFORMES.md`, `BITACORA.md`.
- **Cambios:** origen único con 18 juegos, 10 sesiones BIT y 11 POV; referencias canónicas al Roster; categorías controladas; plataforma, edición y modalidad separadas; fechas/jugadores/portadas no confirmados en `null`; BarFender separado como `EXP-001`.
- **Criterios:** el participante no se confunde con el canal POV; Among Us registra cuatro participantes y dos POV; PEAK conserva canal POV sin asignar; Escape the Backrooms reúne la sesión BIT-001 en un solo registro.
- **Validaciones locales:** 14 pruebas unitarias; validador manual; parseo JSON del catálogo y esquema; compilación Python.
- **Pendiente:** validar CI del PR y, en PRs posteriores, conectar los capítulos 07 y 08 a este archivo. La tarjeta estática de Backrooms en Arsenal debe sincronizarse con el nuevo registro; no se tocó la interfaz en esta etapa.
- **Commit:** rama de trabajo; pendiente de CI y revisión.
- **Despliegue:** no aplica; PR independiente, no integrado.


## 2026-11-21 — Capítulo 07 · Bitácora dinámica de colaboraciones

- **Archivos:** index.html, styles.css, games-registry.js, tests/test_collaborations_registry_contract.py, tests/browser/collaborations-registry.spec.js, .github/workflows/validar-sitio.yml, tests/browser/home-conversion.spec.js, INFORMES.md y BITACORA.md.
- **Datos:** el capítulo lee games.json y roster-data.json; las imágenes de canales se obtienen de data.json cuando están disponibles y se respaldan con iniciales, sin reutilizar retratos del Roster. No duplica el registro.
- **Experiencia:** 10 sesiones BIT, 11 POV, participantes separados de canales POV; filtros por búsqueda, categoría y creador; enlaces directos a los VOD y al futuro ID de Arsenal.
- **Casos especiales:** Among Us (cuatro participantes, dos POV); PEAK (canal POV no asignado); Escape the Backrooms (BIT-001 unificado); BarFender permanece como EXP-001 independiente sin contarse como BIT.
- **Pruebas:** pendientes de CI en el PR de la rama.
- **Pendiente:** conectar el Capítulo 08 · Arsenal al mismo origen y verificar que los enlaces entre ambos capítulos funcionen.
- **Despliegue:** no aplica hasta la integración.


## 2026-11-21 — Capítulo 08 · Arsenal conectado al registro compartido

- **Archivos:** index.html, styles.css, arsenal-registry.js, tests/test_arsenal_registry_contract.py, tests/browser/arsenal-registry.spec.js, tests/browser/home-conversion.spec.js, tests/test_collaborations_registry_contract.py, games-registry.js, .github/workflows/validar-sitio.yml, INFORMES.md y BITACORA.md.
- **Origen:** el catálogo lee los 18 registros de games.json; no replica juegos, categorías ni URLs.
- **Experiencia:** filtros por búsqueda, categoría, estado y jugadores mínimos verificados; ruleta sobre resultados visibles; contadores calculados; enlaces a tienda y Bitácora.
- **Estados:** 10 juegos con sesión BIT, 7 por descubrir y BarFender como expediente comercial EXP-001 independiente.
- **Navegación cruzada:** las sesiones reciben anclas BIT estables; ambas secciones enlazan por IDs canónicos.
- **Pruebas:** pendientes del CI del PR apilado.
- **Despliegue:** no aplica hasta integrar PR #87 y PR #88.
