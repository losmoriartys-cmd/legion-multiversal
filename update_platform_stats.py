import json, os, urllib.parse, urllib.request, urllib.error, time
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone

ROSTER="roster-data.json"
OUTPUT="platform-stats.json"

def load_creator_accounts():
    """Usa las cuentas del roster como registro; no mantiene una segunda lista manual."""
    with open(ROSTER, encoding="utf-8") as handle:
        roster = json.load(handle)
    creators = {}
    for hero in roster.get("heroes", []):
        accounts = [
            account for account in hero.get("accounts", [])
            if account.get("platform") in {"youtube", "kick"}
            and (account.get("collection") or {}).get("mode") in {"public_api_key", "public_client_credentials"}
        ]
        if accounts:
            creators[hero.get("id") or hero.get("slug")] = {
                "display_name": hero.get("display_name") or hero.get("name"),
                "accounts": accounts
            }
    return creators
YT="https://www.googleapis.com/youtube/v3"
KICK="https://api.kick.com/public/v1"

def now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

def request(url, headers=None, data=None):
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

def url(base,path,params):
    return base+"/"+path+"?"+urllib.parse.urlencode(params,doseq=True)

def youtube(handle,key):
    ch=request(url(YT,"channels",{"part":"snippet,statistics,contentDetails","forHandle":handle.lstrip("@"),"key":key})).get("items",[])
    if not ch: raise RuntimeError("No se encontró el canal de YouTube configurado.")
    c=ch[0]; sn=c.get("snippet",{}); st=c.get("statistics",{})
    uploads=c.get("contentDetails",{}).get("relatedPlaylists",{}).get("uploads")
    videos=[]
    if uploads:
        items=request(url(YT,"playlistItems",{"part":"snippet,contentDetails","playlistId":uploads,"maxResults":10,"key":key})).get("items",[])
        ids=[x.get("contentDetails",{}).get("videoId") for x in items if x.get("contentDetails",{}).get("videoId")]
        if ids:
            rows=request(url(YT,"videos",{"part":"snippet,statistics,contentDetails","id":",".join(ids),"key":key})).get("items",[])
            videos=[{"video_id":v.get("id"),"title":v.get("snippet",{}).get("title"),"published_at":v.get("snippet",{}).get("publishedAt"),"views":int(v.get("statistics",{}).get("viewCount",0)),"likes":int(v["statistics"]["likeCount"]) if "likeCount" in v.get("statistics",{}) else None,"comments":int(v["statistics"]["commentCount"]) if "commentCount" in v.get("statistics",{}) else None,"url":"https://www.youtube.com/watch?v="+v.get("id","")} for v in rows]
    return {"platform":"youtube","handle":handle,"url":"https://www.youtube.com/"+(handle if handle.startswith("@") else "@"+handle),"display_name":sn.get("title"),"thumbnail_url":(sn.get("thumbnails",{}).get("high") or sn.get("thumbnails",{}).get("default") or {}).get("url"),"metrics":{"subscribers":int(st["subscriberCount"]) if "subscriberCount" in st else None,"total_views":int(st["viewCount"]) if "viewCount" in st else None,"videos_total":int(st["videoCount"]) if "videoCount" in st else None},"recent_videos":videos,"source":"YouTube Data API v3","status":"verified","methodology":"Datos públicos acumulados del canal y hasta 10 videos recientes. El contador de suscriptores puede estar redondeado por YouTube."}

HISTORY_DAYS = 180


def append_history(record, captured_at):
    """Conserva una observación diaria UTC para crecimiento a 7/30/90 y comparativas."""
    history = record.get("history")
    if not isinstance(history, list):
        history = []
    today = captured_at[:10]
    history = [
        item for item in history
        if isinstance(item, dict) and isinstance(item.get("captured_at"), str)
        and item.get("captured_at", "")[:10] != today
    ]
    history.append({
        "captured_at": captured_at,
        "metrics": record.get("metrics") or {}
    })
    cutoff = (datetime.fromisoformat(captured_at.replace("Z", "+00:00")).date() - __import__("datetime").timedelta(days=HISTORY_DAYS)).isoformat()
    history = [item for item in history if item.get("captured_at", "")[:10] >= cutoff]
    history.sort(key=lambda item: item.get("captured_at") or "")
    record["history"] = history
    return record


def append_video_history(videos, previous_videos, captured_at):
    """Añade una captura diaria de views/likes/comments por video de YouTube."""
    previous_by_id = {
        str(item.get("video_id")): item
        for item in (previous_videos or [])
        if isinstance(item, dict) and item.get("video_id")
    }
    today = captured_at[:10]
    cutoff = (datetime.fromisoformat(captured_at.replace("Z", "+00:00")).date() - __import__("datetime").timedelta(days=HISTORY_DAYS)).isoformat()
    for video in videos or []:
        prior = previous_by_id.get(str(video.get("video_id"))) or {}
        history = list(prior.get("view_history") or [])
        point = {
            "date": today,
            "captured_at": captured_at,
            "views": video.get("views"),
            "likes": video.get("likes"),
            "comments": video.get("comments"),
        }
        history = [item for item in history if item.get("date") != today]
        if isinstance(point["views"], int) and point["views"] >= 0:
            history.append(point)
        history = [
            item for item in history
            if isinstance(item, dict) and isinstance(item.get("date"), str)
            and item["date"] >= cutoff and isinstance(item.get("views"), int)
            and item["views"] >= 0
        ]
        history.sort(key=lambda item: item["date"])
        video["view_history"] = history
    return videos


