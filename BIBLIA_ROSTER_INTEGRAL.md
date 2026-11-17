# BIBLIA DEL ROSTER INTEGRAL
## Experiencia editorial, perfiles de creadores, datos multiplataforma y presentación comercial
**Versión:** 1.0 · 14 de noviembre de 2026  
**Proyecto:** Legión Multiversal  
**Rama de implementación histórica:** `feat/roster-integral-2026-11-14`  
**Rama de integración vigente:** `integration/roster-unification-2026-11-16`  
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

Los PR #46 (Auditoría UX integral), #47, #52 y #54 están cerrados sin merge. No hay PR abiertos al iniciar esta etapa. Por decisión del proyecto, el trabajo integrable avanza en una sola rama de integración sin abrir PR adicionales. No se integra a `main` ni se publica producción hasta completar pruebas y revisión funcional/visual; las ramas cerradas se conservan como fuente para recuperar cambios aprobados, no como evidencia de integración.

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

- [x] Sustituir el titular inflado por “LAS PERSONAS DETRÁS DE LA LEGIÓN” (implementado en la cabecera; QA editorial/responsive pendiente).
- [x] Usar “LAS PERSONAS DETRÁS DE LA LEGIÓN”, coherente con el manifiesto.
- [~] Mantener la identidad, voz, canales y especialidades propias de cada integrante en la introducción; revisar redacción final en QA editorial.
- [ ] Comprobar jerarquía tipográfica, anchura de lectura y contraste en escritorio y móvil mediante revisión visual humana.

### 4.2 Filtros simplificados

Objetivo: reducir fricción para un roster de ocho perfiles, sin perder capacidad de exploración.

- [~] Mantener búsqueda por nombre, alias, handle y especialidad (implementada; QA de casos límite pendiente).
- [x] Mostrar chips rápidos de **Vínculo en la Legión** y **Plataforma**.
- [x] Renombrar “Función” como “Vínculo en la Legión” para distinguir Dirección, Profesor, Estudiante y Colaborador de las características de creación.
- [x] Eliminar el filtro “Formato” como control redundante; los formatos se conservan en las fichas y en el texto de búsqueda.
- [x] Mover especialidad y orden secundario detrás de **MÁS FILTROS**.
- [x] Mantener orden editorial por defecto y orden alfabético como alternativa; no duplicar ordenamientos equivalentes.
- [x] Mostrar contador “Mostrando X de Y integrantes”.
- [x] Mostrar filtros activos como chips removibles y acción de limpieza.
- [x] Diseñar estado vacío con explicación y botón para limpiar filtros.
- [~] Abrir filtros avanzados en un panel móvil con cierre, Escape y gestión de foco implementados; QA táctil/teclado real pendiente.
- [~] Mantener búsqueda, chips rápidos y contador; revisión visual de comprensión pendiente.
- [~] Preservar filtros al abrir/cerrar expedientes; probar flujo completo y navegación de navegador en QA funcional.

### 4.3 Presentación de cartas

- [~] Conservar ilustraciones, ocho temas cromáticos y datos aprobados; QA de encuadres y contraste pendiente.
- [~] Conservar giro 3D e interacción con expediente; el manejo de movimiento reducido está implementado y queda QA visual/táctil.
- [~] Mantener nombre, expediente, vínculo y perfil de creación; revisar legibilidad en los tres viewports.
- [x] Añadir insignia **EN VIVO** solo cuando el canal tenga transmisión confirmada y captura dentro del límite de frescura.
- [x] Vincular la insignia al canal correcto y no mostrar EN VIVO con captura vencida; el estado vencido/no disponible queda explícito.
- [~] Separar display name y handles por plataforma en el modelo; revisar la presentación visual en cartas y expedientes.
- [~] Mostrar estados de carga, error, captura demorada y ausencia de datos en los módulos de datos; QA visual pendiente.
- [~] Mantener tarjetas compactas y detalle ampliado en expedientes; revisar duplicaciones en QA editorial.

### 4.4 Orden de llamados a la acción

- [x] Retirar de la parte superior los accesos que compiten con el directorio.
- [x] Mover “Abrir Bitácora Central” y “Archivo de colaboraciones” debajo del roster como cierre del capítulo.
- [~] Conservar enlaces cruzados a Bitácora y Colaboraciones; comprobar destinos y no duplicación al QA.
- [ ] Revisar visualmente que el cierre no desplace ni oculte las cartas en escritorio y móvil.

