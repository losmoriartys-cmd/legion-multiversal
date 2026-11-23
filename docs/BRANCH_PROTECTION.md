# Protección de la rama `main`

**Estado verificado:** ruleset `PROTECCION-MAIN-LEGION`, ID `27883004`, activo sobre `~DEFAULT_BRANCH` (la rama predeterminada es `main`). La consulta REST confirmó bypass vacío, PR obligatorio, aprobación independiente, checks requeridos y rama actualizada antes de integrar.

## Configuración actualmente verificada

- Enforcement: `active`.
- Target: `~DEFAULT_BRANCH` = `main`; sin exclusiones.
- Bypass: `[]`.
- Pull request obligatorio con una aprobación.
- Aprobaciones obsoletas descartadas al recibir nuevos commits.
- Aprobación del último push por alguien distinto del autor.
- Conversaciones de revisión resueltas antes de integrar.
- Checks requeridos: `validar`, `python-tests`, `audit-public-links`.
- `strict_required_status_checks_policy: true`: la rama debe estar actualizada con la base.
- Eliminación y force-push bloqueados.

## Revisión de mantenedores (CODEOWNERS)

El archivo raíz `CODEOWNERS` asigna `* @losmoriartys-cmd`. La API de GitHub confirmó que `losmoriartys-cmd` tiene permiso `admin` en este repositorio. Los cambios de manifiesto, Roster, esquemas, colectores, workflows y código quedan asignados al propietario/mantenedor.

**Acción administrativa todavía necesaria:** editar el ruleset y activar **Require review from Code Owners**. Después consultar el ruleset y verificar que la regla `pull_request.parameters.require_code_owner_review` sea `true`. El archivo CODEOWNERS por sí solo no obliga a GitHub a bloquear el merge sin esa opción. La integración disponible permite leer rulesets, pero no administrarlos.

## Checks que mantienen estable la protección

- `validar`: validación de código/datos, contratos JSON Schema, integridad y Playwright.
- `python-tests`: suite del colector y contratos Python.
- `audit-public-links`: auditoría externa de enlaces públicos.
- Los tres deben ejecutarse en cada PR hacia `main`; no agregar filtros de rutas a esos eventos.

## Verificación reproducible

Ruleset: https://github.com/losmoriartys-cmd/legion-multiversal/rules/27883004

API: https://api.github.com/repos/losmoriartys-cmd/legion-multiversal/rulesets/27883004

Valores ya verificados: `enforcement=active`, `bypass_actors=[]`, `strict_required_status_checks_policy=true`, contextos requeridos `validar`, `python-tests`, `audit-public-links`.

## Límites

La CI comprueba que los workflows y contextos existan, pero no puede activar reglas de GitHub. El permiso de administración no está disponible para esta integración. Tampoco se ha configurado todavía un backup independiente fuera de GitHub.
