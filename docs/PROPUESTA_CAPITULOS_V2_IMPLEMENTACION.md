# Capítulos v2 · Propuesta integral de evolución
## Documento de alcance, decisiones y plan de implementación

**Estado:** Propuesta en PR · pendiente de pruebas, aprobación e implementación  
**Base:** HTML adjunto «Legión Multiversal · Capítulos v2» + revisión consultiva  
**Alcance:** Capítulos 02 (Quiénes somos), 06 (Alianzas), 07 (Colaboraciones), 08 (Arsenal), identidad visual, funcionalidad, accesibilidad y QA.

> Este PR documenta el alcance completo y conserva las sugerencias del HTML y las recomendaciones de revisión. No implementa ni reemplaza capítulos en producción. Las integraciones se harán después de revisar este plan, con cambios verificables y pruebas.

---

## 0. Objetivos de la evolución

Fortalecer Legión Multiversal como:
- una comunidad con historia, identidad, valores y autonomía individual;
- un equipo capaz de organizar y documentar experiencias compartidas;
- una presentación comercial honesta para marcas, publishers, desarrolladores y agencias;
- un espacio útil para la comunidad, no solo una web promocional;
- una experiencia premium que combine editorial de cómic, dossier cinematográfico, interfaz de videojuego y arcade retro, sin caer en una plantilla de tarjetas repetitivas.

**Lema de marca:** DIFERENTES MUNDOS. UNA MISMA LEGIÓN.

## 1. Principios y límites no negociables

- Mantener datos, historia, nombres, roles y aportes fieles; no reescribir eventos sin evidencia.
- Separar hechos verificados, datos proporcionados, muestras, estimaciones, benchmarks y datos no disponibles.
- No inventar métricas, fuentes, acuerdos, patrocinios, ventas, ROI, conversiones, alcance deduplicado ni garantías de crecimiento.
- No presentar acceso a juegos, programas de creadores o plataformas como patrocinio o alianza formal.
- Cada sección debe tener propósito propio; evitar duplicar información o copiar el HTML literalmente.
- Trabajar por etapas; cambios funcionales en PRs controlables, con revisión y aprobación antes de fusionar.
- Conservar el trabajo del Roster y los PRs pendientes; esta iniciativa no debe interferir con ellos.
- Responsive, teclado, foco visible, contraste, lectores de pantalla y `prefers-reduced-motion` son requisitos de aceptación.
- Toda interacción debe tener estados vacíos, carga, error y resultado cuando corresponda.
- Registrar las integraciones aprobadas en `INFORMES.md` y actualizar la Biblia de Evolución al concluir.

## 2. Capítulo 02 · Quiénes somos

### 2.1 Concepto y narrativa
Usar como idea editorial central:

> No buscamos que todos sean iguales. Buscamos que cada uno tenga un lugar.

La sección explica que una Legión no se construye solo sumando nombres: personas diferentes eligen avanzar juntas sin dejar de ser ellas mismas.

### 2.2 Recorrido histórico
Crear una línea de tiempo que explique, en orden y con fechas/contexto cuando estén respaldados:
1. Comienzo con Marvel Rivals: Demian y ROD3R1K impulsan la idea; se suma Akuma y se forma el primer núcleo.
2. Etapa Fortnite y nuevas experiencias: incorporación de ElGabii y Capy, según la historia documentada.
3. Evolución del proyecto y cambio de identidad de S3X-MEN a Legión Multiversal.
4. Incorporaciones posteriores: Lady Moriarty y Dave/Nexus, respetando su contexto.
5. Colaboradores: Pato/Oratoris y Habitos deben identificarse como colaboradores, no roster, salvo futura decisión explícita.
6. Identidad actual y crecimiento futuro, sin convertir aspiraciones en hechos.

**Control editorial:** reconciliar cada punto con la Biblia/historia existente antes de publicarlo. No usar nombres, orden o roles del HTML si contradicen la fuente histórica vigente.

### 2.3 Seis valores y su práctica concreta
Presentarlos con insignias o interacción editorial; la explicación debe poder descubrirse sin depender de hover y ser accesible en móvil/teclado.