### 4.5 Identidad canónica y handles

- [~] Definir `display_name` canónico para ocho expedientes en `roster-data.json`; validación editorial final pendiente.
- [x] Registrar handles/logins y URL por plataforma en campos separados dentro de cada cuenta.
- [~] Usar IDs/display names canónicos como fuente del Roster y expedientes; quedan migraciones editoriales puntuales en fuentes históricas por homologar.
- [~] Renderizar cuentas/plataformas con enlaces dinámicos en el expediente; presentación final en cartas requiere revisión visual.
- [!] Convención propuesta: `ROD3R1K` como display name y `TheR0D3R1K` como handle exacto. La coherencia técnica está modelada; confirmación editorial final todavía pendiente.
- [x] MORIARTYS está identificado como proyecto/canal compartido de Demian y Ari; no se absorben identidades individuales.
- [x] Añadir `identity_scope` y `represented_people` cuando aplica al alcance compartido.

### 4.6 Enlaces a plataformas

- [x] Eliminar la dependencia de un CTA fijo único a Twitch en el modal.
- [x] Construir enlaces desde las cuentas registradas en cada perfil.
- [x] Permitir múltiples enlaces por perfil para plataformas registradas; el render admite Twitch/YouTube/Instagram/Kick.
- [x] Etiquetar destinos por plataforma y usar `target="_blank"`/`rel="noopener noreferrer"`.
- [x] No crear enlaces a cuentas ausentes del registro canónico.
- [~] Las cuentas de publicación y perfiles sociales están tipados por plataforma; enlaces de apoyo se mantienen como categoría futura separada.

---

## 5. Expediente individual: navegación, mecánica y accesibilidad

### 5.1 Enlace directo y navegación del navegador

- [x] Establecer `slug`/ID estable por perfil, independiente del display name.
- [x] Permitir enlaces semánticos `#roster/<slug>`.
- [~] Abrir el capítulo y expediente al entrar por URL; falta validar manualmente los escenarios de carga lenta y perfiles inexistentes.
- [~] Actualizar el historial de navegación al abrir/cambiar/cerrar expediente; QA de flujo completo pendiente.
- [~] Manejar `popstate` y compatibilidad de hashes; probar Atrás/Adelante en navegador real.
- [~] Mantener compatibilidad con hash histórico `#expediente-...`; auditar enlaces históricos adicionales pendiente.
- [x] Usar IDs/slugs estables para identidad y rutas; los índices quedan solo para el orden visible y navegación transitoria.

### 5.2 Navegación entre integrantes

- [x] Añadir navegación anterior/siguiente dentro del conjunto filtrado.
- [~] Resolver siguiente/anterior a partir del roster filtrado; QA funcional pendiente.
- [~] Actualizar contenido, título/hash y foco en navegación del expediente; comprobar coherencia del historial en QA manual.
- [~] Los extremos se resuelven con límites del conjunto filtrado; comprobar deshabilitado/indicadores en QA.

### 5.3 Modal y foco

- [x] Se conserva el modal existente del producto, sin duplicar una segunda capa `dialog`; la migración a `<dialog>` nativo no se justifica en esta iteración.
- [~] Implementados atrapado de foco, Escape, cierre explícito, devolución al disparador y fondo inerte con restauración de `inert`/`aria-hidden`. Verificar scroll y lectores de pantalla en QA humana.
- [ ] Verificar bloqueo/restauración del scroll del documento mientras el modal está abierto.
- [ ] Probar teclado y lector de pantalla con inspección humana.
- [~] Se conserva y amplía el manejo de foco heredado de PR #12/#45; regresión manual pendiente.

### 5.4 Tabs A/B/C

- [~] Hacer que la navegación de tabs sea scrolleable en móvil sin cortar controles (A/B/C visibles en el modal; QA táctil pendiente).
- [~] Exponer semántica `tablist`, `tab` y `tabpanel`, o controles equivalentes accesibles (roles, selección, foco y teclado implementados; lector de pantalla pendiente).
- [~] Recordar la última pestaña elegida por expediente en el almacenamiento local (implementado; QA de persistencia pendiente).
- [~] Navegación por flechas, Home/End y foco entre tabs implementados; validar visualmente foco visible.
- [~] Los perfiles sin fuente utilizable muestran “SIN DATOS VERIFICADOS”; faltan pruebas de todos los estados/perfiles.
- [~] Diferenciar carga, error, fuente demorada y ausencia de registros en módulos de Twitch, YouTube/Kick y clips; QA visual pendiente.

