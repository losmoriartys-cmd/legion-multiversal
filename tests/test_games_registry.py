import copy
import json
import unittest
from pathlib import Path

from scripts.validate_games_registry import validate_registry

ROOT = Path(__file__).resolve().parents[1]
GAMES = json.loads((ROOT / "games.json").read_text(encoding="utf-8"))
ROSTER = json.loads((ROOT / "roster-data.json").read_text(encoding="utf-8"))


class GamesRegistryTests(unittest.TestCase):
    def test_master_registry_is_valid_against_canonical_roster(self):
        self.assertEqual(validate_registry(GAMES, ROSTER), [])

    def test_catalog_has_one_entry_per_unique_game(self):
        games = GAMES["juegos"]
        ids = [game["id"] for game in games]
        self.assertEqual(len(games), 18)
        self.assertEqual(len(ids), len(set(ids)))

    def test_backrooms_alias_is_merged_into_escape_the_backrooms(self):
        matches = [game for game in GAMES["juegos"] if "Backrooms" in game["aliases"]]
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["id"], "escape-the-backrooms")
        self.assertEqual(matches[0]["nombre"], "Escape the Backrooms")
        self.assertEqual(matches[0]["tienda"], "https://store.steampowered.com/app/1943950/")
        self.assertEqual(matches[0]["jugadores"], {"min": 1, "max": 4})
        self.assertEqual(matches[0]["sesiones"][0]["bit"], "BIT-001")

    def test_ten_bit_sessions_and_eleven_povs_are_kept(self):
        sessions = [session for game in GAMES["juegos"] for session in game["sesiones"]]
        povs = [pov for session in sessions for pov in session["pov"]]
        self.assertEqual(len(sessions), 10)
        self.assertEqual(len(povs), 11)
        self.assertEqual({session["bit"] for session in sessions}, {f"BIT-{n:03d}" for n in range(1, 11)})

    def test_among_us_separates_four_participants_from_two_pov_channels(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "among-us")
        session = game["sesiones"][0]
        self.assertEqual(set(session["participantes"]), {"akuma", "habitos", "lady-moriarty", "rod3r1k"})
        self.assertEqual([pov["canal"] for pov in session["pov"]], ["moriartys", "rod3r1k"])

    def test_peak_keeps_unknown_pov_owner_unassigned(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "peak")
        session = game["sesiones"][0]
        self.assertEqual(set(session["participantes"]), {"akuma", "lady-moriarty"})
        self.assertIsNone(session["pov"][0]["canal"])

    def test_barfender_is_commercial_expedient_not_a_bit_session(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "barfender")
        self.assertEqual(game["expediente_comercial"], "EXP-001")
        self.assertEqual(game["sesiones"], [])

    def test_unverified_game_counts_and_dates_remain_null(self):
        unknown_games = [game for game in GAMES["juegos"] if game["jugadores"] is None]
        self.assertTrue(unknown_games)
        self.assertTrue(all(game["fuente_jugadores"] is None for game in unknown_games))
        sessions = [session for game in GAMES["juegos"] for session in game["sesiones"]]
        self.assertTrue(all(session["fecha"] is None and session["fuente_fecha"] is None for session in sessions))

    def test_minecraft_separates_editions_from_platform_and_mode(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "minecraft")
        self.assertEqual(game["ediciones"], ["Java", "Bedrock"])
        self.assertIsNone(game["plataformas"])
        self.assertEqual(game["modalidad"], "Mundo compartido")

    def test_unknown_participant_is_rejected(self):
        bad = copy.deepcopy(GAMES)
        bad["juegos"][2]["sesiones"][0]["participantes"].append("personaje-inexistente")
        self.assertTrue(any("participante no existe en el Roster" in error for error in validate_registry(bad, ROSTER)))

    def test_repeated_game_id_is_rejected(self):
        bad = copy.deepcopy(GAMES)
        duplicate = copy.deepcopy(bad["juegos"][0])
        bad["juegos"].append(duplicate)
        self.assertTrue(any("ID de juego duplicado" in error for error in validate_registry(bad, ROSTER)))

    def test_repeated_bit_id_is_rejected(self):
        bad = copy.deepcopy(GAMES)
        bad["juegos"][3]["sesiones"].append(copy.deepcopy(bad["juegos"][2]["sesiones"][0]))
        self.assertTrue(any("ID de bitácora duplicado" in error for error in validate_registry(bad, ROSTER)))

    def test_unknown_twitch_pov_channel_is_rejected(self):
        bad = copy.deepcopy(GAMES)
        bad["juegos"][2]["sesiones"][0]["pov"][0]["canal"] = "pato-oratoris"
        self.assertTrue(any("no es un integrante con cuenta Twitch" in error for error in validate_registry(bad, ROSTER)))

    def test_tracking_query_parameters_are_not_kept_in_vod_links(self):
        for game in GAMES["juegos"]:
            for session in game["sesiones"]:
                for pov in session["pov"]:
                    self.assertNotIn("?", pov["url"])
                    self.assertNotIn("&", pov["url"])


if __name__ == "__main__":
    unittest.main()