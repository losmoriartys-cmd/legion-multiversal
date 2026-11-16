#!/usr/bin/env python3
"""Clasifica referencias de imágenes sin borrar ni modificar recursos."""
from __future__ import annotations
import argparse
import os
from pathlib import Path
from urllib.parse import quote

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"}
TEXT_GROUPS = {
    "runtime": {".html", ".htm", ".css", ".json", ".svg"},
    "javascript": {".js", ".mjs", ".cjs"},
    "docs": {".md", ".txt", ".xml"},
    "tooling": {".py", ".sh", ".yml", ".yaml", ".toml"},
}
IGNORED_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", "reports"}

def ignored(path: Path) -> bool:
    return any(part in IGNORED_DIRS for part in path.parts)

def collect_text(root: Path) -> list[Path]:
    extensions = set().union(*TEXT_GROUPS.values())
    return sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in extensions and not ignored(p))

def collect_images(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS and not ignored(p))

def variants(image: Path, text_file: Path, root: Path, basename_unique: bool) -> set[str]:
    relative = image.relative_to(root).as_posix()
    local = os.path.relpath(image, text_file.parent).replace(os.sep, "/")
    values = {relative, "./" + relative, local, "./" + local,
              quote(relative, safe="/._-"), quote(local, safe="/._-")}
    if basename_unique:
        values.update({image.name, quote(image.name, safe="._-")})
    return {value for value in values if value and value != "."}

def audit(root: Path) -> list[dict]:
    root = root.resolve()
    corpus = {}
    for path in collect_text(root):
        try:
            corpus[path] = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            continue
    images = collect_images(root)
    basename_counts = {}
    for image in images:
        basename_counts[image.name] = basename_counts.get(image.name, 0) + 1

    records = []
    for image in images:
        refs = {"runtime": [], "javascript": [], "docs": [], "tooling": []}
        for text_file, content in corpus.items():
            if text_file.resolve() == image.resolve():
                continue
            group = next((name for name, extensions in TEXT_GROUPS.items()
                          if text_file.suffix.lower() in extensions), None)
            if not group:
                continue
            hits = [value for value in variants(image, text_file, root, basename_counts[image.name] == 1)
                    if value in content]
            if hits:
                refs[group].append({"file": text_file.relative_to(root).as_posix(), "matches": sorted(set(hits))})
        if refs["runtime"]:
            classification = "runtime"
        elif refs["javascript"]:
            classification = "javascript"
        elif refs["docs"] or refs["tooling"]:
            classification = "docs/tooling"
        else:
            classification = "orphan"
        records.append({
            "path": image.relative_to(root).as_posix(),
            "bytes": image.stat().st_size,
            "classification": classification,
            "references": refs,
        })
    return records

def render_report(root: Path, records: list[dict]) -> str:
    headings = {
        "runtime": "1. Referencias activas: HTML, CSS o JSON",
        "javascript": "2. Referencias desde JavaScript",
        "docs/tooling": "3. Solo documentación, scripts o configuración",
        "orphan": "4. Sin referencias textuales localizables",
    }
    counts = {key: sum(r["classification"] == key for r in records) for key in headings}
    total_bytes = sum(r["bytes"] for r in records)
    lines = [
        "# Auditoría de referencias de imágenes", "",
        "- **Raíz analizada:** " + str(root.resolve()),
        "- **Archivos de imagen:** " + str(len(records)),
        "- **Peso total:** " + format(total_bytes / 1024 / 1024, ".2f") + " MiB", "",
        "| Clasificación principal | Cantidad |", "|---|---:|",
        "| Runtime (HTML/CSS/JSON) | " + str(counts["runtime"]) + " |",
        "| JavaScript | " + str(counts["javascript"]) + " |",
        "| Solo docs / tooling | " + str(counts["docs/tooling"]) + " |",
        "| Sin referencias localizables | " + str(counts["orphan"]) + " |", "",
        "> «Sin referencias localizables» no significa que el archivo pueda borrarse: puede existir una ruta construida dinámicamente, una referencia externa o un uso manual no detectable. No se archiva ni elimina ningún recurso con esta auditoría.",
    ]
    for key, heading in headings.items():
        lines.extend(["", "## " + heading, ""])
        selected = [r for r in records if r["classification"] == key]
        if not selected:
            lines.append("Sin archivos en esta categoría.")
            continue
        for record in selected:
            lines.append("- " + record["path"] + " — " + format(record["bytes"] / 1024, ".1f") + " KB")
            for ref_group, refs in record["references"].items():
                for ref in refs:
                    matches = ", ".join(m for m in ref["matches"])
                    lines.append("  - " + ref_group + ": " + ref["file"] + " (coincidencia: " + matches + ")")
    return "\n".join(lines) + "\n"

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="raíz del snapshot del repositorio que se audita")
    parser.add_argument("--output", type=Path, help="guarda el informe Markdown en esta ruta")
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        parser.error("la raíz no existe: " + str(root))
    report = render_report(root, audit(root))
    print(report)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding="utf-8")
        print("Informe guardado en: " + str(args.output))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
