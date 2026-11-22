import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RosterEditorialContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.roster = json.loads((ROOT / "data/roster.json").read_text(encoding="utf-8"))
        cls.records = json.loads((ROOT / "data/creator-records.json").read_text(encoding="utf-8"))
        cls.platforms = json.loads((ROOT / "platform-stats.json").read_text(encoding="utf-8"))
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")

    def test_eight_profiles_have_commercially_grounded_editorial_contracts(self):
        heroes = self.roster["heroes"]
        self.assertEqual(len(heroes), 8)
        self.assertEqual(len({hero["id"] for hero in heroes}), 8)
        for hero in heroes:
            profile = hero.get("mediaProfile", {})
            self.assertTrue(profile.get("editorial"), hero["id"])
            self.assertTrue(profile.get("formats"), hero["id"])
            self.assertTrue(profile.get("opportunities"), hero["id"])
            self.assertTrue(profile.get("disclaimer"), hero["id"])

    def test_pato_is_video_creator_and_uses_current_youtube_snapshot(self):
        pato = next(hero for hero in self.roster["heroes"] if hero["id"] == "pato-oratoris")
        self.assertEqual(pato["creator_type"], "video_creator")
        self.assertIn("youtube", pato["platforms"])
        metrics = self.platforms["creators"]["pato-oratoris"]["platforms"]["youtube"]["metrics"]
        self.assertEqual(metrics["subscribers"], 56)
        self.assertEqual(metrics["total_views"], 431)
        self.assertEqual(metrics["videos_total"], 6)
        profile_notes = self.records["channels"]["pato-oratoris"]["profile_notes"]
        self.assertEqual(profile_notes["metrics_source"], "platform-stats.json")
        self.assertNotIn("platform_metrics", profile_notes)

    def test_only_dave_has_an_explicit_unconfirmed_schedule_note(self):
        # Horarios declarados por el titular para los ocho perfiles; solo Dave queda sin horario fijo confirmado.
        self.assertEqual(len(self.roster["heroes"]), 8)
        self.assertTrue(all(hero.get("schedule") for hero in self.roster["heroes"]))
        unconfirmed = [
            hero["id"]
            for hero in self.roster["heroes"]
            if hero.get("schedule", "").startswith("Sin directos programados por ahora")
        ]
        self.assertEqual(unconfirmed, ["dave-nexus"])
        dave = next(hero for hero in self.roster["heroes"] if hero["id"] == "dave-nexus")
        self.assertIn("publica contenido en Twitch", dave["schedule"])

    def test_all_eight_dossiers_use_the_same_live_renderer(self):
        dispatch = self.app.split("let pages;", 1)[1].split("pages = normalizeRosterDossierPages", 1)[0]
        self.assertIn("renderRosterComicPages(hero,index,channelStats,sullyChannel)", dispatch)
        for legacy in (
            "renderMoriartysComicPages(hero)",
            "renderLadyMoriartyComicPages(hero",
            "renderRod3r1kComicPages(hero)",
            "renderHabitosComicPages(hero",
            "renderAkumaComicPages(hero",
            "renderArdipiiComicPages(hero",
            "renderDaveNexusComicPages(hero",
            "renderPatoOratorisComicPages(hero)",
        ):
            self.assertNotIn(legacy, dispatch)

    def test_commercial_matrix_is_data_driven_and_disclosed_as_proposal(self):
        self.assertIn("MATRIZ DE ENCAJE COMERCIAL", self.app)
        self.assertIn("activationRows=(opportunities.length?", self.app)
        self.assertIn("no entregables comprometidos ni campañas realizadas", self.app.lower())

    def test_legacy_unsupported_activity_claims_are_not_in_current_editorial_copy(self):
        by_id = {hero["id"]: hero for hero in self.roster["heroes"]}
        self.assertNotIn("presencia constante", by_id["ardipii"]["log"].lower())
        self.assertNotIn("encuentros frecuentes", by_id["akuma"]["log"].lower())
        self.assertNotIn("pioneros en colaboraciones", by_id["moriartys"]["log"].lower())


if __name__ == "__main__":
    unittest.main()
