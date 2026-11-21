import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
GAMES = json.loads((ROOT / "data" / "games.json").read_text(encoding="utf-8"))
SCRIPT = (ROOT / "arsenal-registry.js").read_text(encoding="utf-8")
COLLAB_SCRIPT = (ROOT / "games-registry.js").read_text(encoding="utf-8")
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")


class ArsenalRegistryContractTests(unittest.TestCase):
    APP = (ROOT / "app.js").read_text(encoding="utf-8")
    def test_chapter_08_reads_the_shared_master_catalog(self):
        chapter = HTML.split('id="chapter-5"', 1)[1].split('id="chapter-6"', 1)[0]
        self.assertIn('id="arsenal-registry"', chapter)
        self.assertIn('src="./arsenal-registry.js?v=20261121-arsenal-registry-1"', HTML)
        self.assertIn("fetch('./data/games.json'", SCRIPT)

    def test_catalog_summary_matches_the_master_registry(self):
        sessions = [session for game in GAMES["juegos"] for session in game["sesiones"]]
        self.assertEqual(len(GAMES["juegos"]), 18)
        self.assertEqual(len(sessions), 10)
        self.assertEqual(sum(len(session["pov"]) for session in sessions), 11)
        self.assertIn("renderSummary", SCRIPT)

    def test_escape_the_backrooms_replaces_the_old_duplicate_title_and_store(self):
        game = next(item for item in GAMES["juegos"] if item["id"] == "escape-the-backrooms")
        self.assertEqual(game["nombre"], "Escape the Backrooms")
        self.assertEqual(game["tienda"], "https://store.steampowered.com/app/1943950/")
        self.assertNotIn("2141730", SCRIPT)
        chapter = HTML.split('id="chapter-5"', 1)[1].split('id="chapter-6"', 1)[0]
        self.assertNotIn("Backrooms: Escape Together", chapter)

    def test_barfender_is_a_separate_commercial_case_not_a_bit_session(self):
        game = next(item for item in GAMES["juegos"] if item["id"] == "barfender")
        self.assertEqual(game["expediente_comercial"], "EXP-001")
        self.assertEqual(game["sesiones"], [])
        self.assertIn("commercial", SCRIPT)
        self.assertIn("barfender-expediente", SCRIPT)

    def test_status_filters_and_player_filter_are_data_driven(self):
        for marker in ("documented", "discovery", "commercial", "arsenal-players-filter", "arsenal-category-filter"):
            self.assertIn(marker, HTML + SCRIPT)
        self.assertIn("game.jugadores.max<minPlayers", SCRIPT.replace(" ", ""))
        self.assertIn("stateOf(game)", SCRIPT)

    def test_roulette_uses_only_current_filter_results(self):
        self.assertIn("visibleGames[Math.floor(Math.random()*visibleGames.length)]", SCRIPT.replace(" ", ""))
        self.assertIn("filtered()", SCRIPT)

    def test_cross_navigation_uses_canonical_ids(self):
        self.assertIn("session.bit.toLowerCase()", COLLAB_SCRIPT)
        self.assertIn("data-open-arsenal", COLLAB_SCRIPT)
        self.assertIn("data-open-bit", SCRIPT)
        self.assertIn("arsenal-game-", SCRIPT)
        self.assertIn("window.switchChapter(12,{scrollBehavior:'auto'})", SCRIPT)
        self.assertIn("scrollIntoView({block:'center',behavior:'auto'})", SCRIPT)

    def test_cross_chapter_navigation_uses_instant_scroll_without_racing_global_smooth_scroll(self):
        self.assertIn("options.scrollBehavior === 'auto'", self.APP)
        self.assertIn("rootScroller.style.scrollBehavior = 'auto'", self.APP)
        self.assertIn("requestAnimationFrame(() => window.requestAnimationFrame", self.APP)
        self.assertIn("window.switchChapter(12,{scrollBehavior:'auto'})", SCRIPT)
        self.assertIn("window.switchChapter(5, { scrollBehavior: 'auto' })", COLLAB_SCRIPT)

    def test_missing_cover_and_player_data_are_not_invented(self):
        self.assertIn("game.portada", SCRIPT)
        self.assertIn("game.jugadores", SCRIPT)
        self.assertIn("PORTADA OFICIAL PENDIENTE", SCRIPT)
        self.assertIn("cantidad sin verificar", SCRIPT)
        self.assertIn(".arsenal-registry-cover-fallback", CSS)


if __name__ == "__main__":
    unittest.main()
