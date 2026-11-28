# Brief visual — Legión Multiversal

**Estado:** propuesta visual; no implementada.
**Referencia principal:** banner aportado por el usuario el 28/11/2026 (equipo, paneles de actividad, estética cómic/sci-fi, paleta individual por personaje).

## Dirección de arte
- Evitar dashboard genérico y exceso de neón; mantener personalidad de historieta con tratamiento editorial/cinematográfico.
- El equipo debe verse como un conjunto de personajes diferenciados, no avatares clonados. Cada capítulo puede variar su atmósfera, pero comparte tipografía, sistema de bordes, jerarquía, microinteracciones y reglas de contraste.
- Usar color por función, no decorar todo: cyan para navegación/tecnología; violet para multiverso/identidad; gold para historia/logros/alianzas; blanco frío para lectura; blue-gray para secundaria; rojo solo para alertas.
- La ilustración del usuario es una referencia de dirección, no un asset aprobado para reemplazar banners ni una plantilla literal. No se publica ni modifica por esta propuesta.

## Portada ejecutiva — piloto
1. **Identidad:** marca y slogan en una jerarquía breve; la portada no compite con el arte.
2. **Mensaje:** explicar qué es Legión Multiversal en una frase clara para visitantes, marcas y posibles colaboradores.
3. **Acciones:** separar CTA primario de exploración y CTA secundario de contacto/colaboración; conservar destinos existentes.
4. **Art direction:** artwork como foco; overlays y paneles HUD solo donde expliquen algo real. Evitar cifras decorativas o inventadas.
5. **Composición:** una zona de texto legible, foco visual único y paneles laterales/auxiliares subordinados; no repetir la misma información.
6. **Responsive:** en móvil, conservar primero marca, mensaje y CTA; reordenar los elementos de apoyo en flujo, sin superposiciones frágiles ni scroll horizontal.
7. **Motion/accessibility:** cualquier animación debe ser secundaria, respetar reduced-motion y no esconder contenido ni foco.

## Banner de capítulos
- No uniformar todos los capítulos con el mismo fondo.
- Colaboraciones: usar como referencia el equipo y su actividad compartida; mostrar variedad de roles y conexiones, no sugerir contratos/sponsors inexistentes.
- Roster: individualidad y perfiles tipo dossier.
- Estadísticas: datos reales y metodología antes que gráficos decorativos.
- Arsenal: descubrimiento de juegos y registros editoriales; no repetir una tabla de datos como tarjetas sin jerarquía.
- En Vivo: estado real y accesos directos, sin prometer actividad que no se esté verificando.

## Restricciones de implementación
- La protección del repositorio clasifica HTML/CSS y assets gráficos como recursos con autorización explícita por hash. La implementación debe dividirse en fase A (autorización en PR independiente) y fase B (cambio exacto aprobado), no eludir el control.
- No tocar datos canónicos, colores generados por creador, links, assets o funcionalidad como parte del piloto sin motivo y autorización específica.
- Evitar sumar una nueva hoja CSS de overrides. Primero mapear reglas existentes y decidir consolidación con evidencia.

## Próxima ejecución
1. Mapear duplicaciones y selectores de Portada (CSS crítico inline + styles.css + hojas de conversión/refinamiento).
2. Proponer una intervención acotada, sus archivos exactos y hashes de transición.
3. Crear PR fase A para autorización explícita de esos archivos/hash.
4. Aplicar solo la transición aprobada en fase B.
5. Ejecutar validaciones de código/datos, QA de capítulos, capturas Playwright desktop/móvil y revisar diffs visuales antes de declarar el piloto aprobado.
