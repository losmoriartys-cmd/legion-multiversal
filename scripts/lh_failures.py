#!/usr/bin/env python3
"""Diagnose failed Lighthouse audits, LCP element and heaviest image requests.

Usage:
  python scripts/lh_failures.py reports/lighthouse/github-pages/run1.report.json
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if path is None or not path.is_file():
    raise SystemExit("Uso: python scripts/lh_failures.py RUTA/AL/REPORTE.report.json")

report = json.loads(path.read_text(encoding="utf-8"))
print(f"REPORTE: {path}")
for category in ("seo", "best-practices"):
    info = report.get("categories", {}).get(category, {})
    score = info.get("score")
    print(f"== {category}: {round(score * 100) if score is not None else 'n/d'}")
    for ref in info.get("auditRefs", []):
        audit = report.get("audits", {}).get(ref.get("id"), {})
        value = audit.get("score")
        if value is not None and value < 1:
            print(f"  - {ref.get('id')} | {audit.get('title')} | score {value}")

items = report.get("audits", {}).get("largest-contentful-paint-element", {}).get("details", {}).get("items", [])
if items:
    node = items[0].get("items", [{}])[0].get("node", {})
    print("LCP element:", node.get("snippet", "n/d"))
    print("LCP selector:", node.get("selector", "n/d"))
else:
    print("LCP element: n/d")

requests = report.get("audits", {}).get("network-requests", {}).get("details", {}).get("items", [])
images = []
for item in requests:
    resource_type = str(item.get("resourceType", "")).lower()
    mime = str(item.get("mimeType", "")).lower()
    url = str(item.get("url", ""))
    if resource_type == "image" or mime.startswith("image/"):
        images.append({
            "bytes": int(item.get("transferSize") or 0),
            "resource_bytes": int(item.get("resourceSize") or 0),
            "mime": mime or "n/d",
            "url": url,
        })
images.sort(key=lambda item: item["bytes"], reverse=True)
print("== TOP 10 IMÁGENES POR TRANSFERENCIA")
for item in images[:10]:
    print(f"  - {item['bytes']} B transferidos | {item['resource_bytes']} B recurso | {item['mime']} | {item['url']}")
if not images:
    print("  n/d: Lighthouse no incluyó solicitudes de imagen en network-requests.")