1. **Identidad propia:** no exigir molde; cada canal conserva estilo y comunidad.
2. **Compañerismo real:** apoyo mutuo, reconocer y dar crédito.
3. **Respeto y confianza:** cuidar espacios, límites, diferencias y tiempos.
4. **Libertad para crear:** permitir experimentar y proponer.
5. **Crecer en equipo:** compartir aprendizaje, experiencia y oportunidades.
6. **Honestidad con la comunidad:** comunicar acuerdos y resultados con contexto, sin inflar cifras.

Cada valor incluye un ejemplo «En la práctica» y evita frases vacías.

### 2.4 Antes, durante y después
Tabs accesibles o equivalente:
- **Antes:** propósito, participantes, aportes, condiciones y compromisos confirmados.
- **Durante:** respeto, autoría, límites, coordinación y autonomía.
- **Después:** documentar, dar crédito, contextualizar resultados y aprender; no inflar métricas.

La participación en actividades es voluntaria. Cada miembro puede proponer, aceptar, ajustar o rechazar actividades sin perder su lugar ni identidad.

### 2.5 Lo que prometemos / no prometemos
**Ofrecemos:** espacio para proponer, aprender, compartir y crear; colaboración, respeto y trabajo compartido; oportunidad de aportar desde la voz propia.

**No prometemos:** fama, contratos ni crecimiento automático.

### 2.6 Cómo se suma alguien
Flujo visual y no coercitivo:
1. Conocemos.
2. Probamos una experiencia compartida.
3. Documentamos y evaluamos afinidad con valores, creatividad, disponibilidad conversada y respeto por la autonomía.

CTA diferenciados: «Quiero formar parte» y «Quiero colaborar con la Legión». Deben conducir a los recorridos correctos, sin mezclar solicitudes personales y comerciales.

## 3. Capítulo 06 · Alianzas

### 3.1 Credenciales atribuibles
Mostrar cada credencial con titular, alcance, fuente y explicación de qué significa y qué **no** implica.

- Los Moriartys: Partner Creator en Lurkit para las credenciales/campañas verificadas correspondientes.
- ROD3R1K: Twitch Partner, credencial individual.
- Códigos Epic Support-A-Creator: titular individual; no son alianza comercial de toda la Legión.
- Herramientas/plataformas (Lurkit, Keymailer): explicar su función, no mostrarlas como partners de marca sin evidencia.

Revalidar estado, titular y evidencia antes de publicar. El uso de una plataforma o recibir una key no significa pago, sponsorship, contrato, partnership o representación.

### 3.2 Tabla «Qué es / qué no implica»
Credencial/plataforma, titular, definición y límites. Mantener lenguaje claro, preciso y legible.

### 3.3 Plataformas y herramientas
Enlaces verificados a Lurkit, Keymailer y Epic Support-A-Creator. No confundir plataformas de campañas/acceso a juegos con alianzas formales.

### 3.4 Contexto regional
Presentar LATAM como mercado relevante, no secundario, mediante benchmarks de industria que se distingan claramente de audiencia propia.

- Newzoo / Gamescom u otras fuentes confiables, con año, fecha de consulta, universo y metodología.
- Comscore Argentina, cuando la referencia y muestra estén correctamente documentadas.
- Cifras regionales (jugadores, ingresos, crecimiento y plataformas) solo tras verificar fuente, período y definición.
- Nunca usar cifras de mercado como seguidores, viewers o resultados de la Legión.
- Evitar que el benchmark ocupe más protagonismo que la propia evidencia y propuesta del equipo.

### 3.5 Propuesta de valor para marcas/publishers
Presentar qué se puede construir juntos, sin prometer resultados:
- integraciones en directo;
- experiencias multicanal;
- contenido y clips;
- activaciones comunitarias.

Revisar la factibilidad real por miembro, recursos, disponibilidad, derechos y condiciones antes de describir cualquier formato como servicio confirmado.

### 3.6 Checklist previo a acuerdos
Checklist interactivo/local, sin almacenar datos ni simular envío:
- Objetivo.
- Perfiles participantes.
- Accesos o materiales.
- Entregables.
- Fechas.
- Compensación, si corresponde.
- Divulgación publicitaria.
- Derechos de uso.
- Métricas reportables.

