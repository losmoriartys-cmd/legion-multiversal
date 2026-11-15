#!/usr/bin/env python3
"""Comprueba destinos de anclas HTML locales, incluidos enlaces entre páginas."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob("*.html"))

class AnchorParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        href = attrs.get("href")
        if href:
            self.links.append(href)

documents = {}
for path in HTML_FILES:
    parser = AnchorParser()
    parser.feed(path.read_text(encoding="utf-8"))
    documents[path.resolve()] = parser

errors = []
checked = 0
for source, parser in documents.items():
    for href in parser.links:
        parsed = urlsplit(href.strip())
        if parsed.scheme or parsed.netloc or not parsed.fragment:
            continue
        target = (source.parent / unquote(parsed.path)).resolve() if parsed.path else source
        if target.suffix.lower() not in (".html", ".htm"):
            continue
        if target not in documents:
            if target.is_file():
                target_parser = AnchorParser()
                target_parser.feed(target.read_text(encoding="utf-8"))
                documents[target] = target_parser
            else:
                errors.append(f"{source.name}: destino HTML inexistente: {href}")
                continue
        checked += 1
        fragment = unquote(parsed.fragment)
        if fragment not in documents[target].ids:
            errors.append(f"{source.name}: ancla #{fragment} no encontrada en {target.name}")

required = {"inicio","origen","valores","roster","estadisticas","comunidad","alianzas","colaboraciones","arsenal","en-vivo","reclutamiento"}
index = ROOT / "index.html"
if index.resolve() in documents:
    missing = sorted(required - documents[index.resolve()].ids)
    if missing:
        errors.append("index.html: faltan anclas semánticas: " + ", ".join(missing))
print(f"Anclas locales comprobadas: {checked}")
if errors:
    print("ERRORES DE ANCLAS:")
    for error in errors:
        print("- " + error)
    sys.exit(1)
print("Comprobación de anclas superada.")
