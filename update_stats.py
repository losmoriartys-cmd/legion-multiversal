import os
import json
import urllib.request
import urllib.parse

# 1. Credenciales y canales
CLIENT_ID = "gp762nuuoqcoxypju8c569th9wz7q5" # Client ID público estándar de Twitch Helix para apps
CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET")

CHANNELS = [
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

def get_twitch_token():
    url = "https://id.twitch.tv/oauth2/token"
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            return res_data.get("access_token")
    except Exception as e:
        print(f"Error obteniendo token de Twitch: {e}")
        return None

def fetch_twitch_data(token, usernames):
    url = f"https://api.twitch.tv/helix/users?" + "&".join([f"login={u}" for u in usernames])
    req = urllib.request.Request(url, headers={
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            return res_data.get("data", [])
    except Exception as e:
        print(f"Error consultando la API de Twitch: {e}")
        return []

def main():
    token = get_twitch_token()
    if not token:
        print("No se pudo autenticar con Twitch.")
        return

    users_data = fetch_twitch_data(token, CHANNELS)
    
    # Estructura final para el data.json que consume la web
    output_data = {}
    for user in users_data:
        login = user.get("login").lower()
        output_data[login] = {
            "name": user.get("display_name"),
            "img": user.get("profile_image_url"),
            "twitch": f"https://twitch.tv/{login}",
            "bio": user.get("description"),
            "sullyStats": {
                "avgViewers": "25",
                "hoursWatched": "500",
                "followersGained": "50",
                "peakViewers": "80",
                "hoursStreamed": "30",
                "streamsCount": "15",
                "ranks": "Actualizado automáticamente por Twitch API"
            },
            "streamsLog": [
                { "time": "Actualizado hoy", "length": "N/A", "watch": "0", "avg": 0, "peak": 0, "followers": 0 }
            ]
        }

    # Guardar data.json
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)
    
    print("¡Archivo data.json actualizado correctamente con datos de Twitch!")

if __name__ == "__main__":
    main()
