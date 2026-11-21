import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SharedCreatorProfileContractTests(unittest.TestCase):
    def test_shared_loader_is_present_and_versioned(self):
        source = (ROOT / "creator-profile-core.js").read_text(encoding="utf-8")
        self.assertIn("version: 1", source)
        self.assertIn("function resolveCreator", source)
        self.assertIn("function comparable", source)
        self.assertIn("sourceSnapshot", source)

    def test_main_roster_loads_shared_contract_before_app(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        core = html.index("creator-profile-core.js")
        app = html.index("./app.js")
        self.assertLess(core, app)

    def test_moriartys_dossier_uses_shared_bundle(self):
        html = (ROOT / "roster-02-moriartys.html").read_text(encoding="utf-8")
        self.assertIn("creator-profile-core.js", html)
        self.assertIn("LegionCreatorProfiles.load", html)
        self.assertIn("bundle.getCreator(hero)", html)
        self.assertNotIn("Promise.all(['data/roster.json','creator-records.json','data.json']", html)

    def test_main_roster_data_consumers_use_shared_loader(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("LegionCreatorProfiles.load({files:['records','metrics']})", app)
        self.assertIn("LegionCreatorProfiles.load({files:['platforms']})", app)
        self.assertIn("LegionCreatorProfiles.load({files:['activity']})", app)
        self.assertIn("LegionCreatorProfiles.load({files:['clips']})", app)


    def test_partial_data_loads_do_not_require_roster_file(self):
        source = (ROOT / "creator-profile-core.js").read_text(encoding="utf-8")
        self.assertIn("if (requested.includes('roster'))", source)
        self.assertIn("roster: selected.roster || null", source)

    def test_metric_comparison_requires_same_period_and_provenance(self):
        source = (ROOT / "creator-profile-core.js").read_text(encoding="utf-8")
        for contract in ("left.key === right.key", "left.platform === right.platform",
                         "left.unit === right.unit", "a.from === b.from",
                         "a.to === b.to", "left.status === 'fresh'",
                         "left.visibility === 'public'"):
            self.assertIn(contract, source)


if __name__ == "__main__":
    unittest.main()
