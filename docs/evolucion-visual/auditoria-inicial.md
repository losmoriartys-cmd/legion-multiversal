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

## Primera tanda de revisión
- Mapa de hojas y orden de carga.
- Identificación de reglas duplicadas, sobrescrituras y estilos globales con impacto cruzado.
- Propuesta de tokens antes de cambiar estilos de capítulos.
- Priorización por impacto visual y riesgo técnico.
- Mantener un registro de cambios, evidencia y pendientes en este documento.

## Criterios de aceptación
- No se rompe el flujo de capítulos ni navegación.
- No se alteran datos, métricas, enlaces, imágenes ni funcionalidades sin una necesidad explícita.
- Sin regresiones de escritorio/móvil y sin overflow horizontal no intencional.
- Focus visible, contraste razonable, movimiento reducido respetado.
- Las capturas comparativas muestran mejora clara y el sistema CSS queda más coherente, no más fragmentado.

## Registro
- 2026-11-28: rama de trabajo creada desde main; inspección inicial de index, estilos globales y hojas auxiliares. No se modificó main ni producción.
- Próximo paso: completar mapa de carga CSS y auditoría capítulo/viewport antes de implementar los primeros tokens/refinamientos.