---

## 6. Contenido indexable y carga progresiva

- [~] Skeleton durante carga real, lista estática sin JavaScript y fallback de error/reintento implementados; revisar comportamiento real de JS deshabilitado.
- [~] Skeleton cards con estructura/dimensiones reservadas; medir CLS y duración en navegadores reales pendiente.
- [~] `noscript` con los ocho perfiles, identidad compartida de MORIARTYS y enlaces públicos; queda validación con crawler/navegador sin JS.
- [~] Se implementa un fallback estático sin JS generado y comprobado desde `roster-data.json`; el pre-render completo de tarjetas requiere confirmar pipeline/hosting de producción.
- [x] El listado fallback se genera desde `roster-data.json` y CI verifica su sincronización.
- [x] Se conserva la publicación estática actual sin incorporar un build que altere GitHub Pages.
- [x] Incluir estado de error útil cuando falla la lectura de `roster-data.json`.
- [x] Mostrar error accesible y botón funcional de reintento para la carga del Roster.
- [~] Open Graph/Twitter Cards globales existentes; deep links a perfiles individuales no pueden generar metadata server-side distinta en la arquitectura estática actual. Validación de previews compartidas pendiente.

---

## 7. Integración de datos y actividad en directo

### 7.1 Estado en directo en el Roster

- [x] Reutilizar `data.json` como fuente del estado live; no se introduce consulta Twitch por carta.
- [x] Vincular cada perfil a login canónico del registro de cuentas.
- [x] Mostrar EN VIVO solo con estado positivo y captura fresca.
- [~] Mostrar juego/categoría en tarjetas y expediente; título disponible en metadatos, falta exponerlo en todos los puntos de UI.
- [x] Mostrar estados de demora/no disponibilidad y fecha de última captura; evitar presentar lecturas viejas como actuales.
- [x] Añadir enlace directo al canal/transmisión cuando está live.
- [x] YouTube/Kick se muestran por su fuente propia, sin aplicar etiqueta offline Twitch.
- [x] Separar viewers de última lectura, promedio y pico muestreados; aclarar que no son usuarios únicos ni analítica oficial.

### 7.2 Historial de transmisiones y juegos

- [~] `data.json` identifica muestreo Helix; `creator-records.json` conserva registros editoriales; fuentes externas se muestran por separado. Falta homogeneizar metadatos en todas las fuentes.
- [~] El registro de muestreo contiene fecha, stream_id, categoría y viewers; duración exacta por transmisión no está disponible de forma completa con esta API pública/cadencia.
- [x] Registrar ventana, timestamps, muestras y cobertura efectiva; validador verifica coherencia de muestras y agregados.
- [x] Etiquetar datos observados por muestreo y no como historial completo.
- [~] Mostrar muestras live por juego/sesión y conservar unidad explícita; la distribución por horas solo se mostrará cuando exista duración fiable.
- [~] Cambios de categoría quedan en snapshots; la categoría ausente se identifica como no informada. Falta una vista cronológica específica.

### 7.3 Clips, VOD y destacados

- [x] Conservar clips manuales/editoriales en `creator-records.json` con enlaces y procedencia.
- [~] Colector público `update_clips.py` implementado con Twitch Helix App Token; primera captura real queda pendiente de ejecutar desde main tras confirmar secretos de Actions.
- [~] `clips-data.json` guarda ID, URL, título, creador, fecha, game_id, view_count y metadatos disponibles; la plataforma/fuente queda declarada en el esquema raíz.
- [x] Clips automáticos se muestran en panel separado de highlights editoriales.
- [ ] VOD y broadcasts completos siguen pendientes; el endpoint de clips no se considera sustituto del archivo VOD.
- [~] Crear sección por creador con muestra limitada de clips auditables; videoteca exhaustiva/VOD sigue pendiente.
- [x] Render de clips omite miniaturas y visualizaciones ausentes; valida el host de URLs y muestra estados sin inventar campos.

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

