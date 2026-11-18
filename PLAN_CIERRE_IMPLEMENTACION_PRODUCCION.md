# Plan maestro de cierre e implementación en producción
## Legión Multiversal · control de trabajo verificable

**Propósito:** convertir los acuerdos del proyecto en una lista de trabajo persistente, ejecutable y auditable. El objetivo no es acumular propuestas, ramas o Pull Requests: el objetivo es que cada mejora aprobada quede implementada, probada e integrada en producción.

**Regla principal del usuario:** no dejar PR abiertos acumulándose. Si un cambio está probado y cumple los criterios, se integra; si no está probado, se corrige. Un PR, una rama, un commit o una preview no equivalen a una implementación terminada.

## 1. Definición obligatoria de estados

Usar exclusivamente estos estados en este documento y en los informes:

- [ ] **PENDIENTE:** todavía no implementado.
- [ ] **EN TRABAJO:** se está modificando; no cuenta como realizado.
- [ ] **IMPLEMENTADO EN CÓDIGO:** el cambio existe, pero todavía no pasó todas las pruebas.
- [ ] **PROBADO:** las pruebas pertinentes pasaron, pero todavía no está integrado/publicado.
- [ ] **IMPLEMENTADO Y VERIFICADO EN PRODUCCIÓN:** integrado en `main`, despliegue exitoso y comprobación funcional/visual en el sitio publicado. Solo este estado permite tachar la tarea como terminada.

No marcar una tarea como terminada por estar documentada, codificada, en un PR, en preview o porque una prueba aislada pasó.

## 2. Política de ramas y Pull Requests — regla no negociable

1. Consultar siempre el HEAD actual de `main`, los workflows y el estado de producción antes de tocar código.
2. No crear PR como contenedores de tareas pendientes ni abrir varios PR para acumular trabajo.
3. Priorizar cambios acotados, probados y directamente integrables en `main`, respetando las protecciones del repositorio.
4. Si por protección de rama o necesidad de revisión se requiere PR, debe ser de vida corta: completar pruebas, revisar, integrar en cuanto esté aprobado y cerrar. No dejarlo abierto como recordatorio.
5. Nunca fusionar código que no haya pasado las pruebas aplicables. Si falla, corregir antes de integrar.
6. No cerrar PR sin merge y presentar eso como implementación. Si se descarta una propuesta, registrar explícitamente que no se implementó.
7. Después de integrar, verificar el despliegue real y el SHA publicado. Un merge no demuestra que producción se actualizó.
8. Mantener un único frente activo por vez. No iniciar el siguiente frente hasta cerrar el anterior o registrar un bloqueo concreto.
9. Registrar en `INFORMES.md` archivos, cambios, pruebas con resultados, commit, workflow, SHA desplegado, URL y revisión visual.
10. Si una acción no puede ejecutarse por permisos, herramientas o falta de datos, decirlo claramente y dejar el estado pendiente; nunca simular ejecución.

## 3. Orden de trabajo y checklist maestro

### Frente A — Portada y tres caminos de entrada (prioridad crítica)

- [ ] Portada ejecutiva que funcione como centro de entrada, no como bienvenida estática.
- [ ] Tres accesos principales y visualmente diferenciados:
  - [ ] Comunidad / Roster: conocer a los ocho integrantes y explorar sus expedientes.
  - [ ] Marcas / Publishers / desarrolladores: propuesta comercial, credenciales, colaboraciones, estadísticas y contacto.
  - [ ] Creadores / Reclutamiento: conocer la propuesta y llegar directamente al formulario para sumarse.
- [ ] Acceso directo y visible al Roster desde la primera pantalla.
- [ ] Acceso comercial claro sin confundirlo con el recorrido de creadores.
- [ ] Mantener el lema institucional: “DIFERENTES MUNDOS. UNA MISMA LEGIÓN.”
- [ ] No publicar cifras de prueba del ejemplo (por ejemplo, +30K, 500+ CCV o 92% engagement) sin fuente, período, cobertura y evidencia verificables.
- [ ] Probar CTAs, anclas, teclado, foco, contraste, escritorio y móvil.

