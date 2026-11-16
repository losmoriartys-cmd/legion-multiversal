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

    def test_origin_comic_cover_remains_vertical_and_uncropped(self):
        self.assertIn('src="image_20261107_021355.jpg', self.html)
        self.assertIn(".origin-editorial-cover img", self.css)

    def test_barfender_is_documented_as_collaboration_not_paid_campaign(self):
        self.assertIn("CASO COLABORATIVO DOCUMENTADO · N.º 001", self.html)
        self.assertIn("EXPERIENCIA<br><strong>001</strong>", self.html)
        self.assertIn("no se presenta como patrocinio ni como campaña remunerada", self.html)
        self.assertNotIn("EXPEDIENTE COMERCIAL · N.º 001", self.html)
        self.assertNotIn("EL JUEGO DE LA CAMPAÑA", self.html)

    def test_recruitment_and_campaign_archive_disclaimers_are_explicit(self):
        self.assertIn("requiere una decisión compartida", self.html)
        self.assertIn("no confundir una postulación con una aprobación", self.html)

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

if __name__ == "__main__":
    unittest.main()
