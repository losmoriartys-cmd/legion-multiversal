# Crecimiento: metodología, resultados y datos de audiencia autorizados

## Ventanas 7 / 30 / 90 días

El registro guarda hasta 180 días de observaciones Twitch y hasta 180 días de capturas diarias multiplataforma. Cada ventana compara el período actual con el período anterior de igual duración cuando ambas ventanas alcanzan al menos 65% de cobertura diaria.

**Twitch**
- Sesiones: IDs de directo distintos observados mediante Helix.
- Días activos: fechas UTC con al menos una observación de directo.
- Directos por semana: sesiones observadas divididas por la duración de la ventana expresada en semanas.
- Horas en directo observadas: suma de intervalos entre muestras consecutivas del mismo stream, solo cuando el salto es de 110 minutos o menos. No es duración oficial del VOD.
- Promedio y pico: observaciones públicas propias; no son CCV ni peak oficiales de Creator Dashboard.
- Seguidores ganados: diferencia entre dos capturas propias del total público. La serie comienza cuando se activa el OAuth de solo lectura.

**YouTube**
- Suscriptores, visualizaciones del canal y videos publicados: diferencia entre capturas públicas diarias.
- Rendimiento de videos: reproducciones, me gusta y comentarios públicos de hasta diez videos recientes.
- Tasa de interacción pública: (me gusta + comentarios) / visualizaciones. No equivale a la métrica privada de YouTube Studio.

**Cobertura**
Una ventana con menos de 65% de días muestreados se marca parcial y no se compara con el período anterior. Los valores disponibles pueden seguir mostrándose, pero el panel explica su cobertura. Los registros históricos comienzan a acumularse desde la activación del nuevo recolector; no se reconstruyen períodos anteriores.

## Rendimiento del contenido

- Twitch: hasta cinco clips entre los diez clips con mayor visualización devueltos por la API en la ventana de 30 días. Se archiva una observación diaria de visualizaciones durante un máximo de 180 días desde que cada clip aparece en la selección.
- YouTube: hasta cinco de los diez videos recientes devueltos por la API, con una observación diaria de visualizaciones, me gusta y comentarios.
- Las variaciones de 7/30/90 días se calculan desde la primera captura disponible dentro o antes del período. Si falta una base histórica, el panel dice "base pendiente" y no inventa un crecimiento.

## Colaboraciones y resultados

Los expedientes colaborativos se agrupan desde las entradas fechadas y enlazadas de Bitácora. Las relaciones con plataformas de distribución de claves o programas partner aparecen como vínculos documentados, no como campañas pagadas ni como patrocinios salvo que el registro lo acredite.

Los resultados de BarFender correspondientes al 11/11/2026 proceden de cifras del panel de Twitch aportadas al expediente. Se presentan por canal, con su fuente y condición de dato informado por el creador. **No se suman espectadores, chatters ni seguidores entre canales**, porque sus audiencias pueden solaparse y los contadores son independientes.

Para incorporar un nuevo resultado, usar `collaboration_results` dentro del canal correspondiente en `creator-records.json`. Cada resultado necesita fecha, caso, participantes, fuente, nivel de verificación y métricas con unidad. Valores `creator_reported` se muestran explícitamente como aportados por el creador.

## Audiencia avanzada y datos demográficos

No se consultan automáticamente métricas privadas, ingresos, espectadores únicos ni demografía. Solo se publican cuando el creador aporta un informe agregado y concede autorización explícita para publicación.

Plantilla opcional dentro del expediente del creador:

```json
{
  "audience_report": {
    "authorization": {
      "status": "granted",
      "public_display": true
    },
    "captured_at": "2026-12-01T12:00:00Z",
    "period": {
      "from": "2026-11-01T00:00:00Z",
      "to": "2026-11-30T23:59:59Z"
    },
    "source": "Panel de Twitch del creador · informe aportado",
    "metrics": [
      {
        "key": "unique_viewers",
        "label": "Espectadores únicos",
        "value": 250,
        "unit": "personas"
      }
    ],
    "breakdowns": [
      {
        "dimension": "age_range",
        "label": "18–24",
        "share_pct": 28,
        "sample_size": 25
      },
      {
        "dimension": "country",
        "label": "Argentina",
        "share_pct": 64,
        "sample_size": 25
      }
    ]
  }
}
```

Los desgloses admitidos son franjas de edad, región y país; solo se muestran con una base mínima de cinco observaciones. No incluir nombres, IDs, correos, capturas con información identificable ni segmentos pequeños. Para retirar el permiso se cambia `authorization.status` a `revoked` o `public_display` a `false`.

Este informe es opcional; la ausencia de autorización se muestra como "sin datos autorizados", nunca como cero.