CTA a contacto: `losmoriartys@gmail.com`. Revisar consistencia con el formulario comercial de Reclutamiento y evitar duplicar formularios innecesariamente.

## 4. Capítulo 07 · Colaboraciones: sistema de expedientes

### 4.1 Biblioteca de casos
Transformar colaboraciones en expedientes archivables, no en posts aislados. Cada ficha de índice muestra número, título, fecha, estado, participantes, juego/proyecto y acceso a evidencia.

Estados:
- **Realizado:** actividad efectivamente ejecutada y documentada.
- **En curso:** ejecución activa; resultados aún incompletos.
- **Planificado:** propuesta/idea; no debe confundirse con colaboración realizada.
- **Cancelado:** no se concretó; comunicarlo con criterio, si es relevante.

### 4.2 Plantilla estándar de expediente
1. Ficha: objetivo, fecha, juego/proyecto, contexto, estado.
2. Equipo desplegado: cada creador, canal, rol/participación.
3. Ejecución: qué se hizo y cómo se coordinó.
4. Archivo audiovisual: VOD, clips, capturas y assets con enlaces verificados.
5. Resultados: métricas por canal, fuente, período, fecha de consulta y límites.
6. Valor demostrado: coordinación, multicanal, contenido, comunidad u otros aspectos respaldados.
7. Aprendizajes: qué funcionó y qué se cambiaría.
8. Próximo paso: continuidad, seguimiento o expediente futuro.

### 4.3 Expediente 001 · BarFender
Caso inicial, manteniendo el alcance y evidencia disponibles. La sesión del 05/11/2026, participantes y detalles de juego/campaña deben verificarse contra fuentes existentes antes de fijar los datos en la nueva presentación.

Participantes que el HTML identifica: Demian/Los Moriartys, Lady Moriarty, TheR0D3R1K y Akuma. Cuatro canales en simultáneo; Keymailer facilitó acceso al juego. No presentar como patrocinio pagado.

**VODs conocidos:**
- Los Moriartys: https://www.twitch.tv/videos/2919716450
- Lady Moriarty01: https://www.twitch.tv/videos/2919755971
- TheR0D3R1K: https://www.twitch.tv/videos/2919719142
- Akuma: participó, pero no se localizó VOD público.

Clips que el HTML identifica:
- Los Moriartys: «Un susto que termina en vómito»; «Se boxean en nuestro bar».
- ROD3R1K: «Buscan empleado para el bar».
- Lady Moriarty: «Le pega a Harry Potter».
Verificar URLs/títulos y recuperar clips adicionales ya documentados; no inventar ni sustituir enlaces de clips por VOD.

**Control de discrepancias métricas obligatorio antes de publicación:**
- El HTML indica chat activo 91; la Biblia vigente indica 97. Resolver con fuente antes de publicar.
- HTML presenta duración 2 h 27 min; Biblia registra 2:27:20. Usar precisión respaldada.
- HTML registra 25 promedio, 40 pico, 80 únicos, 154 vistas, +2 seguidores, 1 suscripción. Revalidar contexto/fecha y que sean datos del VOD completo de Los Moriartys, no resultados agregados de cuatro canales.
- Shared Viewership (si se usa) debe identificarse como métrica distinta, no deduplicación global del roster.
- Tres VOD públicos no equivalen a cuatro VOD ni a tiempo acumulado de espectadores.
- Sesión estimada ~90 minutos y duración de VODs deben explicarse con sus límites.
- La segunda sesión y datos de muestras (Akuma 2 muestras; TheR0D3R1K 4 muestras, media observada 26,3/pico 33) no son promedios oficiales ni reemplazan VOD. Verificar que sigan vigentes y contextualizados antes de incorporarlos.

### 4.4 Evidencia y privacidad
- No publicar identificadores privados de keys.
- No afirmar ventas, ROI, conversiones, patrocinio ni alcance deduplicado sin medición.
- Separar métricas de cada canal y no sumarlas como audiencia única.
- Enlaces a VOD/clips deben abrir el recurso exacto.
- No reutilizar fotos o clips por repetición decorativa; usar material pertinente.

