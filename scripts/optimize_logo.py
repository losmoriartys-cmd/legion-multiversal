#!/usr/bin/env python3
"""Create a lossless responsive WebP set for the official Legion emblem.

The 1600px master remains available for structured metadata and high-density
screens. On-page emblems use a 256px default plus 512px and 1600px srcset candidates.
"""
from __future__ import annotations

import io
import os
import re
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "legion_logo_final_hybrid.png"
MASTER = ROOT / "legion_logo_final_hybrid.webp"
RESPONSIVE = ROOT / "legion_logo_final_hybrid-512.webp"
SMALL = ROOT / "legion_logo_final_hybrid-256.webp"
RUNTIME_EXTENSIONS = {".html", ".htm"}
EXPECTED_SIZE = (1600, 1600)
RESPONSIVE_SIZE = (512, 512)
SMALL_SIZE = (256, 256)


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


def open_source():
    opened = Image.open(SOURCE)
    image = ImageOps.exif_transpose(opened)
    has_alpha = (
        "A" in image.getbands()
        or (image.mode == "P" and "transparency" in image.info)
    )
    return image.convert("RGBA" if has_alpha else "RGB"), has_alpha


def verify_master(has_alpha: bool) -> bytes:
    if not MASTER.is_file():
        raise SystemExit(f"Falta el WebP maestro: {MASTER.name}")
    with Image.open(MASTER) as image:
        image.load()
        if image.format != "WEBP" or image.size != EXPECTED_SIZE:
            raise SystemExit("El WebP maestro no conserva formato o dimensiones.")
        if has_alpha and "A" not in image.getbands():
            raise SystemExit("El WebP maestro perdió el canal alfa.")
    return MASTER.read_bytes()


def build_responsive(image: Image.Image, has_alpha: bool) -> bytes:
    small = image.copy()
    small.thumbnail(RESPONSIVE_SIZE, Image.Resampling.LANCZOS)
    if small.size != RESPONSIVE_SIZE:
        raise SystemExit(f"Dimensiones inesperadas para el derivado: {small.size}")
    buffer = io.BytesIO()
    small.save(buffer, format="WEBP", lossless=True, method=6, exact=True)
    data = buffer.getvalue()
    if has_alpha:
        with Image.open(io.BytesIO(data)) as check:
            if "A" not in check.getbands():
                raise SystemExit("El derivado responsive perdió el canal alfa.")
    return data


def build_small(image: Image.Image, has_alpha: bool) -> bytes:
    small = image.copy()
    small.thumbnail(SMALL_SIZE, Image.Resampling.LANCZOS)
    if small.size != SMALL_SIZE:
        raise SystemExit(f"Dimensiones inesperadas para el derivado pequeño: {small.size}")
    buffer = io.BytesIO()
    small.save(buffer, format="WEBP", lossless=True, method=6, exact=True)
    data = buffer.getvalue()
    if has_alpha:
        with Image.open(io.BytesIO(data)) as check:
            if "A" not in check.getbands():
                raise SystemExit("El derivado de 256px perdió el canal alfa.")
    return data


