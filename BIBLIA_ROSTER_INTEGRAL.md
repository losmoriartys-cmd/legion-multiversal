# BIBLIA DEL ROSTER INTEGRAL
## Experiencia editorial, perfiles de creadores, datos multiplataforma y presentación comercial
**Versión:** 1.0 · 14 de noviembre de 2026  
**Proyecto:** Legión Multiversal  
**Rama de implementación:** `feat/roster-integral-2026-11-14`  
**Estado general:** Plan aprobado para implementación progresiva

---

## 0. Propósito y regla de uso

Esta Biblia define el alcance único para evolucionar el Capítulo 03 · Roster hacia un producto completo: una experiencia pública visual y accesible, conectada a información verificable de cada creador y a una futura consola interna de análisis y preparación comercial.

Debe usarse como:
- referencia funcional y visual;
- hoja de ruta por entregas pequeñas;
- checklist de implementación y QA;
- registro de decisiones aprobadas, pendientes y limitaciones;
- protección contra duplicaciones, datos inventados y cambios que rompan el trabajo integrado.

**No se considera terminada una tarea solo porque el código esté escrito.** Para marcarla como completada debe estar implementada en esta línea de trabajo, pasar las pruebas técnicas aplicables, tener evidencia de revisión visual/funcional en escritorio y móvil cuando corresponda, y quedar registrada en `INFORMES.md`. La publicación en `main` requiere el flujo de integración y aprobación correspondiente.

### Estados

- [ ] Pendiente.
- [~] En curso.
- [x] Completado y verificado.
- [!] Bloqueado por una decisión, permiso, credencial o evidencia externa.
- [—] No aplica.

No marcar un punto como completado por inferencia. Registrar enlaces, SHA, ejecuciones o capturas cuando existan.

---

## 1. Visión del producto

El Roster tendrá dos caras conectadas y alimentadas por un modelo de datos coherente:

### 1.1 Experiencia pública

Un directorio editorial de creadores que:
- presente a cada integrante con una identidad visual propia;
- permita encontrar perfiles sin imponer seis filtros simultáneos;
- muestre la actividad en directo cuando exista una fuente reciente y válida;
- conecte perfil, plataforma, contenido, juegos, estadísticas y clips;
- permita compartir un expediente con un enlace directo;
- explique cuándo no existen datos verificados, en vez de dejar espacios vacíos;
- convierta la información de cada creador en una ficha útil para una marca, sin prometer alcance ni resultados no medidos.

### 1.2 Centro de inteligencia de creadores

Una herramienta privada, separada de la página pública, para:
- mantener perfiles y cuentas vinculadas;
- consultar actividad y datos por plataforma;
- recopilar y conservar históricos;
- administrar clips, VOD, juegos, transmisiones y evidencias;
- comparar períodos compatibles;
- generar fichas individuales y un media kit colectivo;
- controlar conexiones, permisos, errores, frescura y cobertura de datos.

La consola privada no debe exponer secretos, tokens ni información no autorizada. La web pública solo recibe los campos destinados a publicación.

---

## 2. Estado de partida verificado

### 2.1 Estructura y fuentes existentes

La implementación actual de `main` ya cuenta con:
- `roster-data.json`: fuente editorial del directorio y de los perfiles;
- `data.json`: estado/actividad observada de canales Twitch;
- `platform-stats.json`: métricas públicas por creador y plataforma;
- `creator-records.json`: clips, hitos, colaboraciones y material editorial;
- `app.js`: renderizado, filtros, expedientes, estadísticas y mecánica de navegación;
- `index.html` y `styles.css`: estructura y presentación del sitio;
- integración editorial con la Bitácora y fichas comerciales.

No crear un segundo catálogo independiente de personas ni mantener dos copias manuales de la misma información. Antes de incorporar un dato, identificar su fuente de verdad y su propietario.

### 2.2 Composición actual

El archivo de roster contiene **ocho expedientes**:
1. MORIARTYS — proyecto/canal compartido de Demian y Ari.
2. ROD3R1K.
3. LADYMORIARTY.
4. ARDIPII.
5. AKUMA.
6. DAVE — NEXUS.
7. PATO — ORATORIS.
8. HABITOS.

El estado documentado de Estadísticas distingue siete canales Twitch en seguimiento y el perfil de ORATORIS, que se informa desde YouTube. No presentar ocho expedientes como ocho canales Twitch.

MORIARTYS representa el proyecto compartido de Demian y Ari, no un canal individual de una sola persona. El canal individual de Ari debe permanecer diferenciado.

### 2.3 Trabajo previo que se conserva

- PR #12: cartas premium, filtros, reverso 3D, accesibilidad inicial, navegación y perfiles.
- PR #14: conexión Roster–Bitácora y directorio de expedientes desde la fuente de roster.
- PR #36: corrección del ancho completo de la ficha ejecutiva comercial.
- PR #45: endurecimiento del enlace externo del modal.
- Estos cambios están integrados en `main` y se deben extender, no duplicar ni reemplazar sin motivo.

