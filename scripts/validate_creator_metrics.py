"""Validate normalized public metrics against roster account identities."""
from __future__ import annotations
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "creator-metrics.json"
ROSTER = ROOT / "roster-data.json"
ALLOWED_STATUS = {"fresh", "delayed", "unavailable", "offline", "sampled", "estimated", "verified_public"}
ALLOWED_VISIBILITY = {"public", "authorized", "editorial"}
FRESHNESS_MINUTES = {"twitch": 120, "youtube": 120, "kick": 120}
CLOCK_SKEW_MINUTES = 5
CURRENT_STATUSES = {"fresh", "offline", "sampled", "estimated", "verified_public"}


def parse_time(value):
    if value is None or not isinstance(value, str):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else None


def capture_status(platform, captured_at, now):
    captured = parse_time(captured_at)
    if captured is None or now is None or now.tzinfo is None:
        return "unavailable"
    age_minutes = (now - captured).total_seconds() / 60
    if age_minutes < -CLOCK_SKEW_MINUTES:
        return "unavailable"
    if age_minutes > FRESHNESS_MINUTES.get(platform, 120):
        return "delayed"
    return "fresh"


def validate(registry, roster, now=None):
    errors = []
    if registry.get("schema_version") != 2:
        errors.append("creator-metrics.json debe usar schema_version=2.")
    snapshot = registry.get("source_snapshot")
    required_sources = ("data.json", "platform-stats.json")
    if not isinstance(snapshot, dict):
        errors.append("source_snapshot debe ser un objeto.")
    else:
        for source_name in required_sources:
            entry = snapshot.get(source_name)
            if not isinstance(entry, dict) or parse_time(entry.get("updated_at")) is None:
                errors.append("{}: source_snapshot.updated_at debe ser ISO-8601 con zona horaria.".format(source_name))
    generated_at = parse_time(registry.get("generated_at"))
    if generated_at is None:
        errors.append("generated_at debe ser ISO-8601 con zona horaria.")
    reference_now = parse_time(now) if isinstance(now, str) else (now or generated_at)
    if reference_now is None or reference_now.tzinfo is None:
        errors.append("No se puede comprobar la frescura sin un reloj de referencia con zona horaria.")
    creators = registry.get("creators")
    if not isinstance(creators, dict):
        return errors + ["creators debe ser un objeto."]
    expected = {}
    for hero in roster.get("heroes", []):
        creator_id = hero.get("id") or hero.get("slug")
        expected[creator_id] = {
            "display_name": hero.get("display_name") or hero.get("name"),
            "accounts": {
                (account.get("platform"), account.get("handle") or account.get("login") or ""): account
                for account in hero.get("accounts") or []
            },
        }
    if set(creators) != set(expected):
        errors.append("Los IDs de creator-metrics.json no coinciden con roster-data.json.")
    for creator_id, record in creators.items():
        source = expected.get(creator_id)
        if source is None or not isinstance(record, dict):
            errors.append("{}: creador inesperado o expediente inválido.".format(creator_id))
            continue
        if record.get("display_name") != source["display_name"]:
            errors.append("{}: display_name no coincide con el registro canónico.".format(creator_id))
        accounts = record.get("accounts")
        if not isinstance(accounts, list):
            errors.append("{}: accounts debe ser una lista.".format(creator_id))
            accounts = []
        actual_accounts = set()
        for account in accounts:
            key = (account.get("platform"), account.get("handle"))
            if key not in source["accounts"]:
                errors.append("{}: cuenta fuera de roster-data.json: {}".format(creator_id, key))
            if key in actual_accounts:
                errors.append("{}: cuenta duplicada: {}".format(creator_id, key))
            actual_accounts.add(key)
            if account.get("account_ref") != "{}:{}".format(*key):
                errors.append("{}: account_ref no coincide con plataforma/handle.".format(creator_id))
        if actual_accounts != set(source["accounts"]):
            errors.append("{}: la lista de cuentas normalizadas no cubre todas las cuentas del roster.".format(creator_id))
        metrics = record.get("metrics")
        if not isinstance(metrics, list):
            errors.append("{}: metrics debe ser una lista.".format(creator_id))
            continue
        seen = set()
        for metric in metrics:
            if not isinstance(metric, dict):
                errors.append("{}: métrica inválida.".format(creator_id))
                continue
            metric_id = metric.get("metric_id")
            if not isinstance(metric_id, str) or not metric_id or metric_id in seen:
                errors.append("{}: metric_id vacío o duplicado.".format(creator_id))
            seen.add(metric_id)
            platform_handle = (metric.get("platform"), metric.get("account_handle"))
            if platform_handle not in source["accounts"]:
                errors.append("{}: métrica vinculada a cuenta inexistente {}.".format(creator_id, platform_handle))
            if metric.get("status") not in ALLOWED_STATUS:
                errors.append("{}: estado inválido en métrica {}.".format(creator_id, metric_id))
            if metric.get("visibility") not in ALLOWED_VISIBILITY:
                errors.append("{}: visibilidad inválida en métrica {}.".format(creator_id, metric_id))
            if metric.get("visibility") != "public":
                errors.append("{}: este registro público no debe incluir datos autorizados/editoriales mezclados.".format(creator_id))
            if not isinstance(metric.get("unit"), str) or not metric["unit"].strip():
                errors.append("{}: unidad vacía en métrica {}.".format(creator_id, metric_id))
            captured = metric.get("captured_at")
            captured_time = parse_time(captured)
            if captured is not None and captured_time is None:
                errors.append("{}: captured_at inválido en métrica {}.".format(creator_id, metric_id))
            if reference_now is not None:
                freshness = capture_status(metric.get("platform"), captured, reference_now)
                status = metric.get("status")
                if status in CURRENT_STATUSES and freshness != "fresh":
                    errors.append(
                        "{}: métrica {} marcada como {} pero su captura está {} respecto de generated_at."
                        .format(creator_id, metric_id, status, freshness)
                    )
                elif status == "delayed" and freshness != "delayed":
                    errors.append(
                        "{}: métrica {} marcada como delayed pero su captura está {} respecto de generated_at."
                        .format(creator_id, metric_id, freshness)
                    )
            period = metric.get("period") or {}
            for field in ("from", "to"):
                if period.get(field) is not None and parse_time(period[field]) is None:
                    errors.append("{}: period.{} inválido en métrica {}.".format(creator_id, field, metric_id))
            if metric.get("status") == "unavailable" and metric.get("value") is not None:
                errors.append("{}: una métrica no disponible no puede contener un valor.".format(creator_id))
            if metric.get("status") == "delayed" and not metric.get("interpretation"):
                errors.append("{}: una métrica demorada debe incluir interpretación temporal.".format(creator_id))
        # Every registered creator channel must have a normalized record for each core KPI.
        # Null values are allowed when the source genuinely has no observation, but the metric
        # must exist so the UI can explain the gap rather than silently omitting the profile.
        required_by_platform = {
            "twitch": {"live_status", "streams_observed", "average_viewers_sampled", "peak_viewers_sampled", "observed_live_hours"},
            "youtube": {"subscribers", "total_views", "videos_total"},
            "kick": {"live_status", "current_viewers"},
        }
        for account_key, account in source["accounts"].items():
            if account.get("account_type") != "creator_channel":
                continue
            required = required_by_platform.get(account_key[0])
            if not required:
                continue
            account_metrics = {
                metric.get("key")
                for metric in metrics
                if (metric.get("platform"), metric.get("account_handle")) == account_key
            }
            missing = sorted(required - account_metrics)
            if missing:
                errors.append("{}: faltan métricas normalizadas para {}: {}.".format(
                    creator_id, account_key[0], ", ".join(missing)
                ))

        growth = record.get("growth")
        if not isinstance(growth, dict) or growth.get("schema_version") != 1:
            errors.append("{}: growth debe ser un objeto schema_version=1.".format(creator_id))
        else:
            growth_platform = growth.get("platform")
            expected_windows = {"7d": 7, "30d": 30, "90d": 90} if growth_platform in {"twitch", "youtube"} else {}
            windows = growth.get("windows")
            if not isinstance(windows, dict):
                errors.append("{}: growth.windows debe ser un objeto.".format(creator_id))
                windows = {}
            for key, expected_days in expected_windows.items():
                item = windows.get(key)
                if not isinstance(item, dict) or item.get("days") != expected_days:
                    errors.append("{}: falta la ventana growth.{}.".format(creator_id, key))
                    continue
                coverage = item.get("coverage") or {}
                pct = coverage.get("coverage_pct")
                if not isinstance(pct, (int, float)) or isinstance(pct, bool) or not 0 <= pct <= 100:
                    errors.append("{}: growth.{}.coverage_pct fuera de rango.".format(creator_id, key))
                    pct = 0
                if coverage.get("status") not in {"sufficient", "partial"}:
                    errors.append("{}: growth.{}.coverage.status inválido.".format(creator_id, key))
                comparison = item.get("comparison") or {}
                previous_pct = (comparison.get("previous_coverage") or {}).get("coverage_pct", 0)
                if comparison.get("status") == "available" and (pct < 65 or not isinstance(previous_pct, (int, float)) or previous_pct < 65):
                    errors.append("{}: growth.{} compara períodos sin cobertura mínima.".format(creator_id, key))
            content_performance = growth.get("content_performance") or {}
            for list_name in ("top_clips", "videos"):
                rows = content_performance.get(list_name, [])
                if not isinstance(rows, list) or len(rows) > 5:
                    errors.append("{}: growth.content_performance.{} debe tener hasta cinco registros.".format(creator_id, list_name))
                    continue
                for row in rows:
                    if not isinstance(row, dict) or not row.get("title") or not str(row.get("url") or "").startswith("https://"):
                        errors.append("{}: growth.content_performance.{} contiene un enlace/título inválido.".format(creator_id, list_name))
                        continue
                    views = row.get("views")
                    if views is not None and (not isinstance(views, int) or isinstance(views, bool) or views < 0):
                        errors.append("{}: visualizaciones de contenido inválidas.".format(creator_id))
                    changes = row.get("views_gained") or {}
                    if set(changes) != {"7d", "30d", "90d"}:
                        errors.append("{}: las variaciones de visualizaciones deben cubrir 7/30/90 días.".format(creator_id))
            collaborations = growth.get("collaborations") or {}
            if not isinstance(collaborations.get("shared_cases", []), list) or not isinstance(collaborations.get("reported_results", []), list):
                errors.append("{}: estructura de colaboraciones inválida.".format(creator_id))
            for result in collaborations.get("reported_results", []):
                if result.get("channel_scope") != creator_id or result.get("verification_status") not in {"creator_reported", "public_source", "platform_verified"} or not result.get("source"):
                    errors.append("{}: resultado colaborativo sin alcance, nivel de verificación o fuente.".format(creator_id))
            audience = growth.get("advanced_audience") or {}
            if audience.get("status") == "authorized_public_aggregate":
                if not audience.get("source") or not audience.get("captured_at") or not audience.get("metrics"):
                    errors.append("{}: audiencia avanzada autorizada sin evidencia suficiente.".format(creator_id))
                for breakdown in audience.get("breakdowns") or []:
                    if not isinstance(breakdown.get("sample_size"), int) or breakdown["sample_size"] < 5:
                        errors.append("{}: desglose demográfico con base inferior a cinco observaciones.".format(creator_id))

        content = record.get("content") or {}
        if not isinstance(content.get("twitch_clips_count", 0), int) or content.get("twitch_clips_count", 0) < 0:
            errors.append("{}: twitch_clips_count inválido.".format(creator_id))
    return errors


def main():
    try:
        registry = json.loads(OUTPUT.read_text(encoding="utf-8"))
        roster = json.loads(ROSTER.read_text(encoding="utf-8"))
        errors = validate(registry, roster)
    except (OSError, json.JSONDecodeError) as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    if errors:
        for issue in errors:
            print("ERROR: " + issue, file=sys.stderr)
        return 1
    print("OK: registro normalizado vinculado a todas las cuentas canónicas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
