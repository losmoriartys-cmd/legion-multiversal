#!/usr/bin/env python3
"""Create a transparent, lossless WebP copy of the official Legion emblem.

The PNG is retained as the source of truth. Runtime references are switched
only after the WebP has been written and verified to be smaller.
"""
from __future__ import annotations

import io
import os
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "legion_logo_final_hybrid.png"
OUTPUT = ROOT / "legion_logo_final_hybrid.webp"
RUNTIME_EXTENSIONS = {".html", ".htm", ".css", ".js", ".mjs", ".json", ".svg", ".xml"}
MIN_SAVING_PERCENT = 10.0


def atomic_write(path: Path, content: bytes) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
        raise


def runtime_references() -> list[tuple[Path, str]]:
    references = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in RUNTIME_EXTENSIONS:
            continue
        if any(part in {".git", "node_modules", ".venv", "venv", "__pycache__"} for part in path.parts):
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if SOURCE.name in content:
            references.append((path, content))
    return references


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"No se encuentra el PNG original: {SOURCE}")
    if OUTPUT.exists():
        raise SystemExit(f"El destino ya existe; no se sobrescribe: {OUTPUT}")

    original_size = SOURCE.stat().st_size
    with Image.open(SOURCE) as opened:
        image = ImageOps.exif_transpose(opened)
        has_alpha = (
            "A" in image.getbands()
            or (image.mode == "P" and "transparency" in image.info)
        )
        image = image.convert("RGBA" if has_alpha else "RGB")
        original_dimensions = image.size
        buffer = io.BytesIO()
        # Lossless encoding preserves sharp edges, colors and alpha for a logo.
        image.save(buffer, format="WEBP", lossless=True, method=6, exact=True)
        webp_data = buffer.getvalue()

    webp_size = len(webp_data)
    saving = (original_size - webp_size) * 100 / original_size
    if webp_size >= original_size or saving < MIN_SAVING_PERCENT:
        raise SystemExit(
            f"WebP lossless insuficiente: {original_size:,} -> {webp_size:,} bytes "
            f"({saving:.1f}% de ahorro; mínimo {MIN_SAVING_PERCENT:.0f}%). "
            "No se modifica ninguna referencia."
        )

    refs = runtime_references()
    if not refs:
        raise SystemExit("No se encontraron referencias runtime al PNG; no se cambia el sitio.")
    expected = ROOT / "index.html"
    if not any(path == expected for path, _ in refs):
        raise SystemExit("No se encontró la referencia principal en index.html.")

    atomic_write(OUTPUT, webp_data)
    with Image.open(OUTPUT) as check:
        check.load()
        if check.format != "WEBP" or check.size != original_dimensions:
            OUTPUT.unlink(missing_ok=True)
            raise SystemExit("La verificación del WebP falló: formato o dimensiones distintos.")
        if has_alpha and "A" not in check.getbands():
            OUTPUT.unlink(missing_ok=True)
            raise SystemExit("La verificación del WebP falló: se perdió el canal alfa.")
    if OUTPUT.stat().st_size != webp_size:
        OUTPUT.unlink(missing_ok=True)
        raise SystemExit("La verificación de tamaño del WebP falló.")

    changed = []
    for path, content in refs:
        updated = content.replace(SOURCE.name, OUTPUT.name)
        if updated != content:
            atomic_write(path, updated.encode("utf-8"))
            if OUTPUT.name not in path.read_text(encoding="utf-8"):
                raise SystemExit(f"No se pudo verificar la referencia en {path.relative_to(ROOT)}")
            changed.append(path.relative_to(ROOT).as_posix())

    print(f"Origen conservado: {SOURCE.name} ({original_size:,} bytes)")
    print(f"WebP lossless: {OUTPUT.name} ({webp_size:,} bytes; ahorro {saving:.1f}%)")
    print(f"Dimensiones conservadas: {original_dimensions[0]}x{original_dimensions[1]}")
    print(f"Transparencia conservada: {'sí' if has_alpha else 'no había canal alfa'}")
    print("Referencias runtime actualizadas:")
    for path in changed:
        print(f" - {path}")


if __name__ == "__main__":
    main()
