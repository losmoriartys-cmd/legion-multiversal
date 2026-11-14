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


def parse_time(value):
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else None


def validate(registry, roster):
    errors = []
    if registry.get("schema_version") != 1:
        errors.append("creator-metrics.json debe usar schema_version=1.")
    if parse_time(registry.get("generated_at")) is None:
        errors.append("generated_at debe ser ISO-8601 con zona horaria.")
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
            if captured is not None and parse_time(captured) is None:
                errors.append("{}: captured_at inválido en métrica {}.".format(creator_id, metric_id))
            period = metric.get("period") or {}
            for field in ("from", "to"):
                if period.get(field) is not None and parse_time(period[field]) is None:
                    errors.append("{}: period.{} inválido en métrica {}.".format(creator_id, field, metric_id))
            if metric.get("status") == "unavailable" and metric.get("value") is not None:
                errors.append("{}: una métrica no disponible no puede contener un valor.".format(creator_id))
            if metric.get("status") == "delayed" and not metric.get("interpretation"):
                errors.append("{}: una métrica demorada debe incluir interpretación temporal.".format(creator_id))
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
