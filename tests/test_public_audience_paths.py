import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class PublicAudiencePathsContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.brand = (ROOT / "marcas/index.html").read_text(encoding="utf-8")
        cls.methodology = (ROOT / "metodologia/index.html").read_text(encoding="utf-8")
        cls.resources = (ROOT / "recursos/index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "public-audience-paths.css").read_text(encoding="utf-8")

    def test_mission_progress_is_hidden_until_real_data_arrives(self):
        trigger = self.home.split('id="mission-progress-trigger"', 1)[1].split(">", 1)[0]
        self.assertIn("hidden", trigger)
        self.assertIn("trigger.hidden=missions.length===0", self.app)
        self.assertNotIn('id="mission-progress-count">0/0', self.home)

    def test_internal_resources_are_not_linked_from_public_navigation(self):
        self.assertNotIn('href="./recursos/"', self.home)
        self.assertNotIn('href="../recursos/"', self.brand)
        self.assertNotIn('href="../recursos/"', self.methodology)
        self.assertIn('name="robots" content="noindex,nofollow"', self.resources)

    def test_brand_page_uses_only_verified_credentials(self):
        credentials = self.brand.split("<h2>CREDENCIALES</h2>", 1)[1].split("</ul>", 1)[0]
        self.assertNotIn("Keymailer", credentials)
        self.assertIn("Twitch Partner", credentials)
        self.assertIn("Lurkit Partner Creator", credentials)

    def test_public_methodology_avoids_internal_filename_inventory(self):
        self.assertNotIn("data.json", self.methodology)
        self.assertNotIn("platform-stats.json", self.methodology)
        self.assertIn("DE DÓNDE VIENEN LOS DATOS", self.methodology)

    def test_home_paths_are_responsive_and_respect_reduced_motion(self):
        self.assertIn("grid-template-columns: repeat(3, minmax(0, 1fr))", self.css)
        self.assertIn("@media (max-width: 760px)", self.css)
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.css)

    def test_home_three_entry_paths_have_distinct_destinations(self):
        home = self.home.split('id="chapter-0"', 1)[1].split('id="chapter-1"', 1)[0]
        self.assertIn('onclick="switchChapter(2)"', home)
        self.assertIn('href="./marcas/"', home)
        self.assertIn("setRecruitmentMode('creator')", home)
        self.assertIn('onclick="switchChapter(6)', home)

    def test_barfender_case_separates_session_estimate_from_public_vod_lengths(self):
        case = self.home.split('id="chapter-12"', 1)[1]
        self.assertIn("aproximadamente 90 minutos", case)
        self.assertIn("1 h 14 min cada uno", case)
        self.assertIn("no una medición de duración total ni una suma de tiempo", case)
        self.assertIn("VOD 01 · LOS MORIARTYS", case)
        self.assertIn("VOD 02 · LADY MORIARTY01", case)
        self.assertIn("VOD 03 · TheR0D3R1K", case)
        self.assertIn("no se localizó un VOD público", case)


if __name__ == "__main__":
    unittest.main()
