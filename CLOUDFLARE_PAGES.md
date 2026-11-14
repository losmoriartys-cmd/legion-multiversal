# Publicación y migración segura · Cloudflare Pages

**Estado verificado: 13/11/2026.** La portada pública responde en:

- GitHub Pages: https://losmoriartys-cmd.github.io/legion-multiversal/
- Cloudflare Pages: https://legion-multiversal.pages.dev/

Ambos dominios devolvieron el contenido público del sitio en la última comprobación. Cloudflare también generó correctamente la preview del PR #46 (rama auditoria-ux): https://b399c4fd.legion-multiversal.pages.dev. Esto confirma que Cloudflare Pages está sirviendo el sitio y publicando previews; **no demuestra por sí solo cuál dominio debe considerarse único principal ni que todas las Pages Functions estén configuradas en producción**.

El HTML declara actualmente https://legion-multiversal.pages.dev/ como URL canónica. GitHub Pages permanece disponible como publicación alternativa. La confirmación de la configuración exacta de producción (rama, dominio y variables) sigue siendo un control operativo, no una razón para describir Cloudflare como inexistente.

## Pages Functions: estado y configuración

El repositorio incorpora:

- functions/api/live.js: consulta Twitch Helix en el servidor y devuelve la lista de canales. El cliente conserva data.json como respaldo.
- functions/api/contact.js: valida los formularios y envía las propuestas mediante Resend; si no se puede usar el endpoint, el cliente ofrece un enlace mailto:.
- _headers: cabeceras de caché y de indexación.

Estas funciones requieren Cloudflare Pages; no se ejecutan en GitHub Pages.

En la preview auditoria-ux, GET /api/live devolvió HTTP 503 durante la auditoría. En el código, ese estado corresponde a la ausencia de TWITCH_CLIENT_ID o TWITCH_CLIENT_SECRET en el entorno. No se debe resolver subiendo secretos al repositorio. Verificar en Cloudflare Pages → Settings → Variables and Secrets → Production y Preview:

- TWITCH_CLIENT_ID (secret o variable protegida).
- TWITCH_CLIENT_SECRET (secret).
- RESEND_API_KEY (secret).
- RESEND_FROM (remitente validado en Resend).
- CONTACT_TO (opcional; por defecto losmoriartys@gmail.com).

Las credenciales de YouTube y Kick permanecen en GitHub Actions; no trasladarlas a Pages si no existe una necesidad funcional demostrada.

## Actualización automática de estadísticas

El workflow .github/workflows/actualizar-stats.yml se programa cada 15 minutos y puede crear commits en data.json y platform-stats.json. La cadencia objetivo de las nuevas muestras Twitch es de aproximadamente 55 minutos, con anti-duplicados; no confundir el cron del workflow con la frecuencia real de muestras nuevas.

Antes de considerar cerrada la estrategia de publicación, comprobar en la configuración del proyecto si los commits automáticos disparan despliegues innecesarios. No excluir data.json ni platform-stats.json de los despliegues sin definir cómo se distribuirán las capturas actualizadas a los visitantes.

## Lista de verificación para cerrar la configuración

1. Confirmar en el panel de Cloudflare que la rama de producción esperada es main, el directorio de salida es la raíz del repositorio y el dominio canónico está asignado correctamente.
2. Confirmar las variables de entorno de Pages Functions sin copiarlas al repositorio.
3. Verificar que GET /api/live devuelve JSON con canales y una fecha de captura válida; si falla, comprobar que el frontend usa el respaldo data.json.
4. Probar el envío de contacto solo con una solicitud de prueba autorizada, después de verificar Resend y el remitente.
5. Comprobar cómo afectan los commits de estadísticas al despliegue y a la frescura de los JSON.
6. Revisar el sitio en escritorio y móvil, navegar con teclado y comprobar lector de pantalla, enlaces y reproductor.

## Vuelta atrás

Mientras se termina esa verificación, GitHub Pages continúa accesible como alternativa. No borrar workflows, rutas, archivos ni secretos necesarios para la publicación actual. No marcar la migración/configuración como cerrada hasta completar los controles anteriores.

**Criterio de cierre:** publicación accesible, rama y dominio de producción confirmados, Pages Functions configuradas, actualización de estadísticas sin regresiones y revisión funcional/visual aprobada.
