# Arquitectura compartida · Capítulos v2

**Estado:** propuesta técnica para revisión; no modifica capítulos ni datos de producción.  
**Base:** `main` en `ea40a8f635f6d01772b459ba66dd931212b1da6f` (Roster V3 integrado).  
**Alcance:** identidad compartida, datos, diseño, accesibilidad, rendimiento, responsabilidades por capítulo y secuencia de implementación.

## 1. Decisiones de arquitectura

1. `roster-data.json` es la única fuente editorial de identidad de creadores/canales. No crear un segundo roster ni copiar listas de integrantes en Estadísticas, En Vivo, Mapa Multiversal o Arsenal.
2. `creator-profile-core.js` es la capa de resolución compartida. Debe seguir resolviendo roster, registros, métricas, plataformas, actividad y clips; cada consumidor solicita el bundle que necesita y utiliza `getCreator(hero)`.
3. Los datos de identidad no son datos de rendimiento. Mantener separados:
   - Identidad, roles, grupo, temas, horarios declarados, redes, ilustración y color: `roster-data.json`.
   - Snapshots de actividad y estado Twitch: `data.json`.
   - Métricas por plataforma: `platform-stats.json`.
   - Métricas normalizadas con fuente, período, visibilidad y frescura: `creator-metrics.json`.
   - Evidencias y registros: `creator-records.json`.
   - Clips: `clips-data.json`.
4. Twitch y YouTube permanecen como bloques independientes. No sumar espectadores, seguidores, horas, vistas ni muestras entre plataformas. PATO se presenta en su bloque YouTube, sin inferir estado en vivo de Twitch.
5. Horarios declarados son información editorial, no actividad medida. No reutilizar horarios antiguos o heredados sin confirmación.
6. Los datos ausentes se representan como «—» o «Sin datos». Cualquier métrica publicada conserva plataforma, fuente, período/fecha de corte y metodología.
7. Cada capítulo mantiene su función y su contenido propio. La identidad se comparte; la narrativa, evidencia y experiencia no se duplican.

## 2. Contrato de identidad canónica

Extender el modelo actual de `roster-data.json` sin cambiar IDs, slugs, cuentas o referencias existentes.

Campos canónicos por perfil:
- `id`, `slug`, `name`, `display_name`, `identity_scope`, `role`, `creator_type`.
- `group`: `formation` o `collaborator`; usar los roles confirmados. Habitos y PATO — ORATORIS son colaboradores.
- `accounts[]`: plataforma, handle/login, URL, titularidad y estado de confirmación.
- `brand_color`: objeto con `value`, `status` y opcionalmente `confirmed_by` / `confirmed_at`. Estado inicial `proposed`; nunca asumir aceptación.
- `logo` / `portrait` / `character_card`: referencias de assets existentes, sin reutilizar una misma fotografía en capítulos diferentes.
- `areas` o `topics`: temas editoriales confirmados.
- `schedule`: horarios declarados, con estado de confirmación y zona horaria. No se derivan de actividad observada.
- `socials`: URLs verificadas; mantener handles canónicos.

### Paleta solicitada (toda en estado propuesto)

| Perfil | Color | Estado |
|---|---|---|
| Los Moriartys | `#00e5ff` | Propuesto |
| ROD3R1K | `#ff3355` | Propuesto |
| Lady Moriarty | `#ff2bd6` | Propuesto |
| ArDipii | `#a06bff` | Propuesto |
| Akuma | `#ffd23f` | Propuesto |
| Dave — Nexus | `#2dff8a` | Propuesto |
| Pato — Oratoris | `#4d9dff` | Propuesto |
| Habitos | `#ff9a3c` | Propuesto |

No cambiar ningún color a `confirmed` hasta contar con confirmación individual. El color debe ser consumido desde el perfil canónico, no duplicado en CSS, JS, gráficos o capítulos.

### Reglas de URL de ROD3R1K

- Capítulo Alianzas: `https://twitch.tv/ROD3R1K` (alias solicitado para ese contexto).
- Roster, Estadísticas, En Vivo, expedientes y otros lugares: `https://twitch.tv/TheR0D3R1K`.
- La cuenta técnica canónica y login del colector no se reemplazan por el alias editorial de Alianzas.

## 3. Capa de resolución y presentación

### Resolución