- [~] Credenciales se leen desde GitHub Actions Secrets en el colector programado de main; no se introducen secretos en front-end. La activación queda bloqueada a confirmación del administrador.
- [!] OAuth por creador no implementado: requiere consentimiento, configuración de aplicación y scopes mínimos de cada titular.
- [x] No se almacenan tokens de creadores en JSON/HTML/JS ni se imprimen tokens en logs del colector.
- [~] El colector público usa App Token y endpoints públicos; scopes OAuth de analítica privada quedan bloqueados por consentimiento individual.
- [~] El colector de clips limita frecuencia a una captura mínima cada 6 horas y preserva capturas previas por error; backoff formal y panel de cuota siguen pendientes.
- [x] Validar/normalizar payloads de Twitch y clips; se añaden validadores del historial, registro y contratos JSON.
- [x] Solo se presentan datos públicos y registros editoriales existentes; datos privados quedan fuera de esta etapa.
- [x] Errores resumidos por cuenta sin incluir tokens ni secretos.

### 9.3 Automatización y frescura

- [~] Twitch histórico mantiene muestreo de 55 minutos; clips se actualizan con intervalo mínimo de 6 horas; revisar cuota real/API en entorno principal pendiente.
- [x] El workflow programado utiliza grupo de concurrencia sin cancelación de ejecución en curso; colectores tienen límites internos de frecuencia.
- [~] `data.json` y `clips-data.json` conservan timestamps, estado/cobertura y errores; ampliar la misma semántica a todas las fuentes multiplataforma pendiente.
- [~] UI muestra última actualización/frescura para estadísticas y clips; QA visual pendiente.
- [x] Diferenciar demora, error de fuente y registro vacío en módulos de Twitch y clips.

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
- [~] Acción de impresión/guardar PDF desde el expediente completo A/B/C con hoja A4; validar saltos, gráficos e imágenes en navegadores/impresoras reales.

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
- [~] Simplificar filtros a búsqueda + chips de vínculo/plataforma + “Más filtros” (implementado; QA visual/táctil final pendiente).
- [~] Incorporar panel móvil de filtros con cierre/Escape y gestión de foco (implementado; QA táctil/teclado real pendiente).
- [x] Añadir contador, resumen de filtros activos, limpieza y estado vacío robusto.
- [x] Reemplazar el titular de cabecera por “LAS PERSONAS DETRÁS DE LA LEGIÓN”.
- [x] Mover CTAs de Bitácora/Colaboraciones al final del capítulo Roster.
- [~] Revisar orden editorial y textos (estructura principal implementada; validación editorial humana pendiente).
- [ ] QA responsive, teclado y lector de pantalla en navegadores reales.

### Fase 2 — Identidad y datos editoriales
- [x] Definir IDs/slugs, display_name, identity_scope, personas representadas y handles por cuenta para ocho perfiles; validación editorial editorial final pendiente.
- [!] Validar la convención final de nombres canónicos con el equipo, en particular ROD3R1K / TheR0D3R1K.
- [x] Distinguir canal compartido MORIARTYS de canales individuales en el modelo (`shared_project`, Demian + Ari).
- [~] Enlaces externos dinámicos por plataforma en expedientes y modal implementados; QA visual/destinos pendiente.
- [~] Uniformar nombres mediante IDs/display names canónicos; quedan registros históricos y secciones editoriales por homologar.

### Fase 3 — Carga, SEO y fallback
- [~] Skeleton cards, fallback sin JavaScript y error/reintento implementados; probar comportamiento real de carga/JS deshabilitado y CLS.
- [x] Error/reintento de carga del Roster y estados de ausencia de datos/demora implementados; QA visual pendiente.
- [~] `noscript` con datos esenciales (implementado; QA crawler pendiente).
- [~] Fallback no-JS se genera desde la fuente JSON; pre-render completo de tarjetas requiere pipeline confirmado sin alterar GitHub Pages.
- [~] Deep links semánticos y metadatos OG/Twitter globales existentes; no hay metadata individual server-side para cada hash en la arquitectura estática.

