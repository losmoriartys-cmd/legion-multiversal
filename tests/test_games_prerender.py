"""Contracts for the static Bitácora and Arsenal HTML fallback."""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
GAMES = ROOT / "data/games.json"


class GamesPrerenderContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = INDEX.read_text(encoding="utf-8")
        cls.games = json.loads(GAMES.read_text(encoding="utf-8"))

    def block(self, start: str, end: str) -> str:
        left = self.html.index(start) + len(start)
        right = self.html.index(end, left)
        return self.html[left:right]

    def test_generated_html_is_synchronized_with_master_json(self):
        result = subprocess.run(
            [sys.executable, "scripts/render_games_prerender.py", "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_all_sessions_and_catalog_entries_are_in_initial_html(self):
        collab = self.block(
            "<!-- GAMES_PRERENDER:COLLAB:START -->",
            "<!-- GAMES_PRERENDER:COLLAB:END -->",
        )
        arsenal = self.block(
            "<!-- GAMES_PRERENDER:ARSENAL:START -->",
            "<!-- GAMES_PRERENDER:ARSENAL:END -->",
        )
        sessions = [session for game in self.games["juegos"] for session in game.get("sesiones", [])]
        self.assertEqual(collab.count('data-prerendered="true"'), len(sessions))
        self.assertEqual(collab.count("FUENTE VERIFICADA"), len(sessions))
        self.assertEqual(arsenal.count('data-prerendered="true"'), len(self.games["juegos"]))
        self.assertIn('data-collab-ready="prerendered"', self.html)
        self.assertIn('data-arsenal-ready="prerendered"', self.html)
        self.assertIn('id="collab-registry-grid" aria-live="polite" aria-busy="false"', self.html)
        self.assertIn('id="arsenal-grid" aria-live="polite" aria-busy="false"', self.html)

    def test_static_summaries_match_current_registry_counts(self):
        collab = self.block(
            "<!-- GAMES_PRERENDER:COLLAB_SUMMARY:START -->",
            "<!-- GAMES_PRERENDER:COLLAB_SUMMARY:END -->",
        )
        arsenal = self.block(
            "<!-- GAMES_PRERENDER:ARSENAL_SUMMARY:START -->",
            "<!-- GAMES_PRERENDER:ARSENAL_SUMMARY:END -->",
        )
        self.assertEqual([int(value) for value in __import__("re").findall(r"<strong>(\d+)</strong>", collab)], [11, 11, 14, 6])
        self.assertEqual([int(value) for value in __import__("re").findall(r"<strong>(\d+)</strong>", arsenal)], [18, 11, 7])
        self.assertNotIn("EXPEDIENTES COMERCIALES", arsenal)

    def test_no_javascript_content_does_not_reintroduce_commercial_classification(self):
        self.assertIn("ARCHIVO HISTÓRICO · EXP-001", self.html)
        self.assertIn("«archivo histórico» conserva material de apoyo", self.html)
        self.assertNotIn("expediente comercial", self.html.lower())
        self.assertIn("BarFenderLos4.jpg", self.html)
        self.assertNotIn("BIT-012", [session["bit"] for game in self.games["juegos"] for session in game.get("sesiones", [])])


if __name__ == "__main__":
    unittest.main()
