import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
GAMES = json.loads((ROOT / "data" / "games.json").read_text(encoding="utf-8"))
SCRIPT = (ROOT / "games-registry.js").read_text(encoding="utf-8")
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")


class CollaborationsRegistryContractTests(unittest.TestCase):
    def test_chapter_07_uses_the_shared_registry_and_roster_sources(self):
        self.assertIn('id="collab-games-registry"', HTML)
        self.assertIn('src="./games-registry.js?v=20261121-collab-registry-1"', HTML)
        self.assertIn("fetch('./data/games.json'", SCRIPT)
        self.assertIn("./styles.css?v=20261121-arsenal-registry-1", HTML)
        self.assertIn("fetch('./data/roster.json'", SCRIPT)
        self.assertIn("fetch('./data.json'", SCRIPT)

    def test_registry_controls_and_live_results_are_accessible(self):
        for marker in ('id="collab-search"', 'id="collab-category"', 'id="collab-creator"',
                       'id="collab-registry-status"', 'aria-live="polite"',
                       'aria-labelledby="collab-registry-title"'):
            self.assertIn(marker, HTML)
        self.assertIn("data-collab-session", SCRIPT)
        self.assertIn("data-collab-participant", SCRIPT)
        self.assertIn("data-pov-channel", SCRIPT)

    def test_all_documented_sessions_come_from_one_master_catalog(self):
        sessions = [session for game in GAMES["juegos"] for session in game["sesiones"]]
        self.assertEqual(len(sessions), 10)
        self.assertEqual(sum(len(session["pov"]) for session in sessions), 11)
        self.assertEqual(len({session["bit"] for session in sessions}), 10)
        self.assertIn("games.json", SCRIPT)

    def test_among_us_keeps_participants_separate_from_pov_channels(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "among-us")
        session = game["sesiones"][0]
        self.assertEqual(len(session["participantes"]), 4)
        self.assertNotIn("moriartys", session["participantes"])
        self.assertEqual([pov["canal"] for pov in session["pov"]], ["moriartys", "rod3r1k"])

    def test_barfender_remains_outside_the_bit_timeline_as_exp001(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "barfender")
        chapter = HTML.split('id="chapter-12"', 1)[1].split('id="chapter-5"', 1)[0]
        self.assertEqual(game["expediente_comercial"], "EXP-001")
        self.assertEqual(game["sesiones"], [])
        self.assertIn("EXP-001", chapter)
        self.assertIn('id="barfender-expediente"', chapter)
        self.assertIn("collab-registry", chapter)

    def test_backrooms_alias_is_not_rendered_as_a_second_session(self):
        backrooms = [game for game in GAMES["juegos"] if "Backrooms" in game["aliases"]]
        self.assertEqual(len(backrooms), 1)
        self.assertEqual(backrooms[0]["nombre"], "Escape the Backrooms")
        self.assertEqual(backrooms[0]["sesiones"][0]["bit"], "BIT-001")

    def test_cover_and_avatar_fallbacks_do_not_repeat_placeholder_art(self):
        self.assertIn("ARTE OFICIAL PENDIENTE", SCRIPT)
        self.assertNotIn("assets/carnet/", SCRIPT)
        self.assertIn("collab-avatar-fallback", SCRIPT)
        self.assertIn("profile_image_url", SCRIPT)
        self.assertIn(".collab-game-cover-fallback", CSS)
        self.assertIn(".collab-avatar-wrap.no-pov", CSS)

    def test_old_separate_preview_is_not_the_chapter_07_entry_point(self):
        chapter = HTML.split('id="chapter-12"', 1)[1].split('id="chapter-5"', 1)[0]
        self.assertNotIn('href="./bitacora-preview.html"', chapter)
        self.assertIn('href="#collab-games-registry"', chapter)


if __name__ == "__main__":
    unittest.main()
