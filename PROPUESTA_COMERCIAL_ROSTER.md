# Estrategia comercial del Roster y sistema de Bitácoras

**Estado:** propuesta editorial y funcional para implementar en `auditoria-ux`  
**Fecha de auditoría:** 14 de noviembre de 2026  
**Objetivo:** convertir el Roster y sus estadísticas en un media kit navegable, creíble y atractivo para marcas, publishers y agencias, conservando la identidad de cómic retro de Legión Multiversal.

## 1. Diagnóstico objetivo

La base visual y narrativa ya tiene personalidad. El proyecto cuenta con un Roster de ocho perfiles, una Bitácora central, un expediente individual desarrollado para MORIARTYS, estadísticas de Twitch Helix, referencias externas de TwitchMetrics y SullyGnome, datos de YouTube y un archivo de clips y colaboraciones.

El problema principal no es la falta de contenido: es la **desigualdad de profundidad, frescura y verificabilidad entre los perfiles y las fuentes**.

Hallazgos de la revisión del 14/11/2026:

- `roster-data.json` contiene ocho perfiles; siete canales Twitch aparecen en el seguimiento activo. PATO — ORATORIS figura como colaborador y creador de video, no como streamer del roster.
- `data.json` declara siete canales esperados y resueltos, pero la última captura registrada (13/11/2026 21:22:55 UTC) tiene cero canales muestreados y siete omitidos. La ventana histórica conserva observaciones anteriores; el archivo no debe presentarse como una lectura actual recién tomada.
- El muestreo Helix está configurado con una cadencia objetivo de 55 minutos. Es telemetría propia y no analítica oficial del panel de creador. Sus promedios y picos son observaciones de las muestras, no audiencia única ni métricas completas de cada directo.
- Twitch Helix no proporciona los seguidores totales en estos registros; el valor está ausente. No debe completarse con cifras inferidas.
- `twitchmetrics-data.json` contiene referencias para dos canales, capturadas el 04/11/2026. Deben conservar su propia ventana y atribución; no se mezclan con Helix o SullyGnome.
- `sullygnome-data.json` fue generado el 03/11/2026. Hay perfiles parciales, pendientes y resúmenes aportados por el equipo. En HABITOS existen discrepancias documentadas entre el resumen y el desglose de categorías; esas cifras no deben convertirse en un gráfico comercial sin resolver o excluir la parte inconsistente.
- `platform-stats.json` contiene una captura de YouTube para PATO — ORATORIS: 56 suscriptores, 431 visualizaciones y 6 videos, con captura del 13/11/2026. Debe presentarse como ficha de YouTube y no compararse con espectadores de Twitch.
- El expediente individual MORIARTYS ya ofrece un recorrido de ocho páginas, pero su estructura no está generalizada con la misma profundidad para todos los creadores. El resto del Roster depende de datos y registros dispersos.
- Los clips y las colaboraciones existen en `creator-records.json`, pero la calidad editorial de los títulos y la disponibilidad de enlaces varía por integrante.

**Conclusión:** hoy podemos mostrar identidad, formatos, clips y una parte de la actividad histórica; todavía no podemos afirmar que todos los perfiles tienen un media kit estadístico completo y homogéneo. El rediseño debe hacer visible esa diferencia sin castigar a quienes tienen menos datos.

## 2. Arquitectura comercial recomendada

### A. Portada comercial de la Legión

Una presentación breve para marcas:

1. Qué es Legión Multiversal y qué tipo de experiencias produce.
2. Qué hace distinto al proyecto: creadores con identidad propia que pueden activar formatos individuales o colaborativos.
3. Capacidades demostrables: canales, plataformas, formatos, juegos, clips, campañas y experiencias documentadas.
4. Acceso directo a expedientes individuales y casos de colaboración.
5. Contacto comercial claro.

No publicar un único número de “audiencia total” sumando espectadores o seguidores de plataformas/canales distintos. No equivale a personas únicas y puede duplicar audiencias.

