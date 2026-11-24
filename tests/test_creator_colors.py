"""Cada integrante tiene un color propio, válido, distinto y legible con texto oscuro."""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def luminance(hex_color: str) -> float:
    channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


class CreatorColorTests(unittest.TestCase):
    def setUp(self):
        self.colors = {key: value["color"] for key, value in json.loads((ROOT / "data" / "creator-colors.json").read_text(encoding="utf-8"))["creators"].items()}
        roster = json.loads((ROOT / "data" / "roster.json").read_text(encoding="utf-8"))
        self.ids = {hero["id"] for hero in roster["heroes"]}

    def test_every_roster_member_has_exactly_one_color(self):
        self.assertEqual(set(self.colors), self.ids)

    def test_colors_are_valid_and_distinct(self):
        for member, color in self.colors.items():
            self.assertRegex(color, r"^#[0-9a-fA-F]{6}$", member)
        self.assertEqual(len({c.lower() for c in self.colors.values()}), len(self.colors))

    def test_dark_text_is_readable_on_every_color(self):
        dark = luminance("#0b0f17")
        for member, color in self.colors.items():
            ratio = (luminance(color) + 0.05) / (dark + 0.05)
            self.assertGreaterEqual(ratio, 4.5, member)


if __name__ == "__main__":
    unittest.main()
