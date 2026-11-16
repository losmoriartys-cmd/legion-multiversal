# Analítica propia · Activación pendiente

La web todavía no incorpora una medición propia activa. No se añadió un ID ficticio ni se envían eventos a un proveedor sin configuración.

## Opción recomendada para Pages

Usar **Cloudflare Web Analytics** asociado al dominio público de producción. Es una integración de medición web que evita incorporar un SDK publicitario de terceros.

1. En Cloudflare, abrir **Analytics & Logs → Web Analytics**.
2. Agregar el hostname de producción que se confirme como canónico.
3. Copiar el token de beacon que entrega Cloudflare.
4. Incorporar el snippet oficial de Cloudflare Web Analytics al HTML de producción, usando exactamente el token emitido por la cuenta.
5. Verificar que las visitas de prueba aparezcan en el panel y que no se duplique el beacon entre dominios o previews.

## Privacidad y alcance

- Medir visitas y rendimiento del sitio, no perfiles individuales de visitantes.
- No enviar nombres, correos, formularios, IDs de creadores ni contenido privado como eventos.
- Publicar un aviso de medición y revisar las obligaciones de privacidad aplicables antes de activar.
- Excluir previews y entornos de prueba si no se desea mezclar sus visitas con producción.

## Estado

**Pendiente de configuración en la cuenta Cloudflare.** El repositorio no contiene token ni beacon activo. La integración se considera terminada solo después de verificar eventos reales en el panel de producción.
