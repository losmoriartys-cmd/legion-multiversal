# Evolución visual — Legión Multiversal

**Estado:** auditoría inicial iniciada · trabajo aislado  
**Base:** `main` en `595f52c381e09ad055e98111d8122afd4cd6eecf`  
**Rama:** `visual/evolution-audit-2026`

## Objetivo
Evolucionar la presentación visual de Legión Multiversal hacia una identidad coherente, cinematográfica y editorial de cómic/multiverso, sin degradar navegación, responsive, accesibilidad, rendimiento, datos, integraciones ni validaciones existentes.

## Principios
- Conservar identidad de cómic y personalidad comunitaria; no reemplazar por un template genérico.
- Consolidar el lenguaje vintage-comic, sci-fi HUD y editorial cinematográfico, evitando que compitan.
- Reusar assets y datos existentes; no sustituir imágenes sin motivo.
- No tocar producción ni hacer merge automático.
- Respetar los contratos de archivos protegidos y los checks de Validar.
- Toda mejora visual debe ser medible y probarse en escritorio y móvil.

## Auditoría preliminar (fuentes: index.html, styles.css y hojas auxiliares)
- La portada ejecutiva ya tiene composición hero, artwork de fondo, degradados y CTAs; se debe refinar jerarquía y densidad antes de reconstruirla.
- Hay una paleta multiversal (void/deep space/cyan/violet/magenta/gold) junto a acentos comic amarillo/rojo y sombras negras. Requiere tokens semánticos y reglas de uso consistentes.
- Existen múltiples capas de CSS correctivo y de evolución (conversion-overhaul, conversion-phase2, chapters-refresh, roster-fixes, roster-selector, creator-colors extensions, etc.). Antes de sumar reglas, mapear importación/orden, especificidad, duplicados y alcance; consolidar solo con evidencia.
- El roster utiliza colores individuales por creador y tratamientos de dossier. Preservar su individualidad, revisar equilibrio entre fondos, color, contraste y lectura.
- Las páginas editoriales/subpáginas tienen variables propias; revisar coherencia entre shell principal y subpáginas sin imponer una identidad uniforme donde sea intencional.
- Los capítulos contienen estructuras funcionales y estados que no deben modificarse como efecto colateral del rediseño.

## Fases
1. **Auditoría visual**: inventario por capítulo, hojas CSS, dependencias/orden de carga, puntos de inconsistencia, capturas desktop/mobile, accesibilidad y rendimiento.
2. **Sistema visual**: tokens semánticos de color, tipografía, espacios, radios, sombras, bordes, superficies, estados, iconografía y movimiento.
3. **Rediseño progresivo por capítulos**:
   - Portada ejecutiva: impacto, foco y CTA.
   - Roster: dossiers y selector, preservar arte/identidad.
   - Estadísticas: jerarquía de datos y visualización.
   - Comunidad: actividad y accesos visuales.
   - Alianzas/Colaboraciones: casos y relaciones claramente distinguidos.
   - Arsenal: catálogo visual y descubrimiento.
   - Origen/Valores/En Vivo/Reclutamiento: alineación al sistema sin borrar su narrativa.
4. **Responsive + accesibilidad**: tamaños táctiles, contraste, foco, navegación, reduced-motion, densidad y overflow.
5. **Validación**: checks actuales, visual-regression, capturas de viewport, diffs revisados, tests pertinentes y reporte de riesgos.

## Primera tanda de revisión — hallazgos confirmados

### Orden de carga observado en index.html
1. styles.css (global + estilos críticos inline de portada)
2. chapter-8.css
3. roster-fixes.css
4. roster-selector.css
5. social-links.css
6. live-program.css
7. editorial-subpages.css
8. creator-colors.css (tokens de creadores generados)
9. stats-tables.css
10. public-audience-paths.css
11. chapters-refresh.css
12. creator-colors-extensions.css

La carga utiliza varios enlaces diferidos con media=print/onload y noscript; deben preservarse al auditar o reorganizar estilos.

