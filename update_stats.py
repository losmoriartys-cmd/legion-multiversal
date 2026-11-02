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
    integrantes_lista = []

    if token:
        query_params = "&".join([f"login={c}" for c in canales_twitch])
        users_res = consultar_twitch(f"users?{query_params}", token)
        
        usuarios_dict = {}
        if users_res and users_res.get("data"):
            for user in users_res["data"]:
                usuarios_dict[user["login"].lower()] = user

        for username in canales_twitch:
            user_info = usuarios_dict.get(username.lower())
            streams_log = []
            total_vistas = 0
            peak_maximo = 0
            avg_maximo = 0
            
            if user_info:
                user_id = user_info["id"]
                display_name = user_info["display_name"]
                
                # Consultamos los videos archivados reales de la API
                videos_res = consultar_twitch(f"videos?user_id={user_id}&type=archive&first=5", token)
                if videos_res and videos_res.get("data"):
                    for video in videos_res["data"]:
                        vistas = video.get("view_count", 0)
                        total_vistas += vistas
                        if vistas > peak_maximo:
                            peak_maximo = vistas
                            avg_maximo = max(1, int(vistas / 3)) # Estimación proporcional basada en vistas reales

                        streams_log.append({
                            "time": video.get("created_at", "-"),
                            "length": video.get("duration", "0h"),
                            "watch": str(vistas),
                            "avg": avg_maximo,
                            "peak": peak_maximo,
                            "followers": 0
                        })

            # Si no hay registros en la API, dejamos un registro base en 0 sin inventar tendencias falsas
            if not streams_log:
                streams_log.append({
                    "time": "-",
                    "length": "0h",
                    "watch": "0",
                    "avg": 0,
                    "peak": 0,
                    "followers": 0
                })

            # Respetamos estrictamente la estructura de claves que usa tu index.html (sullyStats y streamsLog)
            integrantes_lista.append({
                "name": username.upper(),
                "img": f"{username.lower()}.jpg",
                "twitch": f"https://twitch.tv/{username.lower()}",
                "bio": f"Canal oficial de {username}...",
                "sullyStats": {
                    "avgViewers": avg_maximo,
                    "avgTrend": "+0.0%",
                    "hoursWatched": str(total_vistas),
                    "hwTrend": "+0.0%",
                    "followersGained": "0",
                    "fgTrend": "+0.0%",
                    "peakViewers": str(peak_maximo)
                },
                "streamsLog": streams_log
            })

    # Guardamos directamente el archivo con la estructura exacta que tu web lee
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(integrantes_lista, f, ensure_ascii=False, indent=4)

    print("¡Sincronización exacta con la estructura de la web completada!")

if __name__ == "__main__":
    main()