### Fase 4 — Mecánica del expediente
- [~] Deep links por slug (`#roster/<slug>`) implementados; probar enlaces copiados y acceso directo en navegador.
- [~] Atrás/adelante del navegador implementados mediante `popstate`; probar manualmente entrada, salida y navegación entre expedientes.
- [~] Navegación anterior/siguiente implementada dentro del conjunto filtrado; QA manual pendiente.
- [~] Se conserva y amplía el manejo existente de foco, Escape, devolución de foco y cierre; QA con teclado/lector de pantalla pendiente.
- [~] Tabs A/B/C semánticas, scrolleables en móvil, navegación por flechas y persistencia local por creador implementadas; QA manual pendiente.
- [~] Estado “SIN DATOS VERIFICADOS” implementado en módulos de estadísticas; cubrir todos los casos/perfiles en QA.
- [ ] QA de teclado, pantalla táctil y lector de pantalla.

### Fase 5 — Integración en vivo y contenido
- [~] Reutilizar `data.json` en cartas (MORIARTYS piloto y estado EN VIVO; extensión/QA pendiente).
- [~] Badge EN VIVO con frescura y enlace (implementado en cartas; QA del intervalo/fallo pendiente).
- [~] Categoría/juego y metadatos del directo se consumen desde Twitch; asegurar que título aparezca en todas las superficies que lo requieren.
- [~] Historial parcial por muestreo, actividad por juegos y calidad de datos implementados; historial completo y duración fiable siguen pendientes.
- [~] Muestra automática de clips públicos por creador implementada; VOD completos y videoteca exhaustiva pendientes.
- [~] Cobertura de siete cuentas y URLs de clips validadas por código; primera captura API real y revisión de enlaces pendientes tras activación.

### Fase 6 — Plataforma de datos multiplataforma
- [~] Inventario inicial de Helix, YouTube Data API, Kick e Instagram manual; cuota real y scopes OAuth individuales pendientes.
- [~] Modelo de identidad/cuentas en `roster-data.json`; contrato de snapshots Twitch y contrato de clips públicos añadidos. Falta un esquema universal de métrica común a todas las fuentes.
- [~] Twitch: muestreo público App Token, validación de historial y colector público de clips integrados; OAuth privado por creador requiere consentimiento. Primera captura del nuevo colector pendiente en main.
- [~] YouTube: datos públicos integrados al ID estable `pato-oratoris`; frescura marcada, OAuth privado requiere autorización del titular.
- [~] Kick dispone de lectura pública vía colector multiplataforma; Instagram permanece como enlace manual sin métricas.
- [!] Backend seguro/D1 y persistencia independiente bloqueados por falta de provisionamiento, decisión de arquitectura y permisos. El histórico actual se conserva en JSON versionado.
- [!] Consola privada requiere backend, autenticación y definición de roles; infraestructura sin provisionar.
- [~] Prueba piloto MORIARTYS conectada al histórico Twitch; CI y preview técnica aprobados. Falta revisión visual y cotejo con el Creator Dashboard del titular.
- [~] Límites/metodología documentados; cotejo del histórico con fuente original/Creator Dashboard pendiente.

### Fase 7 — Fichas comerciales
- [~] Expedientes individuales consumen fuentes y clips disponibles; pulido comercial, validación por titulares y exportación pendientes.
- [~] Actividad y clips públicos/editoriales diferenciados; primera captura real y validación comercial por titular pendientes.
- [ ] Media kit colectivo.
- [~] Impresión/guardar PDF del expediente completo A/B/C implementado; exportación de media kit colectivo todavía pendiente.
- [ ] Revisión editorial, legal y de permisos de uso de contenido.

### Fase 8 — Imágenes y rendimiento
- [~] Inventario de assets existente; auditoría detallada de encuadres, peso, derechos/atribución pendiente.
- [ ] Conversión con originales preservados.
- [~] Adición de dimensiones se inició en páginas intervenidas; completar inventario y srcset/sizes con mediciones.
- [ ] Alt text y nombres semánticos.
- [ ] Medición de LCP/CLS/peso en varios viewports.
- [ ] Validación visual de encuadres y calidad.

