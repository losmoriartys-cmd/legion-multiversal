# Infraestructura QA común de capítulos
## Objetivo
Aplicar un contrato responsive y de navegación reutilizable a todos los capítulos, sin sustituir pruebas específicas ni debilitar aserciones.
## Cobertura
- IDs de capítulo cubiertos: 0, 1, 2, 3, 11, 9, 10, 8, 12, 5, 6, 13.
- Viewports: 1440, 1024, 768, 390 y 360 px.
- Navegación mediante la función canónica `switchChapter`.
- Overflow horizontal del panel y del documento, con diagnóstico de descendientes visibles.
- Preferencia `prefers-reduced-motion: reduce`.
- Errores de JavaScript de página durante el recorrido.
- Presencia de encabezado, controles de navegación y recorrido de capítulos.
## Ejecución local
```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test tests/browser/chapter-common-qa.spec.js
```
El workflow `.github/workflows/qa-comun-capitulos.yml` ejecuta la suite en PR y publica artefactos de prueba.
## Estados
- PASS: todas las aserciones cumplidas.
- FAIL: regresión detectada; CI falla.
- BLOCKED: entorno/dependencias impiden ejecutar. Nunca equivale a aprobación.
Las pruebas específicas de cada capítulo siguen siendo necesarias; la suite común no sustituye contratos de datos, accesibilidad semántica ni interacciones particulares.
## Límites
Esta primera versión verifica navegación y geometría responsive, no auditoría WCAG completa ni comparación pixel-perfect. El ancho del panel/documento detecta overflow incluso si proviene de pseudo-elementos; la lista de descendientes es diagnóstico complementario.
