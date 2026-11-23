#!/usr/bin/env python3
"""Audit public URLs without treating rate limits or transient failures as dead links."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from typing import Any, Callable
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "public-link-audit.json"


def read_json(path: str) -> Any:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def collect_public_urls(documents: dict[str, Any]) -> list[dict[str, str]]:
    found: dict[str, dict[str, str]] = {}

    def add(path: str, value: Any) -> None:
        if not isinstance(value, str) or not value.strip():
            return
        parsed = urlsplit(value.strip())
        if parsed.scheme != "https" or not parsed.hostname:
            return
        found.setdefault(value.strip(), {"url": value.strip(), "source": path})

    roster = documents.get("data/roster.json", {})
    for index, hero in enumerate(roster.get("heroes", [])):
        creator_id = hero.get("id", f"hero-{index}")
        for account_index, account in enumerate(hero.get("accounts", [])):
            add(f"data/roster.json#/heroes/{index}/accounts/{account_index}/url ({creator_id})", account.get("url"))
        for key, value in (hero.get("socials") or {}).items():
            add(f"data/roster.json#/heroes/{index}/socials/{key} ({creator_id})", value)
        for link_index, link in enumerate(hero.get("links", [])):
            add(f"data/roster.json#/heroes/{index}/links/{link_index}/url ({creator_id})", link.get("url"))
        for bit_index, item in enumerate(hero.get("bitacora", [])):
            add(f"data/roster.json#/heroes/{index}/bitacora/{bit_index}/url ({creator_id})", item.get("url"))

    games = documents.get("data/games.json", {})
    for game_index, game in enumerate(games.get("juegos", [])):
        game_id = game.get("id", f"game-{game_index}")
        for field in ("tienda", "fuente_jugadores"):
            add(f"data/games.json#/juegos/{game_index}/{field} ({game_id})", game.get(field))
        for session_index, session in enumerate(game.get("sesiones", [])):
            add(f"data/games.json#/juegos/{game_index}/sesiones/{session_index}/fuente_fecha ({session.get('bit')})", session.get("fuente_fecha"))
            for pov_index, pov in enumerate(session.get("pov", [])):
                add(f"data/games.json#/juegos/{game_index}/sesiones/{session_index}/pov/{pov_index}/url ({session.get('bit')})", pov.get("url"))

    records = documents.get("data/creator-records.json", {})
    for creator_id, record in (records.get("channels") or {}).items():
        for collection in ("collaborations", "highlights"):
            for index, item in enumerate(record.get(collection, [])):
                add(f"data/creator-records.json#/channels/{creator_id}/{collection}/{index}/url", item.get("url"))

    clips = documents.get("clips-data.json", {})
    for creator_id, record in (clips.get("creators") or {}).items():
        add(f"clips-data.json#/creators/{creator_id}/url", record.get("url"))
        for index, clip in enumerate(record.get("clips", [])):
            add(f"clips-data.json#/creators/{creator_id}/clips/{index}/url ({clip.get('id')})", clip.get("url"))

    platforms = documents.get("platform-stats.json", {})
    for creator_id, creator in (platforms.get("creators") or {}).items():
        for platform, record in (creator.get("platforms") or {}).items():
            add(f"platform-stats.json#/creators/{creator_id}/platforms/{platform}/url", record.get("url"))
            for index, video in enumerate(record.get("recent_videos", [])):
                add(f"platform-stats.json#/creators/{creator_id}/platforms/{platform}/recent_videos/{index}/url ({video.get('video_id')})", video.get("url"))

    news = documents.get("news-data.json", {})
    for index, item in enumerate(news.get("items", [])):
        add(f"news-data.json#/items/{index}/source_url", item.get("source_url"))

    sully = documents.get("sullygnome-data.json", {})
    for index, channel in enumerate(sully.get("channels", [])):
        add(f"sullygnome-data.json#/channels/{index}/source_url ({channel.get('login')})", channel.get("source_url"))

    twitchmetrics = documents.get("twitchmetrics-data.json", {})
    for login, channel in (twitchmetrics.get("channels") or {}).items():
        add(f"twitchmetrics-data.json#/channels/{login}/source_url", channel.get("source_url"))

    programs = documents.get("creator-programs.json", {})
    for key, value in (programs.get("official_links") or {}).items():
        add(f"creator-programs.json#/official_links/{key}", value)

    return sorted(found.values(), key=lambda item: item["url"])


def probe_url(url: str, timeout: float = 12.0) -> int | None:
    """Return HTTP status; None means the result is inconclusive (network/TLS/DNS)."""
    request = Request(url, method="HEAD", headers={"User-Agent": "LegionMultiversal-LinkAudit/1.0"})
    try:
        with urlopen(request, timeout=timeout) as response:
            return int(response.status)
    except HTTPError as exc:
        if exc.code not in {405, 501}:
            return int(exc.code)
    except (URLError, TimeoutError, OSError, ValueError):
        return None

    # Some hosts reject HEAD but permit a tiny ranged GET.
    request = Request(url, method="GET", headers={
        "User-Agent": "LegionMultiversal-LinkAudit/1.0",
        "Range": "bytes=0-0",
    })
    try:
        with urlopen(request, timeout=timeout) as response:
            return int(response.status)
    except HTTPError as exc:
        return int(exc.code)
    except (URLError, TimeoutError, OSError, ValueError):
        return None


def classify_url(
    url: str,
    probe: Callable[[str], int | None] = probe_url,
    attempts: int = 2,
) -> dict[str, Any]:
    statuses: list[int | None] = []
    for _ in range(max(1, attempts)):
        status = probe(url)
        statuses.append(status)
        if status is not None and 200 <= status < 400:
            return {"status": "reachable", "http_status": status, "attempts": statuses}
        if status not in {404, 410}:
            return {"status": "inconclusive", "http_status": status, "attempts": statuses}
    if len(statuses) >= 2 and all(status in {404, 410} for status in statuses):
        return {"status": "confirmed_dead", "http_status": statuses[-1], "attempts": statuses}
    return {"status": "inconclusive", "http_status": statuses[-1] if statuses else None, "attempts": statuses}


def audit_entries(entries: list[dict[str, str]], probe: Callable[[str], int | None] = probe_url) -> list[dict[str, Any]]:
    reports = []
    for entry in entries:
        result = classify_url(entry["url"], probe=probe)
        reports.append({**entry, **result})
    return reports


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--timeout", type=float, default=12.0)
    args = parser.parse_args()

    try:
        documents = {
            "data/roster.json": read_json("data/roster.json"),
            "data/games.json": read_json("data/games.json"),
            "data/creator-records.json": read_json("data/creator-records.json"),
            "clips-data.json": read_json("clips-data.json"),
            "platform-stats.json": read_json("platform-stats.json"),
            "creator-programs.json": read_json("creator-programs.json"),
            "news-data.json": read_json("news-data.json"),
            "sullygnome-data.json": read_json("sullygnome-data.json"),
            "twitchmetrics-data.json": read_json("twitchmetrics-data.json"),
        }
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: no se pudieron leer las fuentes para auditar enlaces: {exc}", file=sys.stderr)
        return 2

    entries = collect_public_urls(documents)
    reports = audit_entries(entries, probe=lambda url: probe_url(url, timeout=args.timeout))
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "policy": "Una baja se confirma solo con dos respuestas HTTP 404/410; 403, 429, 5xx, timeout, DNS y TLS son inconclusos.",
        "total": len(reports),
        "reachable": sum(item["status"] == "reachable" for item in reports),
        "confirmed_dead": sum(item["status"] == "confirmed_dead" for item in reports),
        "inconclusive": sum(item["status"] == "inconclusive" for item in reports),
        "links": reports,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        "Auditoría de enlaces: "
        f"{summary['total']} enlaces · {summary['reachable']} accesibles · "
        f"{summary['inconclusive']} inconclusos · {summary['confirmed_dead']} bajas confirmadas."
    )
    if summary["confirmed_dead"]:
        print("ERROR: hay enlaces con dos respuestas 404/410 consecutivas.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
