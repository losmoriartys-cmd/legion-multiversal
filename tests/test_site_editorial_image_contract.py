import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class SiteEditorialImageContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")

    def test_panorama_images_keep_intrinsic_ratio(self):
        for selector in (
            ".executive-hero-banner img",
            ".origin-editorial-founders img",
            ".executive-case-art img",
            ".belonging-hero > img",
            ".collaboration-chapter .campaign-wide-art img",
        ):
            self.assertIn(selector, self.css)
        self.assertIn("aspect-ratio: auto;", self.css)
        self.assertIn("object-fit: contain;", self.css)

    def test_bitacora_and_comic_previews_use_clean_moriartys_cover_asset(self):
        expected = "assets/heroes/moriartys_dark.jpg"
        for relative in ("bitacora-preview.html", "comic-moriartys.html"):
            content = (ROOT / relative).read_text(encoding="utf-8")
            self.assertIn(expected, content)
            self.assertNotIn("image_20261103_160331-y-ahora", content)
            self.assertNotIn("%20(1).jpg", content)
        self.assertTrue((ROOT / expected).is_file())

    def test_all_static_images_declare_verified_intrinsic_dimensions(self):
        images = re.findall(r"<img\b[^>]*>", self.html, flags=re.IGNORECASE)
        self.assertEqual(len(images), 37)
        for image in images:
            self.assertRegex(image, r'\bwidth="[1-9][0-9]*"')
            self.assertRegex(image, r'\bheight="[1-9][0-9]*"')

    def test_origin_comic_cover_remains_vertical_and_uncropped(self):
        self.assertIn('src="image_20261107_021355.jpg', self.html)
        self.assertIn(".origin-editorial-cover img", self.css)

    def test_home_exposes_live_status_updated_from_public_capture(self):
        for marker in (
            'class="home-live-strip"',
            'id="home-live-status"',
            'id="home-live-updated"',
            'id="home-follow-link"',
            'onclick="openLiveDrawer()"',
        ):
            self.assertIn(marker, self.html)
        self.assertIn("home-live-status", (ROOT / "app.js").read_text(encoding="utf-8"))
        self.assertIn("home-live-updated", (ROOT / "app.js").read_text(encoding="utf-8"))
        self.assertIn("home-follow-link", (ROOT / "app.js").read_text(encoding="utf-8"))

    def test_barfender_is_documented_as_collaboration_not_paid_campaign(self):
        self.assertIn("CASO COLABORATIVO DOCUMENTADO · N.º 001", self.html)
        self.assertIn("EXPERIENCIA<br><strong>001</strong>", self.html)
        self.assertIn("no se presenta como patrocinio ni como campaña remunerada", self.html)
        self.assertNotIn("EXPEDIENTE COMERCIAL · N.º 001", self.html)
        self.assertNotIn("EL JUEGO DE LA CAMPAÑA", self.html)

    def test_recruitment_and_campaign_archive_disclaimers_are_explicit(self):
        self.assertIn("requiere una decisión compartida", self.html)
        self.assertNotIn('id="chapter-14"', self.html)
        self.assertIn("autenticación real", self.html)

    def test_editorial_chapter_labels_and_numbers_are_present(self):
        expected = {
            "CAPÍTULO 00 · INICIO": 'data-editorial-number="0"',
            "CAPÍTULO 01 · ORIGEN": 'data-editorial-number="1"',
            "CAPÍTULO 02 · VALORES": 'data-editorial-number="2"',
            "CAPÍTULO 04 · ESTADÍSTICAS": 'data-editorial-number="4"',
            "CAPÍTULO 05 · COMUNIDAD": 'data-editorial-number="5"',
            "CAPÍTULO 06 · ALIANZAS": 'data-editorial-number="6"',
            "CAPÍTULO 07 · COLABORACIONES": 'data-editorial-number="7"',
            "CAPÍTULO 08 · ARSENAL": 'data-editorial-number="8"',
            "CAPÍTULO 09 · EN VIVO": 'data-editorial-number="9"',
            "CAPÍTULO 10 · RECLUTAMIENTO": 'data-editorial-number="10"',
        }
        for label, number in expected.items():
            self.assertIn(label, self.html)
            position = self.html.index(label)
            opening = self.html.rfind("<section", 0, position)
            self.assertGreaterEqual(opening, 0)
            self.assertIn(number, self.html[opening:position])


class CommercialPortfolioContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
    def test_roster_has_thematic_audience_fit_for_all_eight_profiles(self):
        import json
        roster = json.loads((ROOT / "roster-data.json").read_text(encoding="utf-8"))
        self.assertEqual(len(roster["heroes"]), 8)
        for hero in roster["heroes"]:
            self.assertTrue(hero["mediaProfile"]["audience_fit"].startswith("Afinidad temática"))
        self.assertIn("No implica, por sí sola", self.html)

    def test_barfender_case_has_participants_objective_content_results_and_learning(self):
        for term in ("PARTICIPANTES", "OBJETIVO DE LA EXPERIENCIA", "CONTENIDO REGISTRADO", "RESULTADO DOCUMENTABLE", "APRENDIZAJE"):
            self.assertIn(term, self.html)
        self.assertIn("EXPERIENCIA 001 · 4 CREADORES · 4 CANALES", self.html)
        self.assertNotIn("CAMPAÑA 001 · 4 CREADORES · 4 CANALES", self.html)

    def test_three_modular_formats_and_community_growth_are_present(self):
        for term in ("FORMATO 01 · INDIVIDUAL", "FORMATO 02 · COOPERATIVO", "FORMATO 03 · MULTIPLATAFORMA", "NO SUMAMOS NOMBRES. CONSTRUIMOS VÍNCULOS."):
            self.assertIn(term, self.html)

if __name__ == "__main__":
    unittest.main()
