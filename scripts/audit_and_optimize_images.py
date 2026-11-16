#!/usr/bin/env python3
"""Audita referencias de imágenes y propone conversiones WebP reversibles.

Por defecto no modifica el repositorio. Con --apply escribe únicamente WebP
que ahorran al menos el porcentaje configurado y actualiza referencias exactas.
Los originales solo se eliminan si se solicita --delete-originals y después de
haber escrito y verificado las referencias.
"""
from __future__ import annotations

import argparse
import io
import os
import sys
import tempfile
from collections import Counter
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {
    ".html", ".htm", ".js", ".mjs", ".cjs", ".css", ".json", ".py",
    ".md", ".yml", ".yaml", ".xml", ".txt", ".svg",
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
IGNORED_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache"}
PROTECTED_FILES = {"og-legion-multiversal.jpg", "legion_logo_final_hybrid.png"}


def is_ignored(path: Path) -> bool:
    return any(part in IGNORED_DIRS for part in path.parts)


def collect_text_files() -> list[Path]:
    return sorted(
        p for p in ROOT.rglob("*")
        if p.is_file() and p.suffix.lower() in TEXT_EXTENSIONS and not is_ignored(p)
    )


def find_images() -> list[Path]:
    return sorted(
        p for p in ROOT.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS and not is_ignored(p)
    )


def read_text_files(paths: list[Path]) -> dict[Path, str]:
    corpus = {}
    for path in paths:
        try:
            corpus[path] = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            print(f"[OMITIDO: NO UTF-8] {path.relative_to(ROOT).as_posix()}")
        except OSError as exc:
            print(f"[ERROR DE LECTURA] {path}: {exc}")
    return corpus


def image_to_webp_bytes(image_path: Path, max_width: int, quality: int) -> bytes:
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RuntimeError(
            "Falta Pillow. Instalalo con: python -m pip install Pillow"
        ) from exc

    with Image.open(image_path) as source:
        # Respeta orientación EXIF y conserva transparencia cuando existe.
        image = ImageOps.exif_transpose(source)
        has_alpha = (
            image.mode in ("RGBA", "LA")
            or (image.mode == "P" and "transparency" in image.info)
        )
        image = image.convert("RGBA" if has_alpha else "RGB")
        if image.width > max_width:
            height = max(1, round(image.height * max_width / image.width))
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=quality, method=6)
        return buffer.getvalue()


def reference_variants(image_path: Path, text_path: Path) -> set[str]:
    relative = image_path.relative_to(ROOT).as_posix()
    from_text_file = os.path.relpath(image_path, text_path.parent).replace(os.sep, "/")
    variants = {relative, "./" + relative, from_text_file, "./" + from_text_file}
    variants.update({quote(value, safe="/._-") for value in tuple(variants)})
    return {value for value in variants if value and value != "."}


def replacement_pairs(
    source: Path,
    target: Path,
    text_path: Path,
    observed_variants: set[str],
    basename_is_unique: bool,
) -> dict[str, str]:
    """Build exact replacements, including URL-encoded path components."""
    old_relative = source.relative_to(ROOT).as_posix()
    new_relative = target.relative_to(ROOT).as_posix()
    old_local = os.path.relpath(source, text_path.parent).replace(os.sep, "/")
    new_local = os.path.relpath(target, text_path.parent).replace(os.sep, "/")
    pairs = {
        old_relative: new_relative,
        "./" + old_relative: "./" + new_relative,
        old_local: new_local,
        "./" + old_local: "./" + new_local,
    }
    if basename_is_unique:
        pairs[source.name] = target.name

    encoded_old = quote(source.name, safe="._-")
    encoded_new = quote(target.name, safe="._-")
    for observed in observed_variants:
        # A bare filename is ambiguous when multiple assets share that basename.
        if observed == source.name or observed == encoded_old:
            if not basename_is_unique:
                continue
        if observed.endswith(source.name):
            pairs[observed] = observed[:-len(source.name)] + target.name
        elif observed.endswith(encoded_old):
            pairs[observed] = observed[:-len(encoded_old)] + encoded_new
    return pairs


def atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Fuerza simulación; es el modo predeterminado.")
    parser.add_argument("--apply", action="store_true", help="Escribe WebP y actualiza referencias.")
    parser.add_argument(
        "--delete-originals", action="store_true",
        help="Elimina originales solo después de verificar WebP y referencias. Requiere --apply.",
    )
    parser.add_argument("--max-width", type=int, default=1200)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--min-saving-percent", type=float, default=10.0)
    parser.add_argument("--min-size-kb", type=float, default=150.0)
    args = parser.parse_args()

    if args.delete_originals and not args.apply:
        parser.error("--delete-originals requiere --apply")
    if args.dry_run and args.apply:
        parser.error("--dry-run y --apply son opciones incompatibles")
    if args.max_width < 1 or not 1 <= args.quality <= 100:
        parser.error("--max-width debe ser positivo y --quality estar entre 1 y 100")
    if args.min_saving_percent < 0 or args.min_size_kb < 0:
        parser.error("Los umbrales no pueden ser negativos")

    text_files = collect_text_files()
    corpus = read_text_files(text_files)
    images = find_images()
    basename_counts = Counter(path.name for path in images)
    print(f"Modo: {'APLICACIÓN' if args.apply else 'SIMULACIÓN (--dry-run por defecto)'}")
    print(f"Archivos de texto analizados: {len(corpus)} | Imágenes raster: {len(images)}")

    orphans = []
    candidates = []
    reserved_targets: set[Path] = set()

    for image_path in images:
        relative = image_path.relative_to(ROOT).as_posix()
        refs_by_file = {
            text_path: reference_variants(image_path, text_path)
            for text_path, content in corpus.items()
            if any(token in content for token in reference_variants(image_path, text_path))
            or (basename_counts[image_path.name] == 1 and image_path.name in content)
        }
        refs = list(refs_by_file)
        original_size = image_path.stat().st_size
        original_kb = original_size / 1024

        if not refs:
            orphans.append((relative, original_kb))
            continue
        if image_path.name in PROTECTED_FILES or original_kb <= args.min_size_kb:
            continue

        try:
            webp_data = image_to_webp_bytes(image_path, args.max_width, args.quality)
        except Exception as exc:
            print(f"[ERROR DE CONVERSIÓN] {relative}: {exc}")
            continue

        webp_size = len(webp_data)
        saving = (original_size - webp_size) * 100 / original_size if original_size else 0
        if webp_size >= original_size or saving < args.min_saving_percent:
            print(
                f"[SIN AHORRO SUFICIENTE] {relative}: {original_kb:.1f} KB -> "
                f"{webp_size / 1024:.1f} KB ({saving:.1f}%)"
            )
            continue

        target = image_path.with_suffix(".webp")
        if target.exists() or target in reserved_targets:
            print(f"[CONFLICTO: DESTINO YA EXISTE] {target.relative_to(ROOT).as_posix()}; no se modifica.")
            continue
        reserved_targets.add(target)
        candidates.append((image_path, target, webp_data, refs_by_file, saving))
        print(
            f"[OPTIMIZABLE] {relative}: {original_kb:.1f} KB -> "
            f"{len(webp_data) / 1024:.1f} KB (-{saving:.1f}%)"
        )

    if args.apply and candidates:
        # Primero escribe y verifica todos los destinos; no se toca ningún original.
        completed = []
        for source, target, data, refs_by_file, saving in candidates:
            atomic_write(target, data)
            if target.stat().st_size != len(data):
                raise RuntimeError(f"Verificación de escritura fallida: {target}")
            completed.append((source, target, refs_by_file))

        # Reescribe solo variantes de ruta observadas en cada archivo.
        updates = {}
        for source, target, refs_by_file in completed:
            for text_path, variants in refs_by_file.items():
                pairs = replacement_pairs(
                    source,
                    target,
                    text_path,
                    variants,
                    basename_counts[source.name] == 1,
                )
                for old, new in pairs.items():
                    if old and old in corpus[text_path]:
                        updates.setdefault(text_path, corpus[text_path])
                        updates[text_path] = updates[text_path].replace(old, new)

        for text_path, updated_content in updates.items():
            atomic_write(text_path, updated_content.encode("utf-8"))
            if text_path.read_text(encoding="utf-8") != updated_content:
                raise RuntimeError(f"Verificación de referencias fallida: {text_path}")

        # Solo después de verificar todos los destinos y referencias se permite borrar.
        if args.delete_originals:
            for source, target, _ in completed:
                if not target.is_file():
                    raise RuntimeError(f"No se elimina {source}: falta el WebP verificado.")
                source.unlink()
                print(f"[ORIGINAL ELIMINADO] {source.relative_to(ROOT).as_posix()}")

        print(f"WebP creados: {len(completed)} | Archivos de texto actualizados: {len(updates)}")
    elif args.apply:
        print("No hubo conversiones con ahorro suficiente; no se modificó ningún archivo.")

    print(f"\n=== IMÁGENES SIN REFERENCIAS DETECTADAS ({len(orphans)}) ===")
    for path, size_kb in orphans:
        print(f"[HUÉRFANA: REVISAR MANUALMENTE] {path} ({size_kb:.1f} KB)")
    print("No se eliminan imágenes huérfanas automáticamente.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
