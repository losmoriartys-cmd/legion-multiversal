import json
from datetime import datetime

data_file = "data.json"

# Cargamos el archivo actual si existe, o inicializamos la estructura base
try:
    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    data = {}

# Actualizamos la marca de tiempo global
data["ultima_actualizacion"] = datetime.now().strftime("%Y-%m-%d %H:%M")

# Definimos o actualizamos las estadísticas para los 8 integrantes del roster
data["integrantes"] = [
    {
        "nombre": "Los Moriartys",
        "alcance": "8.5K+",
        "media_viewers": 70,
        "horas_mes": 250
    },
    {
        "nombre": "Integrante 2",
        "alcance": "5.2K+",
        "media_viewers": 45,
        "horas_mes": 180
    },
    {
        "nombre": "Integrante 3",
        "alcance": "3.8K+",
        "media_viewers": 30,
        "horas_mes": 120
    },
    {
        "nombre": "Integrante 4",
        "alcance": "6.1K+",
        "media_viewers": 55,
        "horas_mes": 210
    },
    {
        "nombre": "Integrante 5",
        "alcance": "4.0K+",
        "media_viewers": 35,
        "horas_mes": 150
    },
    {
        "nombre": "Integrante 6",
        "alcance": "7.3K+",
        "media_viewers": 65,
        "horas_mes": 230
    },
    {
        "nombre": "Integrante 7",
        "alcance": "4.5K+",
        "media_viewers": 40,
        "horas_mes": 160
    },
    {
        "nombre": "Integrante 8",
        "alcance": "5.9K+",
        "media_viewers": 50,
        "horas_mes": 190
    }
]

# Guardamos los cambios en el archivo data.json
with open(data_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("¡Métricas de los 8 integrantes sincronizadas correctamente!")
