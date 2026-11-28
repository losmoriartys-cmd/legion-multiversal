# Mapa de cascada — Portada ejecutiva

**Base inspeccionada:** `main` en `595f52c381e09ad055e98111d8122afd4cd6eecf` (28/11/2026).
**Estado:** auditoría estática; sin cambios de implementación.

## Hallazgo principal
La familia de selectores de la Portada está distribuida entre el CSS global y tres bloques `<style>` dentro de `index.html`, y recibe al menos otra capa desde `public-audience-paths.css`. Los mismos selectores se definen en varios lugares con decisiones de layout distintas. Esto justifica resolver la cascada antes de introducir un rediseño.

## Fuentes verificadas

| Fuente | Qué contiene | Riesgo/decisión |
|---|---|---|
| `styles.css` | Reglas globales para `.executive-home`, `.executive-hero`, texto, copy y títulos. El hero aparece como grid de dos columnas. | Es la base global, pero no explica por sí sola el render final. |
| `index.html#critical-home-styles` | 8.388 caracteres de CSS crítico; declara cabecera, navegación, hero, arte, copy, título, CTAs y responsive/reduced-motion. Define el hero como bloque con imagen de fondo superpuesta. | Es ruta crítica de primer render y debe conservarse sin divergencias accidentales. |
| `index.html#conversion-overhaul-inline` | 7.942 caracteres; vuelve a tocar header, navegación, hero, artwork, tipografía, copy, CTAs y breakpoints. | Algunas decisiones de la composición anterior de dos columnas se superponen a la composición de imagen de fondo. |
| `index.html#conversion-phase2-inline` | 9.906 caracteres; reitera reglas del hero y copy, además de reglas específicas para `#chapter-0` y ajustes móviles. | Repite selectores y propiedades de los otros bloques; varias reglas se parecen pero no son idénticas. |
| `public-audience-paths.css` | Controla la grilla de CTAs: tres columnas en escritorio y una columna hasta 760 px; también contiene refinamientos móviles de Portada. | Capa funcional de conversión; conservar los tres recorridos y validar el primer viewport móvil. |

## Colisiones que requieren verificación en navegador

1. **Layout del hero:** `styles.css` declara `display:grid` y dos columnas; el CSS crítico declara `display:block` con arte absoluto de fondo; los bloques de conversión vuelven a declarar propiedades de la grilla, del bloque y del arte. El layout computado efectivo debe medirse en los viewports de prueba.
2. **Imagen principal:** distintas reglas alternan entre `object-fit:contain` (composición de imagen en flujo) y `object-fit:cover` con posicionamiento/opacity (imagen de fondo). No se debe simplificar hasta conocer el HTML efectivo de `.executive-hero-art` y el recorte real.
3. **Copy y título:** tamaño, ancho, altura mínima, margen y alineación se redefinen en más de un bloque y en media queries. No sumar otro override global.
4. **CTAs:** la base flex se combina con una grilla de tres caminos y reglas móviles adicionales. Deben seguir visibles los tres recorridos y sus destinos reales.
5. **Header:** también hay reglas repetidas en critical y conversion-overhaul; este piloto debe limitar su alcance y no reabrir una navegación ya validada sin una necesidad demostrable.

## Decisión técnica para el piloto

- **No crear una cuarta capa de overrides.** Consolidar las reglas de Portada en las fuentes existentes solo después de verificar qué CSS se aplica efectivamente y qué parte es necesaria para LCP/fallback.
- Mantener el bloque crítico pequeño, estrictamente necesario y sincronizado con el estilo definitivo.
- Mantener fuera del alcance del piloto los colores generados por creador, estadísticas, Roster, capítulo Alianzas y contenido comercial.
- La dirección nueva de arte debe trabajar con el artwork aprobado y su composición, no inventar estadísticas ni cambiar destinos de CTA.
- Antes/después obligatorio en escritorio y móvil, junto con verificación de foco, navegación por teclado, reduced-motion, overflow y rendimiento.

## Autorización y ejecución

Como HTML/CSS están dentro de las extensiones protegidas, la intervención debe prepararse con transiciones SHA-256 exactas: fase A autoriza en un PR separado, modificando solo el ledger; fase B aplica la transición ya autorizada. Si el código/arte requerido todavía no está definido, no adelantar autorizaciones genéricas.

## No hacer

- No eliminar reglas por parecer duplicadas sin revisar orden de carga, especificidad, fallback y computed styles.
- No borrar CSS crítico para reducir líneas sin medir LCP/fallback.
- No cambiar la cuadrícula de CTAs ni el orden de contenido como subproducto visual.
- No rediseñar ahora Roster, Stats o chapter 8 mientras el piloto es Portada.
