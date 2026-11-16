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
