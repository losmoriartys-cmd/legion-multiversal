import json
import os
import urllib.parse
import urllib.request
import urllib.error
import time
from email.utils import parsedate_to_datetime
from datetime import datetime, timedelta, timezone

CLIENT_ID = os.environ.get("TWITCH_CLIENT_ID")
CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET")
ROSTER_FILE = "roster-data.json"
WINDOW_DAYS = 30

def load_active_channels():
    """Lee los canales Twitch desde el modelo de identidad; evita una lista duplicada."""
    with open(ROSTER_FILE, "r", encoding="utf-8") as handle:
        roster = json.load(handle)
    logins = []
    for hero in roster.get("heroes", []):
        accounts = hero.get("accounts") or []
        twitch_accounts = [a for a in accounts if a.get("platform") == "twitch" and a.get("account_type") == "creator_channel"]
        if not twitch_accounts and hero.get("twitch"):
            legacy_login = urllib.parse.urlparse(hero["twitch"]).path.strip("/").split("/")[0].lower()
            if legacy_login:
                logins.append(legacy_login)
        for account in twitch_accounts:
            login = str(account.get("login") or "").strip().lower()
            url = urllib.parse.urlparse(str(account.get("url") or ""))
            if not login or url.scheme != "https" or url.hostname not in {"twitch.tv", "www.twitch.tv"}:
                raise RuntimeError("Cuenta Twitch inválida en roster-data.json para {}.".format(hero.get("id") or hero.get("name")))
            logins.append(login)
    if not logins:
        raise RuntimeError("No hay canales Twitch registrados en roster-data.json.")
    if len(logins) != len(set(logins)):
        raise RuntimeError("Hay logins Twitch duplicados en roster-data.json.")
    return sorted(logins)
SAMPLE_INTERVAL_MINUTES = 55
DATA_FILE = "data.json"


def request_json(url, headers=None, data=None):
    req = urllib.request.Request(url, headers=headers or {}, data=data)
    retryable = {429, 500, 502, 503, 504}
    delays = (2, 4)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code in {400, 401, 403} or exc.code not in retryable or attempt == 2:
                raise
            retry_after = exc.headers.get("Retry-After")
            delay = delays[attempt]
            if retry_after:
                try:
                    delay = max(0, min(30, int(retry_after)))
                except ValueError:
                    try:
                        target = parsedate_to_datetime(retry_after)
                        delay = max(0, min(30, (target - datetime.now(timezone.utc)).total_seconds()))
                    except (TypeError, ValueError, OverflowError):
                        pass
            time.sleep(min(30, delay))
        except urllib.error.URLError:
            if attempt == 2:
                raise
            time.sleep(delays[attempt])
    raise RuntimeError("La solicitud HTTP agotó los reintentos.")


def get_token():
    if not CLIENT_ID:
        raise RuntimeError("Falta la variable TWITCH_CLIENT_ID en el entorno seguro del colector.")
    if not CLIENT_SECRET:
        raise RuntimeError("Falta el secreto TWITCH_CLIENT_SECRET en GitHub Actions.")
    form = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }).encode("utf-8")
    result = request_json(
        "https://id.twitch.tv/oauth2/token",
        {"Content-Type": "application/x-www-form-urlencoded"},
        form
    )
    return result["access_token"]


def helix_get(path, token, params):
    query = urllib.parse.urlencode(params, doseq=True)
    return request_json(
        "https://api.twitch.tv/helix/" + path + "?" + query,
        {"Client-ID": CLIENT_ID, "Authorization": "Bearer " + token}
    ).get("data", [])


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"schema_version": 2, "window_days": WINDOW_DAYS, "channels": {}}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            old = json.load(f)
        if isinstance(old.get("channels"), dict):
            return old
    except (OSError, json.JSONDecodeError):
        pass
    return {"schema_version": 2, "window_days": WINDOW_DAYS, "channels": {}}