def update_img_tags(content: str) -> tuple[str, int]:
    count = 0
    tag_pattern = re.compile(r"<img\b[^>]*>", re.IGNORECASE)

    def replace_tag(match: re.Match[str]) -> str:
        nonlocal count
        tag = match.group(0)
        src_match = re.search(r"\bsrc=(['\"])([^'\"]+)\1", tag, re.IGNORECASE)
        if not src_match or src_match.group(2) not in {MASTER.name, RESPONSIVE.name, SMALL.name}:
            return tag
        if src_match.group(2) != SMALL.name:
            tag = tag[:src_match.start(2)] + SMALL.name + tag[src_match.end(2):]
        srcset = f"{SMALL.name} 256w, {RESPONSIVE.name} 512w, {MASTER.name} 1600w"
        if re.search(r"\bsrcset=", tag, re.IGNORECASE):
            tag = re.sub(r"\bsrcset=(['\"])[^'\"]*\1", f'srcset="{srcset}"', tag, count=1, flags=re.IGNORECASE)
        else:
            tag = tag[:-1] + f' srcset="{srcset}">'
        if re.search(r"\bsizes=", tag, re.IGNORECASE):
            tag = re.sub(r"\bsizes=(['\"])[^'\"]*\1", 'sizes="112px"', tag, count=1, flags=re.IGNORECASE)
        else:
            tag = tag[:-1] + ' sizes="112px">'
        for attribute in ("width", "height"):
            dimension = re.compile(rf"\b{attribute}=(['\"])\d+\1", re.IGNORECASE)
            if dimension.search(tag):
                tag = dimension.sub(f'{attribute}="256"', tag, count=1)
            else:
                tag = tag[:-1] + f' {attribute}="256">'
        count += 1
        return tag

    return tag_pattern.sub(replace_tag, content), count


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"No se encuentra el PNG original: {SOURCE.name}")
    image, has_alpha = open_source()
    if image.size != EXPECTED_SIZE:
        raise SystemExit(f"Dimensiones originales inesperadas: {image.size}")
    master_data = verify_master(has_alpha)
    responsive_data = build_responsive(image, has_alpha)
    small_data = build_small(image, has_alpha)

    if len(responsive_data) >= len(master_data):
        raise SystemExit("El derivado de 512px no reduce el peso respecto del maestro.")
    if len(small_data) >= len(responsive_data):
        raise SystemExit("El derivado de 256px no reduce el peso respecto del de 512px.")

    pages = []
    for path in ROOT.rglob("*"):
        if path.is_file() and path.suffix.lower() in RUNTIME_EXTENSIONS:
            if any(part in {".git", "node_modules", ".venv", "venv", "__pycache__"} for part in path.parts):
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            if MASTER.name in content:
                pages.append((path, content))

    index = ROOT / "index.html"
    if not any(path == index for path, _ in pages):
        raise SystemExit("No se encontró el emblema maestro en index.html.")

    # Escribir y verificar el derivado antes de modificar cualquier referencia.
    atomic_write(RESPONSIVE, responsive_data)
    atomic_write(SMALL, small_data)
    changed = []
    for path, content in pages:
        updated, count = update_img_tags(content)
        if count:
            atomic_write(path, updated.encode("utf-8"))
            verified = path.read_text(encoding="utf-8")
            if SMALL.name not in verified or RESPONSIVE.name not in verified or MASTER.name not in verified:
                raise SystemExit(f"Falló la verificación de srcset en {path.relative_to(ROOT)}")
            changed.append((path.relative_to(ROOT).as_posix(), count))

    if not any(RESPONSIVE.name in path.read_text(encoding="utf-8") for path, _ in pages):
        raise SystemExit("No se encontraron etiquetas img del emblema en las páginas runtime.")
    with Image.open(RESPONSIVE) as check:
        check.load()
        if check.format != "WEBP" or check.size != RESPONSIVE_SIZE:
            RESPONSIVE.unlink(missing_ok=True)
            raise SystemExit("Falló la verificación del WebP responsive.")
        if has_alpha and "A" not in check.getbands():
            RESPONSIVE.unlink(missing_ok=True)
            raise SystemExit("El WebP responsive perdió transparencia.")

    with Image.open(SMALL) as check:
        check.load()
        if check.format != "WEBP" or check.size != SMALL_SIZE:
            SMALL.unlink(missing_ok=True)
            raise SystemExit("Falló la verificación del WebP de 256px.")
        if has_alpha and "A" not in check.getbands():
            SMALL.unlink(missing_ok=True)
            raise SystemExit("El WebP de 256px perdió transparencia.")

    original_size = SOURCE.stat().st_size
    print(f"PNG original conservado: {original_size:,} bytes")
    print(f"WebP maestro lossless: {len(master_data):,} bytes (1600x1600)")
    print(f"WebP responsive lossless: {len(responsive_data):,} bytes (512x512)")
    print(f"WebP compacto lossless: {len(small_data):,} bytes (256x256)")
    print(f"Reducción adicional del recurso visual: {(1 - len(responsive_data) / len(master_data)) * 100:.1f}%")
    print(f"Transparencia conservada: {'sí' if has_alpha else 'no había canal alfa'}")
    print("Etiquetas img migradas a srcset:")
    for path, count in changed:
        print(f" - {path}: {count}")


if __name__ == "__main__":
    main()
