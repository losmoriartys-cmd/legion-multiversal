import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class EpicCreatorProgramsContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.programs = json.loads((ROOT / "creator-programs.json").read_text(encoding="utf-8"))
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.index = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_both_codes_have_canonical_owners_and_scopes(self):
        creators = self.programs["creators"]
        self.assertEqual(creators["moriartys"]["code"], "LOSMORIARTYS")
        self.assertEqual(creators["moriartys"]["scope"], "shared_project")
        self.assertEqual(creators["rod3r1k"]["code"], "TheR0d3R1k")
        self.assertEqual(creators["rod3r1k"]["scope"], "individual_creator")
        self.assertEqual(creators["moriartys"]["roster_profile_id"], "moriartys")
        self.assertEqual(creators["rod3r1k"]["roster_profile_id"], "rod3r1k")

    def test_record_confirmation_is_not_misrepresented_as_live_portal_verification(self):
        for creator in self.programs["creators"].values():
            self.assertIn(creator["record_status"], {"confirmed_in_project_administration_record", "creator_reported_account_details_match"})
            self.assertFalse(creator["account_portal_revalidated"])
            self.assertTrue(creator["recorded_at"])
        self.assertIn("NO REVALIDADA", self.programs["creators"]["rod3r1k"]["display_status"])


    def test_moriartys_account_details_match_is_recorded_with_provenance(self):
        creator = self.programs["creators"]["moriartys"]
        evidence = creator["account_details_evidence"]
        self.assertEqual(creator["record_status"], "creator_reported_account_details_match")
        self.assertEqual(evidence["creator_id"], "dc2236199d3c4fc88932c290ad87be97")
        self.assertEqual(evidence["creator_code"], "losmoriartys")
        self.assertTrue(evidence["match_with_project_record"])
        self.assertEqual(evidence["method"], "Transcripción textual aportada por el titular en la conversación")
        self.assertFalse(creator["account_portal_revalidated"])
        self.assertIn("ASOCIACIÓN COINCIDENTE", creator["display_status"])
        self.assertIn("no representa una consulta automática", creator["verification_note"])

    def test_alliance_codes_are_rendered_from_central_mounts(self):
        self.assertIn('id="epic-creator-programs-collective"', self.index)
        self.assertIn('id="epic-creator-programs-rod3r1k"', self.index)
        self.assertNotIn("dc2236199d3c4fc88932c290ad87be97", self.index)
        self.assertNotIn("TheR0d3R1k</strong>", self.index)
        self.assertIn("renderEpicCreatorPrograms()", self.app)
        self.assertIn("creator.display_status||epicCreatorPrograms.display_policy", self.app)
        self.assertIn("creator.verification_note", self.app)
        self.assertIn("fetch('./creator-programs.json'", self.app)

    def test_roster_profiles_use_the_same_central_code_renderer(self):
        self.assertIn("function renderEpicCreatorProfileBadge(hero)", self.app)
        self.assertIn("renderEpicCreatorProfileBadge(hero)", self.app)
        self.assertIn("function renderEpicCreatorCodeCard(creatorId", self.app)
        self.assertIn("copyEpicCreatorCode(", self.app)

    def test_failed_central_load_does_not_fall_back_to_stale_hardcoded_codes(self):
        self.assertIn("No se muestra un código desde una copia local desactualizada", self.app)
        self.assertNotIn('<strong>LosMoriartys</strong>', self.app)
        self.assertNotIn('<strong>TheR0d3R1k</strong>', self.app)


if __name__ == "__main__":
    unittest.main()