### Frente B — Navegación pública y arquitectura editorial

- [ ] Separar recorridos y navegación de Marcas y Creadores.
- [ ] Retirar “Recursos” de los menús públicos; conservar recursos internos si son necesarios, sin exponerlos como navegación pública ni indexarlos.
- [ ] Eliminar Keymailer de credenciales comerciales. No confundir plataforma de gestión de campañas/keys con partnership o aval comercial.
- [ ] Mantener la numeración editorial aprobada y continua del 00 al 10:
  - [ ] 00 Portada / Inicio.
  - [ ] 01 Origen.
  - [ ] 02 Valores.
  - [ ] 03 Roster.
  - [ ] 04 Estadísticas.
  - [ ] 05 Comunidad.
  - [ ] 06 Alianzas.
  - [ ] 07 Colaboraciones.
  - [ ] 08 Arsenal.
  - [ ] 09 EN VIVO.
  - [ ] 10 Reclutamiento.
- [ ] Valores integrado en “Quiénes somos” donde corresponda, sin perder su identidad editorial.
- [ ] Comunidad y Alianzas conservan capítulos propios.
- [ ] Reclutamiento separado de la navegación institucional/comercial.
- [ ] Revisar enlaces, flechas internas/externas, historial atrás/adelante, IDs técnicos y enlaces profundos sin romper formularios ni expedientes.
- [ ] Metodología reescrita para visitantes: lenguaje común, qué se mide, fuentes, períodos, límites y fecha de actualización; sin exponer nombres de archivos internos.
- [ ] En ficha comercial, accesos directos a Roster y Estadísticas.
- [ ] Indicador de misiones oculto hasta recibir datos válidos; no mostrar ceros o estados inventados como si fueran actividad real.
- [ ] Fecha de actualización comercial calculada desde la captura real más reciente y mostrar antigüedad/estado de frescura cuando corresponda.

### Frente C — Registro canónico y calidad de datos

- [ ] Un único registro canónico para los ocho integrantes, con ID estable, nombre visible, usuario por plataforma, alias/personaje y variantes históricas.
- [ ] Consumir ese registro desde Roster, expedientes, ficha comercial y vistas relacionadas.
- [ ] No introducir una segunda fuente de verdad llamada `streamers.json` sin auditar primero el modelo de datos actual. Reutilizar y ampliar el registro vigente cuando sea viable.
- [ ] No copiar el objeto de ejemplo de “Oratoris” ni sus métricas (141 CCV, 380 pico, 8.9K seguidores, 54h, puntuaciones comerciales) como datos reales.
- [ ] No inventar campos de actividad ni convertir valores ausentes en cero.
- [ ] Cada métrica debe incluir plataforma, fuente, unidad, período, fecha de captura, cobertura y criterio de comparabilidad.
- [ ] Diferenciar datos medidos, datos declarados por el creador, estimaciones y datos no disponibles.
- [ ] Validar JSON, esquema, IDs únicos, enlaces, handles y correspondencia de los ocho perfiles.
- [ ] El HTML base del Roster debe conservar fallback útil para SEO y para el caso de JavaScript no disponible, sin duplicar ni contradecir los datos dinámicos.
- [ ] Validar que las ocho fotografías y asignaciones respeten la directiva vigente del Roster: carnet en el selector principal; foto de cuerpo entero solo dentro del expediente y en uso compacto; carta del personaje cuando aporte valor; no repetir ni estirar retratos en Bitácora.

### Frente D — Roster y ocho expedientes

