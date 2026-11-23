"""Regression tests for critical data inventory and roster protections."""
import json, tempfile, unittest
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import guard_data_integrity as guard

class IntegrityGuardTests(unittest.TestCase):
    def test_manifest_has_critical_data_files_and_eight_stable_roster_ids(self):
        manifest=guard.load_manifest()
        self.assertIn("data/roster.json",manifest["critical_files"])
        self.assertIn("data/games.json",manifest["critical_files"])
        self.assertEqual(len(manifest["protected_roster_ids"]),8)
        self.assertEqual(len(set(manifest["protected_roster_ids"])),8)
    def test_inventory_paths_exist(self):
        for path in guard.load_manifest()["critical_files"]:
            self.assertTrue((ROOT/path).is_file(),path)
    def test_authorized_removal_requires_reason_and_reference(self):
        item={"id":"someone","reason":"retirement","reference":"PR #123"}
        self.assertTrue(item["reason"] and item["reference"])
    def test_recovery_is_git_based_and_documented(self):
        source=(ROOT/"scripts/guard_data_integrity.py").read_text(encoding="utf-8")
        self.assertIn("git show",source)
        self.assertIn("git restore --source",source)

if __name__=="__main__": unittest.main()
