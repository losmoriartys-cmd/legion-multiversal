# Legión Multiversal — Proyecto web y automatizaciones

Repositorio de trabajo compartido: [losmoriartys-cmd/legion-multiversal](https://github.com/losmoriartys-cmd/legion-multiversal)  
Sitio accesible en GitHub Pages: [losmoriartys-cmd.github.io/legion-multiversal](https://losmoriartys-cmd.github.io/legion-multiversal/)  
Sitio accesible en Cloudflare Pages: [legion-multiversal.pages.dev](https://legion-multiversal.pages.dev/). La portada responde en ambos dominios y Cloudflare genera previews de los pull requests. La configuración exacta de la rama de producción y las variables de Pages Functions se mantiene como control operativo pendiente; ver [CLOUDFLARE_PAGES.md](./CLOUDFLARE_PAGES.md).

> **Fuente única de verdad:** el contenido vigente del repositorio y su historial de commits. Las conversaciones sirven para acordar y explicar el trabajo, pero una modificación solo se considera compartida cuando está registrada en GitHub.

## 1. Objetivo y alcance

Este repositorio reúne el sitio web, sus recursos visuales, los datos consumidos por la página y las automatizaciones asociadas (incluida la sincronización de estadísticas de Twitch).

El repositorio conserva antecedentes de la etapa S3X-MEN y registra también la evolución de identidad y contenidos. Antes de cambiar nombres, textos institucionales, estructura o identidad visual, confirmar cuál es la denominación aprobada para esa parte del proyecto. No eliminar referencias históricas sin acuerdo.

## 2. Roles de colaboración

Pueden intervenir distintos colaboradores humanos y automatizados. No se presupone que compartan memoria, conversaciones ni notificaciones entre sí.

Cada colaborador debe:
- consultar el estado actual de `main` antes de empezar;
- revisar los commits recientes y leer este archivo y el informe más reciente de `INFORMES.md`;
- identificar qué archivos piensa modificar;
- evitar reemplazar archivos completos basándose en copias locales antiguas;
- registrar sus cambios en un commit descriptivo y actualizar `INFORMES.md`.

## 3. Protocolo obligatorio

### Antes de empezar
1. Abrir [los commits recientes](https://github.com/losmoriartys-cmd/legion-multiversal/commits/main).
2. Revisar el último informe de [`INFORMES.md`](./INFORMES.md).
3. Consultar los archivos actuales de `main`; no asumir que una versión vista en una conversación sigue vigente.
4. Si hubo cambios recientes en un archivo que se va a tocar, integrarlos antes de editar.
5. Si hay cambios simultáneos o dudas sobre qué versión prevalece, detenerse y coordinar antes de sobrescribir.

### Durante el trabajo
- Hacer cambios acotados y relacionados con la tarea acordada.
- No borrar, renombrar ni reemplazar imágenes, datos, secciones o funcionalidades sin comprobar dependencias y contar con acuerdo.
- Mantener las rutas de recursos coherentes con la estructura real del repositorio.
- No inventar métricas, estados de despliegue ni validaciones.
- Proteger secretos, tokens, claves y credenciales: nunca subirlos al repositorio.

### Al terminar
1. Revisar el diff y confirmar que solo se modificaron los archivos previstos.
2. Crear un commit con un mensaje claro que describa el cambio.
3. Añadir una entrada a `INFORMES.md` con archivos, resumen, pruebas, pendientes, hash y enlace del commit.
4. Comprobar el estado de GitHub Actions / GitHub Pages cuando corresponda.
5. Informar al equipo qué quedó implementado, qué se validó y qué sigue pendiente.

## 4. Reglas para evitar conflictos

- `main` es la rama de referencia y la fuente publicada por GitHub Pages, salvo que el equipo acuerde otra estrategia.
- Antes de cada escritura, volver a comprobar que el archivo no cambió desde que se leyó.
- No hacer dos escrituras simultáneas sobre el mismo archivo.
- Si dos colaboradores necesitan editar el mismo archivo, coordinar el orden o trabajar en ramas separadas y revisar el merge.
- No usar un archivo local antiguo para reemplazar el archivo completo de `main`.
- Los commits automáticos (por ejemplo, actualización de `data.json`) también forman parte del historial y deben respetarse.
- Si se detecta una modificación inesperada, no revertirla automáticamente: identificar su origen y consultar.

## 5. Archivos y registros

| Recurso | Propósito |
|---|---|
| `index.html` | Estructura y contenido HTML del sitio. |
| `styles.css` | Hoja de estilos externa. |
| `app.js` | Lógica de presentación, navegación y expedientes. |
| `navigation-fix.js` | Respaldo de navegación por capítulos. |
| `roster-data.json` | Perfiles y datos editoriales de los ocho integrantes. |
| `assets/` | Imágenes y recursos visuales. Confirmar siempre nombres y rutas reales. |
| `data.json` | Seguimiento automático de actividad Twitch (Helix). No editar manualmente salvo corrección acordada. |
| `platform-registry.json` | Cuentas confirmadas por creador y plataforma (YouTube, Kick y futuras integraciones). |
| `platform-stats.json` | Datos automáticos de YouTube/Kick, separados por plataforma, fuente y captura. |
| `update_stats.py` | Colector Twitch Helix. |
| `update_platform_stats.py` | Colectores YouTube Data API v3 y Kick Developer Public API. |
| `creator-records.json` | Registros editoriales y trayectoria documentada por creador. |
| `sullygnome-data.json` / `twitchmetrics-data.json` | Referencias históricas de analítica externa, separadas de las APIs propias. |
| `INFORMES.md` | Bitácora vigente de intervenciones, validaciones y pendientes. |
| `scripts/validate_site.py` | Validación estática de rutas, recursos y datos. |
| `scripts/check_anchors.py` | Comprobación de anclas semánticas, alias de capítulos y enlaces internos. |
| `functions/api/contact.js` | Endpoint de contacto con Resend, honeypot y validación. |
| `functions/api/live.js` | Endpoint de estado en vivo mediante Twitch Helix. |
| `_headers` | Políticas de caché y robots para Cloudflare Pages. |
| `.github/workflows/validar-sitio.yml` | Validación automática de JavaScript, Pages Functions, JSON, rutas y anclas. |
| `CLOUDFLARE_PAGES.md` | Guía de preparación para una futura migración; no implica que esté desplegada. |
| `BITACORA.md` | Archivo histórico anterior a este protocolo. Se conserva como antecedente; no duplicar allí los nuevos informes. |
| `README.md` | Reglas de colaboración y guía de entrada al proyecto. |

La estructura puede evolucionar. Confirmar siempre el árbol actual del repositorio antes de asumir que un archivo o ruta existe.

## 6. Cómo informar una intervención

Usar esta plantilla en `INFORMES.md`:

- **Fecha y responsable:**
- **Objetivo:**
- **Archivos modificados:**
- **Implementado:**
- **Validaciones y resultados:**
- **Pendientes / riesgos:**
- **Commit:** hash y enlace.
- **Despliegue:** pendiente / exitoso / fallido; incluir enlace o ID verificable del workflow.

Distinguir claramente entre lo acordado, lo implementado y lo que todavía no se verificó.

## 7. Publicación y verificación

Un commit aceptado por GitHub no demuestra por sí solo que GitHub Pages haya terminado de desplegar ni que la página se vea correctamente.

Marcar el despliegue como **exitoso** solo después de comprobar el workflow correspondiente y, para cambios visuales o funcionales, revisar el sitio publicado. Si no se pudo comprobar, dejarlo como **pendiente de verificación**.

## 8. Regla final

**Primero leer, después modificar, luego registrar y finalmente verificar.** Ningún colaborador debe dar por hecho que otro conoce sus cambios si no quedaron reflejados en GitHub y documentados en el informe.


## 9. Estadísticas multiplataforma

El sistema admite creadores de directo y de video sin exigir una cuenta Twitch. Las métricas se conservan por plataforma; **no se suman seguidores, vistas, horas ni espectadores entre servicios**.

- Twitch: `update_stats.py` → `data.json`.
- YouTube y Kick: `update_platform_stats.py` → `platform-stats.json`.
- Cuentas confirmadas: `platform-registry.json`. Para sumar un creador, agregar una clave estable y una entrada por plataforma con `platform` y `handle`. En Kick se usa el slug del canal; en YouTube se admite el handle `@...`.
- Los perfiles que solo usan Kick o YouTube pueden formar parte del roster aunque no tengan Twitch. No crear identificadores ni handles por inferencia.

### Secretos necesarios

En GitHub → Settings → Secrets and variables → Actions:

- `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` (ya utilizados por el colector Twitch).
- `YOUTUBE_API_KEY` (proyecto con YouTube Data API v3 habilitada).
- `KICK_CLIENT_ID` y `KICK_CLIENT_SECRET` (aplicación registrada en Kick Developer).

Nunca guardar claves o tokens en JSON, código, informes o commits. Si una credencial no está configurada, el colector debe dejar constancia del estado pendiente en vez de inventar métricas.

### Funciones de Cloudflare Pages: contacto y En Vivo

Las rutas `functions/api/contact.js` y `functions/api/live.js` requieren Cloudflare Pages Functions. **No se ejecutan en GitHub Pages**: mientras GitHub Pages siga siendo la publicación activa, los formularios ofrecen fallback a `mailto:` y En Vivo utiliza `data.json` con la antigüedad de la captura.

En Cloudflare Pages → Settings → Variables and Secrets → Production (y Preview si corresponde), configurar:

- `RESEND_API_KEY` (secret): clave privada de Resend.
- `RESEND_FROM` (variable): remitente validado en Resend; usar el formato admitido por la cuenta y el dominio verificado.
- `CONTACT_TO` (opcional): destinatario; por defecto `losmoriartys@gmail.com`.
- `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` (secrets): credenciales de aplicación Twitch para OAuth Client Credentials y Helix.

No reutilizar automáticamente secretos de GitHub Actions ni incluirlos en el repositorio. Sin estas variables, la función de contacto devuelve un estado de configuración pendiente y el cliente habilita el fallback; la consulta Helix falla de forma controlada y el cliente recupera `data.json`. El archivo `_headers` también es una configuración específica de Cloudflare Pages.

### Alcance actual y límites

- YouTube: estadísticas públicas acumuladas del canal y hasta diez videos recientes. No equivale a Analytics privado del creador.
- Kick: estado actual, espectadores, categoría y título de la transmisión. No reconstruye estadísticas históricas ni sustituye el panel de creador.
- Twitch Helix: actividad pública observada. Las analíticas privadas e históricas del Creator Dashboard requieren autorización del creador o datos aportados por él.
- SullyGnome y TwitchMetrics siguen como referencias históricas separadas; no se mezclan con APIs oficiales.

