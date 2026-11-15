#!/usr/bin/env python3
"""Control de frescura y procedencia de creator-metrics.json."""
import argparse
import json
import sys
import unittest
from datetime import datetime, timedelta, timezone


def parse_ts(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("vacío o no es texto")
    dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    if dt.tzinfo is None:
        raise ValueError("sin zona horaria")
    return dt.astimezone(timezone.utc)


def validate_tolerances(*values):
    for value in values:
        if not isinstance(value, (int, float)) or isinstance(value, bool) or value < 0:
            raise ValueError("La tolerancia debe ser un número >= 0 (recibido: {!r})".format(value))


def check(metrics_ts, sources, tolerance_s=300, future_tolerance_s=300, now=None):
    validate_tolerances(tolerance_s, future_tolerance_s)
    now = now or datetime.now(timezone.utc)
    limit = now + timedelta(seconds=future_tolerance_s)
    try:
        generated = parse_ts(metrics_ts)
    except (TypeError, ValueError) as exc:
        return ["creator-metrics.json: generated_at inválido ({!r}): {}".format(metrics_ts, exc)]
    problems = []
    if generated > limit:
        problems.append("creator-metrics.json: generated_at en el futuro ({})".format(generated.isoformat()))
    parsed = {}
    for name, value in sources.items():
        try:
            stamp = parse_ts(value)
        except (TypeError, ValueError) as exc:
            problems.append("{}: timestamp ausente o inválido ({!r}): {}".format(name, value, exc))
            continue
        if stamp > limit:
            problems.append("{}: fecha futura anómala ({})".format(name, stamp.isoformat()))
        parsed[name] = stamp
    if parsed:
        newest = max(parsed, key=parsed.get)
        lag = (parsed[newest] - generated).total_seconds()
        if lag > tolerance_s:
            problems.append("creator-metrics.json está {:.0f}s por detrás de {} (tolerancia {}s)".format(
                lag, newest, tolerance_s))
    return problems


def check_provenance(snapshot, sources):
    if not isinstance(snapshot, dict) or not snapshot:
        return ["creator-metrics.json: falta el bloque de procedencia o está vacío"]
    problems = []
    for name, actual in sources.items():
        entry = snapshot.get(name)
        if not isinstance(entry, dict) or "updated_at" not in entry:
            problems.append("{}: no figura en la procedencia de creator-metrics.json".format(name))
            continue
        try:
            used, current = parse_ts(entry["updated_at"]), parse_ts(actual)
        except (TypeError, ValueError) as exc:
            problems.append("{}: timestamp de procedencia inválido: {}".format(name, exc))
            continue
        if used != current:
            problems.append("{}: las métricas se generaron con updated_at={} pero el archivo actual tiene {}".format(
                name, used.isoformat(), current.isoformat()))
    return problems


def load_json(path):
    try:
        with open(path, encoding="utf-8") as stream:
            return json.load(stream)
    except FileNotFoundError:
        raise RuntimeError("{}: el archivo no existe".format(path))
    except json.JSONDecodeError as exc:
        raise RuntimeError("{}: JSON inválido ({})".format(path, exc))
    except OSError as exc:
        raise RuntimeError("{}: no se pudo abrir ({})".format(path, exc))


def read_spec(spec):
    path, separator, field = spec.partition(":")
    if not separator or not field:
        raise RuntimeError('"{}": usá el formato archivo:campo'.format(spec))
    data = load_json(path)
    return path, data.get(field) if isinstance(data, dict) else None


class FreshnessTests(unittest.TestCase):
    NOW = datetime(2026, 11, 15, 0, 30, tzinfo=timezone.utc)

    def test_reported_case_fails_and_names_latest_source(self):
        issues = check("2026-11-14T23:47:16Z", {
            "data.json": "2026-11-15T00:10:48Z",
            "platform-stats.json": "2026-11-15T00:10:49Z"}, now=self.NOW)
        self.assertEqual(len(issues), 1)
        self.assertIn("platform-stats.json", issues[0])
        self.assertIn("1413s", issues[0])

    def test_within_tolerance_passes(self):
        self.assertEqual(check("2026-11-15T00:09:00Z", {
            "data.json": "2026-11-15T00:10:48Z"}, now=self.NOW), [])

    def test_generated_after_sources_passes(self):
        self.assertEqual(check("2026-11-15T00:20:00Z", {
            "data.json": "2026-11-15T00:10:48Z"}, now=self.NOW), [])

    def test_missing_and_invalid_source_timestamps(self):
        self.assertEqual(len(check("2026-11-15T00:20:00Z", {
            "data.json": None, "x.json": "ayer"}, now=self.NOW)), 2)

    def test_timezone_required(self):
        self.assertTrue(check("2026-11-15T00:20:00", {
            "data.json": "2026-11-15T00:10:00Z"}, now=self.NOW))

    def test_generated_timestamp_in_future(self):
        issues = check("2026-11-16T12:00:00Z", {
            "data.json": "2026-11-15T00:10:00Z"}, now=self.NOW)
        self.assertTrue(any("generated_at en el futuro" in issue for issue in issues))

    def test_source_timestamp_in_future_names_file(self):
        issues = check("2026-11-15T00:20:00Z", {
            "data.json": "2026-11-15T00:10:00Z",
            "platform-stats.json": "2026-12-01T00:00:00Z"}, now=self.NOW)
        self.assertTrue(any("platform-stats.json" in issue and "futura" in issue for issue in issues))

    def test_invalid_metrics_timestamp(self):
        self.assertTrue(check(None, {"data.json": "2026-11-15T00:10:00Z"}, now=self.NOW))

    def test_equivalent_positive_timezone_offset_passes(self):
        self.assertEqual(check("2026-11-15T01:20:00+01:00", {
            "data.json": "2026-11-15T00:10:48Z"}, now=self.NOW), [])

    def test_negative_timezone_offset_detects_648_seconds(self):
        issues = check("2026-11-14T21:00:00-03:00", {
            "data.json": "2026-11-15T00:10:48Z"}, now=self.NOW)
        self.assertEqual(len(issues), 1)
        self.assertIn("648s", issues[0])

    def test_negative_or_boolean_tolerance_rejected(self):
        with self.assertRaises(ValueError):
            check("2026-11-15T00:20:00Z", {"data.json": "2026-11-15T00:10:00Z"},
                  tolerance_s=-1, now=self.NOW)
        with self.assertRaises(ValueError):
            check("2026-11-15T00:20:00Z", {"data.json": "2026-11-15T00:10:00Z"},
                  future_tolerance_s=True, now=self.NOW)

    def test_missing_file_error_names_path(self):
        with self.assertRaises(RuntimeError) as caught:
            read_spec("no_existe_xyz.json:updated_at")
        self.assertIn("no_existe_xyz.json", str(caught.exception))

    def test_spec_without_field_is_rejected(self):
        with self.assertRaises(RuntimeError):
            read_spec("data.json")

    def test_matching_provenance_accepts_timezone_equivalence(self):
        snapshot = {
            "data.json": {"updated_at": "2026-11-15T00:10:48Z"},
            "platform-stats.json": {"updated_at": "2026-11-15T01:10:49+01:00"}}
        self.assertEqual(check_provenance(snapshot, {
            "data.json": "2026-11-15T00:10:48Z",
            "platform-stats.json": "2026-11-15T00:10:49Z"}), [])

    def test_stale_provenance_is_reported(self):
        issues = check_provenance({"data.json": {"updated_at": "2026-11-14T22:00:00Z"}}, {
            "data.json": "2026-11-15T00:10:48Z"})
        self.assertEqual(len(issues), 1)
        self.assertIn("data.json", issues[0])

    def test_missing_or_incomplete_provenance_is_reported(self):
        self.assertTrue(check_provenance(None, {"data.json": "2026-11-15T00:10:48Z"}))
        issues = check_provenance({"data.json": {"updated_at": "2026-11-15T00:10:48Z"}}, {
            "data.json": "2026-11-15T00:10:48Z",
            "platform-stats.json": "2026-11-15T00:10:49Z"})
        self.assertTrue(any("platform-stats.json" in issue for issue in issues))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--metrics")
    parser.add_argument("--source", action="append", default=[])
    parser.add_argument("--tolerance", type=float, default=300)
    parser.add_argument("--provenance", help="clave del bloque de procedencia en el archivo de métricas")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        sys.argv = [sys.argv[0]]
        unittest.main(module=__name__, verbosity=2)
        return
    if not args.metrics or not args.source:
        parser.error("Indicá --metrics archivo:campo y al menos un --source archivo:campo")
    try:
        metrics_path, metrics_ts = read_spec(args.metrics)
        sources = dict(read_spec(spec) for spec in args.source)
        problems = check(metrics_ts, sources, tolerance_s=args.tolerance)
        if args.provenance:
            metrics_data = load_json(metrics_path)
            snapshot = metrics_data.get(args.provenance) if isinstance(metrics_data, dict) else None
            problems += check_provenance(snapshot, sources)
    except (RuntimeError, ValueError) as exc:
        print("ERROR:", exc)
        raise SystemExit(2)
    for problem in problems:
        print("FALLA:", problem)
    print("OK: creator-metrics.json está al día" if not problems else "{} problema(s)".format(len(problems)))
    raise SystemExit(1 if problems else 0)


if __name__ == "__main__":
    main()
