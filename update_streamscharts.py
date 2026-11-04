#!/usr/bin/env python3
"""Fetch the Streams Charts free Twitch top-100 list (7 days, zero credits).

This intentionally does NOT call per-channel endpoints: those are paid requests.
"""
import json
import os
import sys
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL = "https://streamscharts.com/api/v2/channels?platform=twitch&time=7-days"
OUT = "streamscharts-data.json"

def main():
    client_id = os.environ.get("STREAMCHARTS_CLIENT_ID", "").strip()
    token = os.environ.get("STREAMCHARTS_TOKEN", "").strip()
    if not client_id or not token:
        raise SystemExit("Missing STREAMCHARTS_CLIENT_ID or STREAMCHARTS_TOKEN GitHub secret")

    req = Request(URL, headers={
        "Client-ID": client_id,
        "Token": token,
        "Accept": "application/json",
        "User-Agent": "LegionMultiversal/1.0",
    })
    try:
        with urlopen(req, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
            charged = response.headers.get("x-credits-charged", "not-reported")
    except HTTPError as exc:
        # Never print request headers or credentials.
        body = exc.read(1000).decode("utf-8", "replace")
        raise SystemExit(f"Streams Charts HTTP {exc.code}: {body}") from None
    except URLError as exc:
        raise SystemExit(f"Streams Charts connection error: {exc.reason}") from None

    rows = payload.get("data", [])
    if not isinstance(rows, list):
        raise SystemExit("Unexpected API response: 'data' is not a list")

    result = {
        "source": "Streams Charts API",
        "endpoint": "/api/v2/channels?platform=twitch&time=7-days",
        "window": "7-days",
        "free_request": True,
        "credits_charged": charged,
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(rows),
        "channels": rows,
        "note": "Free top-100 Twitch list only. This does not imply a channel was absent from Twitch; only absent from this ranked list.",
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Saved {len(rows)} ranked Twitch channels; reported credits: {charged}")

if __name__ == "__main__":
    main()