### 4.5 Valor comercial del expediente
Explicar qué demuestra el caso sin sobreclaim:
- coordinación multicanal;
- varias perspectivas de una misma experiencia;
- contenido que continúa después del directo mediante VOD/clips;
- colaboración manteniendo la identidad de cada canal.
No convertir estas evidencias en promesas de resultados futuros.

### 4.6 Expedientes siguientes
Mantener la biblioteca abierta para Expediente 002, 003, etc. (nuevos juegos, eventos, directos conjuntos, activaciones). Cada expediente se crea cuando hay evidencia real; no rellenar placeholders como si fueran casos.

## 5. Capítulo 08 · Arsenal

### 5.1 Catálogo y filtros
Conservar el catálogo propuesto de 11 juegos, sujeto a validación de enlaces, fichas y datos:
- Mimic Party
- MECCHA CHAMELEON
- Backrooms: Escape Together
- R.E.P.O.
- Content Warning
- Dale & Dawson Stationery Supplies
- Lethal Company
- Minecraft
- Among Us
- The Forest
- BarFender

Filtros por experiencia:
- Fiesta/humor.
- Terror cooperativo.
- Deducción social.
- Supervivencia/sandbox.
- Todos.

Filtro de cantidad de jugadores, con rango solo si fuente lo respalda. Si no se conoce, mostrar «a confirmar» y no dar por compatible una convocatoria.

### 5.2 Ficha de juego
Incluir título, categoría, descripción, cantidad/rango de jugadores, plataformas, crossplay/compatibilidad cuando verificado, enlace a ficha oficial/Steam y si existe evidencia de actividad de Legión (por ejemplo BarFender: Expediente 001).

Verificar edición, plataforma, DLC, versión, región y compatibilidad antes de convocar; para Minecraft aclarar diferencias Java/Bedrock.

### 5.3 Ruleta de la Legión
Conservar la función de elección aleatoria y elevarla a experiencia arcade:
- selección animada con suspenso;
- resultado destacado y claro;
- opción de nueva tirada;
- excluir juegos no disponibles o que el grupo no pueda jugar;
- aplicar filtros actuales a la ruleta;
- estado vacío si ningún juego coincide;
- respetar movimiento reducido y no impedir teclado/lectores.

No sacrificar rendimiento ni accesibilidad por la animación.

## 6. Identidad visual y sistema de interfaz

### 6.1 Dirección
Combinar, por capítulo y con jerarquía:
- editorial de cómic retro/vintage;
- dossier/expediente cinematográfico;
- HUD/interfaz de videojuego;
- arcade retro de los 80/90;
- presentación premium de equipo creator.

Paleta base: negro, cyan, magenta, púrpura, amarillo y acentos rojos; equilibrar contraste y evitar que el amarillo domine CTAs. Tipografía expresiva en títulos; tipografía limpia para estadísticas, tablas y datos.

### 6.2 Lenguaje por capítulo
- **Quiénes somos:** editorial/narrativa, origen, valores e historia.
- **Alianzas:** dossier profesional, credenciales y benchmarks.
- **Colaboraciones:** expedientes cinematográficos, archivo audiovisual y evidencia.
- **Arsenal:** arcade, filtros, selección y diversión.

### 6.3 Evitar
- Una pared de tarjetas repetitivas.
- Texto excesivo sin jerarquía.
- Efectos visuales que distraigan de los datos.
- Duplicación de imágenes o evidencias.
- Hover como único medio de revelar información.
- Animaciones que dificulten lectura, navegación o rendimiento.

## 7. Experiencia técnica, responsive y accesibilidad