### Riesgos a investigar
- Los estilos de portada y globales aparecen también en el CSS crítico del index, por lo que puede haber divergencia entre la regla fuente y el fallback.
- Varias capas de refinamiento se cargan al final y comparten selectores con estilos previos; antes de consolidar, hay que identificar cuáles son overrides intencionales y cuáles quedaron obsoletos.
- El roster utiliza tokens de color generados por creador y extensiones que afectan cards, datos, métricas y botones. No normalizar esos colores sin conservar el sistema de identidad individual.
- Las subpáginas tienen variables y shell propios; evaluar consistencia de marca sin borrar diferencias de contexto.
- La hoja de estadísticas y la de rutas públicas son capas funcionales: cambios deben probarse con sus tests específicos.
- El cambio de sistema de diseño no debe aumentar la especificidad ni generar una nueva capa global de overrides.

### Próxima acción
Completar el mapa de selectores/duplicaciones de carga, revisar capturas y pruebas existentes, y definir una propuesta pequeña de tokens semánticos. Implementar primero una capa de sistema visual acotada y probarla en la portada; ampliar solo después de confirmar ausencia de regresiones.

## Criterios de aceptación
- No se rompe el flujo de capítulos ni navegación.
- No se alteran datos, métricas, enlaces, imágenes ni funcionalidades sin una necesidad explícita.
- Sin regresiones de escritorio/móvil y sin overflow horizontal no intencional.
- Focus visible, contraste razonable, movimiento reducido respetado.
- Las capturas comparativas muestran mejora clara y el sistema CSS queda más coherente, no más fragmentado.

## Registro
- 2026-11-28: rama de trabajo creada desde main; inspección inicial de index, estilos globales y hojas auxiliares. No se modificó main ni producción.
- Próximo paso: completar mapa de carga CSS y auditoría capítulo/viewport antes de implementar los primeros tokens/refinamientos.


## 28/11/2026 — Primera intervención: tokens semánticos

- Se incorporó una base semántica de color, superficies, bordes, tipografía de lectura y sombras en `:root` de `styles.css` y en el CSS crítico de `index.html`.
- Tokens nuevos: tinta/void, tres niveles de superficie, líneas suaves/firmes, cyan/violet/magenta/gold, texto primario/secundario/atenuado y sombras de profundidad/comic.
- **No se alteró el aspecto por sí solo:** los tokens aún no están conectados a componentes. Esta intervención es una base para migrar reglas existentes sin sumar otra hoja correctiva ni producir cambios visuales inesperados.
- `creator-colors.css` permanece intacto y generado desde su JSON.
- Próximo piloto: migración controlada de la Portada ejecutiva (hero, panel, CTA y jerarquía), con revisión de duplicaciones entre CSS crítico, `styles.css` y hojas de conversión antes de tocar selectores.
- Verificación pendiente: sintaxis, pruebas automatizadas y capturas reales en escritorio/móvil. No declarar aprobado hasta ejecutarlas.


## Ajuste de proceso — autorización de archivos sensibles

La primera inserción de tokens semánticos en `index.html` y `styles.css` fue detectada correctamente por la política de cambios sensibles del repositorio. Se restauraron ambos archivos al estado de `main`; no se conservarán cambios de implementación en esos archivos hasta que el procedimiento de autorización correspondiente esté aprobado. La propuesta de tokens queda como diseño/documentación, no como código activo. La rama debe pasar nuevamente las validaciones con estos archivos intactos.



## 28/11/2026 — Revisión de autorizaciones y brief de portada

- La última ejecución sobre la rama limpia (`fa8eb4a`) pasó **Validar código y datos del sitio**, **Validar colector de estadísticas** y **Auditoría externa de enlaces públicos**. La autorización fallida previa queda resuelta al restaurar `index.html` y `styles.css` a `main`.
- QA común de capítulos no se disparó en el último commit porque solo cambió documentación; su última ejecución disponible, sobre el SHA anterior que sí contenía cambios de código, había concluido correctamente.
- Se agregó `brief-portada-y-banner.md`: define la dirección de arte, el piloto de Portada, la referencia del banner del usuario, las reglas responsive/motion y las restricciones de autorización.
- **No hay cambios de implementación visual activos.** HTML, CSS y assets siguen sujetos a autorización por transición/hash. El siguiente paso será mapear selectores y preparar el cambio acotado y su autorización fase A, no eludir la protección.


