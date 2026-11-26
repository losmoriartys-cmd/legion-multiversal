# Protección de la rama `main`

**Estado de última consulta (24/11/2026):** ruleset `PROTECCION-MAIN-LEGION`, ID `27883004`, activo sobre `~DEFAULT_BRANCH` (`main`). La respuesta REST más reciente ya no muestra bypass vacío: devuelve dos actores con `bypass_mode=always` (un rol de repositorio y una integración). El requisito de revisión de Code Owners sigue en `false`. Ver la sección «Observación 24/11»; no considerar la configuración lista para cierre.

## Configuración actualmente verificada

- Enforcement: `active`.
- Target: `~DEFAULT_BRANCH` = `main`; sin exclusiones.
- Bypass: consulta histórica del 23/11: `[]`; consulta actual del 24/11: `RepositoryRole` actor `5` y `Integration` actor `1143301`, ambos `always`. Identidad/alcance de la integración pendiente de verificar.
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

Valores actuales: `enforcement=active`, `strict_required_status_checks_policy=true`, contextos requeridos `validar`, `python-tests`, `audit-public-links`; `bypass_actors` ya no está vacío y `require_code_owner_review=false`.

## Límites

La CI comprueba que los workflows y contextos existan, pero no puede activar reglas de GitHub. El permiso de administración no está disponible para esta integración. Tampoco se ha configurado todavía un backup independiente fuera de GitHub.


## Observación 24/11/2026 · discrepancia de bypass y Code Owners

La consulta actual de `GET /repos/losmoriartys-cmd/legion-multiversal/rulesets/27883004` devolvió:

- `enforcement=active`, target `~DEFAULT_BRANCH` (`main`).
- `bypass_actors`: `RepositoryRole` actor ID `5`, modo `always`; e `Integration` actor ID `1143301`, modo `always`.
- `current_user_can_bypass=always`.
- `require_code_owner_review=false`; aprobación general requerida: `1`; aprobación del último push: `true`.
- Checks estrictos: `validar`, `python-tests`, `audit-public-links`.

Esto contradice la consulta documentada el 23/11, que devolvió `bypass_actors=[]`. No se identifica aquí la integración 1143301 ni se presume que sea GitHub Actions. Debe verificarse expresamente en el panel de reglas antes de decidir si corresponde retirarla o limitarla.

La rama `main` actual es `7c73ef777c8576c99e0419c15f4192a42884e784`; el commit fue publicado por `github-actions[bot]` con mensaje de actualización automática de métricas. Esto demuestra que una actualización automatizada llegó a `main`, pero por sí solo no identifica qué actor o excepción del ruleset permitió el push.

El archivo raíz `CODEOWNERS` no existe en `main` (la consulta de contenido devolvió 404); está incluido en la rama de este PR. Por eso, además de activar `require_code_owner_review=true` cuando corresponda, primero debe integrarse un archivo CODEOWNERS revisado y con responsables capaces de otorgar una aprobación independiente.

**Acción pendiente:** identificar la integración 1143301 y reconciliar la lista de bypass con la intención de protección; mantener fuera cualquier PAT de bypass como `COLLECTOR_PUSH_TOKEN`; integrar CODEOWNERS mediante el proceso de revisión; activar y verificar la regla de Code Owners. No se modificó el ruleset ni `main` durante esta auditoría.


## Actualización de referencia · 25/11/2026

- `main` actual consultado: `b114781c21489ea0864ce2fd9cde2bcb42113b9c`; es descendiente directo de la base acordada `0a8287d24b78c4a24e56d18484ff49522158149c` y contiene cuatro commits posteriores, con cambios de árbol limitados a `creator-metrics.json`, `data.json` y `platform-stats.json`.
- El ruleset sigue activo y requiere `validar`, `python-tests` y `audit-public-links`, con checks estrictos, una aprobación, aprobación del último push y resolución de conversaciones.
- Bypass vigente: `RepositoryRole` ID `5` e `Integration` ID `1143301`, ambos `always`. La identidad/alcance de la integración no se presume.
- `require_code_owner_review=false`. El archivo CODEOWNERS no sustituye esa configuración administrativa.
- No se modificó el ruleset ni `main` como parte de esta reconciliación.


## Auditoría de solo lectura · 25/11/2026 · estado posterior a la reconciliación