- [ ] Mantener como referencia obligatoria la directiva y Biblia integral del Roster.
- [ ] Selector principal con las ocho fotos carnet simultáneas para identificar a los integrantes.
- [ ] Apertura individual del expediente con distribución aprobada: carnet, identidad, cita y redes en columna lateral; cabecera y capítulos/contenido en columna principal.
- [ ] Foto de cuerpo entero como recurso interno compacto en Perfil; nunca como imagen gigante que ocupe Bitácora.
- [ ] Carta de personaje debajo del carnet cuando corresponda, sin duplicar innecesariamente imágenes.
- [ ] Pestañas y contenido coherentes con la directiva aprobada (Perfil, Estadísticas, Clips y Bitácora).
- [ ] Estadísticas multiplataforma con fuente, ventana, fecha, frescura y cobertura; no inventar.
- [ ] Máximo cuatro clips destacados por perfil en vista principal, con miniaturas originales y carga optimizada.
- [ ] Juegos, horarios, estado y trayectoria sustentados por datos reales/declarados correctamente.
- [ ] Probar apertura y contenido de los ocho expedientes, imágenes, enlaces, teclado, pestañas, atrás/adelante, escritorio y móvil.

### Frente E — BarFender, credenciales y transparencia comercial

- [ ] BarFender presentado con exactamente cuatro indicadores comerciales, solo si cada uno tiene definición, fuente y evidencia.
- [ ] Separar métricas individuales de resultados colectivos.
- [ ] No sumar espectadores únicos entre canales ni presentar Shared Viewership como deduplicación total si no lo es.
- [ ] Explicación desplegable “Cómo leer estos datos” con metodología simple.
- [ ] Un único bloque de transparencia con referencias ⓘ, evitando aclaraciones repetidas.
- [ ] Credenciales: distinguir partnership, acceso a plataforma, campaña, key recibida y colaboración; no insinuar patrocinio remunerado sin evidencia.
- [ ] Eliminar Keymailer de la ficha de credenciales comerciales; conservarlo solo como herramienta operativa interna cuando corresponda.
- [ ] Formularios con privacidad explícita, validación, honeypot o protección anti-spam segura, estados de envío/error y correo opcional para creadores.
- [ ] No prometer un plazo de respuesta hasta que el equipo lo apruebe y pueda cumplirlo. El plazo propuesto de cinco días hábiles requiere confirmación; no publicar “menos de 48 horas” por el ejemplo.
- [ ] Verificar backend real, entrega, variables y tratamiento de datos antes de declarar funcional un formulario.

### Frente F — Estadísticas y metodología

- [ ] Mostrar solo datos con fuente y período identificables.
- [ ] Mantener separadas las plataformas y no sumar seguidores, vistas, horas o espectadores de servicios distintos como si fueran equivalentes.
- [ ] Estados de carga, error y ausencia de datos claramente diferenciados.
- [ ] Ocultar promedio/pico cuando la muestra sea insuficiente.
- [ ] Validar fecha de captura y frescura; no mostrar datos antiguos como actuales.
- [ ] Probar que la ficha comercial y las estadísticas enlazan correctamente con el Roster y viceversa.

### Frente G — Capítulo 09 EN VIVO / Legión TV

**La propuesta de sala de control es una dirección funcional/visual, no código listo para copiar. Auditar primero el colector y las fuentes reales existentes.**

- [ ] Estado global de red calculado con capturas válidas y recientes de los ocho canales.
- [ ] No usar `estado: live/offline` escrito manualmente como fuente de verdad; definir proveedor, consulta, TTL, última actualización y estado desconocido/error.
- [ ] Detectar transmisiones activas con datos reales. No confundir “sin dato” con “offline”.
- [ ] Reproductor principal que permita sintonizar un canal activo; selección y prioridad de canal documentadas.
- [ ] Soporte Twitch y YouTube solo cuando la plataforma y el método de embed estén verificados. No prometer integración de plataformas que no tengan soporte técnico comprobado.
- [ ] Generar correctamente el parámetro `parent` para Twitch según el dominio de producción/preview y validar restricciones de iframe.
- [ ] Si todos están offline, mostrar un modo archivo atractivo sin pantalla negra.
- [ ] Clips/VODs destacados reales, con URLs y embeds verificados; nunca usar placeholders como `NOMBRE_DEL_CLIP_1`.
- [ ] Agenda solo desde horarios confirmados por los integrantes; no publicar eventos ficticios ni asumir que un horario habitual es un compromiso de directo.
- [ ] Grilla de los ocho canales con identidad, avatar, rol, estado, categoría/juego y enlaces correctos.
- [ ] Telemetría de audiencia simultánea solo si los datos son contemporáneos y comparables; mostrar hora de captura y limitaciones.
- [ ] No mostrar “Índice de actividad Chat: ALTO” sin una métrica y definición calculable.
- [ ] Interacciones accesibles: sintonizar, ir al canal, abrir expediente y controles de agenda.
- [ ] Easter egg opcional y no intrusivo; no usar alertas molestas como única interacción.
- [ ] Seguridad: evitar interpolar datos externos en `innerHTML`; usar creación de nodos/textContent o sanitización robusta. Validar URLs y atributos de iframe.
- [ ] Rendimiento: no cargar iframes de ocho canales al mismo tiempo; lazy-load y activar el reproductor solo al elegir/sintonizar.
- [ ] Responsive: monitor, telemetría y grilla utilizables en móvil; probar 320/375/768/1024 px y escritorio.
- [ ] Accesibilidad: controles con teclado, etiquetas, estados anunciables, foco visible y respeto por `prefers-reduced-motion`.
- [ ] Pruebas unitarias/contratos para estados live/offline/unknown, fuente caída, datos viejos, cero canales activos, uno activo y múltiples activos.