Auditar e implementar con pruebas:
- Desktop, tablet y mobile; navegación horizontal no debe esconder controles ni información.
- Foco visible, teclado completo, semántica, labels, estados y nombres accesibles.
- Contraste de texto, CTA, chips, estados y gráficos.
- `prefers-reduced-motion`; animaciones se reducen o desactivan.
- Estados loading/skeleton, error, empty y success; no skeleton infinito.
- IntersectionObserver con fallback o contenido visible cuando JS/observador no está disponible.
- Lazy loading para imágenes fuera de viewport; no retrasar hero/LCP.
- Dimensiones reservadas, formatos/peso y estabilidad de layout.
- Enlaces externos seguros y válidos; apertura de VOD/clips exactos.
- Rendimiento y ausencia de errores JS/consola.
- No agregar librerías pesadas sin justificar. Reutilizar componentes y gráficos existentes si cumplen.

## 8. Métricas y crecimiento real del proyecto (recomendación añadida)

Evaluar un panel de evolución de Legión con indicadores reales y auditables, no vanity metrics inventadas:
- participantes en experiencias documentadas;
- juegos jugados/documentados;
- expedientes realizados;
- colaboraciones ejecutadas;
- eventos o actividades comunitarias;
- canales participantes, indicando si son únicos o repetidos.

Cada indicador necesita definición, fuente, fecha/corte y reglas de conteo. No publicar agregados que mezclen unidades ni duplicar personas/canales. Si el dato no está disponible, omitirlo o mostrar «en construcción».

## 9. Propuestas de activación (recomendación añadida)

En lugar de una lista genérica de servicios, evaluar «operaciones» con identidad Legion, siempre como formatos posibles y no servicios garantizados:

- **Operación CO-OP:** juego/experiencia compartida, varios creadores y perspectivas.
- **Operación STREAM:** integración o demostración en directo.
- **Operación CLIP:** clips y contenido breve posterior.
- **Operación COMUNIDAD:** desafíos, eventos, dinámicas participativas, sorteos solo cuando estén autorizados y con reglas acordadas.

Para cada operación, definir alcance, participantes disponibles, requisitos, entregables, derechos, disclosure, métricas y presupuesto/compensación si corresponde. No publicar precios ni garantías todavía. Evitar duplicar estos formatos con las tarjetas de propuesta de valor: decidir una nomenclatura unificada en diseño.

## 10. Checklist de validación editorial y de datos

- [ ] Historia y fechas cotejadas con Biblia y evidencia.
- [ ] Roles roster/colaborador correctos.
- [ ] Credenciales con titular y evidencia.
- [ ] Plataformas descritas correctamente.
- [ ] Fuentes regionales revisadas; año/muestra/metodología.
- [ ] BarFender: participantes, publisher/developer, fecha y acceso revalidados.
- [ ] Métricas discrepantes (91 vs 97 chat; precisión duración) resueltas.
- [ ] VODs y clips exactos; sin links inventados.
- [ ] Métricas individuales y de muestras diferenciadas.
- [ ] Arsenal: jugadores, plataforma, crossplay, enlaces y versiones comprobados.
- [ ] Propuestas comerciales presentadas como posibilidades, no compromisos.
- [ ] Sin precios/ROI/conversiones/alcance garantizados.

## 11. Plan de trabajo para los PRs de implementación (después de aprobar este alcance)

Orden recomendado, con cada etapa separada y testeable:

**Fase A — Estructura y narrativa**
1. Capítulo 02: Quiénes somos, timeline, valores/práctica, antes-durante-después, promesas y flujo de incorporación.
2. QA editorial e interacción; confirmar recorrido y formularios.

**Fase B — Alianzas**
3. Capítulo 06: credenciales atribuidas, tabla qué es/no es, plataformas, contexto LATAM verificado, formatos, checklist de acuerdo.
4. QA de fuentes, links, responsive y accesibilidad.

**Fase C — Biblioteca de colaboración**
5. Sistema de expedientes y estados.
6. BarFender Expediente 001 migrado con auditoría de discrepancias, evidencia, clips/VOD y métricas.
7. QA del archivo y navegación; no inventar Expediente 002.

**Fase D — Arsenal**
8. Catálogo de 11 juegos, filtros, rango de jugadores y compatibilidad verificados.
9. Ruleta arcade con exclusiones y filtros.
10. QA funcional y accesibilidad.

