# Publicación y dominios · Legión Multiversal

**Dominio canónico elegido:** https://legion-multiversal.pages.dev/  
**Rama de contenido:** `main`  
**Fecha de actualización documental:** 16/11/2026

## Estado comprobable desde el repositorio

- El dominio `legion-multiversal.pages.dev` es el destino público utilizado en la auditoría de producto entregada al equipo y se adopta como dominio canónico en `index.html`, Open Graph, Twitter Card, sitemap y robots.txt.
- GitHub Pages continúa publicando desde `main` como despliegue secundario. El último despliegue verificado antes de esta actualización corresponde a `6e083bf8568e054bdffd8c861a17b609af1f8082` y finalizó correctamente.
- La configuración y los secretos de Cloudflare Pages no son legibles desde la conexión GitHub disponible. El workflow Lighthouse se ha orientado a `https://legion-multiversal.pages.dev/` y espera el marcador `lm-source-revision` antes de medir; esto comprueba el contenido servido, pero no sustituye la verificación autenticada del deployment SHA en el panel/API de Cloudflare.
- Las claves de Twitch, YouTube y Kick permanecen en GitHub Actions; los JSON publicados contienen resultados públicos, no credenciales.

## Formularios y funciones de servidor

La web estática publicada por GitHub Pages no ejecuta Cloudflare Pages Functions. Un formulario con envío real requiere confirmar que el proyecto Cloudflare Pages está conectado al repositorio y configurar un proveedor de correo/transaccional con sus secretos en el entorno de Cloudflare. Hasta que eso exista, no se debe mostrar un formulario que prometa enviar ni confirmar solicitudes.

## Siguiente validación operativa

1. Confirmar en Cloudflare Pages que el proyecto `legion-multiversal` despliega la rama `main`.
2. Confirmar que el dominio `legion-multiversal.pages.dev` sirve el último SHA de `main`.
3. Probar las rutas `/marcas/`, `/recursos/` y `/metodologia/`.
4. Configurar un proveedor de correo, secretos y protección anti-spam antes de habilitar formularios.
5. Mantener GitHub Pages como despliegue alternativo mientras se completa la validación.

**Importante:** cambiar metadatos canónicos no prueba que Cloudflare esté actualizado. El dominio canónico se ha alineado con el destino público indicado en la auditoría; la sincronización efectiva del despliegue de Cloudflare sigue siendo una comprobación separada.
