# Recuperación selectiva del PR #46

## Decisión

No integrar la rama histórica `auditoria-ux` completa. Se recuperan solo herramientas de QA que no dependen de Cloudflare ni del modelo de datos anterior.

## Base de trabajo

- Rama nueva: `integration/pr46-portable-qa`
- Base inicial de `main`: `624989b13fb0818c5830ebf051c3d253628086b7`
- PR de integración: #51
- Producción: GitHub Pages en `https://losmoriartys-cmd.github.io/legion-multiversal/`

## Herramientas recuperadas

- `scripts/add_image_dimensions.py`: medición real de imágenes con Pillow; la raíz del repositorio se resuelve desde la ubicación del script y `--check` no escribe.
- `scripts/audit_accessibility.py`: controles estáticos de etiquetas, IDs, iframes, enlaces externos, foco visible y movimiento reducido.
- `scripts/check_anchors.py`: verificación de anclas HTML locales.
- `scripts/summarize_lighthouse.py`: medianas únicamente desde reportes JSON reales.
- `scripts/lh_failures.py`: diagnóstico de auditorías Lighthouse, LCP e imágenes pesadas.
- `scripts/lighthouse_runs.sh`: GitHub Pages es el destino por defecto; el preview es opcional y explícito.

## SEO y publicación

- Canonical y Open Graph de la portada apuntan al dominio real de GitHub Pages.
- Cómic y expediente público declaran canonical de GitHub Pages.
- Las páginas identificadas como previews llevan `noindex, nofollow`.
- `robots.txt` y `sitemap.xml` usan exclusivamente el dominio de producción.
- README aclara que Cloudflare no es producción.

## Exclusiones

No se recuperan `functions/api/*`, `_headers`, workflows que requieran permisos de escritura, scripts ligados a `heroes[]` ni formularios que dependan del endpoint de contacto de Cloudflare. Tampoco se sustituyen `app.js`, `styles.css`, datos del roster, snapshots ni credenciales.

## Validación

El PR #51 ejecuta:
1. Validación de código y datos del sitio vigente.
2. Pruebas unitarias y E2E existentes.
3. Workflow QA portable: compilación, shellcheck sintáctico, validador de sitio, anclas, accesibilidad y dimensiones en modo no destructivo.

No se aplican automáticamente dimensiones ni optimizaciones de imágenes. Cualquier modificación visual posterior requiere diff y validación independiente.
