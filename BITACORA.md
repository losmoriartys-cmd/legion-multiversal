# Bitácora de intervenciones — Legión Multiversal

Este archivo registra cada intervención relevante realizada en el repositorio. Al cerrar cada tarea se debe actualizar con los archivos modificados, el resumen de cambios, las validaciones realizadas y lo que queda pendiente.

## Plantilla para próximas intervenciones

### [AAAA-MM-DD] — [Título de la intervención]
- **Archivos modificados:**
- **Cambios realizados:**
- **Validaciones:**
- **Pendientes / riesgos:**
- **Commit:**
- **Despliegue:** pendiente / exitoso / fallido (incluir enlace o ID del workflow).

---

## 2026-11-03 — Rebranding narrativo del Capítulo 01

- **Archivos modificados:**
  - `index.html`
  - `BITACORA.md` (este registro).
- **Cambios realizados:**
  - Se actualizó el título y la cabecera pública a **Legión Multiversal**.
  - Se incorporó el lema **“Diferentes mundos. Una misma Legión.”**
  - Se reescribió el Capítulo 01 como historia de origen: Demian y ROD3R1K en Marvel Rivals; incorporación de Akuma; expansión a Fortnite con ElGabii y Capy; evolución hacia una comunidad de creadores; llegada de colaboradores; incorporación de Lady Moriarty y Dave.
  - Se integraron en la historia imágenes ya existentes del porfolio: Los Moriartys, ROD3R1K, Akuma, ElGabii, Capy, Lady Moriarty, ArDipii, Hábitos Atómicos y Pato — Oratoris.
  - Se conservó el banner grupal original como pieza de archivo de la etapa S3X-MEN.
  - Se mantuvieron las tres dimensiones de la comunidad: gaming y entretenimiento, conocimiento y tecnología, y desarrollo personal.
  - No se rediseñaron ni reemplazaron las ilustraciones individuales existentes.
- **Validaciones:**
  - Se verificó que las rutas de las imágenes utilizadas existen en el repositorio.
  - Se verificó que la edición se realizó sobre `main` y que GitHub aceptó el commit.
  - El despliegue de GitHub Pages debe verificarse después de esta actualización.
- **Pendientes / riesgos:**
  - Revisar visualmente el Capítulo 01 en escritorio y móvil.
  - Confirmar que la cronología y las descripciones de cada incorporación estén aprobadas por el equipo.
  - Diseñar e incorporar el emblema definitivo de Legión Multiversal cuando esté aprobado.
  - Actualizar progresivamente el resto de la navegación, capítulos, metadatos y textos que todavía mencionen S3X-MEN o Instituto cuando corresponda, sin borrar el valor histórico de la primera etapa.
  - La disponibilidad legal/comercial del nombre y de los perfiles sociales debe verificarse antes de su uso comercial.
- **Commit:** `af16ccb53e328f19a27d2628e76d7fbcef8e6c1c`
- **Despliegue:** pendiente de verificación en GitHub Actions.


## 2026-11-03 — Primera propuesta visual de Legión Multiversal en la web

- **Archivos modificados:**
  - `index.html`
  - `BITACORA.md` (este registro).
- **Cambios realizados:**
  - Se incorporó en la cabecera un emblema geométrico provisional con una M central y un anillo orbital, construido en CSS para que pueda revisarse directamente en la web.
  - Se actualizó el título del roster a **Legión Multiversal — Nuestro roster** y se reemplazó parte del lenguaje institucional antiguo por lenguaje de comunidad.
  - Se añadieron cuatro siluetas neutrales como espacios reservados para futuras incorporaciones, identificadas explícitamente como no confirmadas.
  - Se retiró de la galería del Capítulo 01 la referencia a una imagen de Pato que no existe actualmente en `assets/`; su ficha de colaborador permanece en el roster.
  - Se mantuvieron los retratos originales de los personajes ya disponibles. No se generaron ni sustituyeron ilustraciones.
- **Validaciones:**
  - Se comprobó que las rutas de los retratos conservados apuntan a recursos existentes del repositorio.
  - GitHub aceptó la actualización en `main`.
  - Despliegue pendiente de comprobar.
- **Pendientes / riesgos:**
  - El emblema es una primera propuesta web y debe recibir comentarios antes de considerarse definitivo.
  - Las cuatro siluetas son marcadores visuales, no integrantes anunciados.
  - La imagen individual de Pato — Oratoris no está en `assets/`; agregarla solo cuando el equipo la proporcione y apruebe.
  - Revisar el resultado responsive y continuar la actualización de textos antiguos en los capítulos restantes.
- **Commit:** `159c877e43ed1f75e69bdacaa3155e3303844dc8`
- **Despliegue:** pendiente de verificación en GitHub Actions.


## 2026-11-03 — Conexión del panel web con la automatización Twitch

- **Archivos modificados:**
  - `index.html`
  - `BITACORA.md` (este registro).
- **Cambios realizados:**
  - Se corrigió la discrepancia entre la automatización, que publica `data.json`, y la web, que todavía intentaba leer `stats-data.json`.
  - El Capítulo 03 ahora consume el esquema vigente de Twitch Helix: canales, estado en directo, espectadores actuales, categoría, muestras, promedio/pico observados y horas calculadas a partir de muestras consecutivas.
  - Las fichas individuales del roster consultan el mismo archivo y muestran el período real de hasta 10 días, la frecuencia programada de 15 minutos y las limitaciones de cada dato.
  - El panel de Partners deja de presentar seguidores y promedios oficiales como si estuvieran disponibles; distingue las muestras internas de las métricas oficiales de Creator Dashboard.
  - Se mantiene YouTube/Pato separado del conjunto Twitch.
- **Validaciones:**
  - Se confirmó que `data.json` existe en `main`, contiene 9 canales y declara `window_days: 10` y `sampling_interval_minutes: 15`.
  - Se confirmó que `stats-data.json` y `sullygnome-data.json` no existen en `main`; por eso se eliminó la dependencia del primero para los paneles Twitch.
  - GitHub aceptó la actualización de `index.html`.
  - Pendiente comprobar el despliegue de GitHub Pages y la visualización final en escritorio/móvil.
- **Pendientes / riesgos:**
  - El muestreo recién comienza: los promedios, picos y horas observadas pueden permanecer vacíos hasta que haya directos registrados.
  - Seguidores y analíticas oficiales requieren permisos/reportes adicionales; no se deben completar por inferencia.
  - Revisar visualmente el Capítulo 03 y las fichas individuales tras el despliegue.
- **Commit:** `98d7cea54d23b35113659686a6921532636a9627`
- **Despliegue:** pendiente de verificación en GitHub Actions / GitHub Pages.

### Informe breve para cada intervención futura

Al finalizar cada cambio, registrar: archivos tocados; qué se modificó y por qué; validaciones ejecutadas y resultado; pendientes/riesgos; hash del commit; estado y enlace/ID del despliegue. Diferenciar siempre lo acordado, lo implementado y lo pendiente.
