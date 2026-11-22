"""Blocking tests for the cross-file canonical data contract."""
from __future__ import annotations
import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import validate_data_contracts as contracts
import validate_games_registry
import validate_creator_records


class CanonicalDataContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.documents = {path: contracts.read_json(path) for path in contracts.DATA_FILES}

    def test_current_repository_data_passes_all_schemas_and_semantic_contracts(self):
        self.assertEqual(contracts.validate_documents(copy.deepcopy(self.documents)), [])

    def test_roster_requires_nonempty_declared_schedule(self):
        roster = copy.deepcopy(self.documents["data/roster.json"])
        del roster["heroes"][0]["schedule"]
        errors = contracts.schema_diagnostics("data/roster.json", roster, "roster-data.schema.json")
        self.assertTrue(any("/heroes/0" in error and "schedule" in error for error in errors), errors)
        roster["heroes"][0]["schedule"] = ""
        errors = contracts.schema_diagnostics("data/roster.json", roster, "roster-data.schema.json")
        self.assertTrue(any("schedule" in error for error in errors), errors)

    def test_roster_complementary_links_require_https_and_known_fields(self):
        roster = copy.deepcopy(self.documents["data/roster.json"])
        roster["heroes"][0]["links"] = [{"platform": "link_hub", "url": "http://example.com"}]
        errors = contracts.schema_diagnostics("data/roster.json", roster, "roster-data.schema.json")
        self.assertTrue(any("links" in error and "https" in error.lower() for error in errors), errors)
        roster["heroes"][0]["links"] = [{"platform": "link_hub", "url": "https://example.com", "unknown": "typo"}]
        errors = contracts.schema_diagnostics("data/roster.json", roster, "roster-data.schema.json")
        self.assertTrue(any("unknown" in error for error in errors), errors)

    def test_roster_profile_set_is_protected(self):
        docs = copy.deepcopy(self.documents)
        docs["data/roster.json"]["heroes"].pop()
        errors = contracts.semantic_diagnostics(docs)
        self.assertTrue(any("conjunto protegido de ocho IDs cambió" in error for error in errors), errors)

    def test_game_ids_and_bit_ids_are_unique(self):
        games = copy.deepcopy(self.documents["data/games.json"])
        sessions = [session for game in games["juegos"] for session in game["sesiones"]]
        sessions[1]["bit"] = sessions[0]["bit"]
        errors = validate_games_registry.validate_registry(games, self.documents["data/roster.json"])
        self.assertTrue(any("duplicado" in error.lower() and "BIT" in error for error in errors), errors)

    def test_session_participant_must_resolve_to_a_roster_id(self):
        games = copy.deepcopy(self.documents["data/games.json"])
        games["juegos"][0]["sesiones"][0]["participantes"][0] = "creator-not-in-roster"
        errors = validate_games_registry.validate_registry(games, self.documents["data/roster.json"])
        self.assertTrue(any("creator-not-in-roster" in error and "no existe en el Roster" in error for error in errors), errors)

    def test_pov_channel_need_not_be_listed_as_a_session_participant(self):
        games = self.documents["data/games.json"]
        among_us = next(game for game in games["juegos"] if game["id"] == "among-us")
        session = next(item for item in among_us["sesiones"] if item["bit"] == "BIT-008")
        self.assertNotIn("moriartys", session["participantes"])
        self.assertIn("moriartys", [pov["canal"] for pov in session["pov"]])
        self.assertEqual(validate_games_registry.validate_registry(games, self.documents["data/roster.json"]), [])

    def test_creator_records_channel_keys_must_match_canonical_roster(self):
        records = copy.deepcopy(self.documents["data/creator-records.json"])
        records["channels"]["unknown-creator"] = records["channels"].pop("moriartys")
        errors = validate_creator_records.validate(records, self.documents["data/roster.json"])
        self.assertTrue(any("IDs de channels deben coincidir" in error for error in errors), errors)

    def test_collaboration_result_scope_and_participants_are_cross_referenced(self):
        records = copy.deepcopy(self.documents["data/creator-records.json"])
        result = records["channels"]["rod3r1k"]["collaboration_results"][0]
        result["channel_scope"] = "akuma"
        result["participants"] = ["not-a-roster-member"]
        errors = validate_creator_records.validate(records, self.documents["data/roster.json"])
        self.assertTrue(any("alcance del canal" in error for error in errors), errors)
        self.assertTrue(any("participantes fuera del roster" in error for error in errors), errors)

    def test_pato_youtube_remains_separate_from_twitch_clip_population(self):
        roster = self.documents["data/roster.json"]
        pato = next(hero for hero in roster["heroes"] if hero["id"] == "pato-oratoris")
        self.assertFalse(any(account["platform"] == "twitch" for account in pato["accounts"]))
        self.assertNotIn("pato-oratoris", self.documents["clips-data.json"]["creators"])
        self.assertIn("pato-oratoris", self.documents["platform-stats.json"]["creators"])

    def test_barfender_commercial_expediente_stays_outside_bit_sessions(self):
        games = self.documents["data/games.json"]
        barfender = next(game for game in games["juegos"] if game["id"] == "barfender")
        self.assertEqual(barfender["expediente_comercial"], "EXP-001")
        self.assertEqual(barfender["sesiones"], [])
        self.assertFalse(any(session["bit"] == "EXP-001" for game in games["juegos"] for session in game["sesiones"]))

    def test_generated_twitch_feed_keeps_archived_channels_without_promoting_them(self):
        activity = self.documents["data.json"]
        for archived in ("capyunaplay", "elgabii090"):
            self.assertIn(archived, activity["channels"])
            self.assertNotIn(archived, activity["active_channels"])

    def test_schema_diagnostics_expose_file_and_json_pointer(self):
        broken = copy.deepcopy(self.documents["data/games.json"])
        broken["juegos"][0]["nombre"] = ""
        errors = contracts.schema_diagnostics("data/games.json", broken, "games.schema.json")
        self.assertTrue(any(error.startswith("data/games.json#/juegos/0/nombre:") for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
