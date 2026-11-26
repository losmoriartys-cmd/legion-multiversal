#!/usr/bin/env python3
"""Build a deterministic, reference-linked inventory of tracked project resources."""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "data/resource-protection-policy.json"
TEXT_EXTENSIONS = {
    ".css", ".html", ".js", ".json", ".md", ".py", ".sh", ".sql",
    ".svg", ".txt", ".xml", ".yml", ".yaml"
}
IMAGE_EXTENSIONS = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
FONT_DOMAINS = {"fonts.googleapis.com", "fonts.gstatic.com"}
MAX_TEXT_BYTES = 3_000_000


def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def kind_for(path: str) -> str:
    suffix = PurePosixPath(path).suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        return "image_or_illustration"
    if suffix == ".css":
        return "stylesheet"
    if suffix == ".html":
        return "html_page"
    if suffix in {".woff", ".woff2", ".ttf", ".otf"}:
        return "font_binary"
    if suffix == ".json":
        return "structured_data"
    if suffix in {".yml", ".yaml"}:
        return "workflow_or_configuration"
    if suffix == ".js":
        return "javascript"
    if suffix == ".py":
        return "python_source"
    if suffix == ".md":
        return "documentation"
    if suffix in {".sh", ".sql"}:
        return "operational_source"
    return "other"


def change_policy(path: str, policy: dict) -> str:
    if path in policy.get("routine_generated_data", []):
        return "routine_generated_data"
    if path in policy.get("explicit_paths", []):
        return "explicit_authorization"
    if PurePosixPath(path).suffix.lower() in set(policy.get("explicit_extensions", [])):
        return "explicit_authorization"
    for pattern in policy.get("review_required_patterns", []):
        if fnmatch.fnmatch(path, pattern):
            return "review_and_checks"
    return "review_and_checks"


