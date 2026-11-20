"""Public Twitch clips collector for active roster accounts (no private analytics)."""
from __future__ import annotations
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from update_stats import CLIENT_ID, get_token, helix_get, request_json

OUTPUT = Path("clips-data.json")
WINDOW_DAYS = 30
MAX_RESULTS = 100
DISPLAY_LIMIT = 10
MIN_REFRESH_HOURS = 6
HISTORY_DAYS = 180


def iso_utc(value):
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_roster_accounts(path="roster-data.json"):
    with open(path, "r", encoding="utf-8") as handle:
        roster = json.load(handle)
    accounts = []
    for hero in roster.get("heroes", []):
        creator_id = hero.get("id") or hero.get("slug")
        for account in hero.get("accounts") or []:
            if account.get("platform") == "twitch" and account.get("account_type") == "creator_channel":
                login = str(account.get("login") or "").strip().lower()
                if creator_id and login:
                    accounts.append({
                        "creator_id": creator_id,
                        "display_name": hero.get("display_name") or hero.get("name") or creator_id,
                        "login": login,
                        "url": account.get("url") or "https://twitch.tv/" + login,
                    })
    if not accounts:
        raise RuntimeError("No hay cuentas Twitch de creador en roster-data.json.")
    if len({item["login"] for item in accounts}) != len(accounts):
        raise RuntimeError("Hay logins Twitch duplicados en roster-data.json.")
    return accounts


def normalize_clip(raw):
    clip_id = str(raw.get("id") or "").strip()
    url = str(raw.get("url") or "").strip()
    if not clip_id or not (url.startswith("https://www.twitch.tv/") or url.startswith("https://clips.twitch.tv/")):
        return None
    return {
        "id": clip_id, "url": url, "embed_url": raw.get("embed_url"),
        "title": str(raw.get("title") or "Clip sin título"),
        "creator_name": raw.get("creator_name"), "broadcaster_name": raw.get("broadcaster_name"),
        "created_at": raw.get("created_at"),
        "view_count": raw.get("view_count") if isinstance(raw.get("view_count"), int) else None,
        "game_id": raw.get("game_id") or None, "language": raw.get("language") or None,
        "duration": raw.get("duration") if isinstance(raw.get("duration"), (int, float)) else None,
        "thumbnail_url": raw.get("thumbnail_url") if str(raw.get("thumbnail_url") or "").startswith("https://") else None,
        "video_id": raw.get("video_id") or None,
        "vod_offset": raw.get("vod_offset") if isinstance(raw.get("vod_offset"), int) else None,
        "is_featured": raw.get("is_featured") if isinstance(raw.get("is_featured"), bool) else None,
    }


def append_clip_view_history(clips, previous_clips, captured_at, history_days=HISTORY_DAYS):
    """Attach one monotonic daily public view-count point to each currently listed clip."""
    previous_by_id = {
        str(item.get("id")): item
        for item in (previous_clips or [])
        if isinstance(item, dict) and item.get("id")
    }
    today = captured_at[:10]
    capture_date = datetime.fromisoformat(captured_at.replace("Z", "+00:00")).date()
    cutoff = (capture_date - timedelta(days=history_days)).isoformat()
    for clip in clips or []:
        prior = previous_by_id.get(str(clip.get("id"))) or {}
        history_by_day = {}
        for point in prior.get("view_history") or []:
            if not isinstance(point, dict):
                continue
            day = point.get("date")
            count = point.get("views")
            recorded_at = point.get("captured_at")
            if not isinstance(day, str) or day < cutoff or day >= today:
                continue
            if not isinstance(count, int) or isinstance(count, bool) or count < 0:
                continue
            if not isinstance(recorded_at, str):
                continue
            previous_point = history_by_day.get(day)
            if previous_point is None or recorded_at > previous_point.get("captured_at", ""):
                history_by_day[day] = {
                    "date": day, "captured_at": recorded_at, "views": count
                }
        view_count = clip.get("view_count")
        if isinstance(view_count, int) and not isinstance(view_count, bool) and view_count >= 0:
            history_by_day[today] = {
                "date": today, "captured_at": captured_at, "views": view_count
            }
        clip["view_history"] = [history_by_day[day] for day in sorted(history_by_day)]
    return clips