**Fase E — Pulido global**
11. Identidad visual por sección y lenguaje unificado.
12. Métricas de crecimiento real del proyecto (si fuentes y definiciones existen).
13. Operaciones CO-OP/STREAM/CLIP/COMUNIDAD, consolidando nomenclatura comercial.
14. Rendimiento, imágenes, responsive, accesibilidad y regresión integral.

Las fases no deben implementarse todas juntas en un solo cambio de código. Este PR es el contenedor de alcance/decisiones; la implementación puede usar PRs de código secuenciales que referencien este plan, sin perder ninguna tarea.

## 12. Pruebas y condiciones de aceptación

Para cada PR de implementación:
- CI y tests existentes verdes.
- Pruebas Playwright de navegación y comportamiento clave.
- Desktop y mobile: capturas/revisión visual antes de aceptar.
- Teclado/foco, labels, estados y movimiento reducido.
- Validación de enlaces y contenido de fuentes.
- Sin errores JS, IDs duplicados, anchors rotos ni regresiones de capítulos existentes.
- Revisión de cambios contra este checklist y actualización de informe/Biblia.
- No merge ni producción sin aceptación explícita del usuario.

## 13. Lista maestra de sugerencias (para evitar omisiones)

### Del HTML adjunto
- [ ] Capítulo 02 Quiénes somos: timeline S3X-MEN → Legión, valores, práctica antes/durante/después, promesas/no promesas, incorporación.
- [ ] Capítulo 06 Alianzas: credenciales, titularidad, tabla de significado/límites, plataformas, LATAM benchmark, señal Comscore Argentina, propuesta de valor, checklist previo a acuerdos, CTA email.
- [ ] Capítulo 07 Colaboraciones: Expediente BarFender, participantes, métricas contextualizadas, segunda sesión, VODs, clips, valor demostrable, próximo expediente.
- [ ] Capítulo 08 Arsenal: 11 juegos, categorías, filtros, jugadores, fichas/link, ruleta.
- [ ] UI del HTML: tarjetas, KPI, timeline, tabs, ring benchmark, checklist interactivo, chips, resultado ruleta, motion/reduced motion, theme claro/oscuro, responsive.

### De la revisión
- [ ] No copiar maqueta literalmente: adaptar a identidad premium y cohesión del sitio.
- [ ] Biblioteca de expedientes con estados Realizado/En curso/Planificado/Cancelado.
- [ ] Plantilla de expediente completa: ficha, equipo, ejecución, archivo, resultados, valor demostrado, aprendizajes y próximo paso.
- [ ] Resolver discrepancias métricas y no confundir muestras con métricas oficiales.
- [ ] Propuestas comerciales convertidas en operaciones CO-OP/STREAM/CLIP/COMUNIDAD (o nomenclatura equivalente aprobada), con requisitos y límites.
- [ ] Panel de crecimiento del proyecto con métricas reales, definiciones y fechas.
- [ ] Arsenal: validar compatibilidad real, crossplay, plataforma, versión, DLC y disponibilidad.
- [ ] Ruleta arcade con animación, suspenso, nueva tirada y exclusión de juegos no disponibles; respeta filtros y reduce movimiento.
- [ ] Identidad visual diferenciada por capítulo: editorial, dossier, colaboración cinematográfica y arcade.
- [ ] Auditoría de accesibilidad, performance, carga de imágenes, mobile, fallos JS, estados vacíos y carga/error.
- [ ] QA editorial, enlaces, fuentes, evidencia y no duplicación.
- [ ] Documentar y actualizar Biblia/INFORMES.md al finalizar cada integración.

## 14. Estado

- [ ] Alcance revisado por el usuario.
- [ ] PR de planificación aprobado.
- [ ] Fase A implementada y testeada.
- [ ] Fase B implementada y testeada.
- [ ] Fase C implementada y testeada.
- [ ] Fase D implementada y testeada.
- [ ] Fase E implementada y testeada.
- [ ] Revisión visual completa.
- [ ] Aprobación de integración.

**Regla de cierre:** nada de esta propuesta se considera implementado por estar documentado. Solo marcar una tarea como completada cuando esté integrada, verificada, revisada y aceptada.
