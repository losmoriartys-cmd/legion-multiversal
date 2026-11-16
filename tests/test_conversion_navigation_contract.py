import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ConversionNavigationContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "conversion-overhaul.css").read_text(encoding="utf-8")

    def test_primary_navigation_has_five_audience_routes(self):
        nav = self.html.split('<nav class="primary-navigation"', 1)[1].split("</nav>", 1)[0]
        for label, chapter in (("MIRAR", "10"), ("EXPERIENCIAS", "12"),
                               ("PARA MARCAS", "8"), ("UNITE", "6"), ("ORIGEN", "1")):
            self.assertIn(f'data-chapter="{chapter}"', nav)
            self.assertIn(label, nav)
        self.assertEqual(nav.count('data-chapter='), 5)
        self.assertNotIn("secondary-navigation", self.html)

    def test_home_hero_routes_to_live_and_brands(self):
        hero = self.html.split('<div class="executive-hero-actions">', 1)[1].split("</div>", 1)[0]
        self.assertIn('switchChapter(10)', hero)
        self.assertIn('switchChapter(8)', hero)
        self.assertNotIn("mailto:", hero)

    def test_home_live_strip_uses_public_capture_and_no_fake_schedule(self):
        self.assertIn('id="home-live-status"', self.html)
        self.assertIn('id="home-live-updated"', self.html)
        self.assertIn("homeLiveStatus.textContent", (ROOT / "app.js").read_text(encoding="utf-8"))
        self.assertIn("home-live-strip", self.css)

    def test_previous_name_is_not_in_homepage_teaser(self):
        home = self.html.split('<section id="chapter-0"', 1)[1].split('<section id="chapter-1"', 1)[0]
        self.assertNotIn("DE S3X-MEN A LEGIÓN MULTIVERSAL", home)

    def test_responsive_and_reduced_motion_rules_exist(self):
        for rule in ("@media (max-width: 900px)", "@media (max-width: 600px)",
                     "@media (prefers-reduced-motion: reduce)"):
            self.assertIn(rule, self.css)


if __name__ == "__main__":
    unittest.main()
