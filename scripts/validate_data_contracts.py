#!/usr/bin/env python3
"""Unified blocking validation for canonical editorial data and generated public feeds."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "schemas"
sys.path.insert(0, str(ROOT / "scripts"))

from jsonschema import Draft202012Validator, FormatChecker  # noqa: E402

import validate_clips_data  # noqa: E402
import validate_creator_metrics  # noqa: E402
import validate_creator_records  # noqa: E402
import validate_games_registry  # noqa: E402
import validate_roster_data  # noqa: E402

EXPECTED_CREATOR_IDS = {
    "moriartys", "rod3r1k", "lady-moriarty", "ardipii",
    "akuma", "dave-nexus", "pato-oratoris", "habitos",
}

SCHEMA_MAP = {
    "data/roster.json": ["roster-data.schema.json"],
    "data/games.json": ["games.schema.json"],
    "data/creator-records.json": ["creator-records.schema.json"],
    "data/creator-colors.json": ["creator-colors.schema.json"],
    "creator-programs.json": ["creator-programs.schema.json"],
    "community-playbook.json": ["community-playbook.schema.json"],
    "platform-registry.json": ["platform-registry.schema.json"],
    "news-data.json": ["news-data.schema.json"],
    "sullygnome-data.json": ["sullygnome-data.schema.json"],
    "twitchmetrics-data.json": ["twitchmetrics-data.schema.json"],
    "clips-data.json": ["clips-data.schema.json"],
    "data.json": ["twitch-activity.schema.json"],
    "platform-stats.json": ["platform-stats.schema.json"],
    "creator-metrics.json": ["creator-metrics.schema.json"],
}

DATA_FILES = tuple(SCHEMA_MAP)


def read_json(relative_path: str) -> Any:
    path = ROOT / relative_path
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def json_pointer(parts) -> str:
    if not parts:
        return "/"
    escaped = [str(part).replace("~", "~0").replace("/", "~1") for part in parts]
    return "/" + "/".join(escaped)


def schema_diagnostics(relative_path: str, document: Any, schema_name: str) -> list[str]:
    schema_path = SCHEMA_DIR / schema_name
    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
    except (OSError, json.JSONDecodeError, Exception) as exc:
        return [f"{schema_path.relative_to(ROOT)}: esquema no legible o inválido: {exc}"]

    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    issues = sorted(validator.iter_errors(document), key=lambda error: (list(map(str, error.absolute_path)), error.message))
    return [
        f"{relative_path}#{json_pointer(issue.absolute_path)}: {issue.message}"
        for issue in issues
    ]


def _prefix(path: str, messages: list[str]) -> list[str]:
    return [message if message.startswith(path + ":") else f"{path}: {message}" for message in messages]


def semantic_diagnostics(documents: dict[str, Any]) -> list[str]:
    roster = documents["data/roster.json"]
    games = documents["data/games.json"]
    creator_records = documents["data/creator-records.json"]
    clips = documents["clips-data.json"]
    activity = documents["data.json"]
    platform_stats = documents["platform-stats.json"]
    creator_metrics = documents["creator-metrics.json"]
    programs = documents["creator-programs.json"]
    playbook = documents["community-playbook.json"]
    sullygnome = documents["sullygnome-data.json"]
    twitchmetrics = documents["twitchmetrics-data.json"]

    errors: list[str] = []
    heroes = roster.get("heroes") if isinstance(roster, dict) else None
    current_ids = {
        hero.get("id")
        for hero in (heroes or [])
        if isinstance(hero, dict) and isinstance(hero.get("id"), str)
    }
    if current_ids != EXPECTED_CREATOR_IDS:
        missing = sorted(EXPECTED_CREATOR_IDS - current_ids)
        extra = sorted(current_ids - EXPECTED_CREATOR_IDS)
        errors.append(
            "data/roster.json: el conjunto protegido de ocho IDs cambió; "
            f"faltan={missing}, nuevos={extra}. Una modificación de roster exige revisar "
            "el contrato y la línea base en el mismo PR."
        )

    errors.extend(_prefix("data/roster.json", validate_roster_data.validate_roster(roster)))
    errors.extend(_prefix("data.json", validate_roster_data.validate_activity(roster, activity)))
    errors.extend(_prefix("platform-stats.json", validate_roster_data.validate_platform_stats(roster, platform_stats)))
    errors.extend(_prefix("data/games.json", validate_games_registry.validate_registry(games, roster)))
    errors.extend(_prefix("data/creator-records.json", validate_creator_records.validate(creator_records, roster)))
    errors.extend(_prefix("clips-data.json", validate_clips_data.validate(clips, roster)))
    errors.extend(_prefix("creator-metrics.json", validate_creator_metrics.validate(creator_metrics, roster)))

    # The Epic program record refers back to roster IDs, but its private/portal status is never inferred.
    for creator_key, record in (programs.get("creators") or {}).items():
        if not isinstance(record, dict):
            errors.append(f"creator-programs.json#/creators/{creator_key}: el registro debe ser un objeto.")
            continue
        roster_id = record.get("roster_profile_id")
        if roster_id not in current_ids:
            errors.append(
                f"creator-programs.json#/creators/{creator_key}/roster_profile_id: "
                f"no existe el perfil {roster_id!r} en data/roster.json."
            )
        profile = next((hero for hero in heroes or [] if isinstance(hero, dict) and hero.get("id") == roster_id), None)
        if profile and record.get("scope") != profile.get("identity_scope"):
            errors.append(
                f"creator-programs.json#/creators/{creator_key}/scope: "
                "no coincide con identity_scope del perfil asociado."
            )

    # Mission and achievement identifiers must be unique within their own collections.
    for collection_name in ("missions", "achievements"):
        entries = playbook.get(collection_name) or []
        seen: set[str] = set()
        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                continue
            identifier = entry.get("id")
            if isinstance(identifier, str) and identifier in seen:
                errors.append(
                    f"community-playbook.json#/{collection_name}/{index}/id: "
                    f"ID duplicado {identifier!r}."
                )
            if isinstance(identifier, str):
                seen.add(identifier)

    # Third-party snapshots resolve only to canonical Twitch logins; provider metrics stay isolated.
    twitch_logins = {
        str(account.get("login") or account.get("handle") or "").lower()
        for hero in (heroes or []) if isinstance(hero, dict)
        for account in hero.get("accounts", []) if isinstance(account, dict) and account.get("platform") == "twitch"
    }
    for index, channel in enumerate(sullygnome.get("channels", [])):
        login = str(channel.get("login") or "").lower()
        if login not in twitch_logins:
            errors.append(f"sullygnome-data.json#/channels/{index}/login: la cuenta Twitch {login!r} no existe en el Roster.")
    for login in (twitchmetrics.get("channels") or {}):
        if str(login).lower() not in twitch_logins:
            errors.append(f"twitchmetrics-data.json#/channels/{login}: la cuenta Twitch no existe en el Roster.")

    # The commercial expediente and collaboration-result case IDs are different namespaces.
    # Keep BarFender EXP-001 in games.json; do not coerce creator case slugs into EXP IDs or BIT sessions.
    barfender = next((item for item in games.get("juegos", []) if item.get("id") == "barfender"), None)
    if barfender and (barfender.get("expediente_comercial") != "EXP-001" or barfender.get("sesiones") != []):
        errors.append(
            "data/games.json#/juegos/barfender: conservar EXP-001 como expediente comercial; "
            "no convertirlo en una sesión BIT sin evidencia y decisión editorial."
        )

    return errors


def validate_documents(documents: dict[str, Any] | None = None) -> list[str]:
    if documents is None:
        documents = {path: read_json(path) for path in DATA_FILES}

    errors: list[str] = []
    for relative_path, schema_names in SCHEMA_MAP.items():
        if relative_path not in documents:
            errors.append(f"{relative_path}: documento requerido no cargado.")
            continue
        for schema_name in schema_names:
            errors.extend(schema_diagnostics(relative_path, documents[relative_path], schema_name))
    errors.extend(semantic_diagnostics(documents))
    return errors


def main() -> int:
    try:
        documents = {path: read_json(path) for path in DATA_FILES}
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: no se pudo leer un documento de datos: {exc}", file=sys.stderr)
        return 2

    errors = validate_documents(documents)
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        print(f"FAIL: {len(errors)} diagnóstico(s) de contrato.", file=sys.stderr)
        return 1

    print("OK: contratos JSON Schema y referencias semánticas válidos.")
    print("OK: 8 identidades; juegos/BIT/POV; expedientes; clips; Twitch; YouTube; métricas normalizadas.")
    print("OK: horarios declarados separados de actividad medida; BarFender EXP-001 preservado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
