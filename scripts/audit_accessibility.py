#!/usr/bin/env python3
"""Auditoría estática de accesibilidad de las páginas publicadas."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = ("index.html", "bitacora-preview.html", "roster-02-moriartys.html")
ERRORS, WARNINGS = [], []

class AuditParser(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids, self.labels, self.controls = [], set(), []
        self.images = self.images_without_dimensions = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"): self.ids.append(a["id"])
        if tag == "label" and a.get("for"): self.labels.add(a["for"])
        if tag == "img":
            self.images += 1
            if "alt" not in a: ERRORS.append(f"{self.path.name}: img sin atributo alt ({a.get('src','sin src')})")
            if not (a.get("width") and a.get("height")): self.images_without_dimensions += 1
        if tag == "iframe" and not a.get("title", "").strip():
            ERRORS.append(f"{self.path.name}: iframe sin title")
        if tag in ("input", "select", "textarea") and a.get("type") != "hidden":
            # Honeypot de anti-spam: oculto intencionalmente del árbol accesible
            # y del orden de tabulación. No confundir con controles de usuario.
            if a.get("name") in {"website", "contact_hp"} and a.get("tabindex") == "-1":
                return
            if not (a.get("aria-label") or a.get("aria-labelledby")):
                self.controls.append((a.get("id"), tag))
        if tag == "a" and a.get("target") == "_blank":
            rel = set((a.get("rel") or "").lower().split())
            if not {"noopener", "noreferrer"}.issubset(rel):
                ERRORS.append(f"{self.path.name}: target=_blank sin noopener noreferrer ({a.get('href','')})")

pages = [ROOT / name for name in PAGES if (ROOT / name).is_file()]
total_images = no_dimensions = 0
for path in pages:
    parser = AuditParser(path)
    parser.feed(path.read_text(encoding="utf-8"))
    for key, count in Counter(parser.ids).items():
        if count > 1: ERRORS.append(f"{path.name}: id duplicado #{key}")
    for control_id, tag in parser.controls:
        if not control_id or control_id not in parser.labels:
            ERRORS.append(f"{path.name}: {tag} sin label asociado ni nombre ARIA")
    total_images += parser.images
    no_dimensions += parser.images_without_dimensions

css = "\n".join(p.read_text(encoding="utf-8") for p in ROOT.glob("*.css"))
if ":focus-visible" not in css: ERRORS.append("CSS: falta foco visible")
if "prefers-reduced-motion" not in css: ERRORS.append("CSS: falta soporte para movimiento reducido")
if no_dimensions:
    WARNINGS.append(f"{no_dimensions}/{total_images} imágenes HTML sin width/height intrínsecos; medir dimensiones reales antes de fijarlas para reducir CLS.")

print(f"HTML de producción: {len(pages)} documentos; imágenes: {total_images}; sin dimensiones intrínsecas: {no_dimensions}")
for warning in WARNINGS: print("ADVERTENCIA: " + warning)
if ERRORS:
    print("ERRORES:")
    for error in ERRORS: print("- " + error)
    sys.exit(1)
print("Auditoría estática de accesibilidad superada.")
