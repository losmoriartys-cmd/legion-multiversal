import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

CLIENT_ID = os.environ.get("TWITCH_CLIENT_ID") or "ec7tx8ufdef9v9b13dtde93g1zbts9"
CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET")
CHANNELS = [
    "losmoriartys", "ladymoriarty01", "ther0d3r1k",
    "habitos_atomicos", "ardipii", "akumazoldyck", "daved0608"
]
WINDOW_DAYS = 30
SAMPLE_INTERVAL_MINUTES = 15
DATA_FILE = "data.json"


def request_json(url, headers=None, data=None):
    req = urllib.request.Request(url, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get_token():
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
        "method": "Muestreo propio cada 15 minutos; horas estimadas solo entre muestras consecutivas del mismo directo. Categorías y evolución diaria se calculan sobre las muestras observadas."
    }


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0)
    now_iso = now.isoformat().replace("+00:00", "Z")
    token = get_token()
    users = helix_get("users", token, [("login", name) for name in CHANNELS])
    streams = helix_get("streams", token, [("user_login", name) for name in CHANNELS])
    streams_by_login = {s["user_login"].lower(): s for s in streams}
    resolved = {u["login"].lower() for u in users}
    missing = sorted(set(CHANNELS) - resolved)
    if missing:
        raise RuntimeError("Twitch Helix no devolvió todos los canales esperados; no se publican datos parciales: " + ", ".join(missing))
    if len(resolved) != len(CHANNELS):
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
        should_sample = last_sample is None or (now - last_sample) >= timedelta(minutes=10)
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
            "updated_at": now_iso,
            "window": summarize(snapshots, now),
            "snapshots": snapshots
        }

    output = {
        "schema_version": 2,
        "source": "Twitch Helix API",
        "window_days": WINDOW_DAYS,
        "sampling_interval_minutes": SAMPLE_INTERVAL_MINUTES,
        "active_channels": CHANNELS,
        "collection": {
            "started_at": now_iso,
            "expected_channels": len(CHANNELS),
            "resolved_channels": len(resolved),
            "sampled_channels": sampled_channels,
            "skipped_channels": skipped_channels,
            "complete": len(resolved) == len(CHANNELS) and len(sampled_channels) + len(skipped_channels) == len(CHANNELS)
        },
        "archived_channels": [login for login in channel_data if login not in CHANNELS],
        "channel_registry_note": "Los canales archivados se conservan para consulta histórica y no se incluyen en los indicadores del roster activo.",
        "updated_at": now_iso,
        "channels": channel_data
    }
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print("Datos Twitch actualizados para {} canales.".format(len(users)))


if __name__ == "__main__":
    main()
