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


## Concepto específico — capítulo ALIANZAS

**Idea rectora: la mesa de la próxima dimensión.** Los integrantes actuales del Roster aparecen reunidos alrededor de una mesa de trabajo, revisando material físico y digital: papeles, bitácoras, mapas de conexiones, hojas de personaje y expedientes de perfiles que podrían incorporarse en el futuro.

### Qué debe contar la escena
- El equipo actual conversa, compara ideas y toma decisiones; no posa como una formación de combate ni replica el banner de Colaboraciones.
- Los documentos evocan planificación y construcción de vínculos: bitácoras, propuestas, fichas de habilidades/roles, notas y mapas de afinidades.
- Las posibles incorporaciones se representan como **perfiles en exploración**: fichas sin nombre, siluetas, retratos enmarcados sin identificar o expedientes parcialmente abiertos. No deben aparecer como roster confirmado ni inventar personas, nombres, canales, estadísticas o acuerdos.
- La escena sugiere apertura a nuevas alianzas y crecimiento, no una convocatoria ya aceptada ni un contrato cerrado.
- Los personajes existentes deben conservar rasgos y códigos visuales reconocibles del Roster; no intercambiar identidades ni inventar que un integrante cumple un rol que no está documentado.

### Composición y tratamiento
- Plano editorial cinematográfico de tres cuartos o ligeramente elevado, con la mesa como eje narrativo y los personajes formando una composición legible alrededor.
- Profundidad por capas: personajes en primer plano, documentos/bitácoras en plano medio y un fondo de sala de estrategia o archivo multiversal.
- Cian para interfaces, conexiones y anotaciones; violeta para el ambiente multiversal; dorado para acuerdos, hitos o expedientes destacados. No bañar toda la escena en neón.
- Mantener zonas de aire para que el título **ALIANZAS** y el subtítulo del capítulo puedan entrar en el banner sin tapar rostros ni documentos importantes.
- Los documentos deben funcionar como atrezzo narrativo. No incluir microtexto falso que parezca información real legible.

### Diferencia editorial con COLABORACIONES
- **ALIANZAS = construir vínculos:** planificación, exploración, conversaciones, oportunidades y perfiles potenciales.
- **COLABORACIONES = hacer cosas juntos:** proyectos, sesiones, contenidos y casos que efectivamente sucedieron y tienen evidencia.
- Nunca presentar una oportunidad, conversación o perfil en exploración como acuerdo confirmado, patrocinio, partnership o incorporación oficial.

### Uso en la web
La escena será un concepto visual propio del capítulo ALIANZAS. No se reutiliza como banner de todos los capítulos ni reemplaza por sí sola los datos, los CTA o los registros reales. En móvil se prioriza el grupo alrededor de la mesa y se recortan los paneles ambientales, no las caras ni las fichas centrales.

**Estado:** concepto aceptado como dirección creativa por el usuario el 28/11/2026; pendiente de diseño visual, revisión de personajes/activos y autorización de los archivos gráficos que se creen o modifiquen.


### Relación con el contenido real ya existente
La estructura actual de este expediente ya ofrece tres recorridos (probar un juego, contactar a una persona del Roster o proponer una experiencia grupal), credenciales colectivas e individuales, plataformas, contexto LATAM, formatos, modelos de activación, casos/experiencias, transparencia y contacto. La escena de la mesa debe presentar esa lógica y ayudar a orientarse; no sustituye estas secciones ni las simplifica hasta perderlas.

En particular, el arte no debe hacer pasar el expediente creativo por un listado real de miembros: las credenciales que ya están publicadas siguen identificadas por su titular y alcance. Las hojas de perfiles potenciales pertenecen al lenguaje narrativo de exploración de futuras alianzas, no al registro oficial del Roster ni a una promesa de incorporación.


### Integrantes actuales que deben conservar su identidad visual
La fuente canónica `data/roster.json` registra ocho personajes actuales. Para la ilustración de la mesa se parte de sus diseños y referencias existentes, sin intercambiar rasgos ni inventar versiones nuevas:

| Identificador | Nombre visible | Rol de personaje registrado |
|---|---|---|
| `moriartys` | LOS MORIARTYS | ESTRATEGA CIBERNÉTICO |
| `rod3r1k` | ROD3R1K | INGENIERO SÓNICO |
| `lady-moriarty` | LADY MORIARTY | BRUJA CAÓTICA |
| `ardipii` | ARDIPII | GUARDIÁN ESPECTRAL |
| `akuma` | AKUMA | TANQUE DEMONÍACO |
| `dave-nexus` | DAVE — NEXUS | GUARDIÁN TECNOLÓGICO |
| `pato-oratoris` | PATO — ORATORIS | COMUNICADOR DEL CONOCIMIENTO |
| `habitos` | HABITOS | FILÓSOFO ATÓMICO |

La composición debe permitir reconocer a los ocho sin que parezcan posar para una foto de equipo: la mesa y el material de trabajo organizan la escena. Se pueden variar las posturas (sentados, inclinados revisando una hoja o señalando un mapa), pero no alterar los diseños/personajes. Las posibles incorporaciones futuras se expresan con dossiers esquemáticos o siluetas sin identidad, separados visualmente de los ocho registros actuales.
