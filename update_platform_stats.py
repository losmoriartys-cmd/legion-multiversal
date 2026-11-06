import json, os, urllib.parse, urllib.request
from datetime import datetime, timezone

REGISTRY="platform-registry.json"
OUTPUT="platform-stats.json"
YT="https://www.googleapis.com/youtube/v3"
KICK="https://api.kick.com/public/v1"

def now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

def request(url, headers=None, data=None):
    req=urllib.request.Request(url,headers=headers or {},data=data)
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

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
    with open(REGISTRY,encoding="utf-8") as f: registry=json.load(f)
    captured=now(); result={"schema_version":1,"updated_at":captured,"methodology":"Las métricas se conservan por creador y plataforma. No sumar ni comparar directamente unidades de plataformas distintas.","creators":{},"collection_status":{}}
    ykey=os.getenv("YOUTUBE_API_KEY"); cid=os.getenv("KICK_CLIENT_ID"); secret=os.getenv("KICK_CLIENT_SECRET"); token=None
    for key,creator in registry.get("creators",{}).items():
        item={"display_name":creator.get("display_name",key),"platforms":{}}
        for account in creator.get("accounts",[]):
            platform=account.get("platform"); handle=account.get("handle")
            if not platform or not handle: continue
            try:
                if platform=="youtube":
                    if not ykey: raise EnvironmentError("Falta el secreto YOUTUBE_API_KEY.")
                    item["platforms"][platform]=youtube(handle,ykey)
                elif platform=="kick":
                    if not (cid and secret): raise EnvironmentError("Faltan KICK_CLIENT_ID y KICK_CLIENT_SECRET.")
                    if token is None: token=kick_token(cid,secret)
                    item["platforms"][platform]=kick(handle,token)
                else: raise ValueError("No hay colector para esta plataforma.")
            except Exception as e:
                item["platforms"][platform]={"platform":platform,"handle":handle,"url":account.get("url"),"status":"credentials_required" if isinstance(e,EnvironmentError) else "error","source":"YouTube Data API v3" if platform=="youtube" else "Kick Developer Public API","note":str(e)[:250]}
        result["creators"][key]=item
    result["collection_status"]={"youtube":"enabled" if ykey else "awaiting_secret","kick":"enabled" if cid and secret else "awaiting_secrets","captured_at":captured}
    with open(OUTPUT,"w",encoding="utf-8") as f: json.dump(result,f,ensure_ascii=False,indent=2)
    print("Colector multiplaforma: {} perfiles procesados.".format(len(result["creators"])))

if __name__=="__main__": main()
