"""Build a normalized, public-only creator metrics registry from source datasets."""
from __future__ import annotations
import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROSTER_FILE = ROOT / "roster-data.json"
TWITCH_FILE = ROOT / "data.json"
PLATFORM_FILE = ROOT / "platform-stats.json"
CLIPS_FILE = ROOT / "clips-data.json"
OUTPUT_FILE = ROOT / "creator-metrics.json"
FRESHNESS_MINUTES = {"twitch": 120, "kick": 120, "youtube": 10080}


def parse_time(value):
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else None


def iso(value):
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def capture_status(platform, captured_at, now):
    captured = parse_time(captured_at)
    if captured is None:
        return "unavailable"
    age = (now - captured).total_seconds() / 60
    if age < -5:
        return "unavailable"
    if age > FRESHNESS_MINUTES.get(platform, 120):
        return "delayed"
    return "fresh"


def make_metric(platform, handle, key, label, value, unit, captured_at, period,
                source, method, status, interpretation, source_file, visibility="public"):
    return {
        "metric_id": platform + ":" + handle + ":" + key,
        "platform": platform,
        "account_handle": handle,
        "key": key,
        "label": label,
        "value": value,
        "unit": unit,
        "captured_at": captured_at,
        "period": period,
        "source": source,
        "method": method,
        "status": status,
        "visibility": visibility,
        "interpretation": interpretation,
        "source_file": source_file,
    }


def source_period(first, last, kind):
    return {"kind": kind, "from": first, "to": last}