def summarize(snapshots, now):
    cutoff = now - timedelta(days=WINDOW_DAYS)
    snapshots = [s for s in snapshots if datetime.fromisoformat(s["sampled_at"]) >= cutoff]
    live = [s for s in snapshots if s.get("is_live") and isinstance(s.get("viewer_count"), int)]
    viewers = [s["viewer_count"] for s in live]
    observed_minutes = 0.0
    estimated_watch_hours = 0.0
    for previous, current in zip(snapshots, snapshots[1:]):
        if not (previous.get("is_live") and current.get("is_live")):
            continue
        if previous.get("stream_id") != current.get("stream_id"):
            continue
        start = datetime.fromisoformat(previous["sampled_at"])
        end = datetime.fromisoformat(current["sampled_at"])
        gap = (end - start).total_seconds() / 60
        if 0 < gap <= SAMPLE_INTERVAL_MINUTES * 2:
            minutes = min(gap, SAMPLE_INTERVAL_MINUTES)
            observed_minutes += minutes
            estimated_watch_hours += current["viewer_count"] * minutes / 60
    game_groups = {}
    daily_groups = {}
    for sample in live:
        game = sample.get("game_name") or "Categoría no informada"
        group = game_groups.setdefault(game, {"samples": 0, "viewers": [], "streams": set()})
        group["samples"] += 1
        if isinstance(sample.get("viewer_count"), int):
            group["viewers"].append(sample["viewer_count"])
        if sample.get("stream_id"):
            group["streams"].add(str(sample["stream_id"]))
        day = sample["sampled_at"][:10]
        daily = daily_groups.setdefault(day, {"samples": 0, "viewers": [], "streams": set()})
        daily["samples"] += 1
        if isinstance(sample.get("viewer_count"), int):
            daily["viewers"].append(sample["viewer_count"])
        if sample.get("stream_id"):
            daily["streams"].add(str(sample["stream_id"]))

    games = [
        {
            "name": name,
            "live_samples": value["samples"],
            "streams_observed": len(value["streams"]),
            "average_viewers_sampled": round(sum(value["viewers"]) / len(value["viewers"]), 1) if value["viewers"] else None,
            "peak_viewers_sampled": max(value["viewers"]) if value["viewers"] else None
        }
        for name, value in game_groups.items()
    ]
    games.sort(key=lambda item: item["live_samples"], reverse=True)
    daily_activity = [
        {
            "date": day,
            "live_samples": value["samples"],
            "streams_observed": len(value["streams"]),
            "average_viewers_sampled": round(sum(value["viewers"]) / len(value["viewers"]), 1) if value["viewers"] else None,
            "peak_viewers_sampled": max(value["viewers"]) if value["viewers"] else None
        }
        for day, value in sorted(daily_groups.items())
    ]
    return {
        "samples_total": len(snapshots),
        "live_samples": len(live),
        "streams_observed": len({s.get("stream_id") for s in live if s.get("stream_id")}),
        "average_viewers_sampled": round(sum(viewers) / len(viewers), 1) if viewers else None,
        "peak_viewers_sampled": max(viewers) if viewers else None,
        "observed_live_hours": round(observed_minutes / 60, 2),
        "estimated_hours_watched": round(estimated_watch_hours, 2),
        "game_breakdown": games,
        "daily_activity": daily_activity,
        "method": "Muestreo propio con cadencia observada cercana a 55 minutos, variable por la programación de GitHub Actions; horas estimadas solo entre muestras consecutivas del mismo directo cuando el intervalo no supera 110 minutos. Categorías y evolución diaria se calculan sobre las muestras observadas."
    }


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0)
    now_iso = now.isoformat().replace("+00:00", "Z")
    channels = load_active_channels()
    token = get_token()
    users = helix_get("users", token, [("login", name) for name in channels])
    streams = helix_get("streams", token, [("user_login", name) for name in channels])
    streams_by_login = {s["user_login"].lower(): s for s in streams}
    resolved = {u["login"].lower() for u in users}
    missing = sorted(set(channels) - resolved)
    if missing:
        raise RuntimeError("Twitch Helix no devolvió todos los canales esperados; no se publican datos parciales: " + ", ".join(missing))
    if len(resolved) != len(channels):
        raise RuntimeError("La respuesta de Twitch contiene canales duplicados o inesperados; se cancela la publicación.")
    old = load_data()
    channel_data = old.get("channels", {})

    sampled_channels = []
    skipped_channels = []
    for user in users:
        login = user["login"].lower()
        previous = channel_data.get(login, {})
        snapshots = previous.get("snapshots", [])
        valid_times = [datetime.fromisoformat(s["sampled_at"].replace("Z", "+00:00")) for s in snapshots if s.get("sampled_at")]
        last_sample = max(valid_times) if valid_times else None
        should_sample = last_sample is None or (now - last_sample) >= timedelta(minutes=45)
        stream = streams_by_login.get(login)
        sample = {
            "sampled_at": now_iso,
            "is_live": bool(stream),
            "viewer_count": stream.get("viewer_count") if stream else None,
            "game_name": stream.get("game_name") if stream else None,
            "title": stream.get("title") if stream else None,
            "stream_id": stream.get("id") if stream else None,
            "started_at": stream.get("started_at") if stream else None
        }
        if should_sample:
            snapshots.append(sample)
            sampled_channels.append(login)
        else:
            skipped_channels.append(login)
        snapshots.sort(key=lambda item: item["sampled_at"])
        cutoff = now - timedelta(days=WINDOW_DAYS)
        snapshots = [
            s for s in snapshots
            if datetime.fromisoformat(s["sampled_at"]) >= cutoff
        ]
        last_snapshot_at = max(valid_times).isoformat().replace("+00:00", "Z") if valid_times else None
        if should_sample:
            last_snapshot_at = now_iso
        channel_data[login] = {
            "login": login,
            "display_name": user.get("display_name", login),
            "description": user.get("description", ""),
            "profile_image_url": user.get("profile_image_url"),
            "twitch_url": "https://twitch.tv/" + login,
            "followers_total": None,
            "followers_note": "No incluido: requiere autorización de usuario/moderador en Twitch.",
            "live": bool(stream),
            "current_viewers": stream.get("viewer_count") if stream else None,
            "current_game": stream.get("game_name") if stream else None,
            "current_title": stream.get("title") if stream else None,
            "stream_started_at": stream.get("started_at") if stream else None,
            "last_status_at": now_iso,
            "last_snapshot_at": last_snapshot_at,
            "updated_at": now_iso,
            "window": summarize(snapshots, now),
            "snapshots": snapshots
        }

    output = {
        "schema_version": 2,
        "source": "Twitch Helix API",
        "window_days": WINDOW_DAYS,
        "sampling_interval_minutes": SAMPLE_INTERVAL_MINUTES,
        "active_channels": channels,
        "collection": {
            "started_at": now_iso,
            "expected_channels": len(channels),
            "resolved_channels": len(resolved),
            "sampled_channels": sampled_channels,
            "skipped_channels": skipped_channels,
            "complete": len(resolved) == len(channels) and len(sampled_channels) + len(skipped_channels) == len(channels),
            "status_complete": len(resolved) == len(channels),
            "sampling_complete": len(sampled_channels) == len(channels),
            "registry_source": ROSTER_FILE,
            "authentication": "Twitch app access token; public Helix endpoints only",
            "private_analytics_access": False
        },
        "archived_channels": [login for login in channel_data if login not in channels],
        "channel_registry_note": "Los canales archivados se conservan para consulta histórica y no se incluyen en los indicadores del roster activo.",
        "updated_at": now_iso,
        "channels": channel_data
    }
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print("Datos Twitch actualizados para {} canales: {}.".format(len(users), ", ".join(channels)))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("ERROR: captura Twitch no publicada: {}".format(exc), file=__import__("sys").stderr)
        raise SystemExit(1)
