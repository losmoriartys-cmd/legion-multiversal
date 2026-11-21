import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ConversionPhase2Contract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.js = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.css = (ROOT / "conversion-phase2.css").read_text(encoding="utf-8")

    def test_home_and_three_guided_paths(self):
        home = self.html.split('id="chapter-0"', 1)[1].split('id="chapter-1"', 1)[0]
        self.assertIn("CONOCÉ A LOS CREADORES", home)
        self.assertIn("SOY MARCA", home)
        self.assertIn("QUIERO SUMARME", home)
        self.assertEqual(home.count('class="executive-directory-card"'), 3)
        self.assertIn('class="home-live-strip"', home)
        self.assertIn('id="home-live-status"', home)
        self.assertIn('id="home-live-updated"', home)

    def test_floating_live_drawer(self):
        self.assertIn('live-player-drawer', self.html)
        self.assertIn("openLiveDrawer()", self.js)
        self.assertIn("closeLiveDrawer()", self.js)

    def test_market_benchmark_and_activation_tabs(self):
        self.assertIn("BENCHMARK DE INDUSTRIA", self.html)
        self.assertIn("TIEMPO DE EJECUCIÓN", self.html)
        self.assertIn("selectAllianceModelTab", self.js)

    def test_barfender_continuity_and_clip_metadata(self):
        self.assertIn("SESIÓN 02 · 10 NOV 2026", self.html)
        self.assertNotIn("DURACIÓN NO REGISTRADA", self.html)
        collaboration = self.html.split('id="chapter-12"', 1)[1].split('id="chapter-5"', 1)[0]
        self.assertIn("CASO COLABORATIVO DOCUMENTADO · N.º 001", collaboration)
        self.assertIn("EXP-001", collaboration)
        self.assertIn("91 usuarios activos en chat", self.html)

    def test_public_arsenal_does_not_expose_campaign_access_tables(self):
        arsenal = self.html.split('id="chapter-5"', 1)[1].split('id="chapter-6"', 1)[0]
        self.assertNotIn('id="chapter-14"', self.html)
        self.assertNotIn("ABRIR ARCHIVO DE CAMPAÑAS Y ACCESOS", self.html)
        self.assertNotIn("arsenal-internal-note", arsenal)
        self.assertNotIn("autenticación real", arsenal)

    def test_arsenal_filters_and_recruitment_tabs(self):
        arsenal = self.html.split('id="chapter-5"', 1)[1].split('id="chapter-6"', 1)[0]
        arsenal_js = (ROOT / "arsenal-registry.js").read_text(encoding="utf-8")
        self.assertIn("setRecruitmentMode", self.js)
        self.assertIn('id="arsenal-search"', arsenal)
        self.assertIn('id="arsenal-status-filter"', arsenal)
        self.assertIn('id="arsenal-category-filter"', arsenal)
        self.assertIn('id="arsenal-players-filter"', arsenal)
        self.assertIn("function filtered()", arsenal_js)
        self.assertIn("function stateOf(game)", arsenal_js)

    def test_mission_progress_is_discoverable(self):
        self.assertIn("mission-progress-trigger", self.html)
        self.assertIn("updateMissionHeader", self.js)

    def test_arsenal_count_matches_the_shared_master_registry(self):
        arsenal = self.html.split('id="chapter-5"', 1)[1].split('id="chapter-6"', 1)[0]
        registry = json.loads((ROOT / "games.json").read_text(encoding="utf-8"))
        games = registry["juegos"]
        sessions = [session for game in games for session in game["sesiones"]]
        povs = [pov for session in sessions for pov in session["pov"]]
        self.assertIn("18 JUEGOS", arsenal)
        self.assertIn('id="arsenal-grid"', arsenal)
        self.assertIn('data-arsenal-ready="false"', arsenal)
        self.assertEqual(len(games), 18)
        self.assertEqual(len(sessions), 10)
        self.assertEqual(len(povs), 11)
        self.assertNotIn("11. BarFender", arsenal)
        self.assertNotIn("El historial de campañas y accesos se retiró", arsenal)

    def test_barfender_vod_durations_are_not_added_as_watch_time(self):
        self.assertIn("3 VOD DE ~1 H 14 MIN", self.html)
        self.assertNotIn("3 H 43 MIN 35 S", self.html)
        self.assertIn("Muestra insuficiente para publicar promedio o pico", self.html)
        self.assertNotIn("Promedio observado: 10,5", self.html)

    def test_featured_clips_use_verified_titles_and_thumbnails(self):
        clips = self.html.split('<section class="campaign-clips">', 1)[1].split("</section>", 1)[0]
        self.assertEqual(clips.count('class="clip-feature-card"'), 4)
        self.assertEqual(clips.count('class="clip-preview-image"'), 4)
        for title in (
            "UN SUSTO QUE TERMINA EN VÓMITO",
            "SE BOXEAN EN NUESTRO BAR",
            "BUSCAN EMPLEADO PARA EL BAR",
            "LE PEGA A HARRY POTTER",
        ):
            self.assertIn(title, clips)


if __name__ == "__main__":
    unittest.main()

    def test_barfender_summary_card_has_four_metrics_and_collapsed_reading(self):
        case = self.html.split('<div class="campaign-case-index">', 1)[1].split('<section class="campaign-vods">', 1)[0]
        self.assertEqual(case.count("<article><strong>"), 4)
        self.assertIn('<details class="barfender-reading">', case)
        self.assertIn("CÓMO LEER ESTOS DATOS", case)
        self.assertNotIn('class="campaign-metrics"', case)
        self.assertNotIn('class="campaign-impact"', case)

    def test_initial_loading_states_use_skeletons_without_copy(self):
        self.assertNotIn("Actualizando indicadores", self.html)
        self.assertNotIn("Cargando canales registrados", self.html)
        self.assertNotIn("Cargando cuentas multiplataforma", self.html)
        self.assertNotIn("Comprobando el canal seguro de envío", self.html)
        self.assertIn('id="stats-updated" class="stats-note" hidden', self.html)
        self.assertIn('class="loading-skeleton-grid"', self.html)
        self.assertIn("updatedNode.hidden=false", self.js)
