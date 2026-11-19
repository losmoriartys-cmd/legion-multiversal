"""Keep the no-JavaScript Roster links synchronized with roster-data.json."""
from __future__ import annotations
import argparse
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ROSTER_PATH = ROOT / "roster-data.json"
INDEX_PATH = ROOT / "index.html"
START = "<!-- ROSTER_NOSCRIPT_LINKS:START -->"
END = "<!-- ROSTER_NOSCRIPT_LINKS:END -->"
ALLOWED_HOSTS = {
    "twitch": {"twitch.tv", "www.twitch.tv"},
    "youtube": {"youtube.com", "www.youtube.com", "youtu.be"},
    "instagram": {"instagram.com", "www.instagram.com"},
    "kick": {"kick.com", "www.kick.com"},
}


def generated_list(roster: dict) -> str:
    heroes = roster.get("heroes") or []
    rows = []
    for hero in heroes:
        registry = roster.get("name_registry") or {}
        canonical = registry.get(str(hero.get("id") or ""), {})
        name = html.escape(str(canonical.get("display_name") or hero.get("display_name") or hero.get("name") or "Integrante"), quote=True)
        description = html.escape(str(canonical.get("short_description") or "Integrante del roster de Legión Multiversal."), quote=True)
        links = []
        for account in hero.get("accounts") or []:
            platform = str(account.get("platform") or "").lower()
            url = str(account.get("url") or "")
            parsed = urlparse(url)
            if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS.get(platform, set()):
                continue
            links.append('<a href="' + html.escape(url, quote=True) + '" target="_blank" rel="noopener noreferrer">' + html.escape(platform.upper()) + '</a>')
        suffix = " · ".join(links) if links else "plataformas públicas pendientes de confirmar"
        rows.append("                <li><strong>" + name + "</strong> · " + description + " · " + suffix + "</li>")
    return "<ul>\n" + "\n".join(rows) + "\n              </ul>"


def render_block(roster: dict) -> str:
    return START + "\n" + generated_list(roster) + "\n" + END


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="comprobar que index.html coincide con roster-data.json")
    mode.add_argument("--write", action="store_true", help="actualizar el bloque estático dentro de index.html")
    args = parser.parse_args()
    try:
        roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))
        source = INDEX_PATH.read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError) as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 2
    if source.count(START) != 1 or source.count(END) != 1:
        print("ERROR: index.html debe contener una sola pareja de marcadores del Roster.", file=sys.stderr)
        return 1
    start = source.index(START)
    end = source.index(END)
    if end <= start:
        print("ERROR: los marcadores del Roster están invertidos.", file=sys.stderr)
        return 1
    expected = render_block(roster)
    actual = source[start:end + len(END)]
    if args.check:
        heroes = roster.get("heroes") or []
        items = re.findall(r"<li>(.*?)</li>", actual, flags=re.DOTALL)
        synchronized = len(items) == len(heroes)
        registry = roster.get("name_registry") or {}
        if synchronized:
            for hero, item in zip(heroes, items):
                identity = registry.get(str(hero.get("id") or ""), {})
                fields = (
                    identity.get("display_name") or hero.get("display_name") or hero.get("name") or "Integrante",
                    identity.get("short_description") or "Integrante del roster de Legión Multiversal.",
                )
                if any(html.escape(str(field), quote=True) not in item for field in fields):
                    synchronized = False
                    break
                for account in hero.get("accounts") or []:
                    platform = str(account.get("platform") or "").lower()
                    url = str(account.get("url") or "")
                    parsed = urlparse(url)
                    if parsed.scheme == "https" and parsed.hostname in ALLOWED_HOSTS.get(platform, set()):
                        if html.escape(url, quote=True) not in item:
                            synchronized = False
                            break
                if not synchronized:
                    break
        if not synchronized:
            print("ERROR: la lista sin JavaScript está desincronizada. Ejecutá: python scripts/render_roster_noscript.py --write", file=sys.stderr)
            return 1
        print("OK: fallback del Roster sincronizado con {} perfiles, roles y descripciones.".format(len(heroes)))
        return 0
    updated = source[:start] + expected + source[end + len(END):]
    INDEX_PATH.write_text(updated, encoding="utf-8")
    print("Actualizado el fallback estático del Roster.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
