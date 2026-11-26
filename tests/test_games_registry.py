import copy
import json
import unittest
from pathlib import Path

from scripts.validate_games_registry import validate_registry

ROOT = Path(__file__).resolve().parents[1]
GAMES = json.loads((ROOT / "data" / "games.json").read_text(encoding="utf-8"))
ROSTER = json.loads((ROOT / "data/roster.json").read_text(encoding="utf-8"))
SCHEMA = json.loads((ROOT / "schemas/games.schema.json").read_text(encoding="utf-8"))


class GamesRegistryTests(unittest.TestCase):
    def test_master_registry_is_valid_against_canonical_roster(self):
        self.assertEqual(validate_registry(GAMES, ROSTER), [])

    def test_schema_declares_ficha_fields_as_optional(self):
        session_schema = SCHEMA["$defs"]["sesion"]
        properties = session_schema["properties"]
        ficha_fields = {"resumen", "clips", "numeros", "momentos", "imagen"}
        self.assertTrue(ficha_fields.issubset(properties))
        self.assertTrue(ficha_fields.isdisjoint(session_schema["required"]))
        self.assertFalse(session_schema["additionalProperties"])

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
        self.assertEqual(len(sessions), 11)
        self.assertEqual(len(povs), 14)
        self.assertEqual({session["bit"] for session in sessions}, {f"BIT-{n:03d}" for n in range(1, 12)})

    def test_capture_metrics_reject_impossible_calendar_dates(self):
        bad = copy.deepcopy(GAMES)
        session = next(session for game in bad["juegos"] for session in game["sesiones"])
        session["numeros"] = {
            "duracion_vod_s": 3600,
            "vistas_vod": 25,
            "fuente": "Twitch",
            "capturado": "2026-02-30",
        }
        errors = validate_registry(bad, ROSTER)
        self.assertTrue(any("numeros.capturado no es una fecha de calendario válida" in error for error in errors))

    def test_among_us_separates_four_participants_from_two_pov_channels(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "among-us")
        session = game["sesiones"][0]
        self.assertEqual(set(session["participantes"]), {"akuma", "habitos", "lady-moriarty", "rod3r1k"})
        self.assertEqual([pov["canal"] for pov in session["pov"]], ["moriartys", "rod3r1k"])

    def test_peak_pov_belongs_to_akuma(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "peak")
        session = game["sesiones"][0]
        self.assertEqual(set(session["participantes"]), {"akuma", "lady-moriarty"})
        self.assertEqual(session["pov"][0]["canal"], "akuma")

    def test_barfender_is_a_regular_collaboration_with_three_pov(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "barfender")
        self.assertEqual(game["expediente_comercial"], "EXP-001")
        session = game["sesiones"][0]
        self.assertEqual(session["bit"], "BIT-011")
        self.assertEqual(set(session["participantes"]), {"akuma", "lady-moriarty", "moriartys", "rod3r1k"})
        self.assertEqual({pov["canal"] for pov in session["pov"]}, {"moriartys", "rod3r1k", "lady-moriarty"})
        self.assertEqual(session["imagen"], "BarFenderLos4.jpg")
        self.assertEqual(len(session["clips"]), 4)
        self.assertIn("tres VOD públicos", session["resumen"])

    def test_unverified_game_counts_remain_null_and_dates_have_source(self):
        unknown_games = [game for game in GAMES["juegos"] if game["jugadores"] is None]
        self.assertTrue(unknown_games)
        self.assertTrue(all(game["fuente_jugadores"] is None for game in unknown_games))
        sessions = [session for game in GAMES["juegos"] for session in game["sesiones"]]
        # Una fecha solo se carga con fuente verificable; sin fuente permanece en null.
        self.assertTrue(all((session["fecha"] is None) == (session["fuente_fecha"] is None) for session in sessions))
        by_bit = {session["bit"]: session for session in sessions}
        # BIT-001/002/003/004/007: VOD tipo highlight; con autorización de Demian se usa la fecha de creación del highlight.
        for bit, session in by_bit.items():
            self_msg = bit + ": toda fecha necesita el VOD de Twitch como fuente"
            self.assertTrue(session["fuente_fecha"].startswith("https://www.twitch.tv/videos/"), self_msg)

    def test_fortnite_pov_belongs_to_rod_channel(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "fortnite")
        self.assertEqual(game["sesiones"][0]["pov"][0]["canal"], "rod3r1k")

    def test_minecraft_separates_editions_from_platform_and_mode(self):
        game = next(game for game in GAMES["juegos"] if game["id"] == "minecraft")
        self.assertEqual(game["ediciones"], ["Java", "Bedrock"])
        self.assertIsNone(game["plataformas"])
        self.assertEqual(game["modalidad"], "Mundo compartido")

    def test_session_image_rejects_unsafe_or_missing_paths(self):
        bad = copy.deepcopy(GAMES)
        session = next(session for game in bad["juegos"] for session in game["sesiones"])
        session["imagen"] = "../secrets.jpg"
        errors = validate_registry(bad, ROSTER)
        self.assertTrue(any("imagen debe ser una ruta local existente y segura" in error for error in errors))

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