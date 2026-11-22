# Protección de la rama `main`

**Estado:** política documentada; la configuración del repositorio requiere permisos de administración de GitHub y todavía no está verificada desde la integración disponible.

## Regla requerida

Crear una regla de protección o ruleset dirigido a la rama exacta `main` con estas opciones:

- Exigir que los cambios lleguen mediante pull request.
- Exigir que todos los checks siguientes terminen correctamente:
  - `validar` — workflow **Validar código y datos del sitio**. Incluye JSON Schema, validación semántica, pruebas Python del sitio, Playwright y referencias.
  - `python-tests` — workflow **Validar colector de estadísticas**. Incluye pruebas unitarias, conservación de registros, coherencia de identidad y métricas.
  - `audit-public-links` — workflow **Auditoría externa de enlaces públicos**. Comprueba cuentas, enlaces, sesiones, VOD y clips.
- Exigir que la rama esté actualizada con `main` antes de integrar, para que no se aprueben contratos sobre una base antigua.
- Bloquear force-push y eliminación de `main`.
- Incluir administradores en la regla o impedir bypasses, salvo una excepción deliberada y registrada.

No exigir `Cloudflare Pages` como sustituto de estos tres checks: es el despliegue de preview y no valida por sí solo la integridad de los datos.

## Configuración en GitHub

1. Abrir **Settings → Rules → Rulesets** (o **Settings → Branches** si se usa protección clásica).
2. Crear una regla activa para `main`.
3. Habilitar **Require a pull request before merging**.
4. Habilitar **Require status checks to pass** y agregar exactamente `validar`, `python-tests` y `audit-public-links`.
5. Habilitar **Require branches to be up to date before merging**, bloquear force-push y eliminación, e incluir administradores.
6. Guardar y volver a consultar la configuración para verificar que los tres contextos quedaron seleccionados.

## Reglas de CI que mantienen estables los contextos

- `validar` se ejecuta en todo `pull_request` hacia `main` y por `push` únicamente en `main`.
- `python-tests` se ejecuta en todo `pull_request` hacia `main` y por `push` a `main` cuando cambian datos, scripts, tests o workflows.
- `audit-public-links` se ejecuta en todo `pull_request` hacia `main`, además del disparo manual y semanal. No usa filtro de rutas para que el contexto requerido siempre exista.
- No poner filtros de rutas en estos tres eventos `pull_request`: un PR que no coincida con el filtro podría dejar el check requerido pendiente y bloquear la integración.
- Los tests de política verifican que existan los tres jobs, que apunten a `main` y que no estén condicionados por filtros de rutas en PR. No pueden activar la protección de GitHub por sí mismos.

## Límite de permisos de esta automatización

La integración GitHub usada en este trabajo no tiene permiso para leer la protección clásica de ramas (respuesta 403) ni para administrar rulesets. La consulta GET de rulesets no encontró ninguno. Por tanto, no se debe declarar esta regla activa hasta que el administrador la configure en Settings y se pueda verificar el resultado.