### Fase 9 — Cierre
- [~] CI ejecuta sintaxis JS, JSON, modelo/cobertura, fallback no-JS, validadores de clips/histórico, compilación, smoke tests, suite unitaria y `validate_site.py`; QA humana pendiente.
- [~] Pruebas unitarias de colectores/validadores y pruebas de contrato estático del diálogo, tabs, impresión, nombres, fallback y clips incorporadas; tests de navegador/flujo interactivo del Roster pendientes.
- [ ] Pruebas responsive en escritorio, tablet y móvil.
- [ ] Prueba manual de teclado y lector de pantalla.
- [~] Validación estática de enlaces en CI; revisión funcional manual de deep links/back-forward pendiente.
- [~] Validadores automáticos de históricos, clips y frescura incorporados; primer sondeo real de API nueva y cotejo con titulares pendientes.
- [x] Actualización de `INFORMES.md` con el segundo bloque técnico; volver a actualizar al cerrar QA/activación real.
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



### Registro del segundo bloque técnico — 14/11/2026 · clips públicos, integridad y accesibilidad

**Cambios incorporados en la misma rama/PR #47**
- `update_clips.py` consulta el endpoint público Twitch Helix Get Clips por `broadcaster_id`, usando App Token y la ventana móvil de 30 días. Solicita hasta 100 resultados por canal y conserva hasta 10 (ordenados por la API por visualizaciones). La documentación del dato aclara que es una muestra limitada de clips más vistos, no una videoteca exhaustiva ni una selección editorial.
- `clips-data.json` inicializa los siete canales Twitch con estado `awaiting_collection`, sin insertar clips ficticios. Las capturas se separan por ID estable del creador, con fecha, cuenta, URL, título, creador, broadcaster, juego cuando la API lo proporciona, duración, visualizaciones y miniatura cuando existen.
- Se conserva la última captura correcta de una cuenta si la consulta de ese canal falla. La actualización automática tiene un intervalo mínimo de seis horas y la validación falla de forma cerrada si Twitch no resuelve todas las cuentas.
- `renderAutomaticTwitchClips()` agrega una sección de clips automáticos en la pestaña C de cada expediente Twitch. Los highlights elegidos por el equipo permanecen en el archivo editorial separado.
- Se añadieron `schemas/clips-data.schema.json`, `scripts/validate_clips_data.py` y `tests/test_update_clips.py`; el workflow de métricas incluye el colector de clips y guarda `clips-data.json` junto con los otros datos en ejecuciones autorizadas sobre `main`.
- `scripts/render_roster_noscript.py` mantiene el fallback estático del Roster a partir de `roster-data.json`. Los ocho perfiles, la identidad compartida de MORIARTYS y los enlaces públicos están entre marcadores que CI compara con la fuente canónica.
- `schemas/twitch-snapshot.schema.json`, `scripts/validate_metric_history.py` y `tests/test_metric_history.py` incorporan contrato y controles de cronología, tipos, estados offline, agregados y valores restringidos.

**Evidencia**
- Último HEAD conocido: `3c89ddda0b85ffe94afe0b0603283714bc0fa8bb` (actualizar antes de comunicar si el repositorio avanzó).
- GitHub Actions [run 43653732771](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43653732771): SUCCESS; incluye validador de historial Twitch, clips, fallback sin JS, tests de colectores, compilación y validación del sitio.
- GitHub Actions [run 43653781200](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43653781200): SUCCESS para las pruebas unitarias y validaciones en el HEAD del validador de historial.
- La validación del historial `data.json` existente pasó sin introducir ni modificar muestras. No se ejecutó el endpoint de clips desde esta rama.
- La primera captura automática de clips sigue pendiente: el workflow que persiste datos está intencionalmente limitado a `main`; además, antes de activarlo hay que confirmar que los dos secretos Twitch están presentes en GitHub Actions.
- Preview anterior a los dos validadores finales: https://8ccef604.legion-multiversal.pages.dev. Comprobar que Cloudflare haya generado una preview para el HEAD actual antes de compartirla como preview vigente.

**Pendientes que continúan bloqueados o requieren QA**
- OAuth individual de Twitch/YouTube para analíticas privadas: cada titular debe autorizar scopes; no se simula consentimiento.
- Backend con persistencia D1 y consola privada: falta provisionar recursos y definir operación/autenticación; no se afirma que exista.
- Primera captura real de clips, cuota y respuestas de Twitch/YouTube/Kick: requiere entorno principal y secretos confirmados por el administrador.
- VOD completos: no se sustituyen por el endpoint de clips.
- Pruebas manuales de desktop/tablet/móvil, teclado, lector de pantalla, lector sin JS, focos/scroll del modal, encuadres y revisión editorial: todavía no realizadas por una persona.
- No se fusionó, no se tocó `main`, no se desplegó producción ni se modificaron credenciales.


