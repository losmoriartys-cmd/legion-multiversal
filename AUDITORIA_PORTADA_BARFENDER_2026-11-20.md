# Cierre QA de Portada y precisión editorial BarFender — 2026-11-20

## Base auditada
- Repositorio: `losmoriartys-cmd/legion-multiversal`
- Rama base: `main`
- SHA consultado al iniciar la auditoría: `e1005d5610d057fbc785bba3ac0edee6669cc995`
- Archivos revisados: `index.html`, `app.js`, `styles.css`, `tests/browser/home-conversion.spec.js`, `tests/test_public_audience_paths.py`, `BIBLIA_EVOLUCION_LEGION_MULTIVERSAL.md`, `INFORMES.md`, `PLAN_CIERRE_IMPLEMENTACION_PRODUCCION.md`.

## Tarea 01 — Portada
### Hallazgos
- El panel `chapter-0` mantiene portada ejecutiva independiente del Origen.
- Los tres caminos son distintos y están implementados: Roster (`switchChapter(2)`), página de marcas (`./marcas/`) y Reclutamiento (`switchChapter(6)` con modo creador).
- Existen credenciales, estado de transmisiones, recorrido guiado, expediente BarFender, bloque de comunidad, formatos de colaboración y contacto.
- Se detectaron pruebas Playwright existentes para los tres CTA, H1 de subpáginas y carga diferida del CSS de capítulos.
- La hoja y el JS ya tienen comportamiento responsive y accesibilidad declarada; la inspección estática no demuestra funcionamiento visual/real.
### Resultado
No se hizo rediseño ni modificación funcional de la Portada: la auditoría estática no encontró un defecto claro que justifique alterar su arquitectura o jerarquía. Se agregaron contratos Python para proteger los tres destinos y evitar regresiones.
### Aceptación pendiente
- Ejecutar CI/Playwright sobre esta rama.
- Revisar capturas desktop y móvil en navegador real.
- Validar foco/teclado y contraste en la presentación renderizada.
- Confirmar que producción sirve el SHA de `main` vigente y realizar revisión visual pública.
La Portada no se considera cerrada ni verificada en producción hasta cumplir esos controles.

## Expediente 001 — BarFender
### Hallazgo editorial
El expediente distingue una sesión colaborativa estimada en ~90 minutos y tres VOD públicos de aproximadamente 1 h 14 min cada uno. Esa diferencia puede confundir al lector; no debe insinuarse que los tres VOD cubren la duración total ni sumar sus duraciones.
### Corrección implementada
Se aclaró el texto en `index.html` dentro de «Cómo leer estos datos»: la sesión es una estimación; los VOD son registros disponibles, no una medición de duración total ni una suma. Se mantiene la nota de que solo hay tres VOD públicos (no se localizó VOD de Akuma), los cuatro participantes, los clips seleccionados y las métricas individuales con su contexto.
### Salvaguardas
- No se suman espectadores de canales distintos.
- No se atribuyen ventas, conversiones ni ROI.
- Los valores del VOD completo de Los Moriartys se mantienen explícitamente separados del tramo BarFender.
- No se cambia ningún dato, URL de VOD, clip, imagen o participante.
### Validación
Se agregaron contratos Python para los tres destinos de la Portada y para la distinción entre estimación de sesión y duración individual de VOD. Resultados de CI y Playwright quedan pendientes; no se declara aprobación ni despliegue.

## Cambios en esta rama
- `index.html`: aclaración editorial sobre duración de sesión vs. duración de VOD.
- `tests/test_public_audience_paths.py`: dos contratos nuevos.
- Este documento: registro de hallazgos, alcance y límites de aceptación.

## Estado
**Implementado en rama; pruebas automatizadas pendientes.** Sin cambios en `main`, sin merge y sin despliegue de producción.
