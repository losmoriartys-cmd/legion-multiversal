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
        self.assertIn('href="./marcas/"', hero)
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


import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class PublicSubpagesContractTests(unittest.TestCase):
    def test_brand_page_is_printable_and_has_unique_h1(self):
        html = (ROOT / "marcas" / "index.html").read_text(encoding="utf-8")
        self.assertEqual(html.count("<h1"), 1)
        self.assertIn("window.print()", html)
        self.assertIn("6 + 2", html)
        self.assertIn("Partner Creator", html)

    def test_resources_and_methodology_are_separate_pages(self):
        resources = (ROOT / "recursos" / "index.html").read_text(encoding="utf-8")
        methodology = (ROOT / "metodologia" / "index.html").read_text(encoding="utf-8")
        self.assertIn("KEYMAILER", resources)
        self.assertIn("LURKIT", resources)
        self.assertIn("Twitch Helix API", methodology)
        self.assertIn("No sumar", methodology)

    def test_root_metadata_and_footer_use_selected_public_domain(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('rel="canonical" href="https://legion-multiversal.pages.dev/"', html)
        self.assertIn('property="og:url" content="https://legion-multiversal.pages.dev/"', html)
        self.assertIn('href="./metodologia/"', html)
        self.assertIn('href="./recursos/"', html)


if __name__ == "__main__":
    unittest.main()
