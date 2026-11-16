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

    def test_home_fallback_offers_follow_link_only_when_no_fresh_live_channel(self):
        self.assertIn('id="home-follow-link"', self.html)
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("homeFollowLink.hidden=isFresh&&liveCount>0", app)

    def test_non_home_editorial_cover_is_lazy_loaded(self):
        self.assertIn('image_20261107_021355.jpg?v=20261112', self.html)
        cover = self.html.split('image_20261107_021355.jpg?v=20261112', 1)[1][:260]
        self.assertIn('loading="lazy"', cover)

    def test_live_player_is_not_preloaded_in_initial_document(self):
        self.assertNotIn("<iframe", self.html)
        self.assertIn('id="live-player"', self.html)

    def test_home_credential_strip_uses_verified_claims(self):
        self.assertIn('class="executive-credential-strip"', self.html)
        self.assertIn("TWITCH PARTNER", self.html)
        self.assertIn("PARTNER CREATOR", self.html)
        self.assertIn("8 CAMPAÑAS", self.html)
        self.assertIn("1 EXPERIENCIA MULTICANAL", self.html)
        self.assertIn(".executive-credential-strip", self.css)

    def test_bar_fender_home_teaser_does_not_repeat_the_case_photo(self):
        self.assertNotIn("stream4.jpg", self.html)
        self.assertIn("executive-case-summary", self.html)
        self.assertIn("BarFenderLos4.jpg", self.html)

    def test_collaboration_archive_uses_four_neutral_clip_titles(self):
        clips = self.html.split('<section class="campaign-clips">', 1)[1].split("</section>", 1)[0]
        self.assertEqual(clips.count('class="clip-feature-card"'), 4)
        self.assertIn("REACCIÓN INESPERADA", clips)
        self.assertIn("BARFENDER: UNA PARTIDA ENTRE CUATRO", clips)
        self.assertNotIn("OJO OJO OJO VOMITA", clips)
        self.assertNotIn("TE VOY A PEGAR, BOLUDO", clips)
        self.assertEqual(clips.count('target="_blank"'), 4)

    def test_heavy_data_loads_are_deferred_until_relevant_chapters(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        onload = app.split("window.onload = function()", 1)[1]
        self.assertIn("loadChapterResources(initialNumber)", onload)
        self.assertNotIn("await loadEpicCreatorPrograms()", onload)
        self.assertNotIn("await loadRosterData()", onload)
        self.assertNotIn("loadTwitchClipsData()", onload)
        self.assertIn("if (Number(chapterNum) === 8)", app)
        self.assertIn("if (Number(chapterNum) === 9)", app)
        self.assertIn("loadResourceOnce('twitch-clips', loadTwitchClipsData)", app)

    def test_alliance_points_to_the_single_full_experience_dossier(self):
        alliance = self.html.split('id="alliance-cases"', 1)[1].split('id="alliance-transparency"', 1)[0]
        self.assertIn("VER EXPEDIENTES DE COLABORACIÓN", alliance)
        self.assertNotIn("alliance-case-facts", alliance)
        self.assertNotIn("BARFENDER", alliance)

    def test_background_data_refresh_runs_only_on_relevant_chapters(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("querySelector('#chapter-0.active, #chapter-3.active, #chapter-10.active')", app)
        self.assertIn("document.getElementById('chapter-2')?.classList.contains('active')", app)


if __name__ == "__main__":
    unittest.main()