def load_sources(paths: list[str]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for relative in paths:
        if PurePosixPath(relative).suffix.lower() not in TEXT_EXTENSIONS:
            continue
        target = ROOT / relative
        if target.is_symlink() or not target.is_file() or target.stat().st_size > MAX_TEXT_BYTES:
            continue
        try:
            result[relative] = target.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
    return result


def source_role(source: str) -> str:
    suffix = PurePosixPath(source).suffix.lower()
    if source.startswith("tests/"):
        return "test"
    if source.startswith(".github/workflows/"):
        return "workflow"
    if suffix == ".md":
        return "documentation"
    if suffix == ".json":
        return "structured_data"
    if suffix in {".html", ".css", ".js"}:
        return "runtime_source"
    if suffix in {".yml", ".yaml"}:
        return "configuration"
    if suffix == ".py":
        return "tooling"
    return "source_reference"


def references_for(path: str, sources: dict[str, list[str]], basename_unique: bool) -> list[dict]:
    basename = PurePosixPath(path).name
    basename_re = re.compile(r"(?<![A-Za-z0-9_-])" + re.escape(basename) + r"(?![A-Za-z0-9_-])")
    references = []
    for source, lines in sources.items():
        if source == path:
            continue
        for number, line in enumerate(lines, 1):
            if path in line:
                token = path
            elif basename_unique and basename_re.search(line):
                token = basename
            else:
                continue
            references.append({
                "source": source,
                "source_role": source_role(source),
                "line": number,
                "token": token,
                "context": line.strip()[:240]
            })
    return references


def external_resources(sources: dict[str, list[str]]) -> tuple[list[dict], list[dict]]:
    """Collect declared runtime font dependencies, excluding test fixtures and tooling examples."""
    urls = []
    families = []
    seen_urls = set()
    seen_families = set()
    url_re = re.compile(r"https://[^\\s\"'<>)]+")

    for source, lines in sources.items():
        suffix = PurePosixPath(source).suffix.lower()
        if source.startswith(("tests/", ".github/", "docs/")) or suffix not in {".html", ".css", ".js"}:
            continue
        for number, line in enumerate(lines, 1):
            declares_font_url = re.search(
                r"(?:href|src)\\s*=|url\\s*\\(|@import\\s+",
                line,
                re.IGNORECASE,
            )
            if declares_font_url and any(domain in line for domain in FONT_DOMAINS):
                for url in url_re.findall(line):
                    url = url.rstrip(";,")
                    if any(domain in url for domain in FONT_DOMAINS) and url not in seen_urls:
                        seen_urls.add(url)
                        urls.append({
                            "provider": "Google Fonts",
                            "url": url,
                            "source": source,
                            "line": number,
                            "context": line.strip()[:240]
                        })
            for match in re.finditer(r"font-family\\s*:\\s*([^;{}]+)", line, re.IGNORECASE):
                for family in match.group(1).split(","):
                    normalized = family.strip().strip("'\"")
                    if normalized and normalized.lower() not in {"inherit", "initial", "unset", "sans-serif", "serif", "cursive", "monospace"}:
                        key = normalized.lower()
                        if key not in seen_families:
                            seen_families.add(key)
                            families.append({"family": normalized, "source": source, "line": number})
    return urls, families


def build_inventory(policy: dict) -> dict:
    paths = sorted(filter(None, git("ls-files", "-z").split("\0")))
    sources = load_sources(paths)
    basename_counts = Counter(PurePosixPath(path).name for path in paths)
    resources = []
    for relative in paths:
        target = ROOT / relative
        if target.is_symlink():
            digest = None
            symlink = True
        elif target.is_file():
            digest = sha256_file(target)
            symlink = False
        else:
            digest = None
            symlink = False
        refs = references_for(relative, sources, basename_counts[PurePosixPath(relative).name] == 1)
        try:
            blob_sha = git("rev-parse", f"HEAD:{relative}").strip()
        except RuntimeError:
            blob_sha = None
        resources.append({
            "path": relative,
            "kind": kind_for(relative),
            "change_policy": change_policy(relative, policy),
            "sha256": digest,
            "git_blob_sha": blob_sha,
            "symlink": symlink,
            "reference_count": len(refs),
            "references": refs
        })

    font_urls, font_families = external_resources(sources)
    counts = Counter(item["kind"] for item in resources)
    policies = Counter(item["change_policy"] for item in resources)
    unreferenced_assets = [
        item["path"] for item in resources
        if item["kind"] in {"image_or_illustration", "stylesheet", "html_page"}
        and item["reference_count"] == 0
    ]
    return {
        "schema_version": 1,
        "source_commit": git("rev-parse", "HEAD").strip(),
        "policy_file": "data/resource-protection-policy.json",
        "tracked_file_count": len(resources),
        "summary": {
            "kinds": dict(sorted(counts.items())),
            "change_policies": dict(sorted(policies.items())),
            "unreferenced_visual_resources": unreferenced_assets
        },
        "resources": resources,
        "external_resources": {
            "font_urls": font_urls,
            "font_families": font_families
        }
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera un inventario SHA-256 enlazado a referencias reales del árbol Git.")
    parser.add_argument("--output", type=Path, default=Path("reports/resource-inventory.json"))
    args = parser.parse_args()
    try:
        policy = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
        inventory = build_inventory(policy)
        destination = args.output if args.output.is_absolute() else ROOT / args.output
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"RESOURCE INVENTORY: PASS — {inventory['tracked_file_count']} archivos; "
              f"{len(inventory['external_resources']['font_urls'])} URLs de fuentes externas; "
              f"{len(inventory['summary']['unreferenced_visual_resources'])} recursos visuales sin referencia.")
        print(f"Inventario: {destination.relative_to(ROOT) if destination.is_relative_to(ROOT) else destination}")
        print(f"SHA de origen: {inventory['source_commit']}")
        return 0
    except Exception as exc:
        print(f"RESOURCE INVENTORY: ERROR — {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
