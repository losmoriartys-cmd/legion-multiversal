#!/usr/bin/env python3
"""Validación estática de rutas locales y referencias de medios del sitio."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
CHECKED = set()


def is_external(value):
    value = (value or "").strip()
    if not value or value.startswith(("#", "data:", "javascript:", "mailto:", "tel:", "//")):
        return True
    return bool(urlsplit(value).scheme)


def check_local_reference(value, origin):
    value = (value or "").strip()
    if is_external(value):
        return
    path = unquote(urlsplit(value).path).split("#", 1)[0]
    if not path:
        return
    target = (ROOT / path.lstrip("/")).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        ERRORS.append(f"{origin}: ruta fuera del repositorio: {value}")
        return
    if not target.is_file():
        ERRORS.append(f"{origin}: no existe {value}")
    else:
        CHECKED.add(str(target.relative_to(ROOT.resolve())))


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("src", "href", "poster"):
            if attrs.get(key):
                self.refs.append((attrs[key], f"index.html <{tag} {key}>"))


html = ROOT / "index.html"
if not html.is_file():
    ERRORS.append("No existe index.html")
else:
    parser = ReferenceParser()
    parser.feed(html.read_text(encoding="utf-8"))
    for value, origin in parser.refs:
        check_local_reference(value, origin)

css_files = sorted(ROOT.glob("*.css"))
if not css_files:
    ERRORS.append("No hay hojas de estilo CSS para validar")
else:
    for css in css_files:
        text = css.read_text(encoding="utf-8")
        for value in re.findall(r"url\(\s*['\"]?([^'\")]+)", text, flags=re.I):
            check_local_reference(value, f"{css.name} url()")

# Comprueba los recursos de imagen declarados por cada integrante.
roster_path = ROOT / "roster-data.json"
if roster_path.is_file():
    try:
        roster = json.loads(roster_path.read_text(encoding="utf-8"))
        heroes = roster.get("heroes") if isinstance(roster, dict) else None
        if not isinstance(heroes, list) or not heroes:
            ERRORS.append("roster-data.json: falta el arreglo heroes o está vacío")
        else:
            names = set()
            for index, hero in enumerate(heroes, start=1):
                if not isinstance(hero, dict) or not hero.get("name") or not hero.get("role"):
                    ERRORS.append(f"roster-data.json: perfil {index} sin name/role")
                    continue
                if hero["name"] in names:
                    ERRORS.append(f"roster-data.json: nombre duplicado {hero['name']}")
                names.add(hero["name"])
                for field in ("portrait", "img"):
                    if hero.get(field):
                        check_local_reference(hero[field], f"roster-data.json {hero['name']} {field}")
                    elif field == "portrait":
                        ERRORS.append(f"roster-data.json {hero['name']}: falta portrait")
            print(f"Roster: {len(heroes)} perfiles revisados.")
    except (OSError, json.JSONDecodeError) as exc:
        ERRORS.append(f"roster-data.json: {exc}")
else:
    ERRORS.append("No existe roster-data.json")

# Verifica que las URL públicas guardadas en los JSON tengan formato http(s).
for path in ROOT.glob("*.json"):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        ERRORS.append(f"{path.name}: JSON inválido: {exc}")
        continue

    def walk(value, location="$"):
        if isinstance(value, dict):
            for key, child in value.items():
                child_location = f"{location}.{key}"
                if isinstance(child, str) and (key == "url" or key.endswith("_url")) and child:
                    parsed = urlsplit(child)
                    if parsed.scheme not in ("http", "https") or not parsed.netloc:
                        ERRORS.append(f"{path.name} {child_location}: URL inválida: {child}")
                walk(child, child_location)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                walk(child, f"{location}[{index}]")
    walk(data)

print(f"Referencias locales comprobadas: {len(CHECKED)}")
if ERRORS:
    print("ERRORES DE VALIDACIÓN:")
    for error in ERRORS:
        print(f"- {error}")
    sys.exit(1)
print("Validación estática superada.")
