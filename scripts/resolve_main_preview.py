#!/usr/bin/env python3
"""Resolve the Cloudflare Pages preview for the exact current main commit."""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlparse


PREVIEW_PATTERN = re.compile(
    r"<strong>\s*Preview URL:\s*</strong>\s*</td>\s*<td>\s*<a\s+href=['\"]([^'\"]+)['\"]",
    re.IGNORECASE,
)


def extract_preview_url(summary: str) -> str | None:
    match = PREVIEW_PATTERN.search(summary or "")
    if not match:
        return None
    url = match.group(1).strip()
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        return None
    if not parsed.hostname.endswith(".legion-multiversal.pages.dev"):
        return None
    return url


def select_main_preview(check_runs: list[dict], expected_sha: str) -> str:
    candidates = [
        item for item in check_runs
        if item.get("name") == "Cloudflare Pages"
        and item.get("head_sha") == expected_sha
        and item.get("status") == "completed"
        and item.get("conclusion") == "success"
    ]
    candidates.sort(key=lambda item: item.get("completed_at") or "", reverse=True)
    for item in candidates:
        summary = (item.get("output") or {}).get("summary") or ""
        url = extract_preview_url(summary)
        if url:
            return url
    raise RuntimeError(
        "No se encontró un check Cloudflare Pages exitoso para el SHA exacto de main "
        "con una Preview URL de legion-multiversal.pages.dev. No se usa un baseline antiguo."
    )


def fetch_check_runs(repository: str, sha: str, token: str) -> list[dict]:
    endpoint = f"https://api.github.com/repos/{repository}/commits/{sha}/check-runs?per_page=100"
    request = Request(endpoint, headers={
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "LegionMultiversal-MainPreviewResolver/1.0",
    })
    try:
        with urlopen(request, timeout=25) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"No se pudieron consultar los checks de main: {exc}") from exc
    runs = payload.get("check_runs")
    if not isinstance(runs, list):
        raise RuntimeError("La API no devolvió una colección check_runs válida.")
    return runs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--sha", required=True)
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("ERROR: falta GITHUB_TOKEN para consultar el preview exacto de main.", file=sys.stderr)
        return 2

    try:
        runs = fetch_check_runs(args.repo, args.sha, token)
        url = select_main_preview(runs, args.sha)
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        print("ERROR: falta GITHUB_OUTPUT para exportar el baseline de Playwright.", file=sys.stderr)
        return 2
    with open(output_path, "a", encoding="utf-8") as handle:
        handle.write(f"url={url}\n")
    print(f"Baseline de Bitácora resuelto para main {args.sha[:12]}: {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
