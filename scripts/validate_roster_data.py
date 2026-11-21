#!/usr/bin/env python3
"""Valida el modelo de identidad del Roster y su contrato con los archivos de métricas.

No realiza llamadas de red ni modifica archivos. --check-activity contrasta el
registro de cuentas Twitch con data.json después de una captura del colector.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ROSTER = ROOT / "data/roster.json"
ACTIVITY = ROOT / "data.json"
PLATFORM_STATS = ROOT / "platform-stats.json"
SUPPORTED_PLATFORMS = {"twitch", "youtube", "instagram", "kick"}
SCOPES = {"shared_project", "individual_creator"}
MODES = {"public_app_token", "public_api_key", "public_client_credentials", "manual_link_only"}


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_roster(roster: dict) -> list[str]:
    errors: list[str] = []
    if roster.get("schema_version") != 2:
        errors.append("data/roster.json debe usar schema_version=2.")
    if roster.get("identity_model_version") != 1:
        errors.append("identity_model_version debe ser 1.")
    heroes = roster.get("heroes")
    if not isinstance(heroes, list) or not heroes:
        return errors + ["No hay integrantes en data/roster.json."]

    registry = roster.get("name_registry")
    if not isinstance(registry, dict):
        errors.append("data/roster.json debe incluir name_registry con nombres canónicos.")
        registry = {}
    expected_registry_ids = {hero.get("id") for hero in heroes if hero.get("id")}
    if set(registry) != expected_registry_ids:
        errors.append("name_registry debe contener exactamente una entrada por cada integrante del roster.")

    def normalize_name(value: str) -> str:
        import unicodedata
        return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode("ascii").lower())

    alias_owners = {}
    for index, hero in enumerate(heroes, 1):
        identity = registry.get(hero.get("id")) or {}
        if not identity:
            errors.append("{}: falta la identidad canónica en name_registry.".format(hero.get("name") or index))
            continue
        if identity.get("display_name") != hero.get("display_name"):
            errors.append("{}: display_name no coincide con name_registry.".format(hero.get("name") or index))
        if identity.get("character_alias") != hero.get("codename"):
            errors.append("{}: character_alias no coincide con codename.".format(hero.get("name") or index))
        if not str(identity.get("short_description") or "").strip():
            errors.append("{}: falta short_description en name_registry.".format(hero.get("name") or index))
        accounts = hero.get("accounts") or []
        account = next((item for item in accounts if item.get("platform") == identity.get("platform")), None)
        if not account:
            errors.append("{}: platform de name_registry no coincide con una cuenta registrada.".format(hero.get("name") or index))
        elif normalize_name(identity.get("username")) not in {
            normalize_name(account.get("handle")), normalize_name(account.get("login"))
        }:
            errors.append("{}: username no coincide con el handle registrado.".format(hero.get("name") or index))
        aliases = [
            identity.get("display_name"), identity.get("username"), identity.get("character_alias"),
            *(identity.get("variants") or [])
        ]
        for person in identity.get("represented_people") or []:
            aliases.extend([person.get("display_name"), *(person.get("variants") or [])])
        for alias in aliases:
            token = normalize_name(alias)
            if not token:
                continue
            owner = alias_owners.get(token)
            if owner and owner != hero.get("id"):
                errors.append("Alias canónico ambiguo entre {} y {}: {}.".format(owner, hero.get("id"), alias))
            alias_owners[token] = hero.get("id")

    ids, slugs, logins = set(), set(), set()
    for index, hero in enumerate(heroes, 1):
        label = str(hero.get("name") or "integrante {}".format(index))
        for field in ("id", "slug", "display_name"):
            value = hero.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append("{}: falta {}.".format(label, field))
        for field, seen in (("id", ids), ("slug", slugs)):
            value = hero.get(field)
            if isinstance(value, str):
                if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
                    errors.append("{}: {} no es un identificador estable válido.".format(label, field))
                if value in seen:
                    errors.append("{} duplicado: {}.".format(field, value))
                seen.add(value)

        scope = hero.get("identity_scope")
        if scope not in SCOPES:
            errors.append("{}: identity_scope inválido.".format(label))
        if scope == "shared_project" and not hero.get("represented_people"):
            errors.append("{}: un proyecto compartido debe indicar represented_people.".format(label))

        accounts = hero.get("accounts")
        if not isinstance(accounts, list):
            errors.append("{}: accounts debe ser una lista.".format(label))
            continue
        seen_platform_logins = set()
        for account in accounts:
            platform = account.get("platform")
            handle = account.get("handle")
            url = account.get("url")
            if platform not in SUPPORTED_PLATFORMS:
                errors.append("{}: plataforma no admitida {}.".format(label, platform))
                continue
            if not isinstance(handle, str) or not handle.strip():
                errors.append("{}: handle vacío para {}.".format(label, platform))
            parsed = urlparse(url or "")
            expected_hosts = {
                "twitch": {"twitch.tv", "www.twitch.tv"},
                "youtube": {"youtube.com", "www.youtube.com"},
                "instagram": {"instagram.com", "www.instagram.com"},
                "kick": {"kick.com", "www.kick.com"}
            }[platform]
            if parsed.scheme != "https" or parsed.hostname not in expected_hosts:
                errors.append("{}: URL no válida para {}.".format(label, platform))
            key = (platform, (account.get("login") or handle or "").lower())
            if key in seen_platform_logins:
                errors.append("{}: cuenta {} duplicada.".format(label, key[1]))
            seen_platform_logins.add(key)
            collection = account.get("collection") or {}
            if collection.get("mode") not in MODES:
                errors.append("{}: modo de recolección inválido para {}.".format(label, platform))
            if not isinstance(account.get("public_metrics"), list):
                errors.append("{}: public_metrics debe ser una lista.".format(label))
            if not isinstance(account.get("restricted_metrics"), list):
                errors.append("{}: restricted_metrics debe ser una lista.".format(label))
            if platform == "twitch" and account.get("login"):
                login = account["login"].lower()
                if login in logins:
                    errors.append("Login Twitch duplicado: {}.".format(login))
                logins.add(login)
                if collection.get("mode") != "public_app_token":
                    errors.append("{}: Twitch debe usar public_app_token.".format(label))

    return errors


def validate_activity(roster: dict, activity: dict) -> list[str]:
    errors: list[str] = []
    registered = {
        account["login"].lower()
        for hero in roster["heroes"]
        for account in hero.get("accounts", [])
        if account.get("platform") == "twitch" and account.get("login")
    }
    active = set(activity.get("active_channels") or [])
    missing_records = registered - set((activity.get("channels") or {}).keys())
    if registered != active:
        errors.append("Los logins Twitch del Roster no coinciden con data.json: roster={}, data.json={}.".format(sorted(registered), sorted(active)))
    collection = activity.get("collection") or {}
    if collection.get("status_complete") is not True:
        errors.append("data.json no informa consultas Helix válidas para todos los canales.")
    if collection.get("coverage_complete") is not True:
        errors.append("data.json no contabiliza todos los canales muestreados u omitidos por cadencia.")
    if collection.get("complete") != collection.get("sampling_complete"):
        errors.append("data.json presenta estados inconsistentes entre complete y sampling_complete.")
    if int(collection.get("expected_channels") or 0) != len(registered):
        errors.append("data.json.expected_channels no coincide con el registro.")
    covered = set(collection.get("sampled_channels") or []) | set(collection.get("skipped_channels") or [])
    if covered != registered:
        errors.append("La captura no contabiliza todos los canales esperados: faltan {}.".format(sorted(registered - covered)))
    if missing_records:
        errors.append("Faltan registros Twitch en data.json: {}.".format(sorted(missing_records)))
    for login in registered:
        channel = (activity.get("channels") or {}).get(login, {})
        if not channel.get("updated_at") or not channel.get("last_status_at"):
            errors.append("{}: falta updated_at/last_status_at de la consulta Helix.".format(login))
        if not isinstance(channel.get("snapshots"), list):
            errors.append("{}: snapshots no es una lista.".format(login))
    return errors


def validate_platform_stats(roster: dict, stats: dict) -> list[str]:
    errors: list[str] = []
    expected = {}
    for hero in roster.get("heroes", []):
        creator_id = hero.get("id") or hero.get("slug")
        platforms = {
            account.get("platform")
            for account in hero.get("accounts", [])
            if (account.get("collection") or {}).get("mode") in {"public_api_key", "public_client_credentials"}
            and account.get("platform") in {"youtube", "kick"}
        }
        if creator_id and platforms:
            expected[creator_id] = platforms

    creators = stats.get("creators") or {}
    for creator_id, platforms in expected.items():
        record = creators.get(creator_id)
        if not isinstance(record, dict):
            errors.append("Falta el perfil multiplataforma {} en platform-stats.json.".format(creator_id))
            continue
        stored_platforms = record.get("platforms") or {}
        for platform in platforms:
            if platform not in stored_platforms:
                errors.append("{}: falta la plataforma {} en platform-stats.json.".format(creator_id, platform))
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-activity", action="store_true", help="Contrasta todas las cuentas Twitch con data.json.")
    parser.add_argument("--check-platforms", action="store_true", help="Contrasta las cuentas YouTube/Kick con platform-stats.json.")
    args = parser.parse_args()
    try:
        roster = read_json(ROSTER)
        errors = validate_roster(roster)
        if args.check_activity:
            errors.extend(validate_activity(roster, read_json(ACTIVITY)))
        if args.check_platforms:
            errors.extend(validate_platform_stats(roster, read_json(PLATFORM_STATS)))
    except (OSError, json.JSONDecodeError) as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        return 1
    print("OK: modelo de roster válido ({} integrantes, {} cuentas).".format(
        len(roster["heroes"]), sum(len(h.get("accounts", [])) for h in roster["heroes"])
    ))
    if args.check_activity:
        print("OK: las cuentas Twitch del Roster coinciden con data.json.")
    if args.check_platforms:
        print("OK: las cuentas YouTube/Kick del Roster coinciden con platform-stats.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
