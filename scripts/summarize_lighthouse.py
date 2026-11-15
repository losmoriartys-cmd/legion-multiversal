#!/usr/bin/env python3
"""Summarize actual Lighthouse JSON reports as per-environment medians.

Usage: python scripts/summarize_lighthouse.py [reports/lighthouse]
Reads <root>/<environment>/*.report.json and writes <root>/resumen.md.
Missing metrics are reported as n/d; no values are estimated or synthesized.
"""
from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path
from typing import Callable

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "reports/lighthouse")


def category(name: str) -> Callable[[dict], float]:
    def read(report: dict) -> float:
        score = report["categories"][name]["score"]
        if score is None:
            raise ValueError(f"Categoría sin score: {name}")
        return float(score) * 100
    return read


def audit(name: str, divisor: float = 1.0) -> Callable[[dict], float]:
    def read(report: dict) -> float:
        return float(report["audits"][name]["numericValue"]) / divisor
    return read


METRICS: list[tuple[str, Callable[[dict], float], str]] = [
    ("Performance (0-100)", category("performance"), "{:.0f}"),
    ("Accessibility (0-100)", category("accessibility"), "{:.0f}"),
    ("Best Practices (0-100)", category("best-practices"), "{:.0f}"),
    ("SEO (0-100)", category("seo"), "{:.0f}"),
    ("LCP (s)", audit("largest-contentful-paint", 1000), "{:.2f}"),
    ("CLS", audit("cumulative-layout-shift"), "{:.3f}"),
    ("TBT (ms)", audit("total-blocking-time"), "{:.0f}"),
    ("Peso total (KB)", audit("total-byte-weight", 1024), "{:.0f}"),
]

if not ROOT.is_dir():
    raise SystemExit(f"No existe la carpeta de reportes: {ROOT}")

environments = sorted(path for path in ROOT.iterdir() if path.is_dir() and path.name != "__pycache__")
if not environments:
    raise SystemExit(f"No hay carpetas de entorno en {ROOT}")

table: dict[str, dict[str, str]] = {}
run_counts: dict[str, int] = {}
warnings: list[str] = []

for environment in environments:
    reports = []
    for report_path in sorted(environment.glob("*.report.json")):
        try:
            reports.append(json.loads(report_path.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError) as exc:
            warnings.append(f"[aviso] No se pudo leer {report_path}: {exc}")
    run_counts[environment.name] = len(reports)
    table[environment.name] = {}
    for label, getter, formatter in METRICS:
        values = []
        for report in reports:
            try:
                values.append(getter(report))
            except (KeyError, TypeError, ValueError, OverflowError):
                continue
        table[environment.name][label] = formatter.format(statistics.median(values)) if values else "n/d"

names = [environment.name for environment in environments]
lines = [
    "| Métrica | " + " | ".join(f"{name} (n={run_counts[name]})" for name in names) + " |",
    "|---|" + "---|" * len(names),
]
for label, _, _ in METRICS:
    lines.append("| " + label + " | " + " | ".join(table[name][label] for name in names) + " |")

output = "\n".join(lines)
output += "\n\nMedianas calculadas exclusivamente a partir de reportes JSON reales de Lighthouse. "
output += "La variación entre corridas es normal; se recomiendan al menos 3 por entorno.\n"
for warning in warnings:
    print(warning)
(ROOT / "resumen.md").write_text(output, encoding="utf-8")
print(output)