El único PR abierto verificado al iniciar esta Biblia es el #46, **Auditoría UX integral**. Tiene alcance transversal (robustez, formularios, estadísticas, accesibilidad, SEO y rendimiento), no es un PR exclusivo del Roster y conserva pendientes propios. Se mantiene separado; no se fusiona ni se cierra como parte del Roster sin una revisión específica. No se identificaron PR de Roster abiertos para absorber. Los cambios nuevos del Roster deben avanzar en esta única rama y en un único PR integral.

---

## 3. Principios no negociables

1. Una sola fuente de verdad por tipo de dato.
2. Identidad, rol institucional, plataforma y formato de contenido son dimensiones distintas.
3. Separar persona individual de canal o proyecto compartido.
4. Mostrar fuente, período, fecha de captura, cobertura y limitaciones de cada métrica.
5. No estimar datos faltantes ni convertir una ausencia de información en cero.
6. No sumar seguidores, vistas, espectadores ni audiencias de plataformas diferentes como si fueran personas únicas o unidades equivalentes.
7. No confundir un dato aportado por un creador con una consulta actual verificada.
8. No atribuir alianzas, patrocinios, remuneraciones, ventas, conversiones ni ROI sin evidencia.
9. Mantener identidad editorial de cómic/archivo cinematográfico; no convertir el roster en un dashboard genérico.
10. Priorizar lectura, accesibilidad, rendimiento, carga progresiva y uso móvil junto al impacto visual.
11. Mantener compatibilidad con enlaces existentes mientras se incorporan anclas semánticas.
12. No cambiar `main`, despliegues de producción ni credenciales durante el trabajo de esta rama.

---

## 4. Experiencia pública del Roster

### 4.1 Jerarquía de la cabecera

- [ ] Sustituir el titular inflado “UN LUGAR PARA CADA TALENTO EXTRAORDINARIO”.
- [ ] Usar una frase coherente con el manifiesto: propuesta inicial **“LAS PERSONAS DETRÁS DE LA LEGIÓN”**.
- [ ] Mantener como bajada la idea de que cada integrante conserva identidad, voz, canal y especialidades propias.
- [ ] Comprobar jerarquía tipográfica, anchura de lectura y contraste en escritorio y móvil.

### 4.2 Filtros simplificados

Objetivo: reducir fricción para un roster de ocho perfiles, sin perder capacidad de exploración.

- [ ] Mantener la búsqueda por nombre, alias, handle y especialidad.
- [ ] Mostrar chips rápidos de **Vínculo en la Legión** y **Plataforma**.
- [ ] Renombrar “Función” como “Vínculo en la Legión” para distinguir Dirección, Profesor, Estudiante y Colaborador de las características de creación.
- [ ] Eliminar el filtro “Formato” como control redundante cuando la plataforma/actividad ya describe el contexto; el formato podrá mostrarse en la ficha y utilizarse en búsqueda o filtros avanzados si una necesidad real lo justifica.
- [ ] Mover especialidad y orden secundario detrás de **MÁS FILTROS**.
- [ ] No mantener dos ordenamientos que producen prácticamente el mismo resultado. El orden editorial será el predeterminado; el orden alfabético puede quedar como alternativa. El orden por número solo se mantiene si demuestra utilidad.
- [ ] Mostrar un contador inequívoco: “Mostrando X de Y integrantes”.
- [ ] Mostrar filtros activos como chips removibles y una acción de limpieza.
- [ ] Diseñar estado vacío con explicación y botón para limpiar filtros.
- [ ] En móvil, abrir filtros avanzados en un bottom sheet o panel accesible, con cierre, foco y scroll correctos.
- [ ] Mantener búsqueda, chips rápidos y contador siempre comprensibles.
- [ ] No perder el estado de filtros al abrir/cerrar un expediente, salvo que el usuario decida restablecerlos.

### 4.3 Presentación de cartas

- [ ] Conservar ilustraciones, ocho temas cromáticos y datos aprobados del trabajo anterior.
- [ ] Conservar giro 3D, interacción directa con expediente y movimiento reducido.
- [ ] Mantener nombres, número de expediente, vínculo y perfil de creación con una jerarquía legible.
- [ ] Añadir insignia **EN VIVO** cuando el canal asociado tenga una transmisión confirmada y suficientemente reciente.
- [ ] Hacer que la insignia lleve al canal o a la transmisión adecuada; no mostrar EN VIVO usando una captura vencida.
- [ ] Mostrar plataforma(s) y handle(s) oficiales sin confundirlos con el nombre editorial.
- [ ] Mostrar estado no disponible / sin datos verificados de forma explícita; no dejar huecos ambiguos.
- [ ] Evitar repetir en la carta toda la información que ya aparece en la ficha ampliada.

### 4.4 Orden de llamados a la acción

- [ ] Retirar de la parte superior los accesos que compiten con el directorio.
- [ ] Mover “Abrir Bitácora Central” y “Archivo de colaboraciones” debajo del roster como cierre del capítulo.
- [ ] Conservar las conexiones cruzadas con Bitácora y Colaboraciones sin duplicar contenido.
- [ ] Revisar que el cierre no desplace ni oculte las cartas.