def kick_token(cid,secret):
    form=urllib.parse.urlencode({"grant_type":"client_credentials","client_id":cid,"client_secret":secret}).encode()
    return request("https://id.kick.com/oauth/token",{"Content-Type":"application/x-www-form-urlencoded"},form)["access_token"]

def kick(slug,token):
    data=request(url(KICK,"channels",{"slug":slug}),{"Authorization":"Bearer "+token,"Accept":"application/json"}).get("data",[])
    if not data: raise RuntimeError("No se encontró el canal de Kick configurado.")
    c=data[0]; stream=c.get("stream") or {}; category=c.get("category") or {}
    # No persistir stream completo: puede incluir stream.key.
    return {"platform":"kick","handle":slug,"url":"https://kick.com/"+slug,"display_name":c.get("slug",slug),"description":c.get("channel_description"),"thumbnail_url":stream.get("thumbnail"),"metrics":{"live":bool(stream.get("is_live")),"current_viewers":stream.get("viewer_count") if stream.get("is_live") else None,"category":category.get("name"),"stream_title":c.get("stream_title"),"stream_started_at":stream.get("start_time") if stream.get("is_live") else None},"source":"Kick Developer Public API","status":"verified","methodology":"Estado y audiencia actual según la API pública; no equivale a analítica histórica."}

def main():
    registry_creators = load_creator_accounts()
    captured = now()
    old = {}
    if os.path.exists(OUTPUT):
        try:
            with open(OUTPUT, encoding="utf-8") as handle:
                old = json.load(handle)
        except (OSError, json.JSONDecodeError):
            old = {}
    old_creators = old.get("creators") or {}
    result = {
        "schema_version": 1,
        "updated_at": old.get("updated_at"),
        "methodology": old.get("methodology", "Las métricas se conservan por creador y plataforma. No sumar ni comparar directamente unidades de plataformas distintas."),
        "creators": {},
        "collection_status": {}
    }
    ykey = os.getenv("YOUTUBE_API_KEY")
    cid = os.getenv("KICK_CLIENT_ID")
    secret = os.getenv("KICK_CLIENT_SECRET")
    token = None
    successful = 0
    failures = 0
    for key, creator in registry_creators.items():
        item = {
            "display_name": creator.get("display_name", key),
            "platforms": {}
        }
        old_platforms = (old_creators.get(key) or {}).get("platforms") or {}
        for account in creator.get("accounts", []):
            platform = account.get("platform")
            handle = account.get("handle")
            if not platform or not handle:
                continue
            try:
                if platform == "youtube":
                    if not ykey:
                        raise EnvironmentError("Falta el secreto YOUTUBE_API_KEY.")
                    record = youtube(handle, ykey)
                    record["recent_videos"] = append_video_history(
                        record.get("recent_videos") or [],
                        old_platforms.get("youtube", {}).get("recent_videos") or [],
                        captured,
                    )
                elif platform == "kick":
                    if not (cid and secret):
                        raise EnvironmentError("Faltan KICK_CLIENT_ID y KICK_CLIENT_SECRET.")
                    if token is None:
                        token = kick_token(cid, secret)
                    record = kick(handle, token)
                else:
                    raise ValueError("No hay colector para esta plataforma.")
                record["captured_at"] = captured
                record = append_history(record, captured)
                item["platforms"][platform] = record
                successful += 1
            except Exception as exc:
                failures += 1
                previous = old_platforms.get(platform)
                if isinstance(previous, dict):
                    record = dict(previous)
                else:
                    record = {
                        "platform": platform,
                        "handle": handle,
                        "url": account.get("url"),
                        "source": "YouTube Data API v3" if platform == "youtube" else "Kick Developer Public API"
                    }
                record["status"] = "credentials_required" if isinstance(exc, EnvironmentError) else "error"
                record["note"] = str(exc)[:250]
                record["last_error_at"] = captured
                if isinstance(record.get("history"), list):
                    record["history"] = record["history"][-90:]
                item["platforms"][platform] = record
        result["creators"][key] = item
    if successful:
        result["updated_at"] = captured
    result["collection_status"] = {
        "youtube": "enabled" if ykey else "awaiting_secret",
        "kick": "enabled" if cid and secret else "awaiting_secrets",
        "captured_at": captured,
        "successful_accounts": successful,
        "failed_accounts": failures,
        "complete": failures == 0
    }
    with open(OUTPUT, "w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print("Colector multiplataforma: {} perfiles procesados; {} cuentas correctas; {} con error.".format(
        len(result["creators"]), successful, failures
    ))
    if failures:
        raise SystemExit(1)
if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("ERROR: captura multiplataforma no publicada: {}".format(exc), file=__import__("sys").stderr)
        raise SystemExit(1)