### Registro del tercer bloque técnico — 14/11/2026 · salida imprimible y accesibilidad del expediente

- Se unificó el nombre visible del perfil en el dashboard de rendimiento, mapa multiversal, etiquetas accesibles de tarjetas, alt text, página personal, cómic genérico y título del modal. Los `name` técnicos siguen intactos para resolver las plantillas internas; la interfaz utiliza `display_name`. Esto evita que MORIARTYS aparezca como “MORIARTYS” en algunos lugares cuando su nombre canónico público es **LOS MORIARTYS**, y aplica la forma “LADY MORIARTY” donde corresponde.
- El modal mantiene `role="dialog"`, `aria-modal`, `aria-labelledby`, tabs/tabpanel y control de foco. Al abrirlo, el `main` y el footer se vuelven `inert` y `aria-hidden`; al cerrarlo se restaura el estado anterior. No se altera la navegación fuera del modal.
- Se añadió la acción **IMPRIMIR / GUARDAR PDF**. Abre la impresión nativa del navegador, incluye las tres secciones del expediente (A/B/C) aunque solo una esté activa, y aplica una hoja A4. No es un PDF server-side ni garantiza idéntico resultado en todos los motores; saltos de página, fondos y miniaturas requieren QA real.
- Se añadió `tests/test_roster_accessibility_contract.py`, que verifica el contrato de diálogo, correspondencia tabs/paneles, salida de impresión, inert del fondo, nombres canónicos, fallback sin JS, clips automáticos y control de reintento.

**Evidencia de esta entrega**
- HEAD con código funcional y pruebas: `03d0e888722a3df9a65539eefe872c2c6887b006`. El HEAD actual del PR puede ser posterior por cambios documentales.
- GitHub Actions [run 43654434630](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43654434630): SUCCESS. 14 pasos funcionales completados, incluidos todos los validadores y la suite `python -m unittest discover -s tests -v`.
- Cloudflare Pages para ese mismo commit: https://21bc9fac.legion-multiversal.pages.dev; preview de rama: https://feat-roster-integral-2026-11.legion-multiversal.pages.dev.
- CI estático no equivale a revisión con NVDA/VoiceOver, teclado, dispositivos táctiles o impresión física/PDF. Esas comprobaciones humanas siguen pendientes.

**Límites sin cambio**
- No se hizo merge, no se tocó `main`, no se desplegó producción ni se modificaron credenciales. La primera captura real de clips sigue pendiente de la ejecución autorizada del workflow de `main`, con secretos de Twitch confirmados.

## Dirección oficial vigente — Roster como selector de personajes

La experiencia principal del Roster deja de organizar la exploración alrededor de rangos institucionales y filtros. La entrada pública debe funcionar como una **pantalla de selección de personajes**: primero aparecen los ocho integrantes; después, la ficha del seleccionado; al final, el comparador comercial.

### Contrato de experiencia
- Los ocho integrantes aparecen desde el primer viewport, sin separar Dirección, Profesores, Estudiante y Colaboradores.
- Cada integrante tiene retrato, nombre público, identidad narrativa, especialidades, plataforma principal, estado de actividad cuando la fuente es reciente y horario/frecuencia solo cuando está confirmado.
- La línea «Ideal si te gusta» se construye desde las áreas editoriales ya registradas. No se inventan intereses, horarios, idiomas, disponibilidad ni métricas.
- La selección funciona con ratón, teclado (flechas, Inicio y Fin) y carrusel horizontal en móvil.
- «Sorprendeme» selecciona otro integrante; el progreso de exploración reutiliza el estado local ya existente y el sistema de misiones del Mapa Multiversal.
- «Abrir expediente» reutiliza el expediente individual actual y sus rutas canónicas `#roster/<slug>`; no crea un segundo sistema de perfiles.
- El comparador comercial queda al final. Las métricas permanecen como «No disponible» hasta disponer de una ventana, fuente y metodología comparables para los ocho perfiles.
- Los ocho perfiles reciben el mismo nivel de presentación inicial, independientemente de su volumen de estadísticas o clips.