### 4.5 Identidad canónica y handles

- [ ] Definir un `display_name` canónico para cada expediente.
- [ ] Registrar handles por plataforma en campos separados.
- [ ] Usar el mismo display name en cartas, expedientes, estadísticas, Bitácora, Colaboraciones y fichas comerciales.
- [ ] Presentar el handle debajo del nombre, asociado a su plataforma.
- [ ] Resolver ROD3R1K / TheR0D3R1K / Rod3rik con una convención única. Propuesta técnica: conservar el nombre editorial actual del roster como display name y mostrar el handle exacto que la plataforma devuelve. Requiere validación editorial antes de publicar.
- [ ] MORIARTYS debe identificarse como proyecto/canal compartido de Demian y Ari. No convertir su expediente en una ficha individual de Demian ni absorber el canal individual de Ari.
- [ ] Añadir un campo explícito de alcance de identidad, por ejemplo `identity_scope: "shared_project" | "individual_creator"`, y las personas representadas cuando aplique.

### 4.6 Enlaces a plataformas

- [ ] Eliminar la dependencia de un CTA fijo “VISITAR CANAL DE TWITCH”.
- [ ] Construir botones desde las cuentas disponibles de cada creador.
- [ ] Permitir varios enlaces (Twitch, YouTube, Instagram y futuras plataformas) cuando estén registrados.
- [ ] Etiquetar cada destino por plataforma y usar target/rel seguros cuando abra nueva pestaña.
- [ ] No crear botones para cuentas no confirmadas.
- [ ] Separar perfiles sociales, enlaces de apoyo (por ejemplo Cafecito) y cuentas de publicación.

---

## 5. Expediente individual: navegación, mecánica y accesibilidad

### 5.1 Enlace directo y navegación del navegador

- [ ] Establecer slug estable por persona/proyecto, independiente del display name.
- [ ] Permitir enlaces como `#roster/akuma`.
- [ ] Abrir el capítulo Roster y el expediente correcto al entrar por URL.
- [ ] Usar `history.pushState` al abrir/cambiar de expediente y una política coherente al cerrar.
- [ ] Responder correctamente a atrás/adelante del navegador (`popstate`).
- [ ] Mantener alias de compatibilidad para los hashes históricos que ya se hayan compartido.
- [ ] No depender de índices de array como identificador permanente; usar el slug/ID estable.

### 5.2 Navegación entre integrantes

- [ ] Añadir controles anterior/siguiente dentro del expediente.
- [ ] Respetar el conjunto filtrado y el orden actual.
- [ ] Actualizar título, contenido, hash y foco al cambiar de integrante sin cerrar/reabrir visualmente la experiencia.
- [ ] Deshabilitar correctamente los extremos o documentar el comportamiento circular elegido.

### 5.3 Modal y foco

- [ ] Verificar si la vista de expediente debe seguir como página interna o migrar a un `dialog` modal; no duplicar capas innecesarias.
- [ ] Si es modal: foco atrapado dentro, cierre con Escape, cierre explícito, fondo inerte y devolución del foco al control que lo abrió.
- [ ] Gestionar scroll del documento mientras el modal está abierto.
- [ ] Probar teclado y lector de pantalla.
- [ ] No romper el manejo actual de foco ya incorporado por PR #12/#45.

### 5.4 Tabs A/B/C

- [~] Hacer que la navegación de tabs sea scrolleable en móvil sin cortar controles (A/B/C visibles en el modal; QA táctil pendiente).
- [~] Exponer semántica `tablist`, `tab` y `tabpanel`, o controles equivalentes accesibles (roles, selección, foco y teclado implementados; lector de pantalla pendiente).
- [~] Recordar la última pestaña elegida por expediente en el almacenamiento local (implementado; QA de persistencia pendiente).
- [ ] Permitir navegación por teclado y foco visible.
- [ ] En Audiencia, mostrar “SIN DATOS VERIFICADOS” cuando no existan datos aptos para mostrar.
- [ ] Diferenciar carga, error, fuente no disponible y ausencia de datos.

---

## 6. Contenido indexable y carga progresiva

- [ ] Evitar que el capítulo quede vacío si JavaScript tarda, falla o está deshabilitado.
- [ ] Añadir skeleton cards con dimensiones reservadas y una duración limitada al estado de carga real.
- [ ] Añadir `noscript` con el listado básico de nombres, roles y enlaces públicos disponibles.
- [ ] Evaluar pre-renderizado de cartas desde `roster-data.json` durante el build para que el HTML inicial incluya nombres y datos editoriales esenciales.
- [ ] Mantener un solo origen de los datos: el pre-render debe generarse, no convertirse en otro catálogo manual.
- [ ] Confirmar primero cómo GitHub Pages genera/publica el sitio antes de introducir un proceso de build que pueda alterar el despliegue.
- [ ] Incluir fallback útil en caso de error de lectura de `roster-data.json`.
- [ ] Exponer mensajes de error discretos, con opción de reintento cuando corresponda.
- [ ] Comprobar SEO, Open Graph y previews compartidas para la página principal y los enlaces a expedientes, dentro de las limitaciones de una web estática.