- **Referencia examinada:** `main` = `805bef800ff1c953d8686319025e576ccf686da4`; ruleset `PROTECCION-MAIN-LEGION` ID `27883004`, enforcement `active`, condición `~DEFAULT_BRANCH`.
- **Revisión:** una aprobación obligatoria; descarte de aprobaciones obsoletas; aprobación del último push; resolución de hilos obligatoria. `require_code_owner_review=false`.
- **Checks estrictos:** `validar`, `python-tests`, `audit-public-links`. El job `python-tests` está presente en `.github/workflows/test-stats.yml`. `audit-public-links` se añadió en #109, no en main/#101; por eso #101 no genera ese contexto y queda pendiente para el gate.
- **CODEOWNERS:** no existe en main (consulta de contenido 404 y búsqueda en la rama predeterminada sin resultados). En #109 existe un archivo raíz con `* @losmoriartys-cmd`; el ruleset no exige Code Owner review y esa asignación no crea una aprobación independiente del autor/propietario.
- **Bypass:** `RepositoryRole` actor ID `5` corresponde al rol `admin` según la tabla de roles base del proveedor Terraform de GitHub; modo `always`. El actor `Integration` ID `1143301` también tiene `always`, pero su identidad no se pudo verificar y no se presume que sea GitHub Actions. La cuenta autenticada `losmoriartys-cmd` es la propietaria/admin del repositorio; la API reporta `current_user_can_bypass=always`.
- **Protección clásica:** `GET /branches/main/protection` devolvió 403 (`Resource not accessible by integration`). No se pudo auditar esa capa adicional.
- **Límite de modificación:** las acciones Git disponibles permiten leer reglasets, no actualizarlos; tampoco se concedió acceso al endpoint de protección clásica. No se efectuó ningún cambio administrativo.
- **Criterio pendiente:** identificar la integración 1143301; decidir si Admin debe conservar bypass `always` o limitarse a `pull_request`; definir un Code Owner con capacidad real de aprobar independientemente antes de activar `require_code_owner_review`; y asegurar que todos los PR puedan producir cada contexto de check exigido. La documentación de GitHub define `actor_id` y `bypass_mode`; la asignación `RepositoryRole` 5 = admin está documentada en [terraform-provider-github](https://github.com/integrations/terraform-provider-github/blob/main/docs/resources/repository_ruleset.md).
- **Conclusión:** ruleset activo pero no endurecido al nivel de Code Owners; bypass amplio y una integración sin identificar. La protección de main permanece bajo revisión, no aprobada para cierre.


---

## 2026-11-26 · Auditoría efectiva de reglas y Code Owners para BASE-04

### Estado observado en GitHub

- **Referencia:** main = 8f8a173341cb1a7dada1878f2a8506b1810a2d2a; ruleset PROTECCION-MAIN-LEGION, ID 27883004, enforcement active, target ~DEFAULT_BRANCH.
- **Reglas activas verificadas:** PR obligatorio, una aprobación, dismiss de aprobaciones obsoletas, aprobación del último push y resolución de hilos; checks estrictos validar, python-tests, audit-public-links.
- **Code Owner review:** require_code_owner_review=false. El CODEOWNERS actual contiene * @losmoriartys-cmd; es una asignación global, no una barrera efectiva mientras el ruleset no requiera esa revisión.
- **Bypass:** RepositoryRole actor ID 5, modo always; Integration actor ID 1143301, modo always, identidad todavía no verificada. La cuenta propietaria/admin conserva current_user_can_bypass=always.
- **Permisos de actores identificables:** losmoriartys-cmd = admin; claude = read; github-actions[bot] = none. La actividad accesible de los últimos commits tampoco identifica un segundo revisor humano con permiso de escritura.

### Resultado y acciones administrativas pendientes

No se activó require_code_owner_review ni se modificaron reglas de bypass. Con un único Code Owner humano con permiso de escritura, exigir Code Owner approval sin incorporar antes otro revisor independiente podría bloquear el flujo normal de PR. La asignación CODEOWNERS no se presenta como una aprobación independiente.

Pendiente de la cuenta admin del repositorio:
1. identificar y justificar la integración 1143301; retirar o limitar su bypass always si no es imprescindible;
2. decidir si el rol admin debe conservar bypass permanente o quedar limitado a los casos excepcionales documentados;
3. incorporar al menos un mantenedor humano adicional con permiso suficiente y asignación explícita en CODEOWNERS;
4. recién entonces activar require_code_owner_review=true y verificar el ruleset resultante con una lectura posterior.

La integración GitHub disponible en esta sesión permite leer el ruleset, pero no administrarlo; GET /branches/main/protection devolvió 403. No se efectuó ninguna modificación administrativa ni se infiere que la protección clásica esté configurada.

### Relación con la guardia de assets

El nuevo guard scripts/guard_approved_assets.py bloquea cambios accidentales a 42 assets curados mediante huellas y autorizaciones en dos fases; corre como parte de validar. Esta defensa de CI no elimina el bypass del ruleset: un actor con capacidad de administración podría cambiar los checks o la política, por lo que se documenta como defensa complementaria y no como seguridad absoluta.

El workflow independiente de Google Drive conserva evidencia histórica de roundtrip y de 14/14 JSON críticos, pero su activación automática en main, schedule, rotación y borrado no se consideran habilitados por esa evidencia histórica. Ninguna de esas funciones se activó como parte de esta fase.

