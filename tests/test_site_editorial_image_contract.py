import pathlib
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

    def test_recruitment_and_campaign_archive_disclaimers_are_explicit(self):
        self.assertIn("requiere una decisión compartida", self.html)
        self.assertIn("no confundir una postulación con una aprobación", self.html)

    def test_editorial_sequence_is_preserved(self):
        expected = [
            "CAPÍTULO 00 · INICIO", "CAPÍTULO 01 · ORIGEN",
            "CAPÍTULO 02 · VALORES", "CAPÍTULO 04 · ESTADÍSTICAS",
            "CAPÍTULO 05 · COMUNIDAD", "CAPÍTULO 06 · ALIANZAS",
            "CAPÍTULO 07 · COLABORACIONES", "CAPÍTULO 08 · ARSENAL",
            "CAPÍTULO 09 · EN VIVO", "CAPÍTULO 10 · RECLUTAMIENTO",
        ]
        positions = [self.html.index(label) for label in expected]
        self.assertEqual(positions, sorted(positions))


if __name__ == "__main__":
    unittest.main()