### B. Directorio del Roster

Mantener las cartas de cómic como puerta de entrada, pero sumar una lectura comercial breve y homogénea:

- Nombre / canal y plataforma.
- Rol dentro de la Legión (sin confundirlo con el personaje de ficción).
- Especialidad y formatos de contenido.
- Una línea de propuesta editorial.
- Estado de ficha: completa, parcial o en construcción.
- Acceso al expediente comercial.

No usar seguidores, espectadores o rangos como criterio de orden ni como jerarquía entre integrantes.

### C. Expediente comercial individual

Una plantilla compartida para cada streamer, adaptada a su identidad:

1. **Cabecera:** retrato, nombre del canal, plataforma, rol y propuesta de valor en una frase.
2. **Ficha rápida:** tipo de contenido, categorías, idioma/mercado cuando esté confirmado, formatos y enlaces oficiales.
3. **Indicadores destacados:** un máximo de cuatro o cinco métricas relevantes, cada una con fuente, período y fecha de captura visibles.
4. **Lectura de audiencia y actividad:** explicar qué demuestra la muestra y qué no permite concluir.
5. **Contenido y especialidades:** juegos/categorías con períodos comparables y contexto.
6. **Portfolio:** clips, VOD, videos y colaboraciones seleccionadas; títulos descriptivos y enlaces probados.
7. **Oportunidades para marcas:** integraciones, sesiones colaborativas, pruebas de juegos, dinámicas con comunidad, entrevistas o formatos educativos, únicamente cuando correspondan al perfil.
8. **Historial de colaboraciones y credenciales:** distinguir partner, campaña, acceso a clave, código de creador y colaboración editorial.
9. **Contacto / siguiente paso:** llamada a la acción comercial clara.
10. **Metodología desplegable:** fuentes, fechas, cobertura, limitaciones y definiciones.

La ausencia de métricas no debe producir un bloque vacío ni números ficticios. En ese caso, se prioriza el portfolio, los formatos y la propuesta del creador, y se etiqueta con honestidad qué información está pendiente.

### D. Bitácoras de actividad y campañas

Separar dos productos editoriales que hoy pueden confundirse:

- **Bitácora individual:** evolución y actividad de un creador, con fuente, período y metodología.
- **Expediente de colaboración:** una campaña o experiencia concreta, con participantes, objetivo, formato, calendario, piezas publicadas, resultados medidos y evidencia.

Cada caso debe distinguir resultados observados de objetivos o posibilidades. No atribuir ventas, conversiones, ROI, espectadores únicos ni impacto causal si no existe medición que lo respalde.

### E. Bitácora central

Su función es ser el índice narrativo del archivo y conducir a perfiles y casos. No debe repetir todas las tablas estadísticas de cada expediente. La Bitácora central cuenta la historia; el expediente individual demuestra el valor; el caso de colaboración prueba cómo se trabaja en conjunto.

## 3. Sistema de confianza de datos

Cada bloque estadístico debe registrar, como mínimo:

- `source`: fuente concreta.
- `captured_at`: cuándo se consultó.
- `period_start` y `period_end`: período real cubierto.
- `metric_scope`: canal, plataforma, sesión o muestra.
- `status`: estado de verificación.
- `methodology`: definición y forma de cálculo.
- `limitations`: restricciones relevantes.

Estados editoriales recomendados:

| Estado | Uso |
|---|---|
| Fuente oficial | Dato obtenido de API o panel oficial, con fecha y período |
| Fuente externa | Métrica pública de tercero, claramente atribuida |
| Muestreo propio | Observación Helix, sin presentarla como analítica oficial |
| Resumen aportado | Dato compartido por el creador/equipo, pendiente de contraste |
| Parcial | Existe información, pero faltan filas o cobertura |
| Histórico | Período cerrado o captura antigua; no representa el estado actual |
| Pendiente | Sin evidencia suficiente; se muestra como tal o se omite |

