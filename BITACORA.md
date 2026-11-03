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
