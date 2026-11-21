"""Validate creator collaboration evidence and opt-in aggregated audience reports."""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_VERIFICATION = {"creator_reported", "public_source", "platform_verified"}
ALLOWED_BREAKDOWNS = {"age_range", "region", "country"}


def parse_time(value):
    if not isinstance(value, str):
        return False
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return parsed.tzinfo is not None


def validate(records, roster):
    errors = []
    expected_ids = {
        hero.get("id") or hero.get("slug")
        for hero in roster.get("heroes") or []
        if hero.get("id") or hero.get("slug")
    }
    channels = records.get("channels")
    if not isinstance(channels, dict):
        return ["creator-records.json: channels debe ser un objeto."]
    if set(channels) != expected_ids:
        errors.append("creator-records.json: los IDs de channels deben coincidir con data/roster.json.")

    for creator_id, record in channels.items():
        if not isinstance(record, dict):
            errors.append("{}: expediente de creator-records inválido.".format(creator_id))
            continue
        for collection_key in ("milestones", "collaborations", "highlights", "collaboration_results"):
            value = record.get(collection_key, [])
            if not isinstance(value, list):
                errors.append("{}: {} debe ser una lista.".format(creator_id, collection_key))
                continue
            for index, item in enumerate(value):
                if not isinstance(item, dict):
                    errors.append("{}: {}[{}] debe ser un objeto.".format(creator_id, collection_key, index))
                    continue
                if collection_key == "collaboration_results":
                    prefix = "{}: collaboration_results[{}]".format(creator_id, index)
                    if not all(isinstance(item.get(key), str) and item[key].strip() for key in ("case_id", "title", "source", "verification_status", "channel_scope")):
                        errors.append(prefix + " requiere case_id, title, source, verification_status y channel_scope.")
                    if item.get("channel_scope") != creator_id:
                        errors.append(prefix + " debe mantener el alcance del canal del expediente.")
                    if item.get("verification_status") not in ALLOWED_VERIFICATION:
                        errors.append(prefix + " tiene verification_status inválido.")
                    date_value = item.get("date")
                    if not isinstance(date_value, str) or len(date_value) != 10 or not parse_time(date_value + "T00:00:00Z"):
                        errors.append(prefix + " requiere date YYYY-MM-DD.")
                    participants = item.get("participants")
                    if not isinstance(participants, list) or not participants or not set(participants).issubset(expected_ids):
                        errors.append(prefix + " contiene participantes fuera del roster.")
                    if not isinstance(item.get("metrics"), list) or not item.get("metrics"):
                        errors.append(prefix + " requiere métricas declaradas.")
                    else:
                        for metric in item["metrics"]:
                            value = metric.get("value") if isinstance(metric, dict) else None
                            if not isinstance(metric, dict) or not metric.get("label") or not metric.get("unit") or not isinstance(value, (int, float)) or isinstance(value, bool) or value < 0:
                                errors.append(prefix + " contiene una métrica inválida.")
                elif item.get("url"):
                    if not str(item["url"]).startswith("https://"):
                        errors.append("{}: {}[{}] URL debe usar HTTPS.".format(creator_id, collection_key, index))

        report = record.get("audience_report")
        if report is None:
            continue
        if not isinstance(report, dict):
            errors.append("{}: audience_report debe ser un objeto.".format(creator_id))
            continue
        authorization = report.get("authorization") or {}
        status = authorization.get("status")
        public_display = authorization.get("public_display")
        if status not in {"pending", "granted", "revoked"} or not isinstance(public_display, bool):
            errors.append("{}: audience_report requiere authorization.status y public_display explícitos.".format(creator_id))
        if status != "granted" or public_display is not True:
            if report.get("metrics") or report.get("breakdowns"):
                errors.append("{}: no se pueden adjuntar métricas para publicación sin autorización explícita.".format(creator_id))
            continue
        if not report.get("source") or not parse_time(report.get("captured_at")):
            errors.append("{}: audience_report autorizado requiere fuente y captured_at.".format(creator_id))
        period = report.get("period") or {}
        if not parse_time(period.get("from")) or not parse_time(period.get("to")):
            errors.append("{}: audience_report autorizado requiere período válido.".format(creator_id))
        metrics = report.get("metrics") or []
        if not isinstance(metrics, list) or not metrics:
            errors.append("{}: audience_report autorizado requiere métricas agregadas.".format(creator_id))
        else:
            for metric in metrics:
                value = metric.get("value") if isinstance(metric, dict) else None
                if not isinstance(metric, dict) or not metric.get("label") or not metric.get("unit") or not isinstance(value, (int, float)) or isinstance(value, bool) or value < 0:
                    errors.append("{}: audience_report contiene una métrica inválida.".format(creator_id))
        for breakdown in report.get("breakdowns") or []:
            share = breakdown.get("share_pct") if isinstance(breakdown, dict) else None
            count = breakdown.get("sample_size") if isinstance(breakdown, dict) else None
            if not isinstance(breakdown, dict) or breakdown.get("dimension") not in ALLOWED_BREAKDOWNS or not breakdown.get("label") or not isinstance(share, (int, float)) or isinstance(share, bool) or not 0 <= share <= 100 or not isinstance(count, int) or isinstance(count, bool) or count < 5:
                errors.append("{}: audience_report contiene un desglose no agregado o sin base mínima de cinco observaciones.".format(creator_id))
    return errors


def main():
    try:
        records = json.loads((ROOT / "creator-records.json").read_text(encoding="utf-8"))
        roster = json.loads((ROOT / "data/roster.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    errors = validate(records, roster)
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        return 1
    print("OK: vínculos, resultados de colaboración y reportes de audiencia autorizados válidos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