### Fuentes y límites
- `roster-data.json` sigue siendo la fuente canónica de identidad, retratos, slugs, plataformas y especialidades.
- El estado EN VIVO reutiliza `getRosterLiveState()` y `data.json`; solo se presenta como directo si la captura está dentro del umbral de frescura ya definido.
- Los expedientes completos siguen usando el núcleo compartido y los archivos existentes de actividad, registros, métricas, plataformas y clips. No se crea una segunda capa de estadísticas.
- Los horarios se muestran únicamente desde campos editoriales confirmados. Cuando faltan, se indica «Horario por confirmar» o «Frecuencia de publicación por confirmar».
- El comparador no calcula promedios cruzados ni combina Twitch, YouTube u otras plataformas.

### Implementación en la rama única
- `app.js`: nuevo selector alimentado por `heroesData`; se retiró el renderizador de la grilla antigua como vista activa. El selector reutiliza progreso, estado live y apertura del expediente existentes.
- `index.html`: punto de montaje dentro de `#roster-home` y actualización de la versión de caché del script.
- `roster-selector.css`: retratos, panel de personaje, rail responsive, comparador y estados de carga/error.
- `roster-fixes.css`: se conserva como capa correctiva visual previa.
- No se alteró `roster-data.json` ni se duplicaron archivos de estadísticas.
- No se abrió PR, no se fusionó a `main` y no se desplegó producción.

### Verificación pendiente
La inspección estática confirmó ocho perfiles canónicos, selector y panel presentes, navegación de teclado, uso de la fuente live existente, reutilización del progreso, comparador sin métricas inventadas y ausencia del botón de simulación del prototipo. El branch se sincronizó con el último commit de `main`; los cuatro archivos de datos (`data.json`, `clips-data.json`, `creator-metrics.json` y `platform-stats.json`) tienen el mismo blob SHA en ambas ramas.

No hay todavía CI asociado a esta tanda ni QA visual real en navegador. Antes de integrar a `main) se requieren validación JS/HTML/CSS, carga de los ocho retratos, pruebas de interacción desktop/móvil, Back/Forward de expedientes, accesibilidad y revisión visual. Producción permanece intacta.


### Cierre de validación automática — selector de personajes

- Commit de código validado: `8e8dea53e31a82ff9360e6f73a3b98db0f84dc07`.
- GitHub Actions [run 43794534542](https://github.com/losmoriartys-cmd/legion-multiversal/actions/runs/43794534542): **SUCCESS**.
- `node --check app.js`: SUCCESS.
- JSON, modelo del roster, cobertura de cuentas Twitch, fallback sin JavaScript, colectores, clips, historial y métricas normalizadas: SUCCESS.
- Suite Python: **47 pruebas aprobadas**.
- Playwright: **5 pruebas aprobadas**, incluyendo selector con ocho integrantes, apertura de cada expediente, modales, Bitácora y rutas históricas.
- Validador del sitio: **8 perfiles** y **40 referencias locales** comprobadas; SUCCESS.
- La primera ejecución falló por una expectativa obsoleta en un test del expediente compartido; se actualizó el contrato de prueba y la ejecución final quedó verde. No se ocultó ni se dejó pendiente ese fallo.
- QA manual visual en distintos dispositivos y lector de pantalla continúa siendo una revisión posterior; CI no sustituye esa inspección.

La rama continúa aislada de producción. No se creó PR ni se fusionó a `main`.


## 2026-11-17 — Decisión editorial: Roster como capítulo 01 y acceso directo

- El Roster pasa a ser el primer capítulo de contenido, inmediatamente después de Inicio: 01 Roster, 02 Origen, 03 Valores. Se conservan los IDs técnicos de los paneles para no romper rutas ni enlaces.
- El capítulo Roster presenta todas las cartas simultáneamente en una única grilla; se elimina el selector de personaje con panel de vista previa como paso intermedio.
- Cada carta reúne retrato, alias/identidad, métricas disponibles, frecuencia/estado y acceso directo a su Bitácora.
- Al hacer clic se abre directamente la Bitácora individual en composición 35/65, con retrato fijo, enlaces, frase, descripción, datos de actividad y pestañas.
- No se inventan cifras ni estados de actividad. Cuando seguidores, media o último directo no tienen fuente verificable, se informa su indisponibilidad.
- La edición persistente de perfiles queda fuera de esta entrega visual: requiere una superficie administrativa autenticada y escritura segura sobre la fuente de datos; no se simula un botón de edición público.
