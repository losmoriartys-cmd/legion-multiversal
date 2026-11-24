#!/usr/bin/env python3
"""Valida data/creator-colors.json (BASE-02): IDs, formato, unicidad, contraste y distancia."""
from __future__ import annotations

import itertools
import json
import math
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_creator_colors  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
COLORS = ROOT / "data" / "creator-colors.json"
ROSTER = ROOT / "data" / "roster.json"

HEX = re.compile(r"^#[0-9a-f]{6}$")
MIN_CONTRAST = 4.5      # WCAG AA para texto normal sobre los fondos oscuros del sitio
MIN_DELTA_E = 25.0      # distancia mínima entre dos colores de identidad (CIE76)


def _linear(channel: int) -> float:
    c = channel / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(value: str) -> float:
    r, g, b = (_linear(x) for x in build_creator_colors.hex_to_rgb(value))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def lab(value: str) -> tuple[float, float, float]:
    r, g, b = (_linear(x) for x in build_creator_colors.hex_to_rgb(value))
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def delta_e(a: str, b: str) -> float:
    return math.dist(lab(a), lab(b))


def validate(data: dict, roster_ids: list[str]) -> list[str]:
    errors: list[str] = []
    creators = data.get("creators")
    if not isinstance(creators, dict) or not creators:
        return ["data/creator-colors.json: falta el objeto creators o está vacío"]

    missing = [i for i in roster_ids if i not in creators]
    extra = [i for i in creators if i not in roster_ids]
    for creator_id in missing:
        errors.append(f"data/creator-colors.json: falta el color de '{creator_id}' (ID del roster)")
    for creator_id in extra:
        errors.append(f"data/creator-colors.json: '{creator_id}' no existe en data/roster.json")

    backgrounds = data.get("contrast_backgrounds") or {}
    if not backgrounds:
        errors.append("data/creator-colors.json: faltan contrast_backgrounds")

    seen: dict[str, str] = {}
    valid: dict[str, str] = {}
    for creator_id, entry in creators.items():
        color = str((entry or {}).get("color", "")).lower()
        if not HEX.match(color):
            errors.append(f"{creator_id}: color '{color}' no es un hex #rrggbb válido")
            continue
        if not str((entry or {}).get("name", "")).strip():
            errors.append(f"{creator_id}: falta el nombre del color")
        if color in seen:
            errors.append(f"{creator_id}: color {color} repetido con {seen[color]}")
        seen[color] = creator_id
        valid[creator_id] = color
        for bg_name, bg in backgrounds.items():
            ratio = contrast(color, bg)
            if ratio < MIN_CONTRAST:
                errors.append(
                    f"{creator_id}: contraste {ratio:.2f}:1 sobre {bg_name} ({bg}); mínimo {MIN_CONTRAST}:1"
                )

    for (a, ca), (b, cb) in itertools.combinations(valid.items(), 2):
        distance = delta_e(ca, cb)
        if distance < MIN_DELTA_E:
            errors.append(f"{a} y {b}: colores demasiado parecidos (ΔE {distance:.1f}; mínimo {MIN_DELTA_E:.0f})")
    return errors


def main() -> int:
    data = json.loads(COLORS.read_text(encoding="utf-8"))
    roster = json.loads(ROSTER.read_text(encoding="utf-8"))
    roster_ids = [hero["id"] for hero in roster["heroes"]]
    errors = validate(data, roster_ids)
    current = build_creator_colors.TARGET.read_text(encoding="utf-8") if build_creator_colors.TARGET.is_file() else ""
    if current != build_creator_colors.render_css(data):
        errors.append("creator-colors.css no está sincronizado; ejecutar scripts/build_creator_colors.py")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        return 1
    print(f"Colores de creadores válidos: {len(data['creators'])} perfiles.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
