#!/usr/bin/env python3
"""Añade imageSource / imageWidth / imageHeight a cada entrada de heroes[].

La imagen medida es la MISMA que muestra el renderizador de bitacora-preview.html:
    const image = hero.portrait || hero.img || '';
Por eso se mide `portrait || img` con esa misma prioridad, y se guarda en `imageSource`
la ruta medida. El renderizador aplica las dimensiones solo si imageSource === image.

Seguridad:
- Si el JSON no está en formato canónico (indent=2, UTF-8, salto final), no se escribe
  para evitar un diff que reformatea todo el archivo. Usar --force bajo tu responsabilidad.
- Si la estructura no es la esperada, se detiene sin modificar nada.

Uso (desde la raíz del repositorio):
  python scripts/add_hero_image_dimensions.py --check
  python scripts/add_hero_image_dimensions.py
Requiere: pip install pillow
"""
import argparse
import json
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow: pip install pillow")

ROOT = Path.cwd()
JSON_PATH = ROOT / "roster-data.json"   # ADAPTAR si la Bitácora lee otro archivo
LIST_KEY = "heroes"
REMOTE_PREFIXES = ("http://", "https://", "//", "data:")


def resolved_source(hero):
    # Misma prioridad que el renderizador: hero.portrait || hero.img || ''
    return hero.get("portrait") or hero.get("img") or ""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="informar sin escribir")
    ap.add_argument("--force", action="store_true", help="escribir aunque el formato no sea canónico")
    args = ap.parse_args()

    if not JSON_PATH.exists():
        sys.exit(f"No existe {JSON_PATH.name}. Ejecutar desde la raíz del repositorio.")

    raw = JSON_PATH.read_text(encoding="utf-8")
    data = json.loads(raw)
    # Formato original: se compara ANTES de modificar los datos
    was_canonical = raw == json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    heroes = data.get(LIST_KEY)
    if not isinstance(heroes, list) or not all(isinstance(h, dict) for h in heroes):
        sys.exit(f"'{LIST_KEY}' no es una lista de objetos en {JSON_PATH.name}. No se modificó nada.")

    updated, sin_medir = 0, []
    for i, hero in enumerate(heroes):
        label = hero.get("id") or hero.get("name") or f"{LIST_KEY}[{i}]"
        src = resolved_source(hero)
        if not src:
            sin_medir.append(f"{label}: sin 'portrait' ni 'img'")
            continue
        if src.startswith(REMOTE_PREFIXES):
            sin_medir.append(f"{label}: imagen remota {src}")
            continue
        file = ROOT / unquote(urlparse(src).path).lstrip("/")
        if not file.exists():
            sin_medir.append(f"{label}: no existe {src}")
            continue
        try:
            with Image.open(file) as im:
                w, h = im.size
        except Exception as exc:
            sin_medir.append(f"{label}: {src} [{type(exc).__name__}]")
            continue

        if (hero.get("imageSource"), hero.get("imageWidth"), hero.get("imageHeight")) != (src, w, h):
            hero["imageSource"], hero["imageWidth"], hero["imageHeight"] = src, w, h
            updated += 1
            print(f"  {label}: {src} -> {w}x{h}")

    print(f"\nEntradas en {LIST_KEY}: {len(heroes)} · actualizadas: {updated} · sin medir: {len(sin_medir)}")
    for item in sin_medir:
        print("   sin medir  " + item)

    if args.check:
        print("\nModo --check: no se escribió ningún archivo.")
        return
    if not updated:
        print("Nada que escribir.")
        return

    if not was_canonical and not args.force:
        sys.exit("El JSON no está en formato canónico: escribirlo reformatearía todo el archivo. "
                 "No se modificó nada. Revisar el formato o usar --force.")
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Escrito {JSON_PATH.name}.")


if __name__ == "__main__":
    main()
