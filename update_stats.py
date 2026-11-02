#!/usr/bin/env python3
"""Sincroniza métricas verificables de Twitch Helix en data.json.

Get Videos proporciona reproducciones de VOD y duración, NO horas vistas,
espectadores promedio ni pico de espectadores. Esos campos quedan null.
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CLIENT_ID = os.environ.get("TWITCH_CLIENT_ID", "ec7tx8ufdef9v9b13dtde93g1zbts9")
CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET")
DATA_FILE = Path(__file__).with_name("data.json")
PERIOD_DAYS = int(os.environ.get("STATS_PERIOD_DAYS", "30"))
PAGE_SIZE = 100
MAX_PAGES_PER_CHANNEL = 20
API_BASE = "https://api.twitch.tv/helix"
TOKEN_URL = "https://id.twitch.tv/oauth2/token"
CANALES_TWITCH = [
    "losmoriartys", "ladymoriarty01", "TheR0D3R1K", "elgabii090",
    "capyunaplay", "habitos_atomicos", "Ardipii", "akumazoldyck", "daved0608",
]


class TwitchAPIError(RuntimeError):
    pass


def parse_duration_seconds(value):
    parts = re.findall(r"(\d+)([hms])", value or "")
    factors = {"h": 3600, "m": 60, "s": 1}
    return sum(int(amount) * factors[unit] for amount, unit in parts)


def request_json(url, headers=None, data=None, method=None):
    req = Request(url, headers=headers or {}, data=data, method=method)
    try:
        with urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise TwitchAPIError(f"HTTP {exc.code} en Twitch: {detail[:400]}") from exc
    except (URLError, TimeoutError) as exc:
        raise TwitchAPIError(f"Conexión con Twitch fallida: {exc}") from exc


def obtener_token_twitch():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise TwitchAPIError(
            "Faltan TWITCH_CLIENT_ID o TWITCH_CLIENT_SECRET. "
            "Configurá TWITCH_CLIENT_SECRET en GitHub Actions Secrets."
        )
    body = urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }).encode("utf-8")
    result = request_json(
        TOKEN_URL,
        {"Content-Type": "application/x-www-form-urlencoded"},
        body,
        "POST",
    )
    if not result.get("access_token"):
        raise TwitchAPIError("Twitch no devolvió un access_token.")
    return result["access_token"]


def helix(endpoint, token, params):
    url = f"{API_BASE}/{endpoint}?{urlencode(params)}"
    return request_json(url, {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    })


def obtener_vods(user_id, token, cutoff):
    items, cursor = [], None
    for _ in range(MAX_PAGES_PER_CHANNEL):
        params = {"user_id": user_id, "type": "archive", "first": PAGE_SIZE}
        if cursor:
            params["after"] = cursor
        response = helix("videos", token, params)
        page = response.get("data", [])
        if not page:
            break
        older_than_period = False
        for video in page:
            created = datetime.fromisoformat(video["created_at"].replace("Z", "+00:00"))
            if created < cutoff:
                older_than_period = True
                break
            seconds = parse_duration_seconds(video.get("duration"))
            items.append({
                "id": video.get("id"),
                "title": video.get("title"),
                "url": video.get("url"),
                "start_time": video.get("created_at"),
                "length": video.get("duration"),
                "duration_seconds": seconds,
                "video_views": int(video.get("view_count", 0)),
                "source": "Twitch Helix Get Videos",
            })
        if older_than_period:
            break
        cursor = (response.get("pagination") or {}).get("cursor")
        if not cursor:
            break
        time.sleep(0.15)
    return items


def obtener_canal(login, token, cutoff):
    response = helix("users", token, {"login": login})
    users = response.get("data", [])
    if not users:
        return {
            "nombre": login, "status": "not_found",
            "error": "Canal no encontrado.",
            "stats": {
                "followers": None, "avg_viewers": None, "peak_viewers": None,
                "hours_watched": None, "video_views": None,
                "hours_streamed": None, "streams": 0,
            },
            "stream_log": [],
        }
    user = users[0]
    vods = obtener_vods(user["id"], token, cutoff)
    seconds = sum(v["duration_seconds"] for v in vods)
    views = sum(v["video_views"] for v in vods)
    return {
        "nombre": user.get("display_name", login),
        "login": user.get("login", login),
        "user_id": user.get("id"),
        "profile_image_url": user.get("profile_image_url"),
        "status": "ok",
        "stats": {
            "followers": None,
            "avg_viewers": None,
            "peak_viewers": None,
            "hours_watched": None,
            "video_views": views,
            "hours_streamed": round(seconds / 3600, 2),
            "streams": len(vods),
        },
        "stream_log": vods,
    }


def main():
    if not 1 <= PERIOD_DAYS <= 365:
        raise TwitchAPIError("STATS_PERIOD_DAYS debe estar entre 1 y 365.")
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=PERIOD_DAYS)
    token = obtener_token_twitch()
    integrantes = []
    for login in CANALES_TWITCH:
        try:
            integrantes.append(obtener_canal(login, token, cutoff))
            print(f"OK: {login}")
        except TwitchAPIError as exc:
            print(f"ERROR {login}: {exc}", file=sys.stderr)
            integrantes.append({
                "nombre": login, "status": "error", "error": str(exc),
                "stats": {
                    "followers": None, "avg_viewers": None, "peak_viewers": None,
                    "hours_watched": None, "video_views": None,
                    "hours_streamed": None, "streams": None,
                },
                "stream_log": [],
            })
    successes = sum(x["status"] == "ok" for x in integrantes)
    if successes == 0:
        raise TwitchAPIError("Ningún canal se sincronizó; se conserva el data.json anterior.")
    result = {
        "schema_version": 2,
        "ultima_actualizacion": now.isoformat(),
        "periodo_dias": PERIOD_DAYS,
        "fuente": "Twitch Helix API",
        "notas": {
            "video_views": "Reproducciones de VOD publicados en el período; no son horas vistas.",
            "hours_streamed": "Suma de duración de VOD archivados; puede excluir directos sin VOD.",
            "followers": "Requiere token de usuario con moderator:read:followers autorizado por el canal.",
            "avg_viewers": "No lo proporciona Get Videos; requiere muestreo durante directos o fuente analítica autorizada.",
            "peak_viewers": "No lo proporciona Get Videos; requiere muestreo durante directos o fuente analítica autorizada.",
            "hours_watched": "No lo proporciona Get Videos; no se infiere desde view_count.",
        },
        "integrantes": integrantes,
    }
    temp = DATA_FILE.with_suffix(".json.tmp")
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(DATA_FILE)
    print(f"Sincronización: {successes}/{len(integrantes)} canales, período {PERIOD_DAYS} días.")


if __name__ == "__main__":
    try:
        main()
    except TwitchAPIError as exc:
        print(f"ERROR FATAL: {exc}", file=sys.stderr)
        sys.exit(1)
