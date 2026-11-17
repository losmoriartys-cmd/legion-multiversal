#!/usr/bin/env python3
"""Validate SEO and crawler metadata for the GitHub Pages production origin."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://losmoriartys-cmd.github.io/legion-multiversal/"
PUBLIC = {
    "index.html": BASE,
    "comic-moriartys.html": BASE + "comic-moriartys.html",
    "roster-02-moriartys.html": BASE + "roster-02-moriartys.html",
    "marcas/index.html": BASE + "marcas/",
    "recursos/index.html": BASE + "recursos/",
    "metodologia/index.html": BASE + "metodologia/",
}
PREVIEWS = ("bitacora-preview.html", "instituto-preview.html")
errors = []

for page, expected in PUBLIC.items():
    source = (ROOT / page).read_text(encoding="utf-8")
    canonical = f'<link rel="canonical" href="{expected}">'
    if canonical not in source:
        errors.append(f"{page}: canonical ausente o incorrecto; esperado {expected}")
for page in PREVIEWS:
    source = (ROOT / page).read_text(encoding="utf-8")
    if '<meta name="robots" content="noindex, nofollow">' not in source:
        errors.append(f"{page}: falta noindex, nofollow")
robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
if f"Sitemap: {BASE}sitemap.xml" not in robots:
    errors.append("robots.txt: Sitemap no apunta al dominio GitHub Pages")
try:
    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = {node.text for node in tree.findall(".//sm:loc", ns)}
    expected_locations = set(PUBLIC.values())
    if locations != expected_locations:
        errors.append(f"sitemap.xml: URLs inesperadas; recibidas {sorted(locations)}")
except (ET.ParseError, OSError) as exc:
    errors.append(f"sitemap.xml: XML inválido o ilegible ({exc})")
for page in (*PUBLIC.keys(), "README.md", "robots.txt", "sitemap.xml"):
    source = (ROOT / page).read_text(encoding="utf-8")
    if "pages.dev" in source:
        errors.append(f"{page}: referencia de Cloudflare Pages en metadata/documentación de producción")

if errors:
    print("ERRORES SEO / GITHUB PAGES:")
    for error in errors:
        print("- " + error)
    sys.exit(1)
print(f"SEO GitHub Pages validado: {len(PUBLIC)} URLs públicas y {len(PREVIEWS)} previews excluidas.")
