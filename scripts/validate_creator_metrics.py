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
