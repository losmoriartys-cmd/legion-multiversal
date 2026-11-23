"""Behavioral regression tests for critical-data deletion protection."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import guard_data_integrity as guard

IDS = ["moriartys", "rod3r1k", "lady-moriarty", "ardipii", "akuma", "dave-nexus", "pato-oratoris", "habitos"]

class IntegrityGuardBehaviorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "data").mkdir()
        self.manifest_path = self.root / "data/integrity-manifest.json"
        self.critical = ["data/roster.json", "data/games.json"]
        self.manifest = {"critical_files": self.critical, "protected_roster_ids": IDS, "authorized_roster_removals": []}
        self.baseline_manifest = json.dumps(self.manifest)
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        self.roster = {"heroes": [{"id": x} for x in IDS]}
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        (self.root / "data/games.json").write_text("{}", encoding="utf-8")
        self.baseline = json.dumps(self.roster)
        self.diff = ""
        self.git_patch = patch.object(guard, "git", side_effect=self.fake_git)
        self.git_patch.start()
        self.root_patch = patch.object(guard, "ROOT", self.root)
        self.manifest_patch = patch.object(guard, "MANIFEST", self.manifest_path)
        self.root_patch.start(); self.manifest_patch.start()

    def tearDown(self):
        self.manifest_patch.stop(); self.root_patch.stop(); self.git_patch.stop()
        self.tmp.cleanup()

    def fake_git(self, *args):
        if args[:2] == ("diff", "--name-status"):
            return self.diff
        if args and args[0] == "show":
            if len(args) >= 2 and args[1].endswith(":data/integrity-manifest.json"):
                return self.baseline_manifest
            return self.baseline
        if args and args[0] == "rev-parse":
            return "a" * 40
        raise RuntimeError(f"Unexpected git command: {args}")

    def run_guard(self):
        return guard.check("origin/main")

    def test_critical_file_deletion_fails(self):
        self.diff = "D\tdata/games.json"
        (self.root / "data/games.json").unlink()
        errors = self.run_guard()
        self.assertTrue(any("Archivo crítico eliminado" in e for e in errors), errors)
        self.assertTrue(any("ausente en el árbol" in e for e in errors), errors)

    def test_roster_id_removal_without_authorization_fails(self):
        self.roster["heroes"] = [h for h in self.roster["heroes"] if h["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        errors = self.run_guard()
        self.assertTrue(any("akuma" in e and "sin autorización" in e for e in errors), errors)
        self.assertTrue(any("ID protegido ausente" in e and "akuma" in e for e in errors), errors)

    def test_authorized_roster_retirement_in_baseline_requires_reason_and_reference_and_passes(self):
        authorization = {"id": "akuma", "reason": "Retiro solicitado", "reference": "Issue #123"}
        self.manifest["authorized_roster_removals"] = [authorization]
        self.baseline_manifest = json.dumps(self.manifest)
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        self.roster["heroes"] = [h for h in self.roster["heroes"] if h["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        errors = self.run_guard()
        self.assertEqual(errors, [], errors)

    def test_same_pr_cannot_self_authorize_roster_retirement(self):
        self.roster["heroes"] = [h for h in self.roster["heroes"] if h["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        self.manifest["authorized_roster_removals"] = [{"id": "akuma", "reason": "Retiro solicitado", "reference": "Issue #123"}]
        self.manifest["protected_roster_ids"] = [x for x in IDS if x != "akuma"]
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        errors = self.run_guard()
        self.assertTrue(any("Política de integridad modificada" in e for e in errors), errors)
        self.assertTrue(any("akuma" in e and "sin autorización" in e for e in errors), errors)

    def test_same_pr_cannot_weaken_critical_inventory_or_protected_ids(self):
        self.manifest["critical_files"] = ["data/roster.json"]
        self.manifest["protected_roster_ids"] = [x for x in IDS if x != "akuma"]
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        (self.root / "data/games.json").unlink()
        self.roster["heroes"] = [h for h in self.roster["heroes"] if h["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        self.diff = "D\\tdata/games.json"
        errors = self.run_guard()
        self.assertTrue(any("Política de integridad modificada" in e for e in errors), errors)
        self.assertTrue(any("data/games.json" in e for e in errors), errors)
        self.assertTrue(any("akuma" in e and "ID protegido ausente" in e for e in errors), errors)

    def test_missing_baseline_manifest_fails_closed(self):
        self.git_patch.stop()
        with patch.object(guard, "git", side_effect=RuntimeError("baseline unavailable")):
            errors = self.run_guard()
        self.assertTrue(any("No se pudo cargar la política de integridad" in e for e in errors), errors)
        self.git_patch.start()

    def test_authorization_without_reason_or_reference_does_not_pass(self):
        self.roster["heroes"] = [h for h in self.roster["heroes"] if h["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        self.manifest["authorized_roster_removals"] = [{"id":"akuma","reason":"","reference":""}]
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        errors = self.run_guard()
        self.assertTrue(any("sin autorización" in e for e in errors), errors)

    def test_all_inventory_paths_must_exist(self):
        (self.root / "data/games.json").unlink()
        errors = self.run_guard()
        self.assertTrue(any("ausente en el árbol" in e for e in errors), errors)

if __name__ == "__main__":
    unittest.main()
