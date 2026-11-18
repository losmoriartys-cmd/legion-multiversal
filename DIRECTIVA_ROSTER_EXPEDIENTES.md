# Directiva de diseño obligatoria — Roster y expedientes de streamer
**Legión Multiversal · Aprobada por el usuario · 18 de noviembre de 2026**
**Referencia visual obligatoria:** la tercera captura compartida por el usuario, el modelo de expediente de Pato / Oratoris.

> Esta directiva expresa criterio aprobado por el usuario y debe respetarse estrictamente. No es una lista de ideas opcionales. Antes de cambiar, diseñar, probar o revisar los perfiles, leer este documento. Si una implementación o propuesta contradice estos criterios, se considera incorrecta aunque pase CI. No reinterpretar, omitir ni revertir estos requisitos sin autorización explícita del usuario.

## 1. Objetivo y modelo visual
Replicar la distribución de la referencia Pato / Oratoris: un expediente editorial tipo superhéroe/cómic llevado al streaming. No basta con inspirarse en los colores: respetar la distribución, jerarquía y organización de paneles.

- Columna izquierda fija/estable de identidad y acciones.
- Columna derecha de contenido, con cabecera y capítulos arriba, y el capítulo elegido debajo.
- En móvil, adaptar a una columna sin perder orden, acceso ni legibilidad.
- Mantener identidad retro/cómic de Legión, sin convertir el expediente en dashboard corporativo genérico.

## 2. Columna izquierda
Orden esperado:
1. Carnet/retrato de perfil para identificar al streamer.
2. Frase/voz del creador en panel breve, no repetitiva.
3. Botones independientes por red social/plataforma, con nombre/icono de plataforma y URL real.
4. Acceso a la carta/personaje, debajo del carnet y dentro de esta columna; no colocarla como imagen enorme en el contenido principal.
5. Volver al roster.

No inventar cuentas ni URLs. Cuando un destino no esté disponible, omitirlo o indicarlo de forma discreta; nunca fabricar botones sin destino. Las redes deben ser botones individuales y reconocibles.

## 3. Cabecera exterior del expediente
La ruta (LEGIÓN › ROSTER › NOMBRE), ritmo, estado live/offline/no disponible y enlace «VER CANAL» pertenecen a una cabecera global del expediente. Deben estar por encima de los capítulos y no dentro de la Bitácora ni repetidos en cada capítulo. Los estados deben distinguir datos frescos de datos desconocidos/vencidos.

## 4. Capítulos y navegación
Los capítulos deben ubicarse arriba del contenido principal, inmediatamente debajo de la cabecera global, en la distribución de la referencia. Deben mantenerse accesibles y claros al navegar.

- Perfil
- Estadísticas
- Clips
- Bitácora

No mantener una pestaña independiente «Juegos y ritmo» si duplica Perfil: unificar la información pertinente en Perfil. La barra de poderes/atributos tipo videojuego no es requisito y no debe añadirse por defecto.

## 5. Fotografía de cuerpo entero y arte
Las fotografías de cuerpo entero que hoy aparecen en el centro y dominan el ancho/alto de la Bitácora deben retirarse de esa posición en los ocho perfiles. No deben repetirse ni convertirse en una gran pantalla que tape los capítulos o su contenido.

Si se reutiliza foto de cuerpo entero, debe ser un recurso interno/contextual, de tamaño contenido, dentro de un panel o capítulo que lo necesite y con intención editorial; no como imagen gigante por defecto ni sustituto de contenido. La foto carnet/portrait de la columna izquierda identifica al streamer; evitar repetir esa misma foto sin propósito.

La carta/arte de personaje debe tener acceso desde debajo del retrato en la columna izquierda, junto a la zona de redes. No hacer que la carta o foto de cuerpo entero desplacen el expediente principal.

## 6. Perfil: juegos y ritmo
- Los juegos que aparecen como «últimos jugados» o detectados recientemente son actividad reciente, no «los más jugados».
- El dato «mejor juego» o juegos más jugados debe provenir de historial acumulado y evidencia apropiada; no inferir ranking a partir de sesiones recientes.
- Unificar juegos y ritmo en Perfil sin duplicar módulos ni pestañas.
- Puede añadirse una tabla de horas/juegos si existen duraciones fiables. No inventar horas ni extrapolar duración a partir de muestras de categoría.

## 7. Estadísticas — ampliar y mantener actualizadas
La pestaña Estadísticas actualmente es insuficiente. Debe aprovechar la información ya recopilada desde distintas plataformas para mantener el expediente lo más actualizado posible, de forma transparente y verificable.

