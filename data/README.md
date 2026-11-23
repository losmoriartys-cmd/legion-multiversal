# Datos canónicos de Legión Multiversal

Esta carpeta contiene los registros maestros editables. Cada entidad tiene una única fuente de autoría; no se crean archivos paralelos que dupliquen relaciones ya incluidas en un registro canónico.

## Fuentes canónicas

- **`roster.json`**: identidad estable de los ocho perfiles, nombres y alias, personas representadas, cuentas, redes directas, enlaces complementarios y horarios declarados. El horario es una referencia editorial del titular, no una medición de actividad ni una promesa de disponibilidad.
- **`games.json`**: catálogo maestro de juegos; cada sesión BIT guarda su fecha/fuente, participantes y POV/VOD. `EXP-###` identifica expedientes comerciales de juegos; `BIT-###` identifica sesiones documentadas. Son espacios distintos.
- **`creator-records.json`**: hitos, colaboraciones, destacados y resultados editoriales vinculados a perfiles por ID canónico.

## Datos generados y registros auxiliares

Los feeds y snapshots automáticos permanecen en sus rutas actuales mientras los colectores y consumidores dependan de ellas. No son fuentes de identidad ni deben editarse manualmente:

- `../data.json`: actividad y muestreo público de Twitch, incluidos canales archivados.
- `../platform-stats.json`: capturas separadas por plataforma externa (por ejemplo, YouTube); no se agregan ni comparan directamente con métricas Twitch.
- `../clips-data.json`: clips públicos de cuentas Twitch; no se exige que un perfil sin cuenta Twitch tenga clips.
- `../creator-metrics.json`: salida normalizada derivada de las fuentes anteriores y del roster.
- `../creator-programs.json` y `../community-playbook.json`: registros auxiliares del programa de creadores y de la experiencia de Comunidad, validados por sus esquemas propios.
- `../platform-registry.json`: archivo obsoleto, reemplazado por `roster.json`; se conserva solo como marcador de compatibilidad.

Los snapshots externos de proveedores y noticias conservan su propio ciclo de actualización y su procedencia separada. `news-data.json`, `sullygnome-data.json` y `twitchmetrics-data.json` también tienen esquemas propios y comprobación de referencias a URLs; sus métricas no se fusionan con los muestreos Twitch Helix ni entre proveedores.

## Contratos

Los esquemas están en `../schemas/`. La validación integral se ejecuta con `../scripts/validate_data_contracts.py`; combina JSON Schema Draft 2020-12 con los validadores semánticos existentes para claves, IDs, vínculos entre documentos y procedencia. Se ejecuta en los workflows de CI y debe terminar correctamente antes del merge.

## Reglas de autoría

1. Usar IDs estables para las relaciones; nunca vincular perfiles por el nombre visible.
2. Representar los datos desconocidos como `null` solo cuando el contrato del campo lo permita. No inventar fechas, fuentes, métricas, participantes ni enlaces.
3. Mantener horarios declarados separados de actividad medida y separar métricas por plataforma.
4. Las sesiones BIT y sus POV/VOD se registran dentro del juego correspondiente; los enlaces y horarios dentro del perfil. No crear `schedules.json`, `links.json` ni `sessions.json` paralelos.
5. Toda modificación debe actualizar datos, esquemas, consumidores, validadores y pruebas en el mismo PR.
6. No mover ni editar snapshots generados como si fueran datos editoriales.