def read_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def build(roster, twitch, platforms, clips, now=None):
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).replace(microsecond=0)
    generated = iso(now)
    registry = {
        "schema_version": 2,
        "generated_at": generated,
        "source_files": {
            "identity": "roster-data.json",
            "twitch": "data.json",
            "platforms": "platform-stats.json",
            "clips": "clips-data.json",
        },
        "source_snapshot": {
            "data.json": {"updated_at": twitch.get("updated_at")},
            "platform-stats.json": {"updated_at": platforms.get("updated_at")},
        },
        "methodology": [
            "Registro normalizado derivado de archivos de fuente; no reemplaza las capturas originales.",
            "No sumar ni comparar directamente métricas con unidades o períodos diferentes.",
            "Los valores muestreados y estimados no son analítica oficial ni espectadores únicos.",
            "Los estados delayed/unavailable no se presentan como métricas actuales.",
            "Solo se incluyen datos públicos; métricas privadas requieren autorización individual.",
        ],
        "creators": {},
    }
    twitch_channels = twitch.get("channels") or {}
    platform_creators = platforms.get("creators") or {}
    clip_creators = clips.get("creators") or {}

    for hero in roster.get("heroes") or []:
        creator_id = hero.get("id") or hero.get("slug")
        if not creator_id:
            continue
        accounts, metrics = [], []
        for account in hero.get("accounts") or []:
            platform = account.get("platform")
            handle = account.get("handle") or account.get("login") or ""
            account_ref = platform + ":" + handle if platform else handle
            record = {
                "account_ref": account_ref,
                "platform": platform,
                "account_type": account.get("account_type"),
                "handle": handle,
                "login": account.get("login"),
                "url": account.get("url"),
                "ownership": account.get("ownership"),
                "account_status": account.get("status"),
                "collection_mode": (account.get("collection") or {}).get("mode", "manual_link_only"),
                "collection_source": (account.get("collection") or {}).get("source"),
                "restricted_metrics": account.get("restricted_metrics") or [],
            }
            accounts.append(record)

            if platform == "twitch" and account.get("account_type") == "creator_channel":
                login = str(account.get("login") or "").lower()
                channel = twitch_channels.get(login) or {}
                snapshots = channel.get("snapshots") or []
                window = channel.get("window") or {}
                captured_at = channel.get("updated_at") or (snapshots[-1].get("sampled_at") if snapshots else None)
                freshness = capture_status("twitch", captured_at, now)
                latest = snapshots[-1] if snapshots else {}
                period = source_period(
                    snapshots[0].get("sampled_at") if snapshots else None,
                    snapshots[-1].get("sampled_at") if snapshots else captured_at,
                    "sampled_window",
                )
                metric_source = "Twitch Helix Public API"
                for key, label, value, unit, meaning in [
                    ("live_status", "Estado de transmisión", channel.get("live") if freshness == "fresh" else None, "status", "Estado observado en la última consulta pública; un estado vencido queda oculto."),
                    ("current_viewers", "Espectadores en la última captura", channel.get("current_viewers") if freshness == "fresh" and channel.get("live") else None, "viewers", "Lectura puntual de stream en vivo; no equivale a espectadores únicos ni promedio."),
                    ("samples_total", "Muestras históricas", window.get("samples_total"), "samples", "Cantidad de observaciones almacenadas en el período efectivo."),
                    ("live_samples", "Muestras en directo", window.get("live_samples"), "samples", "Observaciones que encontraron el canal en directo."),
                    ("streams_observed", "Sesiones observadas", window.get("streams_observed"), "streams", "Sesiones distinguibles mediante stream_id dentro del muestreo."),
                    ("average_viewers_sampled", "Promedio de viewers muestreado", window.get("average_viewers_sampled"), "viewers_sampled_avg", "Promedio de las observaciones disponibles en directo; no es CCV oficial."),
                    ("peak_viewers_sampled", "Pico observado", window.get("peak_viewers_sampled"), "viewers_sampled_peak", "Mayor lectura puntual registrada; no es pico oficial de Twitch."),
                    ("observed_live_hours", "Horas en directo observadas", window.get("observed_live_hours"), "hours_observed", "Duración aproximada de intervalos consecutivos admisibles del mismo directo."),
                    ("estimated_hours_watched", "Horas vistas estimadas", window.get("estimated_hours_watched"), "hours_estimated", "Estimación entre muestras consecutivas; no es watch time oficial."),
                ]:
                    if value is None and key in {"samples_total", "live_samples", "streams_observed"} and not channel:
                        continue
                    status = freshness if key in {"live_status", "current_viewers"} else ("estimated" if key == "estimated_hours_watched" else "sampled")
                    if key == "live_status" and freshness == "fresh":
                        value = "live" if channel.get("live") else "offline"
                    if key == "current_viewers" and freshness == "fresh" and not channel.get("live"):
                        status = "offline"
                    metrics.append(make_metric(
                        "twitch", handle, key, label, value, unit, captured_at, period,
                        metric_source, "public_helix_snapshot" if key in {"live_status", "current_viewers"} else "55_minute_public_sampling",
                        status, meaning, "data.json",
                    ))
            elif platform in {"youtube", "kick"}:
                creator_platform = (platform_creators.get(creator_id) or {}).get("platforms") or {}
                source_record = creator_platform.get(platform) or {}
                captured_at = platforms.get("updated_at")
                freshness = capture_status(platform, captured_at, now)
                base_status = source_record.get("status")
                metric_status = "verified_public" if base_status == "verified" and freshness == "fresh" else freshness if base_status == "verified" else "unavailable"
                source_name = source_record.get("source") or ("YouTube Data API v3" if platform == "youtube" else "Kick Developer Public API")
                period = source_period(None, captured_at, "cumulative" if platform == "youtube" else "point_in_time")
                source_metrics = source_record.get("metrics") or {}
                if platform == "youtube":
                    definitions = [
                        ("subscribers", "Suscriptores públicos", "subscribers", "Conteo público de YouTube; puede estar redondeado."),
                        ("total_views", "Visualizaciones acumuladas", "views", "Acumulado del canal informado por YouTube Data API."),
                        ("videos_total", "Videos publicados", "videos", "Cantidad total de videos del canal."),
                    ]
                    for key, label, unit, meaning in definitions:
                        value = source_metrics.get(key) if freshness != "unavailable" else None
                        historical_meaning = meaning + (" Valor histórico de la última captura correcta; no se etiqueta como lectura actual." if freshness == "delayed" else "")
                        metrics.append(make_metric(
                            platform, handle, key, label, value, unit,
                            captured_at, period, source_name, "youtube_data_api_public",
                            metric_status, historical_meaning, "platform-stats.json",
                        ))
                elif platform == "kick":
                    kick_metrics = source_record.get("metrics") or {}
                    live_value = kick_metrics.get("live")
                    live_value = ("live" if live_value else "offline") if isinstance(live_value, bool) else None
                    metrics.append(make_metric(
                        platform, handle, "live_status", "Estado de transmisión",
                        live_value if freshness == "fresh" else None, "status", captured_at, period,
                        source_name, "kick_public_api_snapshot", metric_status,
                        "Estado puntual de la API pública; no equivale a analítica histórica.",
                        "platform-stats.json",
                    ))
                    metrics.append(make_metric(
                        platform, handle, "current_viewers", "Espectadores actuales",
                        kick_metrics.get("current_viewers") if freshness == "fresh" and live_value == "live" else None,
                        "viewers", captured_at, period, source_name, "kick_public_api_snapshot",
                        "offline" if freshness == "fresh" and live_value == "offline" else metric_status,
                        "Lectura puntual; no equivale a espectadores únicos ni promedio.", "platform-stats.json",
                    ))
        creator_clips = clip_creators.get(creator_id) or {}
        registry["creators"][creator_id] = {
            "display_name": hero.get("display_name") or hero.get("name") or creator_id,
            "identity_scope": hero.get("identity_scope"),
            "represented_people": hero.get("represented_people") or [],
            "accounts": accounts,
            "metrics": metrics,
            "content": {
                "twitch_clips_status": creator_clips.get("status", "not_collected"),
                "twitch_clips_captured_at": creator_clips.get("captured_at"),
                "twitch_clips_count": len(creator_clips.get("clips") or []),
            },
        }
    return registry


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validar la salida existente sin escribirla")
    args = parser.parse_args()
    roster = read_json(ROSTER_FILE, {})
    twitch = read_json(TWITCH_FILE, {})
    platforms = read_json(PLATFORM_FILE, {})
    clips = read_json(CLIPS_FILE, {})
    result = build(roster, twitch, platforms, clips)
    if args.check:
        existing = read_json(OUTPUT_FILE, None)
        if existing != result:
            print("El registro normalizado está desactualizado. Ejecutá python scripts/build_creator_metrics.py")
            return 1
        print("OK: creator-metrics.json coincide con las fuentes actuales.")
        return 0
    OUTPUT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Registro normalizado: {} creadores, {} métricas.".format(
        len(result["creators"]), sum(len(item["metrics"]) for item in result["creators"].values())
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
