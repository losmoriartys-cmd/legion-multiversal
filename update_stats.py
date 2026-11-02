import json
from datetime import datetime

data_file = "data.json"

# Métricas que se actualizarán de forma automatizada
nuevos_datos = {
    "ultima_actualizacion": datetime.now().strftime("%Y-%m-%d %H:%M"),
    "alcance_acumulado": "8.5K+",
    "media_viewers_global": 70,
    "horas_producidas_mes": 250
}

with open(data_file, "w", encoding="utf-8") as f:
    json.dump(nuevos_datos, f, ensure_ascii=False, indent=4)

print("¡Métricas sincronizadas correctamente!")
