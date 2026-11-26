# Infraestructura QA común de capítulos

## Objetivo

Aplicar un contrato responsive, de navegación y de evidencia visual reutilizable a todos los capítulos, sin sustituir pruebas específicas ni debilitar aserciones existentes.

## Cobertura común

- IDs cubiertos: `0, 1, 2, 3, 6, 8, 9, 10, 11, 12 y 13` (los 11 paneles `#chapter-N` presentes en `index.html`).
- La suite descubre los IDs reales del DOM y exige igualdad exacta con la matriz declarada. Agregar o eliminar un panel sin actualizar la matriz hace fallar la prueba.
- Viewports: 1440×1000, 1024×900, 768×1024, 390×844 y 360×800.
- Navegación mediante la función canónica `switchChapter`.
- Overflow horizontal del panel y del documento, con diagnóstico de descendientes visibles.
- Preferencia `prefers-reduced-motion: reduce`.
- Errores JavaScript de página durante el recorrido.
- Presencia del encabezado, controles de navegación y recorrido de capítulos.

En todos los tamaños se ejecutan las aserciones responsive. Además, se conserva una captura por capítulo en dos viewports representativos: escritorio ancho (1440 px) y móvil (390 px). Son 22 capturas por ejecución cuando los 11 paneles están presentes.

## Comparación visual determinista

`tests/browser/visual-regression.spec.js` compara el candidato con la preview del `main` vigente para el mismo SHA resuelto por CI (`MAIN_BASELINE_URL`). La comparación se realiza dentro de la misma versión de Chromium y el mismo contexto de navegador, con movimiento reducido y fuentes externas de Google bloqueadas en ambas páginas.

Las superficies comparadas son:

| Área | Superficies | Viewports |
|---|---|---|
| Roster | Las ocho cartas del índice del Roster | 1280×900 y 390×900 |
| Estadísticas | Resumen, comparativa Twitch, rendimiento por juego, evolución, semana de la Legión y tabla técnica | 1280×900 y 390×900 |
| Bitácora | Contenido de Bitácora de Lady Moriarty | 390×844 |

Para cada superficie se comprueba la geometría y se comparan los bytes de las capturas PNG. Las capturas de `main` y del candidato se adjuntan como evidencia. Las esperas exigen contenido real (cartas, filas y métricas) antes de capturar; no se acepta comparar estados de carga.

La comparación de Bitácora conserva su normalización específica del marco exterior de identidad, documentada en la prueba existente. Las comparaciones nuevas de Roster y Estadísticas no enmascaran ni normalizan componentes: cualquier diferencia de geometría o de píxeles falla y debe revisarse.

## Baselines y revisión

- La referencia es la preview del SHA exacto de `main` resuelta por el workflow, no una captura que se actualiza desde el candidato.
- No se regeneran ni aceptan baselines automáticamente.
- Un cambio visual intencional debe aparecer en el diff del PR, contar con revisión explícita de las capturas de `main` y del candidato y pasar las pruebas restantes. La integración aprobada hace que el nuevo `main` sea la referencia de futuras comparaciones.
- No editar HTML, CSS, assets, tipografías ni proporciones para facilitar una prueba.
- Antes de relajar una aserción, demostrar que la diferencia es una variación de entorno o un comportamiento intencional; no ocultar diferencias reales.

## Evidencias de CI

El workflow `.github/workflows/qa-comun-capitulos.yml` ejecuta la suite común en cada PR que toca HTML, CSS, JavaScript, pruebas o configuración de Playwright. Publica el artefacto `qa-comun-capitulos-<sha>` con las capturas representativas y los resultados de la ejecución.

El workflow `.github/workflows/validar-sitio.yml` ejecuta la batería completa (`npm run test:e2e`) y publica `roster-visual-review-<sha>`, que incluye los pares de capturas visuales de las superficies comparadas. Ante un fallo, Playwright conserva los datos de diagnóstico configurados por el proyecto; el mensaje de la aserción identifica superficie y viewport.

## Ejecución local

```bash
npm install
npx playwright install --with-deps chromium
npx playwright test tests/browser/chapter-common-qa.spec.js
```

Para las comparaciones visuales contra `main`, definir `MAIN_BASELINE_URL` con la preview del SHA de referencia y ejecutar:

```bash
MAIN_BASELINE_URL=https://<preview-main>.pages.dev npx playwright test tests/browser/visual-regression.spec.js
```

El workflow de PR resuelve esa URL automáticamente. Este repositorio no mantiene un `package-lock.json`; por eso la instalación local documentada usa `npm install`.

## Estados

- **PASS:** todas las aserciones cumplidas y artefactos publicados.
- **FAIL:** regresión reproducible detectada; CI bloquea la integración.
- **BLOCKED:** el entorno, la preview de referencia o las dependencias impiden ejecutar. Nunca equivale a aprobación.

Las pruebas específicas de cada capítulo siguen siendo necesarias; la suite común no sustituye contratos de datos, accesibilidad semántica completa ni interacciones particulares.

## Límites conocidos

La infraestructura verifica navegación, geometría responsive y las superficies visuales enumeradas; no representa una auditoría WCAG completa ni afirma cobertura pixel-perfect de todos los estados posibles de cada capítulo. El overflow intencional (por ejemplo, una navegación horizontal desplazable) debe seguir distinguiéndose de una ruptura del layout. Toda ampliación de estados o superficies debe aportar detección útil y evidencia revisable.
