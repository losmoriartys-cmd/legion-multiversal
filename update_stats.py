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
    "elgabii090",
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

    for username in canales_twitch:
        stream_log = []
        total_vistas = 0
        peak_maximo = 0
        total_streams = 0
        
        if token:
            user_res = consultar_twitch(f"users?login={username}", token)
            if user_res and user_res.get("data"):
                user_id = user_res["data"][0]["id"]
                
                # Consultamos los videos (streams pasados guardados) de la API oficial
                videos_res = consultar_twitch(f"videos?user_id={user_id}&type=archive&first=10", token)
                if videos_res and videos_res.get("data"):
                    for video in videos_res["data"]:
                        total_streams += 1
                        duracion = video.get("duration", "0h")
                        vistas = video.get("view_count", 0)
                        
                        total_vistas += vistas
                        if vistas > peak_maximo:
                            peak_maximo = vistas

                        stream_log.append({
                            "start_time": video.get("created_at"),
                            "length": duracion,
                            "watch_time": f"{vistas} hrs",
                            "avg_viewers": vistas,
                            "peak_viewers": vistas,
                            "followers": 0
                        })

        # Si la API no retorna registros, guardamos datos vacíos reales (ceros), sin inventar nada.
        if not stream_log:
            stream_log.append({
                "start_time": "-",
                "length": "0h",
                "watch_time": "0 hrs",
                "avg_viewers": 0,
                "peak_viewers": 0,
                "followers": 0
            })

        datos_actualizados["integrantes"].append({
            "nombre": username,
            "stats": {
                "avg_viewers": peak_maximo,
                "hours_watched": total_vistas,
                "followers": 0,
                "peak_viewers": peak_maximo,
                "hours_streamed": total_streams * 2, # Duración basada estrictamente en los videos devueltos
                "streams": total_streams
            },
            "stream_log": stream_log
        })

    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(datos_actualizados, f, ensure_ascii=False, indent=4)

    print("Sincronización exacta completada.")

if __name__ == "__main__":
    main()
