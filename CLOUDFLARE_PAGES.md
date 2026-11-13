# Preparación para una futura publicación en Cloudflare Pages

**Estado:** guía preparada; el proyecto todavía no está conectado ni desplegado en Cloudflare Pages. GitHub Pages continúa siendo la publicación de referencia. Las funciones `/api/contact` y `/api/live` y el archivo `_headers` solo tendrán efecto al publicar con Cloudflare Pages.

## Configuración del proyecto

Cuando se conecte la cuenta de Cloudflare:

- **Proveedor:** GitHub.
- **Repositorio:** `losmoriartys-cmd/legion-multiversal`.
- **Rama de producción:** `main`.
- **Framework preset:** None / Ninguno.
- **Build command:** vacío (sitio estático, sin compilación).
- **Build output directory:** `.` (raíz del repositorio).
- **Root directory:** `/` (raíz del repositorio).
- **Variables de entorno:** para el sitio estático no hacen falta. Para activar las Pages Functions de contacto y En Vivo, configurar en Production/Preview: `RESEND_API_KEY` (secret), `RESEND_FROM` (remitente validado en Resend), `CONTACT_TO` (opcional; por defecto losmoriartys@gmail.com), `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` (secrets de Twitch). No almacenar valores en el repositorio.

No copiar secretos de GitHub Actions a Cloudflare automáticamente. Configurar por separado las credenciales que las Pages Functions necesitan: Resend para contacto y Twitch OAuth para Helix. Las credenciales de YouTube y Kick permanecen en GitHub Actions; los JSON públicos contienen únicamente resultados, nunca tokens ni claves.

## Riesgo que debe resolverse antes de activar producción

El workflow `.github/workflows/actualizar-stats.yml` consulta datos cada 15 minutos y puede crear commits que modifican `data.json` y `platform-stats.json`. Una integración Git directa de Pages puede intentar publicar un nuevo despliegue ante cada commit.

Antes de conectar el proyecto como publicación principal, elegir y probar una estrategia para actualizar los JSON sin generar despliegues innecesarios, pero sin dejar las estadísticas desactualizadas. No configurar exclusiones de `data.json` o `platform-stats.json` sin diseñar primero cómo llegará la última captura a los visitantes.

Hasta resolverlo, conservar GitHub Pages como sitio principal y usar Cloudflare solo como entorno de prueba.

## Secuencia de migración segura

1. Crear el proyecto Pages desde el repositorio indicado y aplicar los ajustes de la sección anterior.
2. Hacer el primer despliegue de prueba sin cambiar el dominio ni desactivar GitHub Pages.
3. Comprobar que se publican `index.html`, `styles.css`, `app.js`, `navigation-fix.js`, `roster-data.json`, los demás JSON y `assets/`.
4. Verificar HTTP 200 para los archivos principales y para una muestra de imágenes.
5. Ejecutar la prueba funcional completa: navegación de capítulos, ocho integrantes, expedientes, estadísticas, estado En Vivo, enlaces externos y vista móvil.
6. Comparar el contenido de ambas publicaciones y comprobar cómo se comporta una actualización automática de estadísticas.
7. Solo después de aprobar esas pruebas, decidir si Cloudflare Pages pasa a ser la publicación principal y configurar el dominio definitivo.

## Vuelta atrás

Mientras la migración no esté aprobada, GitHub Pages sigue activo y sirve como referencia y alternativa de recuperación. No borrar workflows, rutas ni archivos necesarios para la publicación actual durante la preparación.

## Criterio de finalización

La migración solo se considera terminada cuando existe un despliegue Cloudflare Pages accesible, se han completado las pruebas funcionales y se ha resuelto el impacto de las actualizaciones automáticas de datos. Crear este documento no equivale a haber conectado la cuenta ni a haber publicado el sitio en Cloudflare.
