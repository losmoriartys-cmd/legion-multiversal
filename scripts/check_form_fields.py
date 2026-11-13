#!/usr/bin/env python3
"""Ensure data-contact-form controls stay aligned with the Pages Function allowlist."""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
ENDPOINT = ROOT / "functions" / "api" / "contact.js"

class ContactFormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_contact_form = False
        self.forms = []
        self.current = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "form":
            self.in_contact_form = "data-contact-form" in attrs
            if self.in_contact_form:
                self.current = set()
                self.forms.append(self.current)
        elif self.in_contact_form and tag in {"input", "select", "textarea"}:
            name = attrs.get("name")
            if name:
                self.current.add(name)

    def handle_endtag(self, tag):
        if tag == "form":
            self.in_contact_form = False

html = HTML.read_text(encoding="utf-8")
endpoint = ENDPOINT.read_text(encoding="utf-8")
parser = ContactFormParser()
parser.feed(html)
match = re.search(r"const ALLOWED_FIELDS = new Set\(\[(.*?)\]\);", endpoint, re.S)
if not match:
    sys.exit("No se pudo localizar ALLOWED_FIELDS en contact.js")
allowed = set(re.findall(r'"([^"]+)"', match.group(1)))
if not parser.forms:
    sys.exit("No se encontraron formularios data-contact-form")
errors = []
for index, fields in enumerate(parser.forms, start=1):
    unknown = sorted(fields - allowed)
    if unknown:
        errors.append(f"Formulario de contacto {index}: campos fuera de allowlist: {', '.join(unknown)}")
    if "contact_hp" not in fields:
        errors.append(f"Formulario de contacto {index}: falta el honeypot contact_hp")
creator_fields = parser.forms[0]
if "Correo de contacto" not in creator_fields:
    errors.append("El formulario de incorporación no incluye correo de contacto")
if errors:
    sys.exit("\n".join(errors))
print(f"OK: {len(parser.forms)} formularios de contacto alineados con ALLOWED_FIELDS.")