`creator-profile-core.js` debe seguir siendo el punto de entrada de identidad + datos por plataforma. No agregar fetches redundantes a cada capítulo para volver a construir la lista de perfiles. Los nuevos campos de identidad deben viajar en `hero` y exponerse desde `getCreator(hero)`.

Los consumidores deben usar helpers existentes para normalización, frescura, comparabilidad, actividad y rangos. No replicar fórmulas ni crear un reconciliador paralelo.

### Contrato de presentación

Cada vista de creador recibe el perfil resuelto y expone el color mediante una variable local, por ejemplo `--c`, validada contra un color hexadecimal permitido. Fallback neutral cuando falte color; no inferir color por nombre.

Tokens globales en `:root` y variantes de tema claro/oscuro:
- superficies y capas de fondo;
- texto principal/secundario y bordes;
- acentos cian, magenta, rojo y amarillo;
- estados semánticos (live, offline, advertencia, sin datos);
- tipografías Bangers para display y Inter para lectura, con fallback local.

El color del creador se utiliza como acento de bordes, sombras, avatares, barras, chips, horarios y gráficos. No debe ser el único medio para comunicar estados; acompañar con texto, iconos o patrones.

Componentes compartidos permitidos: insignia de creador, fuente/fecha, etiqueta de frescura, estado live, bloque de horario declarado, enlace social y marcador de evidencia. Mantener composición específica por capítulo.

## 4. Responsabilidad de los capítulos

### Capítulo 02 · Quiénes somos
Fuente narrativa: historia ya documentada en Origen y Biblia. Línea S3X-MEN → Legión sin fechas nuevas ni cronología inferida. Seis valores con «En la práctica», Antes/Durante/Después, Ofrecemos/No prometemos y proceso Conocemos/Probamos/Documentamos. Participación voluntaria explícita. No volver a contar el Roster ni replicar fichas individuales.

### Capítulo 03 · Roster
La implementación V3 integrada en `main` es la base funcional. Preservar ocho perfiles, filtros, orden, indicadores y expedientes. Arquetipos de Akuma, Dave, Pato y Habitos deben continuar identificados como propuestos hasta confirmación de Demian. Formación y Colaboradores separados. No crear una segunda versión del roster para satisfacer otros capítulos.

### Capítulo 04 · Estadísticas
Usar el bundle y reconciliador existentes. Twitch y YouTube separados. Indicadores y fichas deben mostrar fuente, período, frescura y metodología. Categorías recolectadas son «observadas»; temas editoriales son «declarados» y visualmente distintos. Si no hay categoría recolectada, no simularla. Los horarios son declarados y se muestran aparte de actividad medida. Gráficos de promedio/pico solo para series comparables de Twitch y con escala interna claramente rotulada.

### Capítulo 06 · Alianzas
Distinguir credenciales, plataformas de campañas, códigos de creador y acuerdos comerciales. Una credencial o solicitud no implica patrocinio, contrato, pago ni representación. Benchmark LATAM es contexto de industria, no audiencia propia, con fuente, universo, período y enlace. Contacto comercial separado del técnico. Checklist previo a confirmar sin almacenar ni enviar datos.

### Capítulo 07 · Colaboraciones
Biblioteca de expedientes con estados y evidencias. Cada caso diferencia actividad ejecutada, acceso a juego, campaña, patrocinio y resultados. BarFender conserva las aclaraciones metodológicas: VOD simultáneos no equivalen a tiempo acumulado; muestreo del 10/11 no es audiencia oficial; con dos muestras Akuma no publica promedio ni pico. Expediente 003 permanece pendiente, no planificado como hecho.

### Capítulo 08 · Arsenal
Catálogo de juegos con enlace oficial y arte propio/permitido. Filtros por categoría y selector de cantidad de jugadores usando exclusivamente rangos publicados; valores no verificados quedan «A confirmar». La ruleta selecciona del catálogo visible y no inventa compatibilidades. Futuro indicador de quién jugó toma IDs y colores del roster canónico.

### En Vivo y Mapa Multiversal
No son parte del rediseño editorial en esta etapa, pero son consumidores del mismo perfil resuelto. No duplicar perfiles, redes, colores ni horarios.

## 5. Reglas para colectores y reconciliación

