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
ROSTER_FILE = "data/roster.json"
WINDOW_DAYS = 30
HISTORY_DAYS = 180

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
                raise RuntimeError("Cuenta Twitch inválida en data/roster.json para {}.".format(hero.get("id") or hero.get("name")))
            logins.append(login)
    if not logins:
        raise RuntimeError("No hay canales Twitch registrados en data/roster.json.")
    if len(logins) != len(set(logins)):
        raise RuntimeError("Hay logins Twitch duplicados en data/roster.json.")
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


FOLLOWERS_TOKEN_FILE = "twitch-followers-refresh-token.enc"


def _followers_fernet():
    """Cifrado autenticado para persistir el refresh token rotativo sin publicarlo en claro."""
    key = os.environ.get("TWITCH_FOLLOWERS_TOKEN_KEY", "").strip()
    if not key:
        raise RuntimeError("Falta TWITCH_FOLLOWERS_TOKEN_KEY para cifrar el token OAuth rotativo.")
    try:
        from cryptography.fernet import Fernet
    except ImportError as exc:
        raise RuntimeError("Falta la dependencia cryptography para proteger el token OAuth.") from exc
    return Fernet(key.encode("ascii"))


def get_followers_user_token(now=None):
    """Obtiene un token de usuario sin scopes: permite consultar solo el total público."""
    now = now or datetime.now(timezone.utc)
    fernet = None
    state = None
    if os.path.exists(FOLLOWERS_TOKEN_FILE):
        fernet = _followers_fernet()
        try:
            encrypted = open(FOLLOWERS_TOKEN_FILE, "rb").read()
            state = json.loads(fernet.decrypt(encrypted).decode("utf-8"))
        except Exception as exc:
            raise RuntimeError("No se pudo descifrar el estado OAuth de seguidores; no se reemplazó.") from exc
    else:
        initial_refresh = os.environ.get("TWITCH_FOLLOWERS_REFRESH_TOKEN", "").strip()
        if not initial_refresh:
            return None
        state = {"refresh_token": initial_refresh}

    expires_at = state.get("expires_at")
    if state.get("access_token") and expires_at:
        try:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if expiry.tzinfo and (expiry - now).total_seconds() > 300:
                return state["access_token"]
        except (TypeError, ValueError):
            pass

    if fernet is None:
        fernet = _followers_fernet()
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError("Faltan TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET para renovar el acceso de solo lectura.")
    refresh_token = state.get("refresh_token")
    if not refresh_token:
        raise RuntimeError("El estado OAuth cifrado no contiene refresh_token.")
    form = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }).encode("utf-8")
    result = request_json(
        "https://id.twitch.tv/oauth2/token",
        {"Content-Type": "application/x-www-form-urlencoded"},
        form,
    )
    new_refresh = result.get("refresh_token")
    access_token = result.get("access_token")
    expires_in = result.get("expires_in")
    if not new_refresh or not access_token or not isinstance(expires_in, int):
        raise RuntimeError("Twitch no devolvió un juego completo de tokens OAuth renovados.")
    next_state = {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "expires_at": (now + timedelta(seconds=expires_in)).isoformat().replace("+00:00", "Z"),
    }
    encrypted_state = fernet.encrypt(json.dumps(next_state, separators=(",", ":")).encode("utf-8"))
    with open(FOLLOWERS_TOKEN_FILE, "wb") as handle:
        handle.write(encrypted_state)
    return access_token


def get_channel_followers_total(broadcaster_id, user_token):
    """Consulta exclusivamente total; ignora deliberadamente la lista de identidades."""
    query = urllib.parse.urlencode({"broadcaster_id": str(broadcaster_id)})
    result = request_json(
        "https://api.twitch.tv/helix/channels/followers?" + query,
        {"Client-ID": CLIENT_ID, "Authorization": "Bearer " + user_token},
    )
    total = result.get("total")
    if isinstance(total, bool) or not isinstance(total, int) or total < 0:
        raise RuntimeError("Twitch no devolvió un total de seguidores numérico.")
    return total


def get_channel_schedule(broadcaster_id, token, now):
    """Horarios publicados por el propio canal en Twitch (próximos 14 días). Sin horario publicado no se inventa uno."""
    captured = now.isoformat().replace("+00:00", "Z")
    try:
        result = request_json(
            "https://api.twitch.tv/helix/schedule?broadcaster_id=" + str(broadcaster_id) + "&first=25",
            {"Client-ID": CLIENT_ID, "Authorization": "Bearer " + token},
        )
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return {"status": "not_published", "captured_at": captured, "segments": []}
        return {"status": "unavailable", "captured_at": captured, "segments": []}
    except Exception:
        return {"status": "unavailable", "captured_at": captured, "segments": []}
    data = result.get("data") or {}
    horizon = now + timedelta(days=14)
    segments = []
    for segment in data.get("segments") or []:
        try:
            start = datetime.fromisoformat(str(segment.get("start_time")).replace("Z", "+00:00"))
        except (TypeError, ValueError):
            continue
        if segment.get("canceled_until") or start < now - timedelta(hours=3) or start > horizon:
            continue
        category = segment.get("category") or {}
        segments.append({
            "start_time": segment.get("start_time"),
            "end_time": segment.get("end_time"),
            "title": (segment.get("title") or "")[:120],
            "category": category.get("name"),
            "is_recurring": bool(segment.get("is_recurring")),
        })
    status = "vacation" if data.get("vacation") else ("published" if segments else "not_published")
    return {"status": status, "captured_at": captured, "source": "Twitch Helix · Get Channel Stream Schedule", "segments": segments[:14]}


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


