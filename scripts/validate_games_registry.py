#!/usr/bin/env python3
"""Valida el registro maestro compartido de juegos y sus referencias al Roster."""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
GAMES_FILE = ROOT / "games.json"
ROSTER_FILE = ROOT / "roster-data.json"
ALLOWED_CATEGORIES = {
    "Fiesta y humor", "Terror cooperativo", "Deducción social", "Supervivencia",
    "Sandbox y construcción", "Simulación", "Retro y clásicos", "Cooperativo y aventura", "Competitivo",
}
GAME_KEYS = {
    "id", "nombre", "aliases", "categorias", "plataformas", "ediciones", "modalidad",
    "descripcion", "jugadores", "fuente_jugadores", "tienda", "portada", "expediente_comercial", "sesiones",
}
SESSION_KEYS = {"bit", "fecha", "fuente_fecha", "participantes", "pov", "nota"}
POV_KEYS = {"canal", "url"}


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def is_https_url(value) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.hostname)


def normalized(value: str) -> str:
    import unicodedata
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower())


def validate_registry(registry: dict, roster: dict) -> list[str]:
    errors: list[str] = []
    if not isinstance(registry, dict):
        return ["games.json debe contener un objeto raíz."]
    if registry.get("version") != 1:
        errors.append("games.json debe usar version=1.")
    if not isinstance(registry.get("nota"), str) or not registry["nota"].strip():
        errors.append("games.json debe documentar el propósito del registro en nota.")
    games = registry.get("juegos")
    if not isinstance(games, list) or not games:
        return errors + ["juegos debe ser una lista no vacía."]

    heroes = roster.get("heroes") if isinstance(roster, dict) else None
    if not isinstance(heroes, list):
        return errors + ["roster-data.json no contiene una lista heroes válida."]
    roster_ids = {hero.get("id") for hero in heroes if isinstance(hero, dict) and hero.get("id")}
    twitch_ids = {
        hero.get("id")
        for hero in heroes
        if isinstance(hero, dict)
        and any(account.get("platform") == "twitch" for account in hero.get("accounts", []) if isinstance(account, dict))
    }

    game_ids: set[str] = set()
    title_owners: dict[str, str] = {}
    bit_ids: set[str] = set()
    session_count = 0
    pov_count = 0

    for index, game in enumerate(games, 1):
        label = game.get("nombre") if isinstance(game, dict) else f"juego {index}"
        if not isinstance(game, dict):
            errors.append(f"{label}: cada juego debe ser un objeto.")
            continue
        missing = GAME_KEYS - set(game)
        extra = set(game) - GAME_KEYS
        if missing:
            errors.append(f"{label}: faltan campos obligatorios: {', '.join(sorted(missing))}.")
        if extra:
            errors.append(f"{label}: campos no reconocidos: {', '.join(sorted(extra))}.")

        game_id = game.get("id")
        if not isinstance(game_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", game_id):
            errors.append(f"{label}: id debe ser un identificador slug estable.")
        elif game_id in game_ids:
            errors.append(f"ID de juego duplicado: {game_id}.")
        else:
            game_ids.add(game_id)

        if not isinstance(label, str) or not label.strip():
            errors.append(f"Juego {index}: nombre vacío.")
            label = f"juego {index}"
        for value in [label, *(game.get("aliases") or [])]:
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{label}: los aliases deben ser textos no vacíos.")
                continue
            token = normalized(value)
            owner = title_owners.get(token)
            if owner and owner != game_id:
                errors.append(f"Nombre/alias ambiguo entre {owner} y {game_id}: {value}.")
            title_owners[token] = game_id

        aliases = game.get("aliases")
        if not isinstance(aliases, list) or len(aliases) != len(set(aliases)):
            errors.append(f"{label}: aliases debe ser una lista sin duplicados.")
        categories = game.get("categorias")
        if not isinstance(categories, list) or not categories:
            errors.append(f"{label}: categorias debe ser una lista no vacía.")
        else:
            if len(categories) != len(set(categories)):
                errors.append(f"{label}: categorías duplicadas.")
            for category in categories:
                if category not in ALLOWED_CATEGORIES:
                    errors.append(f"{label}: categoría no normalizada: {category}.")

        for field in ("plataformas", "ediciones"):
            value = game.get(field)
            if value is not None and (not isinstance(value, list) or not value or any(not isinstance(x, str) or not x.strip() for x in value)):
                errors.append(f"{label}: {field} debe ser null o una lista de textos no vacíos.")
        for field in ("modalidad", "descripcion"):
            value = game.get(field)
            if value is not None and not isinstance(value, str):
                errors.append(f"{label}: {field} debe ser texto o null; no usar cadenas vacías como dato desconocido.")
            if isinstance(value, str) and not value.strip():
                errors.append(f"{label}: {field} desconocido debe expresarse como null, no como cadena vacía.")

        players = game.get("jugadores")
        source = game.get("fuente_jugadores")
        if players is None:
            if source is not None:
                errors.append(f"{label}: fuente_jugadores debe ser null cuando jugadores no está verificado.")
        elif isinstance(players, dict):
            minimum, maximum = players.get("min"), players.get("max")
            if any(not isinstance(x, int) or isinstance(x, bool) or x < 1 for x in (minimum, maximum)):
                errors.append(f"{label}: min/max de jugadores deben ser enteros positivos.")
            elif minimum > maximum:
                errors.append(f"{label}: el mínimo de jugadores supera el máximo.")
            if not is_https_url(source):
                errors.append(f"{label}: los jugadores verificados necesitan una fuente HTTPS.")
        else:
            errors.append(f"{label}: jugadores debe ser un objeto min/max o null.")

        for field in ("tienda", "portada"):
            value = game.get(field)
            if value is not None and not is_https_url(value):
                errors.append(f"{label}: {field} debe ser una URL HTTPS o null.")
        commercial = game.get("expediente_comercial")
        if commercial is not None and (not isinstance(commercial, str) or not re.fullmatch(r"EXP-[0-9]{3}", commercial)):
            errors.append(f"{label}: expediente_comercial debe usar el prefijo EXP-### o null.")

        sessions = game.get("sesiones")
        if not isinstance(sessions, list):
            errors.append(f"{label}: sesiones debe ser una lista.")
            continue
        for session in sessions:
            session_count += 1
            if not isinstance(session, dict):
                errors.append(f"{label}: cada sesión debe ser un objeto.")
                continue
            missing_session = SESSION_KEYS - set(session)
            extra_session = set(session) - SESSION_KEYS
            if missing_session:
                errors.append(f"{label}: sesión incompleta; faltan {', '.join(sorted(missing_session))}.")
            if extra_session:
                errors.append(f"{label}: campos no reconocidos en sesión: {', '.join(sorted(extra_session))}.")

            bit = session.get("bit")
            if not isinstance(bit, str) or not re.fullmatch(r"BIT-[0-9]{3}", bit):
                errors.append(f"{label}: cada sesión debe tener un ID BIT-###.")
            elif bit in bit_ids:
                errors.append(f"ID de bitácora duplicado: {bit}.")
            else:
                bit_ids.add(bit)

            session_date = session.get("fecha")
            date_source = session.get("fuente_fecha")
            if session_date is not None:
                try:
                    date.fromisoformat(session_date)
                except (TypeError, ValueError):
                    errors.append(f"{label} · {bit}: fecha debe usar YYYY-MM-DD o null.")
                if not is_https_url(date_source):
                    errors.append(f"{label} · {bit}: una fecha declarada necesita una fuente HTTPS.")
            elif date_source is not None:
                errors.append(f"{label} · {bit}: fuente_fecha debe ser null si la fecha no está verificada.")

            participants = session.get("participantes")
            if not isinstance(participants, list) or not participants:
                errors.append(f"{label} · {bit}: participantes debe ser una lista no vacía.")
            else:
                if len(participants) != len(set(participants)):
                    errors.append(f"{label} · {bit}: participantes duplicados.")
                for creator_id in participants:
                    if creator_id not in roster_ids:
                        errors.append(f"{label} · {bit}: participante no existe en el Roster: {creator_id}.")

            povs = session.get("pov")
            if not isinstance(povs, list) or not povs:
                errors.append(f"{label} · {bit}: pov debe contener al menos un registro audiovisual.")
                continue
            seen_urls: set[str] = set()
            for pov in povs:
                pov_count += 1
                if not isinstance(pov, dict):
                    errors.append(f"{label} · {bit}: cada POV debe ser un objeto.")
                    continue
                missing_pov = POV_KEYS - set(pov)
                extra_pov = set(pov) - POV_KEYS
                if missing_pov or extra_pov:
                    errors.append(f"{label} · {bit}: estructura POV inválida.")
                channel = pov.get("canal")
                if channel is not None and channel not in twitch_ids:
                    errors.append(f"{label} · {bit}: canal POV no es un integrante con cuenta Twitch: {channel}.")
                url = pov.get("url")
                if not is_https_url(url) or not re.fullmatch(r"https://(?:www\\.)?twitch\\.tv/videos/[0-9]+", url or ""):
                    errors.append(f"{label} · {bit}: URL POV no es un VOD Twitch limpio: {url}.")
                elif url in seen_urls:
                    errors.append(f"{label} · {bit}: VOD duplicado dentro de la misma sesión.")
                else:
                    seen_urls.add(url)
            note = session.get("nota")
            if note is not None and (not isinstance(note, str) or not note.strip()):
                errors.append(f"{label} · {bit}: nota debe ser texto no vacío o null.")

    if len(game_ids) != len(games):
        errors.append("El registro contiene IDs de juegos repetidos o inválidos.")
    return errors


def main() -> int:
    try:
        registry = read_json(GAMES_FILE)
        roster = read_json(ROSTER_FILE)
        errors = validate_registry(registry, roster)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        return 1

    games = registry["juegos"]
    sessions = [session for game in games for session in game["sesiones"]]
    povs = [pov for session in sessions for pov in session["pov"]]
    print(f"OK: {len(games)} juegos únicos; {len(sessions)} sesiones BIT; {len(povs)} POV.")
    print("OK: participantes y canales resuelven contra roster-data.json; fechas y jugadores no verificados se mantienen en null.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())