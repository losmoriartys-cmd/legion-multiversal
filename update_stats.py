#!/usr/bin/env python3
"""Sincroniza métricas públicas verificables de los canales Twitch del Instituto.
Get Videos no ofrece horas vistas, promedio/pico históricos ni seguidores.
"""
import json, os, re, sys, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CLIENT_ID = os.environ.get("TWITCH_CLIENT_ID", "ec7tx8ufdef9v9b13dtde93g1zbts9")
CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET")
DATA_FILE = Path(__file__).with_name("stats-data.json")
SAMPLES_FILE = Path(__file__).with_name("viewer_samples.json")
PERIOD_DAYS = int(os.environ.get("STATS_PERIOD_DAYS", "30"))
API = "https://api.twitch.tv/helix"
TOKEN_URL = "https://id.twitch.tv/oauth2/token"
CHANNELS = [
    "losmoriartys", "ladymoriarty01", "TheR0D3R1K", "capyunaplay",
    "habitos_atomicos", "Ardipii", "akumazoldyck", "elgabii090", "daved0608"
]
MAX_PAGES = 20

class TwitchAPIError(RuntimeError): pass

def request_json(url, headers=None, data=None, method=None):
    req = Request(url, headers=headers or {}, data=data, method=method)
    try:
        with urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise TwitchAPIError(f"HTTP {exc.code}: {detail[:300]}") from exc
    except (URLError, TimeoutError) as exc:
        raise TwitchAPIError(f"Conexión Twitch: {exc}") from exc

def token():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise TwitchAPIError("Falta TWITCH_CLIENT_SECRET en GitHub Actions Secrets.")
    body = urlencode({"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET,
                      "grant_type": "client_credentials"}).encode()
    result = request_json(TOKEN_URL, {"Content-Type":"application/x-www-form-urlencoded"}, body, "POST")
    if not result.get("access_token"): raise TwitchAPIError("Twitch no devolvió access_token.")
    return result["access_token"]

def helix(endpoint, access, params):
    return request_json(f"{API}/{endpoint}?{urlencode(params)}",
        {"Client-ID":CLIENT_ID, "Authorization":f"Bearer {access}"})

def duration_seconds(value):
    return sum(int(n)*{"h":3600,"m":60,"s":1}[u] for n,u in re.findall(r"(\d+)([hms])", value or ""))

def fetch_vods(uid, access, cutoff):
    rows, cursor = [], None
    for _ in range(MAX_PAGES):
        params={"user_id":uid,"type":"archive","first":100}
        if cursor: params["after"]=cursor
        page=helix("videos",access,params)
        data=page.get("data",[])
        if not data: break
        stop=False
        for v in data:
            created=datetime.fromisoformat(v["created_at"].replace("Z","+00:00"))
            if created < cutoff: stop=True; break
            rows.append({"id":v.get("id"),"title":v.get("title"),"url":v.get("url"),
                "created_at":v.get("created_at"),"duration":v.get("duration"),
                "duration_seconds":duration_seconds(v.get("duration")),
                "video_views":int(v.get("view_count") or 0),"game_id":v.get("game_id") or None})
        if stop: break
        cursor=(page.get("pagination") or {}).get("cursor")
        if not cursor: break
        time.sleep(.12)
    return rows

def game_names(ids, access):
    ids=sorted({str(x) for x in ids if x})
    result={}
    for i in range(0,len(ids),100):
        batch=ids[i:i+100]
        if not batch: continue
        params=[("id",x) for x in batch]
        url=API+"/games?"+ "&".join(f"id={x}" for x in batch)
        data=request_json(url,{"Client-ID":CLIENT_ID,"Authorization":f"Bearer {access}"})
        for g in data.get("data",[]): result[g["id"]]=g.get("name","Categoría desconocida")
    return result

def follower_total(uid, access):
    return int(helix("channels/followers", access, {"broadcaster_id":uid,"first":1}).get("total", 0))

def live_status(uid, login, access):
    rows=helix("streams",access,{"user_id":uid,"first":1}).get("data",[])
    if not rows:
        return {"is_live":False,"title":None,"game_id":None,"game_name":None,
                "viewer_count":None,"started_at":None,"url":f"https://twitch.tv/{login}"}
    x=rows[0]
    return {"is_live":True,"title":x.get("title"),"game_id":x.get("game_id"),
        "game_name":None,"viewer_count":x.get("viewer_count"),"started_at":x.get("started_at"),
        "url":f"https://twitch.tv/{login}"}

def channel(login, access, cutoff):
    users=helix("users",access,{"login":login}).get("data",[])
    if not users:
        return {"login":login,"status":"not_found","error":"Canal no encontrado en Twitch.",
            "stats":empty_stats(),"live":{"is_live":False},"games":[],"vods":[]}
    u=users[0]; vods=fetch_vods(u["id"],access,cutoff); live=live_status(u["id"],login,access); followers=follower_total(u["id"],access)
    names=game_names([v["game_id"] for v in vods]+[live.get("game_id")],access)
    by_game={}
    for v in vods:
        v["game_name"]=names.get(v["game_id"],"Categoría no informada")
        key=v["game_name"]; g=by_game.setdefault(key,{"game":key,"streams":0,"duration_seconds":0,"video_views":0})
        g["streams"]+=1; g["duration_seconds"]+=v["duration_seconds"]; g["video_views"]+=v["video_views"]
    for v in vods: v.pop("game_id",None)
    games=sorted([dict(g,hours_streamed=round(g["duration_seconds"]/3600,2)) for g in by_game.values()],
                 key=lambda x:x["hours_streamed"],reverse=True)
    live["game_name"]=names.get(live.get("game_id")) if live.get("game_id") else None
    live.pop("game_id",None)
    secs=sum(v["duration_seconds"] for v in vods)
    return {"login":u.get("login",login),"display_name":u.get("display_name",login),
        "user_id":u["id"],"profile_image_url":u.get("profile_image_url"),"channel_url":f"https://twitch.tv/{login}",
        "status":"ok","live":live,"games":games,"vods":vods,
        "stats":{"followers":followers,"avg_viewers":None,"peak_viewers":None,"avg_viewers_sampled":None,"peak_viewers_sampled":None,"viewer_samples":0,"hours_watched":None,
            "video_views":sum(v["video_views"] for v in vods),"hours_streamed":round(secs/3600,2),
            "streams":len(vods)}}