def collection_flags(expected_channels, resolved_channels, sampled_channels, skipped_channels):
    expected = set(expected_channels)
    resolved = set(resolved_channels)
    sampled = set(sampled_channels)
    skipped = set(skipped_channels)
    return {
        "complete": bool(expected) and expected == resolved and expected == sampled,
        "status_complete": bool(expected) and expected == resolved,
        "sampling_complete": bool(expected) and expected == sampled,
        "coverage_complete": bool(expected) and expected == (sampled | skipped)
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
    try:
        followers_user_token = get_followers_user_token(now)
        followers_token_error = None
    except Exception as exc:
        followers_user_token = None
        followers_token_error = str(exc)
        print("AVISO: no se pudo preparar la consulta del total de seguidores: {}".format(exc))

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
        # Conservamos seis meses para ventanas 7/30/90 días y su período anterior.
        # El resumen legado "window" sigue limitado a 30 días.
        cutoff = now - timedelta(days=HISTORY_DAYS)
        snapshots = [
            s for s in snapshots
            if datetime.fromisoformat(s["sampled_at"]) >= cutoff
        ]
        last_snapshot_at = max(valid_times).isoformat().replace("+00:00", "Z") if valid_times else None
        if should_sample:
            last_snapshot_at = now_iso
        previous_followers = previous.get("followers_total")
        followers_total = previous_followers
        followers_captured_at = previous.get("followers_captured_at")
        followers_source = previous.get("followers_source")
        followers_history = list(previous.get("followers_history") or [])
        followers_query_token = followers_user_token or token
        if followers_query_token:
            try:
                followers_total = get_channel_followers_total(user["id"], followers_query_token)
                followers_captured_at = now_iso
                followers_source = "Twitch Helix · total público"
                followers_note = "Total público consultado en Twitch Helix; no se solicitaron permisos de moderación ni se guardó la lista de seguidores."
                followers_status = "fresh"
                today = now_iso[:10]
                daily_point = {"date": today, "captured_at": now_iso, "followers_total": followers_total}
                followers_history = [point for point in followers_history if point.get("date") != today]
                followers_history.append(daily_point)
                followers_history.sort(key=lambda point: point.get("date") or "")
                history_cutoff = (now - timedelta(days=365)).date().isoformat()
                followers_history = [point for point in followers_history if point.get("date", "") >= history_cutoff]
            except Exception as exc:
                followers_note = "No se pudo actualizar el contador en esta ejecución; se conserva la última captura y su fecha. Detalle: {}".format(exc)
                followers_status = "delayed" if previous_followers is not None else "unavailable"
                print("AVISO: seguidores de {} sin actualización: {}".format(login, exc))
        else:
            followers_note = (
                "Pendiente de configurar OAuth de usuario de solo lectura. No requiere moderador ni acceso a identidades."
                if not followers_token_error else
                "Autorización de solo lectura todavía no disponible: " + followers_token_error
            )
            followers_status = "delayed" if previous_followers is not None else "awaiting_authorization"

        channel_data[login] = {
            "login": login,
            "display_name": user.get("display_name", login),
            "description": user.get("description", ""),
            "profile_image_url": user.get("profile_image_url"),
            "twitch_url": "https://twitch.tv/" + login,
            "followers_total": followers_total,
            "followers_captured_at": followers_captured_at,
            "followers_source": followers_source,
            "followers_status": followers_status,
            "followers_note": followers_note,
            "followers_history": followers_history,
            "schedule": get_channel_schedule(user["id"], token, now),
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
        "history_days": HISTORY_DAYS,
        "sampling_interval_minutes": SAMPLE_INTERVAL_MINUTES,
        "active_channels": channels,
        "collection": {
            "started_at": now_iso,
            "expected_channels": len(channels),
            "resolved_channels": len(resolved),
            "sampled_channels": sampled_channels,
            "skipped_channels": skipped_channels,
            **collection_flags(channels, resolved, sampled_channels, skipped_channels),
            "registry_source": ROSTER_FILE,
            "authentication": "Twitch app access token for public channel/stream data; public follower totals and published stream schedules read with the same app token (no user data, no follower list)",
            "followers_total_only": True,
            "followers_list_access": False,
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
