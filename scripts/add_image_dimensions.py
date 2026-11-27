#!/usr/bin/env python3
"""Completa width/height en <img> estáticos midiendo los archivos reales.

Las rutas se resuelven desde la raíz del repositorio, independientemente del directorio de ejecución.

Clasificación de cada <img>:
  - ya tenía width/height y coincide con el archivo  -> "ya tenía"
  - ya tenía width/height pero NO coincide            -> DESAJUSTE (exit 1)
  - sin dimensiones y archivo local legible          -> completable
  - src dinámico (plantilla JS con + o ${})          -> sin medir: corregir en el renderizador
  - remota, data URI o archivo inexistente           -> sin medir

Uso:
  python scripts/add_image_dimensions.py --check                       # todas las *.html de la raíz; no modifica
  python scripts/add_image_dimensions.py --check index.html            # subconjunto
  python scripts/add_image_dimensions.py index.html comic-moriartys.html  # aplica

Requiere: pip install pillow
Después de aplicar: revisar `git diff` completo y correr scripts/validate_site.py.
"""
import argparse
import re
import sys
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
IMG_TAG = re.compile(r"<img\b[^>]*>", re.I)
REMOTE_PREFIXES = ("http://", "https://", "//", "data:")
REMOTE_CACHE = {}
MAX_REMOTE_BYTES = 20 * 1024 * 1024
REMOTE_TIMEOUT_SECONDS = 20


def attr(tag, name):
    # (?<![\w-]) evita confundir width con data-width
    m = re.search(rf'(?<![\w-]){name}\s*=\s*["\']([^"\']*)["\']', tag, re.I)
    return m.group(1) if m else None


def local_file(src):
    return ROOT / unquote(urlparse(src).path).lstrip("/")


def measure(path):
    with Image.open(path) as im:
        return im.size


def measure_remote(src):
    """Measure a declared remote image without saving it to the repository."""
    url = "https:" + src if src.startswith("//") else src
    if url in REMOTE_CACHE:
        return REMOTE_CACHE[url]
    request = Request(url, headers={"User-Agent": "LegionMultiversal-ImageAudit/1.0"})
    try:
        with urlopen(request, timeout=REMOTE_TIMEOUT_SECONDS) as response:
            content_type = response.headers.get_content_type()
            if not content_type.startswith("image/"):
                raise ValueError(f"Content-Type no es imagen: {content_type}")
            payload = response.read(MAX_REMOTE_BYTES + 1)
        if len(payload) > MAX_REMOTE_BYTES:
            raise ValueError(f"imagen remota supera {MAX_REMOTE_BYTES // (1024 * 1024)} MiB")
        with Image.open(BytesIO(payload)) as im:
            dimensions = im.size
        REMOTE_CACHE[url] = dimensions
        return dimensions
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        REMOTE_CACHE[url] = exc
        raise


def process(page, apply_changes, measure_remotes=False):
    path = ROOT / page
    html = path.read_text(encoding="utf-8")
    stats = {"total": 0, "ya_tenia": 0, "completadas": 0,
             "desajustes": [], "sin_medir": [], "sugerencias": []}

    def fix(match):
        tag = match.group(0)
        stats["total"] += 1
        src = attr(tag, "src")

        # Plantilla JS dentro del HTML: no es una ruta estática.
        if "+" in tag or "${" in tag:
            stats["sin_medir"].append(
                "src dinámico en plantilla JS: corregir en el renderizador (ver Bitácora)")
            return tag
        if not src:
            stats["sin_medir"].append("(sin src)")
            return tag

        w_attr, h_attr = attr(tag, "width"), attr(tag, "height")
        is_remote = src.startswith(("http://", "https://", "//"))
        is_data = src.startswith("data:")

        if is_data:
            stats["sin_medir"].append(f"{src[:80]}  [data URI]")
            return tag

        file = None
        if is_remote:
            if not measure_remotes:
                stats["sin_medir"].append(f"{src}  [remota; usar --measure-remotes]")
                return tag
            try:
                real = measure_remote(src)
            except Exception as exc:
                stats["sin_medir"].append(f"{src}  [no se pudo medir: {type(exc).__name__}: {exc}]")
                return tag
        else:
            file = local_file(src)
            if not file.exists():
                stats["sin_medir"].append(f"{src}  [archivo no existe: {file.relative_to(ROOT)}]")
                return tag
            try:
                real = measure(file)
            except Exception as exc:  # SVG, formato no soportado, archivo corrupto
                stats["sin_medir"].append(f"{src}  [{type(exc).__name__}]")
                return tag

        if w_attr and h_attr:
            stats["ya_tenia"] += 1
            if (int(w_attr), int(h_attr)) != real:
                stats["desajustes"].append(
                    f"{src}: declarado {w_attr}x{h_attr}, archivo {real[0]}x{real[1]}")
            return tag

        w, h = real
        stats["completadas"] += 1
        stats["sugerencias"].append(f"{src}: width={w} height={h}")
        tag = re.sub(r'(?<![\w-])width\s*=\s*["\'][^"\']*["\']\s*', "", tag, flags=re.I)
        tag = re.sub(r'(?<![\w-])height\s*=\s*["\'][^"\']*["\']\s*', "", tag, flags=re.I)
        return tag[:-1].rstrip("/ ") + f' width="{w}" height="{h}">'

    new_html = IMG_TAG.sub(fix, html)
    if apply_changes and new_html != html:
        path.write_text(new_html, encoding="utf-8")
    return stats


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pages", nargs="*", help="HTML a procesar (por defecto: *.html de la raíz)")
    ap.add_argument("--check", action="store_true", help="solo informar; no modifica archivos")
    ap.add_argument("--measure-remotes", action="store_true",
                    help="descarga temporalmente imágenes HTTP(S) declaradas para medir sus dimensiones; no las guarda")
    args = ap.parse_args()

    if not (ROOT / "index.html").exists():
        sys.exit("Ejecutar desde la raíz del repositorio (no se encontró index.html en el directorio actual).")

    pages = args.pages or sorted(p.name for p in ROOT.glob("*.html"))
    totals = {"total": 0, "ya_tenia": 0, "completadas": 0, "desajustes": 0, "sin_medir": 0}

    for page in pages:
        if not (ROOT / page).exists():
            print(f"[{page}] no existe, se omite")
            continue
        s = process(page, apply_changes=not args.check, measure_remotes=args.measure_remotes)
        for k in ("total", "ya_tenia", "completadas"):
            totals[k] += s[k]
        totals["desajustes"] += len(s["desajustes"])
        totals["sin_medir"] += len(s["sin_medir"])

        verbo = "completaría" if args.check else "completadas"
        print(f"\n[{page}] <img>: {s['total']} · ya tenían: {s['ya_tenia']} · "
              f"{verbo}: {s['completadas']} · desajustes: {len(s['desajustes'])} · sin medir: {len(s['sin_medir'])}")
        for item in s["desajustes"]:
            print("   DESAJUSTE  " + item)
        for item in s["sugerencias"]:
            print("   dimensión  " + item)
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
