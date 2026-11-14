#!/usr/bin/env python3
"""Add intrinsic width/height to local raster <img> sources using Pillow.

Only dimensions read from the actual image file are written. Remote URLs, data
URIs, SVGs, missing files, and unsupported formats are left unchanged/reported.
Existing width/height attributes are preserved independently.

Run from any directory:
  python scripts/add_image_dimensions.py --check
  python scripts/add_image_dimensions.py --check index.html bitacora-preview.html
  python scripts/add_image_dimensions.py index.html bitacora-preview.html

Requires: python -m pip install Pillow
After applying, inspect the full git diff and run scripts/validate_site.py.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Falta Pillow: python -m pip install Pillow")

ROOT = Path(__file__).resolve().parents[1]
IMG_TAG = re.compile(r"""<img\b(?:[^>"']|"[^"]*"|'[^']*')*>""", re.IGNORECASE)


def attr(tag: str, name: str) -> str | None:
    pattern = rf"""(?<![\w:-]){re.escape(name)}\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))"""
    match = re.search(pattern, tag, re.IGNORECASE)
    return next((value for value in match.groups() if value is not None), None) if match else None


def local_image_path(src: str, page_path: Path) -> Path | None:
    parsed = urlparse(src)
    if parsed.scheme or parsed.netloc:
        return None
    decoded = unquote(parsed.path)
    if not decoded:
        return None
    candidate = ROOT / decoded.lstrip("/") if decoded.startswith("/") else page_path.parent / decoded
    candidate = candidate.resolve()
    try:
        candidate.relative_to(ROOT)
    except ValueError:
        return None
    return candidate


def process(page_name: str, apply_changes: bool) -> dict:
    page_path = (ROOT / page_name).resolve()
    try:
        page_path.relative_to(ROOT)
    except ValueError:
        raise SystemExit(f"La ruta queda fuera del repositorio: {page_name}")
    if not page_path.is_file():
        raise SystemExit(f"No existe el archivo HTML: {page_name}")

    html = page_path.read_text(encoding="utf-8")
    stats = {"total": 0, "ya_tenia": 0, "completadas": 0, "sin_medir": []}

    def fix(match: re.Match[str]) -> str:
        tag = match.group(0)
        stats["total"] += 1
        has_width = attr(tag, "width") is not None
        has_height = attr(tag, "height") is not None
        if has_width and has_height:
            stats["ya_tenia"] += 1
            return tag

        src = attr(tag, "src")
        if not src:
            stats["sin_medir"].append("(sin src)")
            return tag
        file_path = local_image_path(src, page_path)
        if file_path is None:
            stats["sin_medir"].append(f"{src} [remota, data URI o ruta fuera del repositorio]")
            return tag
        try:
            with Image.open(file_path) as image_file:
                width, height = image_file.size
        except (OSError, ValueError, Image.DecompressionBombError) as exc:
            stats["sin_medir"].append(f"{src} [{type(exc).__name__}]")
            return tag

        additions = ""
        if not has_width:
            additions += f' width="{width}"'
        if not has_height:
            additions += f' height="{height}"'
        stats["completadas"] += 1
        return tag[:-1].rstrip() + additions + ">"

    updated = IMG_TAG.sub(fix, html)
    if apply_changes and updated != html:
        page_path.write_text(updated, encoding="utf-8")
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("pages", nargs="*", help="HTML a procesar (por defecto: todos los *.html de la raíz)")
    parser.add_argument("--check", action="store_true", help="solo informar; no modifica archivos")
    args = parser.parse_args()

    pages = args.pages or sorted(path.name for path in ROOT.glob("*.html"))
    totals = {"total": 0, "ya_tenia": 0, "completadas": 0, "sin_medir": 0}
    for page in pages:
        stats = process(page, apply_changes=not args.check)
        for key in ("total", "ya_tenia", "completadas"):
            totals[key] += stats[key]
        totals["sin_medir"] += len(stats["sin_medir"])
        verb = "se completarían" if args.check else "completadas"
        print(
            f"\n[{page}] imágenes: {stats['total']} · ya tenían ambas dimensiones: "
            f"{stats['ya_tenia']} · {verb}: {stats['completadas']} · "
            f"sin medir: {len(stats['sin_medir'])}"
        )
        for item in stats["sin_medir"]:
            print("   - " + item)

    print("\n=== RESUMEN ===")
    print(f"Total <img>: {totals['total']}")
    print(f"Con ambas dimensiones previas: {totals['ya_tenia']}")
    print(f"{'Se completarían' if args.check else 'Completadas'}: {totals['completadas']}")
    print(f"Quedan sin medir: {totals['sin_medir']} (resolver con aspect-ratio en CSS o dimensiones en JS)")
    if args.check:
        print("\nModo --check: no se modificó ningún archivo.")


if __name__ == "__main__":
    main()