## 28/11/2026 — Dirección creativa aprobada para ALIANZAS

- Se incorporó al brief el concepto **la mesa de la próxima dimensión**: integrantes actuales del Roster reunidos revisando bitácoras, documentos y fichas de perfiles que podrían sumarse a futuro.
- Se separó expresamente la narrativa de **ALIANZAS** (construcción/exploración de vínculos) de **COLABORACIONES** (proyectos y experiencias que ya ocurrieron y tienen evidencia).
- Se estableció que los perfiles futuros deben leerse como exploratorios/no confirmados; no inventar nombres, canales, estadísticas ni acuerdos. También se definieron composición, paleta funcional, espacio para título y recorte móvil seguro.
- El usuario aceptó esta dirección creativa. Sigue siendo concepto documentado, no arte final ni asset listo para publicación.


## Contexto funcional verificado — ALIANZAS Y OPORTUNIDADES

Se revisó la sección actual `#chapter-8` en `main`. No es una página vacía: contiene recorridos para probar un juego, contactar a una persona del Roster o proponer una experiencia grupal; credenciales colectivas e individuales; plataformas; contexto LATAM; formatos; modelos de activación; experiencias/casos; transparencia y contacto. La nueva escena de la mesa funcionará como introducción narrativa y orientación, no como reemplazo de esa estructura ni de las credenciales comprobadas. Se agregó esta preservación al brief.


## 28/11/2026 — Mapa de cascada de Portada

Se verificó que la familia visual de la Portada se reparte entre `styles.css`, los bloques `critical-home-styles`, `conversion-overhaul-inline` y `conversion-phase2-inline` en `index.html`, y refinamientos de `public-audience-paths.css`. Hay solapamientos en layout del hero, tratamiento de imagen, copy/títulos, CTAs y header. Se documentó el mapa y los riesgos en `docs/evolucion-visual/mapa-cascada-portada.md`. Todavía no se borró ni consolidó ninguna regla: el siguiente paso requiere capturas/computed styles en desktop y móvil para determinar la cascada efectiva y el alcance mínimo del piloto.


## Hallazgo de rendimiento/cascada — carga diferida de styles.css

La hoja global `styles.css` no entra en el primer render: `app.js` la solicita en el primer `scroll`, `pointerdown` o `keydown` mediante `ensureGlobalChapterStyles()`. Por eso `critical-home-styles` gobierna la primera pantalla y luego se incorpora la hoja global. El mapa de cascada ahora incluye la necesidad de comparar ambos estados y medir cualquier salto visual, sin quitar la carga diferida por intuición.


## Control de regresión de Portada agregado

Se amplió `tests/browser/visual-regression.spec.js` con una comparativa del Hero de Portada contra el baseline exacto de `main`, para escritorio y móvil, en dos estados: carga inicial (sin `styles.css`) y después de cargar la hoja global al entrar a otro capítulo y volver. Se comprueba geometría, tamaño raster y delta máximo de canal (tolerancia existente de 2/255), además de errores JavaScript. Es infraestructura de prueba; no cambia HTML, CSS, datos ni assets del sitio.


## Personajes oficiales para la escena de ALIANZAS
Se verificó `data/roster.json`: hay ocho personajes actuales con referencias de retrato, imagen/fullbody y character card. El brief fija que la escena parta de esas ocho identidades y sus diseños existentes, con posturas naturales de reunión; los perfiles futuros serán dossiers esquemáticos/siluetas sin identidad y claramente separados del Roster actual. No se va a inventar un noveno personaje ni atribuir credenciales o roles no registrados.


## Matriz de QA de Portada
Se relacionó el nuevo test de comparación visual con las pruebas ya existentes: `home-conversion.spec.js` (primer viewport y carga diferida), `chapter-common-qa.spec.js` (capítulos y responsive en cinco viewports) y `visual-regression.spec.js` (comparación contra main para Roster/Stats, ahora también Portada en frío y con CSS global). La nueva cobertura está pendiente de PASS del workflow completo.