def load_samples():
    if not SAMPLES_FILE.exists(): return {"schema_version":1,"samples":[]}
    try:
        obj=json.loads(SAMPLES_FILE.read_text(encoding="utf-8"))
        if isinstance(obj,dict) and isinstance(obj.get("samples"),list): return obj
    except (OSError, json.JSONDecodeError): pass
    raise TwitchAPIError("viewer_samples.json está dañado; se evita sobrescribir el historial.")

def record_samples(members, now):
    store=load_samples(); stamp=now.isoformat()
    for item in members:
        live=item.get("live") or {}
        if item.get("status")=="ok" and live.get("is_live") and live.get("viewer_count") is not None:
            store["samples"].append({"login":item["login"],"sampled_at":stamp,"viewer_count":int(live["viewer_count"])})
    cutoff=now-timedelta(days=PERIOD_DAYS)
    store["samples"]=[x for x in store["samples"] if datetime.fromisoformat(x["sampled_at"].replace("Z","+00:00")) >= cutoff]
    store["updated_at"]=stamp
    temp=SAMPLES_FILE.with_suffix(".json.tmp")
    temp.write_text(json.dumps(store,ensure_ascii=False,indent=2),encoding="utf-8"); temp.replace(SAMPLES_FILE)
    by_login={}
    for sample in store["samples"]: by_login.setdefault(sample["login"],[]).append(sample["viewer_count"])
    for item in members:
        values=by_login.get(item.get("login"),[])
        if item.get("status")=="ok":
            item["stats"]["avg_viewers_sampled"]=round(sum(values)/len(values),2) if values else None
            item["stats"]["peak_viewers_sampled"]=max(values) if values else None
            item["stats"]["viewer_samples"]=len(values)

def empty_stats():
    return {"followers":None,"avg_viewers":None,"peak_viewers":None,"avg_viewers_sampled":None,"peak_viewers_sampled":None,"viewer_samples":0,"hours_watched":None,
            "video_views":None,"hours_streamed":None,"streams":None}

def main():
    if not 1 <= PERIOD_DAYS <= 365: raise TwitchAPIError("Período inválido (1-365 días).")
    now=datetime.now(timezone.utc); cutoff=now-timedelta(days=PERIOD_DAYS); access=token()
    members=[]
    for login in CHANNELS:
        try:
            item=channel(login,access,cutoff); members.append(item)
            print(f"{item['status']}: {login} · {len(item.get('vods',[]))} VODs")
        except TwitchAPIError as exc:
            print(f"ERROR {login}: {exc}",file=sys.stderr)
            members.append({"login":login,"status":"error","error":str(exc),"stats":empty_stats(),
                "live":{"is_live":False},"games":[],"vods":[]})
    record_samples(members,now)
    ok=sum(x["status"]=="ok" for x in members)
    if ok==0: raise TwitchAPIError("Ningún canal sincronizado; no se sobrescribe el último archivo válido.")
    result={"schema_version":4,"updated_at":now.isoformat(),"period_days":PERIOD_DAYS,
        "source":"Twitch Helix API","refresh_minutes":5,
        "methodology":{
            "hours_streamed":"Suma de duración de VODs archivados creados en el período; puede excluir directos sin VOD.",
            "video_views":"Suma de view_count de los VODs del período; no equivale a horas vistas.",
            "games":"Categoría de Twitch asociada a cada VOD; horas calculadas sumando la duración de VODs por categoría.",
            "live":"Estado consultado con Get Streams en el momento de sincronización; actualización programada cada cinco minutos.",
            "followers":"Total consultado por Get Channel Followers; Twitch permite devolver solo el total sin autorización individual.",
            "avg_viewers":"El promedio oficial histórico se carga desde Twitch Creator Dashboard Analytics; avg_viewers_sampled es el promedio de muestras cada cinco minutos durante directos.",
            "peak_viewers":"El máximo oficial histórico se carga desde Twitch Creator Dashboard Analytics; peak_viewers_sampled es el mayor recuento observado en las muestras cada cinco minutos.",
            "viewer_sampling":"Muestras solo cuando el canal figura en directo; intervalo objetivo cinco minutos. El promedio es aproximado y el pico es el máximo observado; pueden perderse picos entre muestras.",
            "hours_watched":"No disponible mediante Get Videos; no se calcula a partir de reproducciones."
        },"channels_total":len(CHANNELS),"channels_synced":ok,"channels":members}
    temp=DATA_FILE.with_suffix(".json.tmp")
    temp.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    temp.replace(DATA_FILE)
    print(f"Sincronizados {ok}/{len(CHANNELS)} canales.")
if __name__=="__main__":
    try: main()
    except TwitchAPIError as exc:
        print(f"ERROR FATAL: {exc}",file=sys.stderr); sys.exit(1)

# Trigger de validación inicial en la rama de desarrollo.