### Frente H — QA integral y publicación

- [ ] Revisar diff y dependencias antes de integrar.
- [ ] Ejecutar suite Python completa: `python -m unittest discover -s tests -v`.
- [ ] Ejecutar validadores de JSON, roster, rutas, assets, enlaces y JavaScript disponibles en el repo.
- [ ] Ejecutar Playwright con los ocho expedientes, las cinco pestañas, navegación atrás/adelante y formularios.
- [ ] Revisar visualmente escritorio y móvil; guardar evidencia de capturas cuando el flujo lo permita.
- [ ] Comprobar que ninguna fotografía corta rostros ni se deforma; comprobar carga y fallbacks.
- [ ] Comprobar navegación pública, CTAs, enlaces internos/externos y accesibilidad básica.
- [ ] Corregir todos los fallos antes de integrar.
- [ ] Integrar en `main` sin dejar PR abierto acumulado.
- [ ] Esperar workflow de producción exitoso y registrar URL/run.
- [ ] Comparar SHA desplegado con HEAD de `main`.
- [ ] Abrir el sitio publicado y repetir smoke tests en producción: portada, tres recorridos, ficha comercial, estadísticas, ocho expedientes, EN VIVO y formularios.
- [ ] Solo entonces cambiar el estado de los ítems correspondientes a **IMPLEMENTADO Y VERIFICADO EN PRODUCCIÓN**.

## 4. Registro de ejecución

Por cada tarea o subgrupo, agregar una entrada a `INFORMES.md` con:

- Fecha y responsable.
- ID del frente y checklist abordado.
- Archivos modificados.
- Qué quedó implementado realmente.
- Pruebas ejecutadas y resultado exacto (comando, cantidad, PASS/FAIL).
- Commit SHA integrado en `main`.
- Workflow de producción y resultado.
- SHA publicado comparado con `main`.
- URL y fecha de comprobación visual/funcional.
- Pendientes, riesgos y motivo de cualquier bloqueo.

Actualizar este documento al cerrar cada subgrupo. No tachar por avance parcial.

## 5. Estado inicial de esta guía

Al crear esta guía, los cambios del PR #67 estaban registrados en una rama/PR Draft, no integrados a producción según el estado reportado. El PR #66 contiene directivas del Roster que deben respetarse y reconciliarse. No asumir que sus contenidos están publicados ni que sus pruebas validan el HEAD actual de `main`.

- [ ] Auditar estado actual de #67, #66 y HEAD de `main`.
- [ ] Resolver e integrar primero el frente institucional del PR #67, respetando el orden editorial vigente y sin romper las directivas del Roster.
- [ ] Cerrar cualquier PR pendiente mediante integración probada o descarte documentado; no dejarlo abierto como backlog.
- [ ] Continuar por los frentes de esta guía, uno por vez.

**Criterio final:** el progreso se mide por funcionalidades que el visitante puede usar en la web publicada, no por la cantidad de código escrito ni por la cantidad de PR creados.
