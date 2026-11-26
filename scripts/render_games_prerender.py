"""Generate the static HTML fallback for Bitácora and Arsenal.

The JSON registries remain the single source of truth. The generated blocks are
replaced by the interactive registries when JavaScript loads successfully.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
GAMES_PATH = ROOT / "data/games.json"
ROSTER_PATH = ROOT / "data/roster.json"
INDEX_PATH = ROOT / "index.html"

MONTHS_ES = ("ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC")
BIT_RE = re.compile(r"^BIT-\d{3}$")
IMAGE_RE = re.compile(r"^[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*\.(?:jpg|jpeg|png|webp)$")

MARKERS = {
    "collab_summary": ("<!-- GAMES_PRERENDER:COLLAB_SUMMARY:START -->", "<!-- GAMES_PRERENDER:COLLAB_SUMMARY:END -->"),
    "collab": ("<!-- GAMES_PRERENDER:COLLAB:START -->", "<!-- GAMES_PRERENDER:COLLAB:END -->"),
    "arsenal_summary": ("<!-- GAMES_PRERENDER:ARSENAL_SUMMARY:START -->", "<!-- GAMES_PRERENDER:ARSENAL_SUMMARY:END -->"),
    "arsenal": ("<!-- GAMES_PRERENDER:ARSENAL:START -->", "<!-- GAMES_PRERENDER:ARSENAL:END -->"),
}


def esc(value: object) -> str:
    return html.escape("" if value is None else str(value), quote=True)


def safe_url(value: object, allowed_suffixes: set[str] | None = None) -> str:
    if not isinstance(value, str):
        return ""
    try:
        parsed = urlparse(value)
    except ValueError:
        return ""
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not host:
        return ""
    if allowed_suffixes and not any(host == suffix or host.endswith("." + suffix) for suffix in allowed_suffixes):
        return ""
    return value


def date_label(value: object) -> str:
    try:
        parsed = date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return "FECHA SIN VERIFICAR"
    return f"{parsed.day} {MONTHS_ES[parsed.month - 1]} {parsed.year}"


def creator_names(roster: dict) -> dict[str, str]:
    registry = roster.get("name_registry") or {}
    names = {}
    for hero in roster.get("heroes") or []:
        creator_id = str(hero.get("id") or hero.get("slug") or "")
        if not creator_id:
            continue
        identity = registry.get(creator_id) or {}
        names[creator_id] = str(
            identity.get("display_name") or hero.get("display_name") or hero.get("name") or creator_id
        )
    return names


def sessions_for(games: dict) -> list[tuple[dict, dict]]:
    entries = []
    for game in games.get("juegos") or []:
        for session in game.get("sesiones") or []:
            if not BIT_RE.fullmatch(str(session.get("bit") or "")):
                raise ValueError(f"Identificador BIT inválido: {session.get('bit')!r}")
            entries.append((game, session))
    return sorted(entries, key=lambda item: item[1]["bit"])


def render_collab_session(game: dict, session: dict, names: dict[str, str]) -> str:
    bit = esc(session["bit"])
    game_id = esc(game.get("id") or "")
    title = esc(game.get("nombre") or "Juego sin título")
    participants = session.get("participantes") or []
    povs = session.get("pov") or []
    clips = session.get("clips") or []
    pov_ids = {str(pov.get("canal") or "") for pov in povs}
    participant_items = []
    for creator_id in participants:
        creator_id = str(creator_id)
        name = esc(names.get(creator_id, creator_id))
        status = "PARTICIPÓ · POV DISPONIBLE" if creator_id in pov_ids else "PARTICIPÓ · SIN POV REGISTRADO"
        participant_items.append(
            f'<li class="collab-participant"><span class="collab-participant-copy"><strong>{name}</strong>'
            f'<small>{status}</small></span></li>'
        )
    pov_items = []
    for pov in povs:
        href = safe_url(pov.get("url"), {"twitch.tv"})
        if not href:
            continue
        channel = str(pov.get("canal") or "")
        name = esc(names.get(channel, channel or "Canal por confirmar"))
        pov_items.append(
            f'<li><a class="collab-pov-link" href="{esc(href)}" target="_blank" rel="noopener noreferrer">'
            f'<span>POV · {name}</span><strong>ABRIR VOD ↗</strong></a></li>'
        )
    clip_items = []
    for clip in clips:
        href = safe_url(clip.get("url"), {"twitch.tv"})
        if not href:
            continue
        channel = str(clip.get("canal") or "")
        channel_name = esc(names.get(channel, channel or "Canal por confirmar"))
        clip_items.append(
            f'<li><a href="{esc(href)}" target="_blank" rel="noopener noreferrer">'
            f'{esc(clip.get("titulo") or "Clip") } · {channel_name} ↗</a></li>'
        )
    categories = "".join(
        f'<span class="collab-category-chip">{esc(category)}</span>'
        for category in (game.get("categorias") or [])
    )
    cover = safe_url(game.get("portada"))
    poster_art = (
        f'<img src="{esc(cover)}" alt="Portada de {title}" loading="lazy" decoding="async">'
        if cover else '<span class="collab-poster-fallback">ARTE OFICIAL PENDIENTE</span>'
    )
    date_source = safe_url(session.get("fuente_fecha"), {"twitch.tv"})
    date_text = date_label(session.get("fecha")) if date_source else "FECHA SIN VERIFICAR"
    date_markup = (
        f'<a class="collab-session-date" href="{esc(date_source)}" target="_blank" rel="noopener noreferrer">FECHA · {esc(date_text)} · FUENTE VERIFICADA ↗</a>'
        if date_source else f'<span class="collab-session-date">{esc(date_text)}</span>'
    )
    image = str(session.get("imagen") or "")
    session_image = ""
    if image and IMAGE_RE.fullmatch(image) and (ROOT / image).is_file():
        session_image = (
            f'<figure class="campaign-editorial-art collab-session-art"><img src="{esc(image)}" '
            f'alt="Imagen de la sesión de {title}" loading="lazy" decoding="async" width="2048" height="1152">'
            f'<figcaption>UNA SESIÓN · PUNTOS DE VISTA DE LA LEGIÓN</figcaption></figure>'
        )
    summary = session.get("resumen") or session.get("nota") or "Resumen editorial pendiente de completar."
    numbers = session.get("numeros") or {}
    number_parts = []
    if numbers.get("duracion_vod_s") is not None:
        seconds = int(numbers["duracion_vod_s"])
        hours, remainder = divmod(seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        number_parts.append("Duración VOD: " + (f"{hours} h " if hours else "") + f"{minutes} min {seconds} s")
    if numbers.get("vistas_vod") is not None:
        number_parts.append("Vistas VOD: " + str(numbers["vistas_vod"]))
    if numbers.get("fuente"):
        number_parts.append("Fuente: " + str(numbers["fuente"]))
    if numbers.get("capturado"):
        number_parts.append("Capturado: " + date_label(numbers["capturado"]))
    numbers_html = f'<p class="collab-session-note">{" · ".join(esc(item) for item in number_parts)}</p>' if number_parts else ""
    moments = session.get("momentos") or []
    moments_html = (
        '<ul class="collab-prerender-moments">' + "".join(
            f'<li><strong>{esc(moment.get("t"))}</strong> · {esc(moment.get("texto"))} · {esc(names.get(str(moment.get("canal") or ""), moment.get("canal") or "Canal"))}</li>'
            for moment in moments
        ) + '</ul>'
    ) if moments else ""
    player_range = game.get("jugadores")
    player_label = ""
    if isinstance(player_range, dict):
        player_label = f'JUGADORES · {esc(player_range.get("min"))}–{esc(player_range.get("max"))}'
    store = safe_url(game.get("tienda"))
    links = []
    if store:
        links.append(f'<a class="collab-store-link" href="{esc(store)}" target="_blank" rel="noopener noreferrer">FICHA OFICIAL ↗</a>')
    if game.get("expediente_comercial"):
        links.append('<a class="collab-store-link" href="#barfender-expediente">ARCHIVO HISTÓRICO · EXP-001 →</a>')
    pov_html = "<ul>" + "".join(pov_items) + "</ul>" if pov_items else "<p>POV públicos pendientes de registrar.</p>"
    clips_html = "<ul>" + "".join(clip_items) + "</ul>" if clip_items else "<p>Clips destacados pendientes de registrar.</p>"
    return (
        f'<article class="collab-session-card collab-prerendered-card" id="{esc(session["bit"].lower())}" '
        f'data-collab-session="{bit}" data-game-id="{game_id}" data-prerendered="true">'
        f'<div class="collab-poster">{poster_art}<div class="collab-poster-top"><span class="collab-bit-id">{bit}</span>'
        f'{date_markup}</div>'
        f'<div class="collab-poster-bottom"><h4>{title}</h4><div class="collab-session-categories">{categories}</div></div></div>'
        f'<div class="collab-card-strip"><span class="collab-card-count">{len(participants)} JUGARON · {len(povs)} POV</span></div>'
        f'<details class="collab-ficha"><summary><span>ABRIR FICHA</span><span class="collab-ficha-close">CERRAR FICHA</span></summary>'
        f'<div class="collab-session-content"><div class="collab-game-meta"><span class="collab-game-meta-item">{player_label}</span>'
        f'<span class="collab-game-meta-item">{esc(game.get("modalidad") or "Modalidad sin verificar")}</span></div>'
        f'{session_image}<p class="collab-session-note">{esc(summary)}</p>{numbers_html}'
        f'<h5>JUGARON</h5><ul class="collab-prerender-participants">{"".join(participant_items)}</ul>'
        f'<h5>POV DISPONIBLES</h5>{pov_html}{moments_html}<h5>CLIPS DESTACADOS</h5>{clips_html}'
        f'<div class="collab-session-actions">{"".join(links)}</div></div></details></article>'
    )


def render_collab_summary(games: dict) -> str:
    entries = sessions_for(games)
    played = len({game.get("id") for game, _ in entries})
    pov_count = sum(len(session.get("pov") or []) for _, session in entries)
    creators = {str(person) for _, session in entries for person in (session.get("participantes") or [])}
    values = (played, len(entries), pov_count, len(creators))
    labels = ("JUEGOS JUGADOS", "SESIONES BIT", "POV REGISTRADOS", "INTEGRANTES PARTICIPANTES")
    return "\n".join(f"<article><strong>{value}</strong><span>{label}</span></article>" for value, label in zip(values, labels))


def render_arsenal_game(game: dict, index: int) -> str:
    sessions = game.get("sesiones") or []
    state = "documented" if sessions else "discovery"
    label = "COLABORACIÓN DOCUMENTADA" if sessions else "POR DESCUBRIR"
    title = esc(game.get("nombre") or "Juego sin título")
    cover = safe_url(game.get("portada"))
    cover_html = (
        f'<div class="arsenal-registry-cover"><img src="{esc(cover)}" alt="Arte de {title}" loading="lazy" decoding="async"><span>{label}</span></div>'
        if cover else
        f'<div class="arsenal-registry-cover arsenal-registry-cover-fallback"><span>{label}</span><strong>{title}</strong><small>PORTADA OFICIAL PENDIENTE</small></div>'
    )
    categories = "".join(f'<span class="arsenal-category-chip">{esc(item)}</span>' for item in (game.get("categorias") or []))
    description = esc(game.get("descripcion") or "Descripción pendiente de completar con información oficial.")
    metadata = []
    if game.get("plataformas"):
        metadata.append("Plataforma · " + ", ".join(str(item) for item in game["plataformas"]))
    if game.get("ediciones"):
        metadata.append("Ediciones · " + " / ".join(str(item) for item in game["ediciones"]))
    if game.get("modalidad"):
        metadata.append("Modalidad · " + str(game["modalidad"]))
    players = game.get("jugadores")
    if isinstance(players, dict):
        min_players, max_players = players.get("min"), players.get("max")
        metadata.append("Jugadores: " + (str(min_players) if min_players == max_players else f"{min_players}–{max_players}"))
    else:
        metadata.append("Jugadores: cantidad sin verificar")
    meta_html = "".join(f"<li>{esc(item)}</li>" for item in metadata)
    pov_count = sum(len(session.get("pov") or []) for session in sessions)
    evidence = (
        f'{len(sessions)} {"sesión BIT" if len(sessions) == 1 else "sesiones BIT"} · {pov_count} POV disponibles'
        if sessions else
        ("Archivo histórico EXP-001" if game.get("expediente_comercial") else "Sin sesión documentada")
    )
    links = []
    store = safe_url(game.get("tienda"))
    if store:
        links.append(f'<a class="arsenal-store-link" href="{esc(store)}" target="_blank" rel="noopener noreferrer">FICHA OFICIAL ↗</a>')
    source = safe_url(game.get("fuente_jugadores"))
    if source:
        links.append(f'<a class="arsenal-player-source" href="{esc(source)}" target="_blank" rel="noopener noreferrer">FUENTE DE JUGADORES ↗</a>')
    if sessions:
        links.append(
            f'<a class="arsenal-bit-link" href="#{esc(str(sessions[0].get("bit") or "").lower())}">'
            f'BITÁCORA · {len(sessions)} {"SESIÓN" if len(sessions) == 1 else "SESIONES"} · {pov_count} POV →</a>'
        )
    return (
        f'<article class="premium-card arsenal-card arsenal-registry-card" id="arsenal-game-{esc(game.get("id"))}" '
        f'data-arsenal-game="{esc(game.get("id"))}" data-game-id="{esc(game.get("id"))}" '
        f'data-arsenal-state="{state}" data-prerendered="true">'
        f'{cover_html}<div class="arsenal-registry-card-body"><div class="premium-kicker">MISIÓN {index + 1:02d} · {label}</div>'
        f'<h3>{title}</h3><div class="arsenal-registry-categories">{categories}</div>'
        f'<p class="arsenal-registry-description">{description}</p><ul class="arsenal-registry-meta">{meta_html}</ul>'
        f'<div class="arsenal-registry-evidence"><span>{esc(evidence)}</span></div>'
        f'<div class="arsenal-registry-links">{"".join(links)}</div></div></article>'
    )


def render_arsenal_summary(games: dict) -> str:
    catalog = games.get("juegos") or []
    documented = sum(1 for game in catalog if game.get("sesiones"))
    discovery = len(catalog) - documented
    values = (len(catalog), documented, discovery)
    labels = ("JUEGOS ÚNICOS", f"CON SESIÓN BIT · {sum(len(game.get('sesiones') or []) for game in catalog)} SESIONES", "POR DESCUBRIR")
    return "\n".join(f"<article><strong>{value}</strong><span>{label}</span></article>" for value, label in zip(values, labels))


def generated_blocks(games: dict, roster: dict) -> dict[str, str]:
    names = creator_names(roster)
    entries = sessions_for(games)
    return {
        "collab_summary": render_collab_summary(games),
        "collab": "\n".join(render_collab_session(game, session, names) for game, session in entries),
        "arsenal_summary": render_arsenal_summary(games),
        "arsenal": "\n".join(render_arsenal_game(game, index) for index, game in enumerate(games.get("juegos") or [])),
    }


def replace_marked(source: str, key: str, generated: str) -> str:
    start_marker, end_marker = MARKERS[key]
    if source.count(start_marker) != 1 or source.count(end_marker) != 1:
        raise ValueError(f"index.html debe contener una sola pareja de marcadores para {key}.")
    start = source.index(start_marker)
    end = source.index(end_marker)
    if end <= start:
        raise ValueError(f"Los marcadores para {key} están invertidos.")
    return source[:start] + start_marker + "\n" + generated + "\n" + end_marker + source[end + len(end_marker):]


def expected_index(source: str, games: dict, roster: dict) -> str:
    for key, generated in generated_blocks(games, roster).items():
        source = replace_marked(source, key, generated)
    return source


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args()
    try:
        games = json.loads(GAMES_PATH.read_text(encoding="utf-8"))
        roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))
        source = INDEX_PATH.read_text(encoding="utf-8")
        expected = expected_index(source, games, roster)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    if args.check:
        for key, generated in generated_blocks(games, roster).items():
            start_marker, end_marker = MARKERS[key]
            left = source.index(start_marker) + len(start_marker)
            right = source.index(end_marker, left)
            actual = source[left:right].strip("\n")
            if actual != generated:
                limit = min(len(actual), len(generated))
                offset = next((index for index in range(limit) if actual[index] != generated[index]), limit)
                print(
                    f"ERROR: bloque {key} desincronizado en offset {offset}; "
                    f"HTML={actual[max(0, offset - 60):offset + 100]!r}; "
                    f"JSON={generated[max(0, offset - 60):offset + 100]!r}",
                    file=sys.stderr,
                )
                return 1
        if source != expected:
            print("ERROR: el HTML prerenderizado está desincronizado fuera de los bloques generados.", file=sys.stderr)
            return 1
        entries = sessions_for(games)
        print(
            "OK: HTML prerenderizado sincronizado: {} juegos, {} sesiones BIT, {} POV.".format(
                len(games.get("juegos") or []),
                len(entries),
                sum(len(session.get("pov") or []) for _, session in entries),
            )
        )
        return 0
    INDEX_PATH.write_text(expected, encoding="utf-8")
    print("Actualizado el HTML prerenderizado de Bitácora y Arsenal.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
