#!/usr/bin/env python3
"""Completa width/height en <img> estáticos midiendo los archivos reales.

Se ejecuta SIEMPRE desde la raíz del repositorio (ROOT = directorio actual).

Clasificación de cada <img>:
  - ya tenía width/height y coincide con el archivo  -> "ya tenía"
  - ya tenía width/height pero NO coincide            -> DESAJUSTE (exit 1)
  - sin dimensiones y archivo local legible          -> completable
  - src dinámico (plantilla JS con + o ${})          -> sin medir: corregir en el renderizador
  - remota, data URI o archivo inexistente           -> sin medir

Uso:
  python scripts/add_image_dimensions.py --check                       # todas las *.html de la raíz; no modifica
  python scripts/add_image_dimensions.py --check index.html            # subconjunto
  python scripts/add_image_dimensions.py index.html bitacora-preview.html   # aplica

Requiere: pip install pillow
Después de aplicar: revisar `git diff` completo y correr scripts/validate_site.py.
"""
import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow: pip install pillow")

ROOT = Path.cwd()
IMG_TAG = re.compile(r"<img\b[^>]*>", re.I)
REMOTE_PREFIXES = ("http://", "https://", "//", "data:")


def attr(tag, name):
    # (?<![\w-]) evita confundir width con data-width
    m = re.search(rf'(?<![\w-]){name}\s*=\s*["\']([^"\']*)["\']', tag, re.I)
    return m.group(1) if m else None


def local_file(src):
    return ROOT / unquote(urlparse(src).path).lstrip("/")


def measure(path):
    with Image.open(path) as im:
        return im.size


def process(page, apply_changes):
    path = ROOT / page
    html = path.read_text(encoding="utf-8")
    stats = {"total": 0, "ya_tenia": 0, "completadas": 0,
             "desajustes": [], "sin_medir": []}

    def fix(match):
        tag = match.group(0)
        stats["total"] += 1
        src = attr(tag, "src")

        # Plantilla JS dentro del HTML: no es una ruta estática
        if "+" in tag or "${" in tag:
            stats["sin_medir"].append(
                "src dinámico en plantilla JS: corregir en el renderizador (ver Bitácora)")
            return tag
        if not src:
            stats["sin_medir"].append("(sin src)")
            return tag
        if src.startswith(REMOTE_PREFIXES):
            stats["sin_medir"].append(f"{src}  [remota o data URI]")
            return tag

        file = local_file(src)
        w_attr, h_attr = attr(tag, "width"), attr(tag, "height")

        if w_attr and h_attr:
            stats["ya_tenia"] += 1
            if file.exists():
                try:
                    real = measure(file)
                    if (int(w_attr), int(h_attr)) != real:
                        stats["desajustes"].append(
                            f"{src}: declarado {w_attr}x{h_attr}, archivo {real[0]}x{real[1]}")
                except (ValueError, OSError):
                    pass
            return tag

        if not file.exists():
            stats["sin_medir"].append(f"{src}  [archivo no existe: {file.relative_to(ROOT)}]")
            return tag
        try:
            w, h = measure(file)
        except Exception as exc:  # SVG, formato no soportado, archivo corrupto
            stats["sin_medir"].append(f"{src}  [{type(exc).__name__}]")
            return tag

        stats["completadas"] += 1
        return tag[:-1].rstrip("/ ") + f' width="{w}" height="{h}">'

    new_html = IMG_TAG.sub(fix, html)
    if apply_changes and new_html != html:
        path.write_text(new_html, encoding="utf-8")
    return stats


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pages", nargs="*", help="HTML a procesar (por defecto: *.html de la raíz)")
    ap.add_argument("--check", action="store_true", help="solo informar; no modifica archivos")
    args = ap.parse_args()

    if not (ROOT / "index.html").exists():
        sys.exit("Ejecutar desde la raíz del repositorio (no se encontró index.html en el directorio actual).")

    pages = args.pages or sorted(p.name for p in ROOT.glob("*.html"))
    totals = {"total": 0, "ya_tenia": 0, "completadas": 0, "desajustes": 0, "sin_medir": 0}

    for page in pages:
        if not (ROOT / page).exists():
            print(f"[{page}] no existe, se omite")
            continue
        s = process(page, apply_changes=not args.check)
        for k in ("total", "ya_tenia", "completadas"):
            totals[k] += s[k]
        totals["desajustes"] += len(s["desajustes"])
        totals["sin_medir"] += len(s["sin_medir"])

        verbo = "completaría" if args.check else "completadas"
        print(f"\n[{page}] <img>: {s['total']} · ya tenían: {s['ya_tenia']} · "
              f"{verbo}: {s['completadas']} · desajustes: {len(s['desajustes'])} · sin medir: {len(s['sin_medir'])}")
        for item in s["desajustes"]:
            print("   DESAJUSTE  " + item)
        for item in s["sin_medir"]:
            print("   sin medir  " + item)

    print("\n=== RESUMEN ===")
    print(f"Total <img>: {totals['total']}")
    print(f"Con dimensiones previas: {totals['ya_tenia']}")
    print(f"{'Se completarían' if args.check else 'Completadas'}: {totals['completadas']}")
    print(f"Desajustes (declaradas ≠ archivo): {totals['desajustes']}")
    print(f"Sin medir: {totals['sin_medir']}")
    if args.check:
        print("\nModo --check: no se modificó ningún archivo.")
    sys.exit(1 if totals["desajustes"] else 0)


if __name__ == "__main__":
    main()