def read_previous():
    try:
        with OUTPUT.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
        return value if isinstance(value, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def collect(now=None):
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).replace(microsecond=0)
    now_iso = iso_utc(now)
    start_iso = iso_utc(now - timedelta(days=WINDOW_DAYS))
    accounts = load_roster_accounts()
    token = get_token()
    users = helix_get("users", token, [("login", account["login"]) for account in accounts])
    users_by_login = {str(user.get("login") or "").lower(): user for user in users}
    unresolved = [item["login"] for item in accounts if item["login"] not in users_by_login]
    if unresolved:
        raise RuntimeError("Twitch Helix no resolvió todas las cuentas: " + ", ".join(unresolved))
    previous = read_previous().get("creators") or {}
    creators, errors = {}, []
    for account in accounts:
        key = account["creator_id"]
        old = previous.get(key) or {}
        broadcaster_id = str(users_by_login[account["login"]].get("id") or "")
        if not broadcaster_id:
            message = "Twitch no devolvió broadcaster_id."
            errors.append(account["login"] + ": " + message)
            creators[key] = {**old, "display_name": account["display_name"], "login": account["login"], "url": account["url"], "status": "error", "captured_at": old.get("captured_at"), "clips": old.get("clips") or [], "error": message}
            continue
        params = urlencode([
            ("broadcaster_id", broadcaster_id), ("started_at", start_iso),
            ("ended_at", now_iso), ("first", str(MAX_RESULTS)),
        ])
        try:
            payload = request_json("https://api.twitch.tv/helix/clips?" + params, {
                "Client-ID": CLIENT_ID, "Authorization": "Bearer " + token,
            })
            raw = payload.get("data") or []
            clips = [clip for item in raw if (clip := normalize_clip(item))]
            clips = append_clip_view_history(clips, old.get("clips") or [], now_iso)
            creators[key] = {
                "display_name": account["display_name"], "login": account["login"],
                "broadcaster_id": broadcaster_id, "url": account["url"],
                "status": "ok" if clips else "empty", "captured_at": now_iso,
                "period": {"from": start_iso, "to": now_iso, "days": WINDOW_DAYS},
                "clips": clips[:DISPLAY_LIMIT], "result_count": len(raw),
                "displayed_count": min(len(clips), DISPLAY_LIMIT),
            }
        except Exception as exc:
            errors.append(account["login"] + ": " + str(exc)[:180])
            creators[key] = {
                **old, "display_name": account["display_name"], "login": account["login"],
                "url": account["url"], "status": "error", "captured_at": old.get("captured_at"),
                "clips": old.get("clips") or [],
                "error": "No se pudo actualizar esta cuenta; se conserva la última captura correcta.",
            }
    return {
        "schema_version": 1, "source": "Twitch Helix Get Clips",
        "captured_at": now_iso, "window_days": WINDOW_DAYS,
        "selection": {
            "max_results_requested_per_channel": MAX_RESULTS,
            "max_results_displayed_per_channel": DISPLAY_LIMIT,
            "ordering": "API: descending view_count",
            "methodology": "Clips públicos del broadcaster_id durante los últimos 30 días. Se solicitan hasta 100 resultados ordenados por visualizaciones según Twitch Helix y se muestran hasta 10. Las visualizaciones por clip se capturan una vez por día durante hasta 180 días desde que el clip entra en la selección; el crecimiento se calcula solo desde la primera captura disponible. Muestra limitada; no es inventario exhaustivo ni selección editorial.",
            "view_history_days": HISTORY_DAYS,
        },
        "collection": {
            "expected_channels": len(accounts),
            "successful_channels": sum(1 for item in creators.values() if item.get("status") in {"ok", "empty"}),
            "failed_channels": len(errors), "complete": not errors, "errors": errors,
        },
        "creators": creators,
    }


def main():
    previous = read_previous()
    timestamp = previous.get("captured_at")
    if timestamp:
        try:
            age = datetime.now(timezone.utc) - datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            if age < timedelta(hours=MIN_REFRESH_HOURS):
                print("Clips Twitch: se conserva la captura de {} (intervalo mínimo: {} h).".format(timestamp, MIN_REFRESH_HOURS))
                return 0
        except (ValueError, TypeError):
            pass
    result = collect()
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Clips Twitch: {}/{} canales actualizados; {} con error.".format(
        result["collection"]["successful_channels"], result["collection"]["expected_channels"],
        result["collection"]["failed_channels"],
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