- Extender el colector Twitch para conservar `profile_image_url` y categorías más vistas solo si los endpoints y permisos usados lo permiten; almacenar fuente y fecha de captura.
- No sustituir la foto editorial del carnet por `profile_image_url`; esta última es un dato de plataforma para la ficha estadística.
- Las categorías observadas deben conservar período y conteo de muestras. No reemplazar temas declarados.
- Mantener reconciliación determinista y pruebas de frescura entre Python y JavaScript. Ninguna captura debe escribir sobre identidad editorial.
- No publicar métricas restringidas ni atribuir métricas del canal compartido a cada integrante.

## 6. Diseño, accesibilidad y rendimiento

- Estética de cómic editorial: fondo oscuro, cian, magenta, rojo y amarillo; Bangers + Inter; expedientes clasificados y textura CRT/viñeta sutil.
- Animación escalonada, conteos, barras y tilt leve únicamente como mejora progresiva.
- Toda animación respeta `prefers-reduced-motion`; no bloquear contenido ni controles.
- Sonido opcional, desactivado por defecto, sin autoplay.
- Foco visible, contraste suficiente, navegación completa por teclado, nombres accesibles, estados anunciados y diálogos nativos con cierre Escape.
- Imágenes con dimensiones/aspect-ratio reservados para evitar CLS; lazy loading para imágenes fuera del primer viewport; priorizar LCP de portada.
- No cargar librerías pesadas si el comportamiento puede resolverse con la arquitectura actual.

## 7. Plan de trabajo por PR

1. **PR A — Arquitectura compartida (este documento):** revisar contrato, confirmar colores/roles y aprobar responsabilidades. Sin cambios de runtime.
2. **PR B — Capítulo 02:** implementar narrativa e interacciones usando fuentes históricas existentes.
3. **PR C — Capítulo 06:** credenciales, benchmark verificado y checklist.
4. **PR D — Capítulo 07:** expediente 001 BarFender, reconciliar datos/evidencias y dejar expediente 003 pendiente.
5. **PR E — Capítulo 08:** catálogo, filtros, selector y ruleta.
6. **PR F — Integración 03/04:** auditar Roster y Estadísticas sobre la arquitectura aprobada; incorporar mejoras de colector en cambios aislados y probados.

Cada PR debe limitar su alcance, actualizar `INFORMES.md`, incluir pruebas automatizadas y revisión visual. No fusionar un PR solo por estar desplegado en preview.

## 8. Matriz mínima de QA

- Integridad: ocho perfiles, IDs únicos, grupos correctos y un único origen de identidad.
- Datos: ausencia de cifras inventadas; fuente, período y metodología visibles; no mezclar plataformas.
- Roster: ocho cartas, búsqueda, filtros, orden, tabs y dossier.
- Estadísticas: Twitch/YouTube separados, PATO en YouTube, categorías observadas/declaradas diferenciadas, horarios declarados separados.
- Accesibilidad: teclado, foco, labels, diálogo/Escape y reduced motion.
- Responsive: móvil y escritorio; sin overflow ni CLS evitable.
- Calidad: Playwright, pruebas Python/reconciliador, consola sin errores y Lighthouse móvil.
- Producción: comprobar despliegue de `main` y SHA publicado en `https://legion-multiversal.pages.dev`; previews no cuentan como producción.

## 9. Bloqueos y decisiones pendientes

- Confirmación individual de los ocho colores propuestos.
- Confirmación de horarios declarados por cada creador; no asumir que el campo actual está vigente.
- Confirmar logos/ilustraciones disponibles y evitar reutilización de fotografías entre capítulos.
- Validar con fuentes actuales las cifras de benchmark LATAM y el dato Comscore antes de publicación.
- Reconciliar reseñas Steam, ficha de BarFender, títulos/URLs de los cuatro clips y corte de métricas del expediente 001.
- Confirmar compatibilidad/rangos de jugadores de los once juegos del Arsenal mediante fuentes oficiales.
- Resolver PR #81 (Roster) y PR #82 (plan de capítulos) por revisión independiente; este documento no los cierra, modifica ni reemplaza.
- Verificar publicación de producción después de cada integración.

## 10. Archivos protegidos en esta fase

No se modifican `index.html`, `app.js`, hojas de estilo globales, `roster-data.json`, colectores, snapshots ni datos de capítulos. Este PR agrega únicamente arquitectura documental para revisión. El Capítulo 01 queda expresamente fuera del alcance.