---

## 7. Integración de datos y actividad en directo

### 7.1 Estado en directo en el Roster

- [ ] Reutilizar el `data.json` y el estado ya recolectado; no crear una consulta paralela por carta.
- [ ] Vincular cada perfil Twitch con su login canónico.
- [ ] Mostrar EN VIVO solo con una respuesta positiva y dentro de la ventana de frescura definida.
- [ ] Mostrar juego/categoría y título de transmisión cuando estén disponibles y sean correctos.
- [ ] Mostrar “Estado no actualizado” o “Última captura…” si la fuente está atrasada.
- [ ] Añadir enlace directo a la transmisión/canal.
- [ ] Mantener el estado de perfiles YouTube/video sin etiquetarlos como offline de Twitch.
- [ ] No presentar viewers actuales como audiencia histórica, promedio ni usuarios únicos.

### 7.2 Historial de transmisiones y juegos

- [ ] Definir qué histórico proviene de Twitch Helix, qué histórico proviene de fuentes externas y qué registros aporta el creador.
- [ ] Registrar fecha, duración, categoría/juego y métricas disponibles por transmisión.
- [ ] Registrar la ventana temporal y cobertura efectiva.
- [ ] Evitar presentar una captura parcial como historial completo.
- [ ] Construir distribuciones de juegos con denominadores claros (horas emitidas, transmisiones, horas vistas u otra unidad disponible).
- [ ] Identificar cambios de categoría y transmisiones con categoría ausente.

### 7.3 Clips, VOD y destacados

- [ ] Conservar clips manuales aportados por creadores y su procedencia.
- [ ] Diseñar captura automática de clips públicos autorizados/disponibles.
- [ ] Guardar ID, URL, título, creador, plataforma, fecha, juego/categoría y visualizaciones cuando la API lo proporcione.
- [ ] Distinguir clip automático de destacado seleccionado editorialmente.
- [ ] Incorporar VOD/highlights disponibles y comprobar su accesibilidad.
- [ ] Crear una videoteca por creador con enlaces que se puedan auditar.
- [ ] No inventar miniaturas, títulos, visualizaciones ni URLs ausentes.

---

## 8. Estadísticas multiplataforma y calidad de datos

### 8.1 Esquema común de métricas

Cada dato publicado debería conservar, cuando corresponda:
- creador e identidad/canal;
- plataforma y cuenta;
- métrica y unidad;
- valor;
- período de medición;
- instante de captura;
- fuente y URL de origen;
- método de obtención;
- cobertura y limitaciones;
- estado: verificado, parcial, aportado por creador, vencido, no disponible o error;
- visibilidad: público o interno/restringido.

No convertir unidades incompatibles ni mezclar métricas de fuentes diferentes.

### 8.2 Twitch

- [ ] Estado en directo, juego, título y viewers actuales desde fuente oficial cuando esté disponible.
- [ ] Clips, VOD y metadatos públicos con límites de paginación respetados.
- [ ] Históricos propios por muestreo/captura; registrar cadencia y cobertura.
- [ ] Métricas privadas solo con autorización y scopes válidos del titular.
- [ ] No utilizar campos obsoletos ni extrapolar datos que Twitch no expone.

### 8.3 YouTube

- [ ] Mantener separado el perfil de ORATORIS y sus métricas de YouTube.
- [ ] Verificar credenciales y cuota de YouTube Data API v3.
- [ ] Incorporar estadísticas públicas del canal y videos con fecha/captura.
- [ ] Las analíticas privadas requieren autorización del titular mediante OAuth y permisos aplicables.
- [ ] No tratar suscriptores, vistas y espectadores Twitch como unidades sumables.

### 8.4 Otras plataformas

- [ ] Inventariar Kick, Instagram y futuras plataformas por cuenta y posibilidad real de API.
- [ ] Documentar los permisos/secretos requeridos sin incluir valores sensibles en el repositorio.
- [ ] No marcar una plataforma como integrada hasta comprobar una captura real.
- [ ] Donde no exista acceso legítimo, mostrar estado pendiente/no disponible.

### 8.5 Fuentes externas y datos aportados

- [ ] Mantener SullyGnome, TwitchMetrics, Streams Charts u otras fuentes separadas de Twitch Helix.
- [ ] Mostrar fecha/ventana y limitaciones de cada fuente.
- [ ] Registrar datos aportados por creadores con fecha de entrega y responsable.
- [ ] No presentar resúmenes manuales como una integración automática.
- [ ] No llamar audiencia única a una suma de canales no deduplicada.

---

## 9. Arquitectura técnica propuesta

La arquitectura se implementará después de un inventario de lo que ya existe, no mediante una reconstrucción a ciegas.

### 9.1 Separación de responsabilidades

- Frontend público estático: GitHub Pages, sin secretos.
- API/backend: Cloudflare Worker o Pages Functions, según el despliegue aprobado y probado.
- Persistencia histórica: evaluar Cloudflare D1 u otra persistencia apropiada. No asumir que ya está provisionada.
- Archivos públicos derivados: JSON versionados o endpoints públicos con esquema controlado.
- Consola privada: autenticación y autorización por administrador/colaborador.

