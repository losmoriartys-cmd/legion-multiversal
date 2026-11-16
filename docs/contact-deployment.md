# Configuración del canal de contacto

El endpoint público vive en `functions/api/contact.js` y se expone como `/api/contact`. La página **no** confirma un envío mientras falte cualquiera de las variables requeridas.

## Variables de Cloudflare Pages

Configurar en el proyecto Pages vinculado al repositorio, en **Settings → Variables and Secrets**. Para el despliegue público, establecerlas en el entorno **Production**.

| Variable | Tipo | Uso |
|---|---|---|
| `RESEND_API_KEY` | Secret | Clave de API de Resend |
| `TURNSTILE_SECRET_KEY` | Secret | Clave secreta del widget Turnstile |
| `TURNSTILE_SITE_KEY` | Variable pública | Clave de sitio de Turnstile |
| `CONTACT_TO` | Variable | Buzón que recibirá las consultas |
| `CONTACT_FROM` | Variable | Remitente verificado en Resend |

No guardar claves, tokens ni credenciales en Git. No usar una dirección remitente que el dominio de Resend no haya verificado.

## Preparación externa

1. Crear un widget de Cloudflare Turnstile para el hostname de producción y registrar su Site Key y Secret Key.
2. Verificar en Resend el dominio o identidad que se utilizará como remitente.
3. Crear la API Key de Resend y configurar el destinatario que administra el equipo.
4. Cargar las cinco variables en Cloudflare Pages Production. Mantener las claves secretas como **Secret**, no como variables públicas.
5. Ejecutar un nuevo deployment de producción para que Pages Functions reciba las variables.

## Comprobación

- `GET /api/contact` debe devolver `configured: true` y una `turnstileSiteKey` no nula. No devuelve secretos.
- Ambos formularios deben mostrar el desafío Turnstile antes de habilitar el botón.
- Enviar una presentación de prueba de cada tipo y comprobar la recepción en el buzón.
- Verificar que una solicitud sin token, con origen distinto o con campos obligatorios ausentes se rechace.
- Confirmar que el navegador solo muestre éxito cuando Resend haya aceptado la entrega.

Si falta configuración, el endpoint responde con error de servicio y el frontend mantiene el formulario deshabilitado. No se almacena la presentación en el navegador ni se simula una recepción.
