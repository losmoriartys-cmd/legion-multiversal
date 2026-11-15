"""Validate the public Twitch clips dataset against the canonical roster."""
from __future__ import annotations
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CLIPS = ROOT / "clips-data.json"
ROSTER = ROOT / "roster-data.json"
VALID_STATUSES = {"awaiting_collection", "ok", "empty", "error"}


def read(path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate(clips, roster):
    errors = []
    if clips.get("schema_version") != 1:
        errors.append("clips-data.json debe usar schema_version=1.")
    if clips.get("source") != "Twitch Helix Get Clips":
        errors.append("La fuente de clips debe ser Twitch Helix Get Clips.")
    if clips.get("window_days") != 30:
        errors.append("La ventana de clips debe ser de 30 días.")
    creators = clips.get("creators")
    if not isinstance(creators, dict):
        return errors + ["creators debe ser un objeto."]

    expected = {}
    for hero in roster.get("heroes", []):
        creator_id = hero.get("id") or hero.get("slug")
        for account in hero.get("accounts") or []:
            if account.get("platform") == "twitch" and account.get("account_type") == "creator_channel":
                expected[creator_id] = str(account.get("login") or "").lower()
    if set(creators) != set(expected):
        errors.append("Las claves creator_id no coinciden con las cuentas Twitch del roster.")

    for creator_id, record in creators.items():
        if not isinstance(record, dict):
            errors.append("{}: el expediente debe ser un objeto.".format(creator_id))
            continue
        if record.get("login", "").lower() != expected.get(creator_id):
            errors.append("{}: login no coincide con roster-data.json.".format(creator_id))
        if record.get("status") not in VALID_STATUSES:
            errors.append("{}: estado de clips inválido.".format(creator_id))
        clips_list = record.get("clips")
        if not isinstance(clips_list, list) or len(clips_list) > 10:
            errors.append("{}: clips debe ser una lista de hasta 10 elementos.".format(creator_id))
            continue
        ids = set()
        for clip in clips_list:
            clip_id, url, title = clip.get("id"), clip.get("url"), clip.get("title")
            parsed = urlparse(url or "")
            if not isinstance(clip_id, str) or not clip_id.strip() or clip_id in ids:
                errors.append("{}: ID de clip vacío o duplicado.".format(creator_id))
            ids.add(clip_id)
            if parsed.scheme != "https" or parsed.hostname not in {"www.twitch.tv", "clips.twitch.tv"}:
                errors.append("{}: URL de clip no válida.".format(creator_id))
            if not isinstance(title, str) or not title.strip():
                errors.append("{}: título de clip vacío.".format(creator_id))
            count = clip.get("view_count")
            if count is not None and (not isinstance(count, int) or count < 0):
                errors.append("{}: view_count debe ser entero no negativo o null.".format(creator_id))
    collection = clips.get("collection") or {}
    if collection.get("expected_channels") != len(expected):
        errors.append("collection.expected_channels no coincide con roster.")
    return errors


def main():
    try:
        errors = validate(read(CLIPS), read(ROSTER))
    except (OSError, json.JSONDecodeError) as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        return 1
    print("OK: clips-data.json válido y vinculado a las cuentas Twitch del roster.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
