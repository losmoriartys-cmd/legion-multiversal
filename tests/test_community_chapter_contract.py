import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


class CommunityChapterContractTests(unittest.TestCase):
    def test_community_chapter_has_one_accessible_entry(self):
        self.assertEqual(HTML.count('id="chapter-9"'), 1)
        self.assertIn('aria-labelledby="belonging-intro-title"', HTML)
        self.assertIn('id="belonging-intro-title"', HTML)

    def test_community_participation_principles_are_present(self):
        for phrase in (
            "CADA VOZ CONSERVA SU IDENTIDAD",
            "LAS ACTIVIDADES SE CONFIRMAN",
            "PARTICIPAR ES VOLUNTARIO",
        ):
            self.assertIn(phrase, HTML)

    def test_community_navigation_targets_exist(self):
        targets = set(re.findall(r'onclick="switchChapter\((\d+)\)"', HTML))
        chapter_ids = set(re.findall(r'<section[^>]+id="chapter-(\d+)"', HTML))
        self.assertTrue({"2", "6", "10", "11", "12"}.issubset(targets))
        self.assertTrue({"2", "6", "10", "11", "12"}.issubset(chapter_ids))

    def test_community_hero_image_has_alt_text(self):
        match = re.search(r'<header class="belonging-hero">(.*?)</header>', HTML, re.S)
        self.assertIsNotNone(match)
        self.assertRegex(match.group(1), r'<img[^>]+alt="[^"]+"')


if __name__ == "__main__":
    unittest.main()