### 9.2 Seguridad

- [ ] Secretos solo en el entorno seguro del backend.
- [ ] OAuth por creador para datos privados cuando corresponda.
- [ ] No guardar tokens de creadores en `roster-data.json`, HTML, JS público ni logs.
- [ ] Verificar permisos y scopes mínimos.
- [ ] Rate limits, reintentos con backoff y manejo de cuota.
- [ ] Validar payloads y normalizar datos.
- [ ] Exponer únicamente datos públicos o autorizados.
- [ ] Registrar errores sin volcar secretos o tokens.

### 9.3 Automatización y frescura

- [ ] Definir cadencias por fuente según límites/cuotas, no por una frecuencia arbitraria.
- [ ] Evitar solicitudes superpuestas.
- [ ] Registrar `captured_at`, éxito, error y cobertura.
- [ ] Mostrar última actualización visible cuando afecte la interpretación.
- [ ] No ocultar fallos: diferenciar dato antiguo, fuente caída y ausencia real de datos.

---

## 10. Fichas comerciales y entregables

### 10.1 Perfil comercial individual

- [ ] Identidad canónica y handles correctos.
- [ ] Plataformas activas y enlaces.
- [ ] Formatos reales de contenido.
- [ ] Juegos/categorías con período y fuente.
- [ ] Estadísticas disponibles con metodología.
- [ ] Clips/VOD destacados.
- [ ] Colaboraciones y credenciales verificadas.
- [ ] Oportunidades potenciales diferenciadas de acuerdos existentes.
- [ ] Datos no disponibles claramente indicados.
- [ ] Exportación a PDF o ficha imprimible, cuando la información esté validada.

### 10.2 Media Kit general

- [ ] Presentación de Legión Multiversal.
- [ ] Integrantes y composición del roster.
- [ ] Plataformas y formatos.
- [ ] Actividad por plataforma sin sumas engañosas.
- [ ] Casos de colaboración documentados (incluido BarFender).
- [ ] Clips representativos.
- [ ] Metodología, períodos, cobertura y fuentes.
- [ ] Propuestas comerciales posibles, no promesas.
- [ ] Contacto y próximos pasos.
- [ ] Fecha de actualización y versión.

---

## 11. Imágenes, recursos y rendimiento

- [ ] Auditar los JPG de carnets e ilustraciones y los WebP existentes.
- [ ] Convertir a WebP/AVIF cuando la comparación visual confirme calidad suficiente.
- [ ] Conservar originales; no reemplazar ni borrar fuentes sin respaldo.
- [ ] Añadir `width` y `height` intrínsecos correctos para evitar CLS.
- [ ] Añadir `loading="lazy"` a imágenes fuera del primer viewport; no retrasar imágenes críticas.
- [ ] Añadir `decoding="async"` donde corresponda.
- [ ] Crear variantes responsive y `srcset/sizes` para móvil/tablet/escritorio cuando aporten una mejora medida.
- [ ] Renombrar assets con nombres semánticos, manteniendo un manifiesto de referencias y sin romper rutas.
- [ ] Investigar el typo `DemuianCarnet.jpg`; corregirlo mediante migración controlada y referencias verificadas.
- [ ] Completar alt text descriptivo en imágenes significativas; usar alt vacío solo en decoración.
- [ ] Revisar tamaño transferido, LCP, CLS y carga de tarjetas en móvil.
- [ ] Mantener animaciones sutiles y respetar `prefers-reduced-motion`.

---

## 12. Anclas, navegación y coherencia editorial

Los IDs numéricos históricos se conservan por compatibilidad; no renumerar los capítulos como solución rápida.

- [ ] Introducir anclas semánticas estables para `roster`, `estadisticas`, `colaboraciones`, etc.
- [ ] Hacer que los enlaces compartibles apunten a destinos semánticos.
- [ ] Mantener alias para hashes heredados cuando sea razonable.
- [ ] Verificar que número visible, orden de lectura, navegación principal y paginador sigan el orden editorial aprobado.
- [ ] Corregir destinos frágiles que dependan del número interno de capítulo.
- [ ] Revisar enlaces desde Inicio, Comunidad, Estadísticas, Bitácora y Colaboraciones.
- [ ] El acceso a Bitácora y Archivo de colaboraciones queda debajo del directorio, como cierre del Roster.

---

## 13. Fases de implementación y checklist maestro