Evaluar e integrar, cuando exista fuente:
- Seguidores/suscriptores por plataforma.
- Vistas y rendimiento de contenido cuando la fuente lo entregue.
- Directos observados, sesiones, horas transmitidas (solo si duración fiable).
- Promedio y pico de audiencia observada, diferenciando muestra/ventana de analítica oficial.
- Juegos/categorías y distribución de actividad.
- Comparación temporal (semana/mes) si hay históricos compatibles.
- Tendencias, historial y cobertura de fuentes.
- Fecha de última captura, período, método, frescura, errores y campos ausentes.

Separar Twitch, YouTube y demás plataformas. No sumar métricas de plataformas como unidades equivalentes/personas únicas. No presentar capturas públicas/sampling como analítica oficial. No rellenar vacíos con cero ni estimaciones. Mostrar fuente y período; distinguir capturas observadas, dato aportado, dato oficial/API y estimación (esta última no usar como cifra publicable sin aprobación).

## 8. Clips
Mostrar máximo **4 clips por streamer** en la vista principal del capítulo Clips para evitar sobrecarga. Preferir miniaturas optimizadas y carga diferida; no cargar reproductores pesados automáticamente. Si la evidencia de rendimiento confirma que una lista mayor no perjudica, puede estudiarse a futuro, pero el valor por defecto y criterio editorial es cuatro.

## 9. Bitácora — un solo relato comercial/editorial
Evitar duplicación de «Propuesta editorial», «Lectura rápida para marcas», «Ficha ejecutiva» y bloques equivalentes que repitan bio, territorios, formatos, oportunidades y presencia digital con estilos/colores diferentes.

Consolidar en una única sección editorial clara que incluya, según datos del integrante:
- Identidad y trayectoria.
- Territorios/especialidades de contenido.
- Formatos y oportunidades potenciales (etiquetados como propuestas, no campañas).
- Colaboraciones/alianzas documentadas y estado.
- Accesos a programas/plataformas para keys/promoción cuando proceda.
- Código Epic de creador para integrantes aplicables.
- Evidencias/material registrado solo si agrega valor, con conteos que expliquen qué miden.

Retirar encabezados, bloques, galerías o elementos denominados «Muestras» en los capítulos de Bitácora. No mostrar la cantidad de muestras como relleno comercial. No duplicar el contenido de Perfil en Bitácora ni presentar el mismo argumento en una segunda ficha de otro color.

## 10. Epic, Lurkit y Keymailer
- Registrar el código Epic de **Los Moriartys** y **ROD3R1K** en sus Bitácoras correspondientes, con destino oficial, copia si funcional, y estado de verificación basado en fuente.
- Mostrar acceso/participación de **Lady Moriarty, ROD3R1K, Akuma y Hábitos** a **Lurkit y Keymailer** cuando esté documentado. Distinguir claramente acceso, keys recibidas, campañas, publicidad o partnership: no insinuar sponsorship o campaña activa si solo hay acceso/plataforma.
- Los bloques de acceso deben ser pequeños y funcionales, no duplicar la narrativa comercial.

## 11. Criterio de calidad y aceptación
No considerar la implementación terminada por tests verdes solamente. Revisar los ocho perfiles y confirmar:

- [ ] La distribución corresponde a la referencia Pato/Oratoris: columna izquierda + derecha; navegación arriba del contenido.
- [ ] Cabecera global (ruta, ritmo, live/estado, canal) está fuera de capítulos y no se duplica.
- [ ] Las pestañas están arriba y el contenido del capítulo debajo.
- [ ] No hay imagen full-body gigante ni repetición innecesaria de retrato.
- [ ] Carta de personaje accesible debajo del carnet, en la columna izquierda.
- [ ] Redes sociales son botones individuales, con enlaces válidos.
- [ ] Perfil integra juegos y ritmo; sin pestaña duplicada.
- [ ] «Últimos juegos» y «más jugados» se distinguen y tienen fuente correcta.
- [ ] Estadísticas ampliadas, separadas por plataforma, con fuente, ventana y fecha.
- [ ] Clips muestra máximo 4 por perfil y carga optimizada.
- [ ] Bitácora no repite ficha comercial; se retiraron los bloques «Muestras».
- [ ] Epic code aparece en Moriartys y ROD3R1K y no se inventa verificación.
- [ ] Lurkit/Keymailer aparece en los cuatro integrantes especificados, solo con evidencia y tipo de vínculo correcto.
- [ ] Escritorio, móvil, teclado, historial atrás/adelante, navegación entre perfiles y los ocho expedientes probados.
- [ ] Revisar encuadre/rostros y evitar fotos repetidas o cortadas.
- [ ] Verificar visualmente en preview desplegada correspondiente al commit; no declarar producción si no se desplegó.
- [ ] Registrar evidencias, SHA, pruebas y pendientes en `INFORMES.md`.

## 12. Regla de cambios
Esta directiva solo puede modificarse con aprobación explícita del usuario. Si una limitación técnica impide cumplir un punto, reportarla, explicar alternativas y pedir decisión; no sustituir silenciosamente el criterio.
