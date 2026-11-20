import json
import unittest
from pathlib import Path

from scripts.validate_creator_records import validate

ROOT = Path(__file__).resolve().parents[1]


class CreatorRecordsValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = json.loads((ROOT / "creator-records.json").read_text(encoding="utf-8"))
        cls.roster = json.loads((ROOT / "roster-data.json").read_text(encoding="utf-8"))

    def test_committed_creator_records_have_valid_channel_scoped_evidence(self):
        self.assertEqual(validate(self.records, self.roster), [])

    def test_collaboration_result_cannot_cross_creator_channel_scope(self):
        value = json.loads(json.dumps(self.records))
        value["channels"]["rod3r1k"]["collaboration_results"][0]["channel_scope"] = "akuma"
        errors = validate(value, self.roster)
        self.assertTrue(any("alcance del canal" in error for error in errors))

    def test_private_audience_metrics_are_rejected_without_public_consent(self):
        value = json.loads(json.dumps(self.records))
        value["channels"]["dave-nexus"]["audience_report"] = {
            "authorization": {"status": "pending", "public_display": False},
            "metrics": [{"label": "Espectadores únicos", "value": 100, "unit": "personas"}],
        }
        errors = validate(value, self.roster)
        self.assertTrue(any("sin autorización explícita" in error for error in errors))

    def test_small_demographic_cells_are_rejected(self):
        value = json.loads(json.dumps(self.records))
        value["channels"]["dave-nexus"]["audience_report"] = {
            "authorization": {"status": "granted", "public_display": True},
            "captured_at": "2026-11-20T12:00:00Z",
            "period": {"from": "2026-11-01T00:00:00Z", "to": "2026-11-20T00:00:00Z"},
            "source": "Panel aportado",
            "metrics": [{"label": "Espectadores únicos", "value": 100, "unit": "personas"}],
            "breakdowns": [{"dimension": "country", "label": "Otro", "share_pct": 1, "sample_size": 3}],
        }
        errors = validate(value, self.roster)
        self.assertTrue(any("base mínima de cinco" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