### Fase 0 — Consolidación y base documental
- [x] Revisar estado actual de `main`, archivos de fuente y PR integrados.
- [x] Confirmar que no hay PR de Roster abiertos pendientes de absorber.
- [x] Crear una rama única de implementación integral.
- [x] Crear esta Biblia y centralizar aquí el checklist.
- [x] Crear un único PR Draft del Roster integral: [PR #47](https://github.com/losmoriartys-cmd/legion-multiversal/pull/47).
- [x] Añadir vínculo a esta Biblia desde la Biblia maestra del proyecto e `INFORMES.md`.

### Fase 1 — UX del directorio
- [~] Simplificar filtros a búsqueda + chips de vínculo/plataforma + “Más filtros” (implementado; QA visual pendiente).
- [~] Incorporar bottom sheet móvil accesible (implementado; QA táctil/teclado pendiente).
- [~] Añadir contador y estado vacío robusto (contador implementado; QA pendiente).
- [~] Reemplazar el titular de cabecera (implementado; QA editorial pendiente).
- [~] Mover CTAs de Bitácora/Colaboraciones al final (implementado; QA de orden pendiente).
- [ ] Revisar orden editorial y textos.
- [ ] QA responsive y teclado.

### Fase 2 — Identidad y datos editoriales
- [~] Definir `display_name`, slug, identity scope y handles por plataforma (modelo inicial creado para ocho perfiles; validación editorial pendiente).
- [ ] Validar nombres canónicos con el equipo.
- [x] Distinguir canal compartido MORIARTYS de canales individuales en el modelo (`shared_project`, Demian + Ari).
- [~] Hacer enlaces externos dinámicos por plataforma en expedientes y modal (implementado para Twitch/YouTube/Instagram; QA visual y de destinos pendiente).
- [ ] Uniformar nombres en Roster, Estadísticas, Bitácora, Alianzas y Colaboraciones.

### Fase 3 — Carga, SEO y fallback
- [~] Skeleton cards (implementados; no se completan hasta pasar pruebas de carga/JS deshabilitado).
- [ ] Error/reintento y ausencia de datos diferenciados.
- [~] `noscript` con datos esenciales (implementado; QA crawler pendiente).
- [ ] Prueba de pre-render desde la fuente JSON y decisión según pipeline real de Pages.
- [ ] Enlaces semánticos y metadatos sociales cuando corresponda.

### Fase 4 — Mecánica del expediente
- [~] Deep links por slug (`#roster/<slug>`) implementados; probar enlaces copiados y acceso directo en navegador.
- [~] Atrás/adelante del navegador implementados mediante `popstate`; probar manualmente entrada, salida y navegación entre expedientes.
- [~] Navegación anterior/siguiente implementada dentro del conjunto filtrado; QA manual pendiente.
- [~] Se conserva y amplía el manejo existente de foco, Escape, devolución de foco y cierre; QA con teclado/lector de pantalla pendiente.
- [~] Tabs A/B/C semánticas, scrolleables en móvil, navegación por flechas y persistencia local por creador implementadas; QA manual pendiente.
- [ ] Estado “Sin datos verificados”.
- [ ] QA de teclado, pantalla táctil y lector de pantalla.

### Fase 5 — Integración en vivo y contenido
- [~] Reutilizar `data.json` en cartas (MORIARTYS piloto y estado EN VIVO; extensión/QA pendiente).
- [~] Badge EN VIVO con frescura y enlace (implementado en cartas; QA del intervalo/fallo pendiente).
- [ ] Categoría/juego actual cuando esté disponible.
- [ ] Historial de transmisiones y juegos.
- [ ] Biblioteca de clips y VOD por creador.
- [ ] QA de cobertura y enlaces.

### Fase 6 — Plataforma de datos multiplataforma
- [ ] Inventario de APIs, permisos y cuotas.
- [~] Modelo inicial unificado de identidad/cuentas, método y permisos definido en `roster-data.json` schema v2; falta ampliar el esquema histórico de métricas con capturas/estado detallado por fuente.
- [~] Twitch: colector público App Token y muestreo automático existente integrados al registro del Roster. OAuth por creador para datos privados queda pendiente y requiere autorización individual.
- [~] YouTube: datos públicos integrados al ID estable `pato-oratoris`; OAuth de analítica privada pendiente de autorización del titular.
- [ ] Evaluar Kick/Instagram y plataformas adicionales.
- [ ] Backend seguro y persistencia histórica.
- [ ] Consola privada: estado de conectores, errores y cobertura.
- [~] Prueba piloto MORIARTYS conectada al histórico Twitch; CI y preview técnica aprobados. Falta revisión visual y cotejo con el Creator Dashboard del titular.
- [ ] Validar cifras con la fuente original y documentar límites.

### Fase 7 — Fichas comerciales
- [ ] Ficha individual basada en datos verificados.
- [ ] Clips destacados y actividad.
- [ ] Media kit colectivo.
- [ ] Exportación/impresión.
- [ ] Revisión editorial, legal y de permisos de uso de contenido.

### Fase 8 — Imágenes y rendimiento
- [ ] Inventario de imágenes y referencias.
- [ ] Conversión con originales preservados.
- [ ] Dimensiones intrínsecas y responsive.
- [ ] Alt text y nombres semánticos.
- [ ] Medición de LCP/CLS/peso en varios viewports.
- [ ] Validación visual de encuadres y calidad.

### Fase 9 — Cierre
- [~] CI ejecuta sintaxis JS, validación JSON, registro/cobertura Twitch y plataformas, compilación Python, smoke tests de los loaders y `validate_site.py`; QA funcional/visual completa pendiente.
- [ ] Pruebas funcionales automatizadas del roster.
- [ ] Pruebas responsive en escritorio, tablet y móvil.
- [ ] Prueba manual de teclado y lector de pantalla.
- [ ] Revisión de enlaces, deep links y navegación del navegador.
- [ ] Verificación de datos, fuentes, cuotas y frescura.
- [ ] Actualización final de `INFORMES.md`.
- [ ] Revisión humana de la preview por el responsable del proyecto.
- [ ] Aprobación explícita antes de integrar en `main`.
- [ ] Confirmación del despliegue correcto según el hosting de producción.

---

## 14. Criterios de aceptación del Roster integral

El Roster solo se declara terminado cuando:

1. Un visitante comprende quiénes son los integrantes y qué plataformas usan sin navegar filtros complejos.
2. Las cartas no aparecen vacías durante la carga ni cuando JavaScript falla.
3. Cada creador tiene display name, handle, identidad y enlaces coherentes.
4. El canal compartido MORIARTYS no se confunde con las identidades individuales de Demian o Ari.
5. La insignia EN VIVO refleja información reciente y enlaza al destino correcto.
6. Cada expediente puede abrirse, compartirse, recorrerse y cerrarse mediante teclado, ratón, pantalla táctil y controles del navegador.
7. Las pestañas y estados de audiencia no inventan datos.
8. Las métricas conservan fuente, período, captura, unidad y cobertura.
9. Clips, VOD y juegos se atribuyen al creador y plataforma correctos.
10. Los materiales comerciales distinguen hechos, muestras, datos aportados y oportunidades potenciales.
11. Imágenes y animaciones mantienen calidad, legibilidad, responsive y estabilidad visual.
12. No hay regresiones en Bitácora, Estadísticas, En Vivo, navegación ni capítulos vecinos.
13. La preview fue inspeccionada y aceptada por el responsable del proyecto.
14. Los resultados se documentaron y el PR integral quedó listo para revisión.

---

## 15. Registro de decisiones y cambios

| Fecha | Decisión | Estado |
|---|---|---|
| 14/11/2026 | Una única línea de implementación para el Roster integral; no abrir PR pequeños y paralelos para cada mejora del mismo producto. | Aprobado |
| 14/11/2026 | Mantener PR #46 separado por su alcance global de UX/robustez y sus propios pendientes. | Aprobado |
| 14/11/2026 | Simplificar filtros: chips de vínculo/plataforma, controles secundarios detrás de “Más filtros”. | Aprobado |
| 14/11/2026 | Reemplazar “Un lugar para cada talento extraordinario” por “Las personas detrás de la Legión” como propuesta inicial. | Aprobado para implementar |
| 14/11/2026 | Mover accesos a Bitácora y Colaboraciones al cierre del Roster. | Aprobado |
| 14/11/2026 | MORIARTYS se presenta como canal/proyecto compartido de Demian y Ari. | Confirmado |
| 14/11/2026 | Nombres canónicos y handles exactos deben separarse; la convención de ROD3R1K requiere validación editorial. | Pendiente de validación |
| 14/11/2026 | Usar `data.json` para el indicador EN VIVO evitando una consulta duplicada. | Aprobado para implementar |
| 14/11/2026 | Mantener IDs técnicos históricos y añadir rutas/anclas semánticas compatibles. | Aprobado |

---

## 16. Regla de continuidad

Antes de cada tarea:
1. comprobar el HEAD y el estado de la rama;
2. leer la sección pertinente de esta Biblia y los archivos actuales;
3. comprobar dependencias y PR relacionados;
4. realizar un cambio acotado;
5. ejecutar pruebas y revisar diferencias;
6. registrar el resultado y actualizar el checklist;
7. entregar al responsable los cambios, evidencia, pendientes y riesgos.

No fusionar, publicar en producción, cambiar credenciales ni retirar datos/assets por el solo hecho de que una etapa técnica haya terminado. Si aparece un conflicto entre esta Biblia, un dato verificado nuevo y una decisión anterior, documentar el conflicto y pedir resolución antes de alterar la información pública.

### Registro del primer bloque de implementación — 14/11/2026

- **Rama única:** `feat/roster-integral-2026-11-14`; origen `main`. No se modificó ni integró `main`.
- **Modelo:** `roster-data.json` pasa a schema v2 e incorpora ID/slug estable, display name, alcance de identidad y cuentas por plataforma para los ocho perfiles. MORIARTYS queda como proyecto compartido de Demian y Ari. Se añaden `schemas/roster-data.schema.json` y `scripts/validate_roster_data.py`.
- **Colectores:** Twitch y plataformas ahora derivan las cuentas del modelo de roster; se elimina la lista estática de canales y el Client ID hardcodeado. La autenticación sigue siendo app token para endpoints públicos; no se habilita acceso a analíticas privadas. El workflow de métricas valida cobertura contra el roster.
- **Piloto MORIARTYS:** el libro de cuatro páginas consume `data.json` y `creator-records.json`; se retiraron métricas históricas hardcodeadas y porcentajes geográficos no respaldados. Promedios/picos se identifican como muestreo propio y seguidores/demografía como no verificados.
- **Directorio:** filtros simplificados, contador, búsqueda de handles, chips rápidos, panel avanzado responsive, titular actualizado, skeletons, `noscript`, badge EN VIVO dependiente de frescura y CTAs movidos al cierre.
- **Estado:** implementación en curso. Aún no se ha ejecutado CI sobre un PR, no se ha cotejado el piloto con una cuenta/consulta externa real y no se realizó revisión visual manual. No marcar como completado hasta pasar esos controles.

- **Mecánica del expediente:** rutas compartibles `#roster/<slug>`, navegación del historial Atrás/Adelante, slugs estables, pestañas A/B/C reorganizadas por identidad, audiencia/juegos y contenido/colaboraciones, con desplazamiento horizontal en móvil y persistencia por creador.
### Estado verificable de la primera entrega — 14/11/2026

**Consolidación**
- PR único: [#47 · Roster integral](https://github.com/losmoriartys-cmd/legion-multiversal/pull/47), Draft y abierto, base `main`, rama `feat/roster-integral-2026-11-14`.
- La auditoría global PR #46 permanece separada. No se fusionó ni cerró ningún PR anterior como parte de esta entrega.

**Modelo y colectores**
- `roster-data.json` schema v2: ocho expedientes; siete logins Twitch y ORATORIS/YouTube por separado. Los siete logins registrados coinciden con `data.json.active_channels` y la última captura informaba cobertura completa 7/7.
- `update_stats.py` toma los logins del registro de roster, requiere `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` seguros y conserva el muestreo de 55 minutos/ventana móvil de hasta 30 días. No usa la clave hardcodeada anterior.
- **Precondición antes de habilitar el colector tras un merge:** confirmar que `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` existan en Settings → Secrets and variables → Actions del repositorio. La variable que se configuró en Cloudflare Pages no se comparte automáticamente con GitHub Actions. No copiar valores a archivos ni a conversaciones.
- `update_platform_stats.py` toma las cuentas del mismo registro. El ID de ORATORIS es ahora `pato-oratoris`; el antiguo `platform-registry.json` queda deprecado.
- El sistema sigue limitado a datos públicos con App Token/API key. Analíticas privadas, OAuth individual, consola privada y almacenamiento histórico dedicado (por ejemplo D1) no están implementados aún.

**Piloto MORIARTYS — lectura de `data.json` existente**
- Muestras almacenadas: **271**; primera muestra **03/11/2026 17:47:50 UTC** y última **14/11/2026 20:56:27 UTC**.
- Muestras tomadas durante directos: **11**; sesiones distintas observadas: **6**; categorías con muestras live: **4**.
- Promedio de espectadores muestreados: **17,6**; pico capturado: **31**.
- Tiempo en directo observado entre muestras: **3,59 h**; horas vistas estimadas entre muestras consecutivas admisibles: **73,79 h**.
- Categorías: Just Chatting (4 muestras live), BarFender (3), Clive Barker's Hellraiser: Revival (2) y Fortnite (2).
- La última lectura guardada mostraba el canal **offline**; seguidores totales y demografía siguen **sin datos verificados**.
- **Limitación:** el período cubierto es el intervalo real entre la primera y última muestra indicada, no 30 días completos. Promedio/pico son métricas de muestreo propio: no son CCV oficial, espectadores únicos ni Analytics privadas. Las 73,79 h son estimación del muestreo, no watch time oficial. Estos valores proceden del `data.json` versionado; no se realizó una consulta directa al Creator Dashboard desde esta rama.

**UX y mecánica implementadas en código**
- Filtros reducidos, chips de vínculo/plataforma, filtros avanzados, contador, estado vacío, skeleton y fallback `noscript`.
- Titular “LAS PERSONAS DETRÁS DE LA LEGIÓN”; enlaces Bitácora/Colaboraciones al cierre.
- Insignia EN VIVO con control de frescura; enlaces dinámicos a plataformas; modal con pestañas A/B/C y persistencia por creador.
- Rutas `#roster/<slug>`, `popstate`, anterior/siguiente y manejo accesible de foco/teclado.

**Evidencia técnica**
- GitHub Actions [run 43645619308](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43645619308): **SUCCESS**. Incluye sintaxis JS, JSON, validación de roster/Twitch/YouTube, `py_compile`, smoke tests de lectura de ambos colectores y `validate_site.py`.
- Cloudflare Pages: despliegue de preview correcto para el commit `5e98c5b21257752ab7b0941225513a48d03ae2eb`.
- Preview inmutable: https://f8207995.legion-multiversal.pages.dev
- Preview de rama: https://feat-roster-integral-2026-11.legion-multiversal.pages.dev
- **Pendiente de aceptación:** inspección humana en desktop/tablet/móvil; pruebas funcionales de filtros, bottom sheet, flip, deeplinks, Back/Forward, tabs, lector de pantalla y destinos externos; cotejo de cifras con el titular; revisión de imágenes y métricas visuales Lighthouse. No se declara aprobada la revisión visual.
- No hubo merge ni despliegue de producción; `main` permanece intacta.
