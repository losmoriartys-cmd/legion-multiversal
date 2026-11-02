# LOS S3X-MEN — Plan técnico de evolución

## Estado de partida (02-11-2026)

- Repositorio: `losmoriartys-cmd/s3xmen`
- Sitio público: https://losmoriartys-cmd.github.io/s3xmen/
- Rama de trabajo: `command-center-3.0`
- Rama pública: `main` (sin modificar).
- La rama de trabajo se creó desde el HEAD actual de `main` para conservar los cambios visuales recientes.

## Hallazgo prioritario de auditoría

El `index.html` actual de `main` termina en mitad del cuarto botón de navegación (`CAP 4`), dentro del `<nav>`. El documento no contiene el resto del cuerpo, los capítulos, las fichas ni el cierre del HTML. El commit anterior completo (base `72e9ee1ee8`) conserva una versión funcional más extensa del sitio (45 KB aprox.).

**Acción requerida:** reconstruir la página sobre una copia de trabajo, preservando el diseño visual reciente y recuperando el contenido/funcionalidad válida de la última versión completa. No reemplazar `main` ni publicar hasta validar y recibir aprobación.

## Arquitectura objetivo

### Frontend público
- Mantener GitHub Pages como hosting estático.
- Separar estructura, estilos y lógica en archivos mantenibles.
- Conservar las ilustraciones y recursos originales del equipo.
- Incorporar progresivamente la navegación tipo cómic sin sacrificar accesibilidad ni responsive.

### Backend y autenticación
- Supabase Auth para el inicio de sesión OAuth de Twitch.
- Supabase Database para perfiles, conexiones, snapshots y métricas históricas.
- Secretos de Twitch y claves privadas únicamente en Supabase/server-side secrets; nunca en el repositorio ni en el navegador.
- Cada creador autoriza su propia cuenta; no se comparten contraseñas.

### Modelo de datos propuesto
- `creators`: identidad pública, slug, canal Twitch y datos de perfil.
- `twitch_connections`: referencia segura a la identidad autorizada y estado de conexión; tokens cifrados/gestionados solo en backend.
- `metric_snapshots`: valor, métrica, fuente, fecha de captura, período y creator_id.
- `game_activity`: juego/categoría, fuente, inicio/fin y período.
- `campaigns`: publisher, juego, estado, fechas, requisitos y enlaces.
- `applications`: postulaciones y estado de revisión, con acceso restringido.

## Reglas de integridad de datos

- No mostrar cifras inventadas ni métricas sin fuente y fecha.
- Separar datos actuales, históricos, estimaciones y datos no disponibles.
- No prometer que la API de Twitch expone métricas que no entrega directamente.
- Mostrar el período de cada KPI y la fecha de última sincronización.
- Mantener los perfiles públicos separados de los datos privados de autenticación.

## Fases

1. Recuperar y validar el HTML completo preservando el rediseño.
2. Separar frontend y módulos funcionales; corregir navegación, roster y perfiles.
3. Configurar Supabase (URL pública permitida, OAuth Twitch, esquema y políticas RLS).
4. Implementar conexión individual de Twitch y persistencia segura.
5. Crear sincronización de métricas con fuente, período y trazabilidad.
6. Implementar dashboard, campañas, programas, reclutamiento y herramientas internas.
7. Integrar la experiencia de cómic interactivo y optimizar móvil/accesibilidad.
8. Pruebas funcionales, seguridad y revisión final antes de publicar.

## Condiciones de publicación

- Todo desarrollo se realiza en `command-center-3.0`.
- No hacer merge ni modificar `main` sin aprobación explícita del responsable del proyecto.
- No incluir secretos, tokens ni credenciales en commits.
- No afirmar que una integración o prueba funciona hasta haberla ejecutado y verificado.
