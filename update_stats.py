import json
from datetime import datetime
import os
import urllib.request
import urllib.parse

CLIENT_ID = "ec7tx8ufdef9v9b13dtde93g1zbts9"
CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET", "bconf0s6ovedz7b6lp3xgvxc2d9am8")
data_file = "data.json"

canales_twitch = [
    "losmoriartys",
    "ladymoriarty01",
    "TheR0D3R1K",
    "elgabii",
    "capyunaplay",
    "habitos_atomicos",
    "Ardipii",
    "akumazoldyck",
    "daved0608"
]

def obtener_token_twitch():
    url = "https://id.twitch.tv/oauth2/token"
    values = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    data = urllib.parse.urlencode(values).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            return res_data.get("access_token")
    except Exception as e:
        print(f"Error obteniendo token: {e}")
        return None

def consultar_twitch(endpoint, token):
    url = f"https://api.twitch.tv/helix/{endpoint}"
    req = urllib.request.Request(url, headers={
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    })
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error consultando {endpoint}: {e}")
        return None

def main():
    token = obtener_token_twitch()
    datos_actualizados = {
        "ultima_actualizacion": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "integrantes": []
    }

    if not token:
        print("No se pudo autenticar con la API de Twitch.")
        return

    # Consultamos los datos de los usuarios en bloque (Twitch permite hasta 100 con 'login=')
    query_params = "&".join([f"login={c}" for c in canales_twitch])
    users_res = consultar_twitch(f"users?{query_params}", token)
    
    usuarios_dict = {}
    if users_res and users_res.get("data"):
        for user in users_res["data"]:
            usuarios_dict[user["login"].lower()] = user

    for username in canales_twitch:
        user_info = usuarios_dict.get(username.lower())
        stream_log = []
        
        if user_info:
            user_id = user_info["id"]
            
            # Verificamos si el canal está en directo ahora mismo
            live_res = consultar_twitch(f"streams?user_id={user_id}", token)
            if live_res and live_res.get("data"):
                live_data = live_res["data"][0]
                stream_log.append({
                    "start_time": live_data.get("started_at"),
                    "length": "En directo",
                    "watch_time": f"{live_data.get('viewer_count', 0)} viewers",
                    "avg_viewers": live_data.get("viewer_count", 0),
                    "peak_viewers": live_data.get("viewer_count", 0),
                    "followers": 0
                })
            else:
                # Si no está en directo, consultamos los videos archivados
                videos_res = consultar_twitch(f"videos?user_id={user_id}&type=archive&first=5", token)
                if videos_res and videos_res.get("data"):
                    for video in videos_res["data"]:
                        vistas = video.get("view_count", 0)
                        stream_log.append({
                            "start_time": video.get("created_at"),
                            "length": video.get("duration", "0h"),
                            "watch_time": f"{vistas} hrs",
                            "avg_viewers": vistas,
                            "peak_viewers": vistas,
                            "followers": 0
                        })

        # Si no hay registros ni directos ni videos públicos, dejamos la estructura limpia en ceros
        if not stream_log:
            stream_log.append({
                "start_time": "-",
                "length": "0h",
                "watch_time": "0 hrs",
                "avg_viewers": 0,
                "peak_viewers": 0,
                "followers": 0
            })

        # Tomamos métricas del primer registro si existe
        peak_val = stream_log[0]["peak_viewers"] if stream_log else 0

        datos_actualizados["integrantes"].append({
            "nombre": username,
            "stats": {
                "avg_viewers": peak_val,
                "hours_watched": peak_val,
                "followers": 0,
                "peak_viewers": peak_val,
                "hours_streamed": len(stream_log),
                "streams": len(stream_log) if stream_log[0]["length"] != "0h" else 0
            },
            "stream_log": stream_log
        })

    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(datos_actualizados, f, ensure_ascii=False, indent=4)

    print("Sincronización masiva de canales completada.")

if __name__ == "__main__":
    main()
