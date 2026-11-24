#!/usr/bin/env python3
"""Genera creator-colors.css a partir de data/creator-colors.json.

Uso:
    python3 scripts/build_creator_colors.py          # escribe creator-colors.css
    python3 scripts/build_creator_colors.py --check  # falla si el CSS no está sincronizado

El CSS generado define, para cada creador con ID canónico <id>:
  --c-<id>        color de identidad
  --c-<id>-soft   el mismo color al 14 % de opacidad, para fondos
y asigna --creator-color / --creator-color-soft a todo elemento con
data-creator-id="<id>".
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "creator-colors.json"
TARGET = ROOT / "creator-colors.css"

HEADER = (
    "/* Generado por scripts/build_creator_colors.py desde data/creator-colors.json.\n"
    "   No editar a mano: cambiar el color en el JSON y volver a generar. */\n"
)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def render_css(data: dict) -> str:
    creators = data["creators"]
    root_lines = []
    attr_lines = []
    for creator_id, entry in creators.items():
        color = entry["color"].lower()
        r, g, b = hex_to_rgb(color)
        root_lines.append(f"  --c-{creator_id}: {color};")
        root_lines.append(f"  --c-{creator_id}-soft: rgba({r}, {g}, {b}, .14);")
        attr_lines.append(
            f'[data-creator-id="{creator_id}"] {{ '
            f"--creator-color: var(--c-{creator_id}); "
            f"--creator-color-soft: var(--c-{creator_id}-soft); }}"
        )
    return HEADER + ":root {\n" + "\n".join(root_lines) + "\n}\n" + "\n".join(attr_lines) + "\n"


def main(argv: list[str]) -> int:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    expected = render_css(data)
    if "--check" in argv:
        current = TARGET.read_text(encoding="utf-8") if TARGET.is_file() else ""
        if current != expected:
            print("creator-colors.css no está sincronizado con data/creator-colors.json. "
                  "Ejecutar: python3 scripts/build_creator_colors.py")
            return 1
        print("creator-colors.css sincronizado.")
        return 0
    TARGET.write_text(expected, encoding="utf-8")
    print(f"Escrito {TARGET.name} con {len(data['creators'])} creadores.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
