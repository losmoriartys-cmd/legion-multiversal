"""Contrato del color de identidad de los creadores (fuente única)."""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_creator_colors  # noqa: E402
import validate_creator_colors as validator  # noqa: E402

DATA = json.loads((ROOT / "data" / "creator-colors.json").read_text(encoding="utf-8"))
ROSTER_IDS = [h["id"] for h in json.loads((ROOT / "data" / "roster.json").read_text(encoding="utf-8"))["heroes"]]


class CreatorColorsSourceTests(unittest.TestCase):
    def test_real_data_passes_every_rule(self):
        self.assertEqual(validator.validate(DATA, ROSTER_IDS), [])

    def test_every_roster_creator_has_exactly_one_color(self):
        self.assertEqual(sorted(DATA["creators"]), sorted(ROSTER_IDS))

    def test_generated_css_is_in_sync(self):
        css = (ROOT / "creator-colors.css").read_text(encoding="utf-8")
        self.assertEqual(css, build_creator_colors.render_css(DATA))

    def test_css_exposes_a_variable_and_a_selector_per_creator(self):
        css = (ROOT / "creator-colors.css").read_text(encoding="utf-8")
        for creator_id, entry in DATA["creators"].items():
            self.assertIn(f"--c-{creator_id}: {entry['color']};", css)
            self.assertIn(f'[data-creator-id="{creator_id}"]', css)


class CreatorColorsRulesTests(unittest.TestCase):
    def mutated(self, creator_id, color):
        data = copy.deepcopy(DATA)
        data["creators"][creator_id]["color"] = color
        return validator.validate(data, ROSTER_IDS)

    def test_rejects_invalid_hex(self):
        self.assertTrue(any("hex" in e for e in self.mutated("akuma", "violeta")))

    def test_rejects_low_contrast(self):
        self.assertTrue(any("contraste" in e for e in self.mutated("akuma", "#303a4d")))

    def test_rejects_duplicate_colors(self):
        errors = self.mutated("akuma", DATA["creators"]["rod3r1k"]["color"])
        self.assertTrue(any("repetido" in e for e in errors))

    def test_rejects_near_identical_colors(self):
        errors = self.mutated("akuma", "#f0555b")
        self.assertTrue(any("parecidos" in e for e in errors))

    def test_rejects_creator_missing_from_colors_or_unknown_to_roster(self):
        data = copy.deepcopy(DATA)
        del data["creators"]["habitos"]
        data["creators"]["fantasma"] = {"color": "#ffffff", "name": "Blanco"}
        errors = validator.validate(data, ROSTER_IDS)
        self.assertTrue(any("habitos" in e for e in errors))
        self.assertTrue(any("fantasma" in e for e in errors))


class CreatorColorsConsumersTests(unittest.TestCase):
    def test_home_loads_the_generated_stylesheet(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("./creator-colors.css", html)

    def test_collaboration_script_has_no_private_color_map(self):
        js = (ROOT / "games-registry.js").read_text(encoding="utf-8")
        self.assertNotIn("CREATOR_COLORS", js)
        self.assertIn("var(--c-", js)

    def test_app_has_no_parallel_color_map(self):
        js = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertNotIn("heroAccentColors", js)


if __name__ == "__main__":
    unittest.main()