No combinar dos fuentes para fabricar un indicador más completo. Si dos fuentes discrepan, se muestran separadas o se retiene la cifra hasta resolver la diferencia.

## 4. Jerarquía visual: cómic retro profesional

La estética debe sentirse como una publicación editorial de colección, no como un panel de videojuego saturado.

- **Base:** fondos oscuros azul petróleo, superficies de archivo/papel cálido y tipografía de lectura limpia.
- **Acentos:** cian, dorado y rojo usados con moderación para estados, etiquetas y datos clave.
- **Cómic:** numeración de expediente, sellos, tramas de semitono, marcos y onomatopeyas puntuales; no colocar efectos detrás de tablas o textos largos.
- **Datos:** números grandes, etiquetas cortas, unidades claras, gráficos simples y comparaciones legibles.
- **Ritmo:** una idea principal por bloque; evitar repetir la misma métrica en tarjeta, tabla y texto.
- **Responsive:** en móvil, primero la conclusión y las métricas esenciales; las tablas extensas pasan a vistas resumidas o desplegables.
- **Accesibilidad:** contraste, foco visible, texto alternativo, movimiento reducido y no depender solo del color para comunicar estados.

## 5. Prioridad de implementación

### P0 — Integridad comercial y estadística
- Auditar y corregir frescura, cobertura y estados de las fuentes.
- Resolver discrepancias antes de publicar métricas.
- Normalizar fechas, períodos, definiciones y estados.
- No presentar el último archivo de Helix como captura fresca cuando no hubo muestras nuevas.
- Diferenciar claramente streamers, canal compartido y colaboradores de otras plataformas.

### P1 — Sistema de expedientes individual
- Diseñar una plantilla comercial común.
- Aplicarla a todos los perfiles streamer.
- Dar a cada integrante una propuesta de valor propia, no una biografía genérica.
- Integrar métricas solo donde estén respaldadas y clips/portfolio donde existan.

### P2 — Presentación colectiva
- Reorganizar el capítulo de Estadísticas como resumen ejecutivo + fichas por creador.
- Mostrar comparaciones solo dentro de la misma plataforma, período y metodología.
- Evitar ranking, leaderboard o sumas engañosas.
- Conectar cada tarjeta con su expediente.

### P3 — Bitácoras y casos
- Separar actividad individual de casos colaborativos.
- Mejorar tablas, visualizaciones, filtros y navegación.
- Documentar resultados y evidencias sin exagerar impacto.

### P4 — QA comercial y visual
- Revisar desktop, tablet y móvil.
- Comprobar enlaces, fuentes, estados vacíos y fallbacks.
- Medir accesibilidad y rendimiento.
- Validar que la estética de cómic no perjudique la lectura.

## 6. Criterios de aceptación

La etapa se considera lista cuando:

- Una marca puede entender la propuesta colectiva en menos de un minuto.
- Cada streamer tiene una ficha consistente, útil y fiel a su identidad.
- Toda cifra visible tiene fuente, período y fecha de captura accesibles.
- Las métricas ausentes o antiguas no se disfrazan de datos actuales.
- Las plataformas y unidades no comparables permanecen separadas.
- Los clips y casos tienen enlaces funcionales y contexto.
- La experiencia conserva el tono retro-comic sin sacrificar legibilidad, velocidad ni navegación móvil.
- Las pruebas automáticas y la revisión visual no detectan regresiones.

## 7. Salvaguardas de implementación

- Implementar en `auditoria-ux`.
- No modificar `main`, fusionar PRs ni publicar en producción sin autorización explícita.
- Mantener originales de imágenes y referencias hasta validar cualquier alternativa.
- No inventar métricas, alianzas, resultados, disponibilidad ni propuestas aceptadas.
- Registrar cambios y decisiones en `INFORMES.md`.
