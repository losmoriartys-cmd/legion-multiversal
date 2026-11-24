#!/usr/bin/env python3
"""Validate SEO and crawler metadata for the Cloudflare Pages production origin."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://legion-multiversal.pages.dev/"
PUBLIC = {
    "index.html": BASE,
    "comic-moriartys.html": BASE + "comic-moriartys.html",
    "roster-02-moriartys.html": BASE + "roster-02-moriartys.html",
    "politica-de-privacidad/index.html": BASE + "politica-de-privacidad/",
}
SITEMAP_URLS = {
    BASE,
    BASE + "marcas/",
    BASE + "recursos/",
    BASE + "metodologia/",
    BASE + "politica-de-privacidad/",
    BASE + "comic-moriartys.html",
    BASE + "roster-02-moriartys.html",
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
    errors.append("robots.txt: Sitemap no apunta al dominio Cloudflare Pages")
try:
    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = {node.text for node in tree.findall(".//sm:loc", ns)}
    if locations != SITEMAP_URLS:
        errors.append(f"sitemap.xml: URLs inesperadas; recibidas {sorted(locations)}")
except (ET.ParseError, OSError) as exc:
    errors.append(f"sitemap.xml: XML inválido o ilegible ({exc})")
for page in ("index.html", "README.md", "robots.txt", "sitemap.xml"):
    source = (ROOT / page).read_text(encoding="utf-8")
    if "github.io" in source:
        errors.append(f"{page}: referencia obsoleta de GitHub Pages")

if errors:
    print("ERRORES SEO / CLOUDFLARE PAGES:")
    for error in errors:
        print("- " + error)
    sys.exit(1)
print(f"SEO Cloudflare Pages validado: {len(PUBLIC)} canónicos, {len(SITEMAP_URLS)} URLs públicas y {len(PREVIEWS)} previews excluidas.")
