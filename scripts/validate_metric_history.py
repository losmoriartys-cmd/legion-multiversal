"""Check Twitch metric-history shape, chronology, and public-data boundaries."""
from __future__ import annotations
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data.json"
REQUIRED_SNAPSHOT_FIELDS = {
    "sampled_at", "is_live", "viewer_count", "game_name", "title", "stream_id", "started_at"
}


def parse_timestamp(value):
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else None


def validate_snapshot(snapshot, previous_time=None):
    errors = []
    if not isinstance(snapshot, dict):
        return ["la muestra debe ser un objeto"]
    missing = REQUIRED_SNAPSHOT_FIELDS - set(snapshot)
    if missing:
        errors.append("faltan campos: " + ", ".join(sorted(missing)))
        return errors
    sampled_at = parse_timestamp(snapshot.get("sampled_at"))
    if sampled_at is None:
        errors.append("sampled_at no es una fecha ISO-8601 con zona horaria")
    elif previous_time is not None and sampled_at <= previous_time:
        errors.append("las muestras deben estar estrictamente ordenadas y sin timestamps repetidos")
    if not isinstance(snapshot.get("is_live"), bool):
        errors.append("is_live debe ser boolean")
    viewers = snapshot.get("viewer_count")
    if viewers is not None and (not isinstance(viewers, int) or isinstance(viewers, bool) or viewers < 0):
        errors.append("viewer_count debe ser entero no negativo o null")
    if snapshot.get("is_live") is False and viewers is not None:
        errors.append("una muestra offline no puede incluir espectadores actuales")
    for field in ("game_name", "title", "stream_id", "started_at"):
        value = snapshot.get(field)
        if value is not None and not isinstance(value, str):
            errors.append("{} debe ser string o null".format(field))
    if snapshot.get("started_at") is not None and parse_timestamp(snapshot["started_at"]) is None:
        errors.append("started_at no es una fecha ISO-8601 con zona horaria")
    return errors


def validate_data(data):
    errors = []
    if data.get("schema_version") != 2:
        errors.append("data.json debe usar schema_version=2")
    channels = data.get("channels")
    active = data.get("active_channels")
    if not isinstance(channels, dict) or not isinstance(active, list):
        return errors + ["channels y active_channels deben ser un objeto y una lista"]
    if len(active) != len(set(active)):
        errors.append("active_channels contiene logins duplicados")
    for login in active:
        channel = channels.get(login)
        if not isinstance(channel, dict):
            errors.append("{}: falta el expediente del canal".format(login))
            continue
        if str(channel.get("login") or "").lower() != str(login).lower():
            errors.append("{}: login del expediente no coincide".format(login))
        if not isinstance(channel.get("live"), bool):
            errors.append("{}: live debe ser boolean".format(login))
        viewers = channel.get("current_viewers")
        if viewers is not None and (not isinstance(viewers, int) or isinstance(viewers, bool) or viewers < 0):
            errors.append("{}: current_viewers inválido".format(login))
        if channel.get("followers_total") is not None:
            errors.append("{}: followers_total requiere autorización/captura específica y no se acepta en este colector público".format(login))
        snapshots = channel.get("snapshots")
        if not isinstance(snapshots, list):
            errors.append("{}: snapshots debe ser una lista".format(login))
            continue
        previous_time = None
        live_count = 0
        for index, snapshot in enumerate(snapshots):
            for issue in validate_snapshot(snapshot, previous_time):
                errors.append("{}: snapshot {}: {}".format(login, index, issue))
            if isinstance(snapshot, dict):
                timestamp = parse_timestamp(snapshot.get("sampled_at"))
                if timestamp is not None and (previous_time is None or timestamp > previous_time):
                    previous_time = timestamp
                if snapshot.get("is_live") is True:
                    live_count += 1
        window = channel.get("window") or {}
        if window.get("samples_total") != len(snapshots):
            errors.append("{}: window.samples_total no coincide con snapshots".format(login))
        if window.get("live_samples") != live_count:
            errors.append("{}: window.live_samples no coincide con las muestras live".format(login))
        for field in ("average_viewers_sampled", "peak_viewers_sampled", "observed_live_hours", "estimated_hours_watched"):
            value = window.get(field)
            if value is not None and (not isinstance(value, (int, float)) or isinstance(value, bool) or value < 0):
                errors.append("{}: window.{} debe ser numérico no negativo o null".format(login, field))
    return errors


def main():
    try:
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
        errors = validate_data(data)
    except (OSError, json.JSONDecodeError) as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        return 1
    print("OK: historial Twitch íntegro; muestras, cronología y límites de datos verificados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
