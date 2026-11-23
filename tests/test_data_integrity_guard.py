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
        self.bootstrap_paths = [
            "clips-data.json", "community-playbook.json", "creator-metrics.json",
            "creator-programs.json", "data.json", "data/creator-records.json",
            "data/games.json", "data/roster.json", "news-data.json",
            "platform-registry.json", "platform-stats.json", "sullygnome-data.json",
            "twitchmetrics-data.json",
        ]
        self.git_patch = patch.object(guard, "git", side_effect=self.fake_git)
        self.git_patch.start()
        self.root_patch = patch.object(guard, "ROOT", self.root)
        self.manifest_patch = patch.object(guard, "MANIFEST", self.manifest_path)
        self.root_patch.start(); self.manifest_patch.start()

    def tearDown(self):
        self.manifest_patch.stop(); self.root_patch.stop(); self.git_patch.stop()
        self.tmp.cleanup()

    def fake_git(self, *args):
        if args[:1] == ("ls-tree",):
            return "\n".join(self.bootstrap_paths)
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
        self.assertTrue(any("autorización de retiro debe aprobarse en un PR separado" in e for e in errors), errors)
        self.assertTrue(any("akuma" in e and "sin autorización" in e for e in errors), errors)

    def test_retirement_authorization_must_be_staged_before_roster_change(self):
        self.manifest["authorized_roster_removals"] = [
            {"id": "akuma", "reason": "Retiro solicitado", "reference": "Issue #123"}
        ]
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        self.assertEqual(self.run_guard(), [])

        # Simulate the authorization-only PR having merged to main.
        self.baseline_manifest = json.dumps(self.manifest)
        self.roster["heroes"] = [hero for hero in self.roster["heroes"] if hero["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        self.assertEqual(self.run_guard(), [])

    def test_existing_retirement_authorization_cannot_be_rewritten(self):
        approved = {"id": "akuma", "reason": "Aprobado", "reference": "Issue #123"}
        self.manifest["authorized_roster_removals"] = [approved]
        self.baseline_manifest = json.dumps(self.manifest)
        self.manifest["authorized_roster_removals"] = [
            {"id": "akuma", "reason": "Texto cambiado", "reference": "Issue #123"}
        ]
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        errors = self.run_guard()
        self.assertTrue(any("Autorización histórica modificada o eliminada" in e for e in errors), errors)

    def test_same_pr_cannot_weaken_critical_inventory_or_protected_ids(self):
        self.manifest["critical_files"] = ["data/roster.json"]
        self.manifest["protected_roster_ids"] = [x for x in IDS if x != "akuma"]
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        (self.root / "data/games.json").unlink()
        self.roster["heroes"] = [h for h in self.roster["heroes"] if h["id"] != "akuma"]
        (self.root / "data/roster.json").write_text(json.dumps(self.roster), encoding="utf-8")
        self.diff = "D\tdata/games.json"
        errors = self.run_guard()
        self.assertTrue(any("Política de integridad modificada" in e for e in errors), errors)
        self.assertTrue(any("data/games.json" in e for e in errors), errors)
        self.assertTrue(any("akuma" in e and "ID protegido ausente" in e for e in errors), errors)

    def test_initial_manifest_bootstrap_uses_base_roster_and_fixed_inventory(self):
        # The first manifest must exactly match the immutable bootstrap policy:
        # critical paths that exist on main + roster IDs read from main.
        self.manifest["critical_files"] = list(self.bootstrap_paths)
        self.manifest["protected_roster_ids"] = sorted(IDS)
        self.manifest["authorized_roster_removals"] = []
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        for relative_path in self.bootstrap_paths:
            path = self.root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            if not path.exists():
                path.write_text("{}", encoding="utf-8")

        self.git_patch.stop()
        def bootstrap_git(*args):
            if args[:2] == ("show", "origin/main:data/integrity-manifest.json"):
                raise RuntimeError("fatal: path 'data/integrity-manifest.json' exists on disk, but not in 'origin/main'")
            return self.fake_git(*args)
        with patch.object(guard, "git", side_effect=bootstrap_git):
            errors = self.run_guard()
        self.assertEqual(errors, [], errors)

    def test_initial_manifest_cannot_change_bootstrap_inventory(self):
        self.manifest["critical_files"] = ["data/roster.json"]
        self.manifest["protected_roster_ids"] = sorted(IDS)
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        self.git_patch.stop()
        def bootstrap_git(*args):
            if args[:2] == ("show", "origin/main:data/integrity-manifest.json"):
                raise RuntimeError("fatal: path 'data/integrity-manifest.json' exists on disk, but not in 'origin/main'")
            return self.fake_git(*args)
        with patch.object(guard, "git", side_effect=bootstrap_git):
            errors = self.run_guard()
        self.assertTrue(any("Política de integridad modificada" in e for e in errors), errors)

    def test_missing_baseline_roster_fails_closed(self):
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

    def test_critical_file_cannot_be_replaced_by_external_symlink(self):
        external = self.root / "external-games.json"
        external.write_text("{}", encoding="utf-8")
        (self.root / "data/games.json").unlink()
        (self.root / "data/games.json").symlink_to(external)
        errors = self.run_guard()
        self.assertTrue(any("Ruta crítica insegura" in e and "games.json" in e for e in errors), errors)

    def test_integrity_manifest_cannot_be_loaded_through_symlink(self):
        external = self.root / "external-manifest.json"
        external.write_text(self.baseline_manifest, encoding="utf-8")
        self.manifest_path.unlink()
        self.manifest_path.symlink_to(external)
        errors = self.run_guard()
        self.assertTrue(any("manifiesto de integridad inseguro" in e.lower() for e in errors), errors)

    def test_critical_file_rename_does_not_evade_inventory_check(self):
        (self.root / "data/games.json").rename(self.root / "data/games-archived.json")
        self.diff = "R100\tdata/games.json\tdata/games-archived.json"
        errors = self.run_guard()
        self.assertTrue(any("ausente en el árbol actual" in e and "games.json" in e for e in errors), errors)

    def test_pull_request_workflow_must_execute_integrity_guard_unconditionally(self):
        workflow = (ROOT / ".github/workflows/validar-sitio.yml").read_text(encoding="utf-8")
        self.assertIn("  pull_request:", workflow)
        marker = "      - name: Proteger inventario crítico, roster y recuperación Git"
        self.assertIn(marker, workflow)
        step = workflow.split(marker, 1)[1].split("      - name:", 1)[0]
        self.assertIn("run: python scripts/guard_data_integrity.py --base-ref origin/main --recovery-report", step)
        self.assertNotIn("if:", step)

    def test_bootstrap_inventory_is_derived_from_base_tree_not_pr_constant(self):
        # A PR-side constant/manifest edit must not redefine the trusted inventory.
        self.manifest["critical_files"] = ["data/roster.json"]
        self.manifest["protected_roster_ids"] = sorted(IDS)
        self.manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        self.git_patch.stop()
        def bootstrap_git(*args):
            if args[:2] == ("show", "origin/main:data/integrity-manifest.json"):
                raise RuntimeError("fatal: path 'data/integrity-manifest.json' does not exist in 'origin/main'")
            return self.fake_git(*args)
        with patch.object(guard, "git", side_effect=bootstrap_git):
            errors = self.run_guard()
        self.assertTrue(any("Política de integridad modificada" in e for e in errors), errors)

    def test_unsafe_repo_path_rejects_traversal_and_absolute_paths(self):
        self.assertTrue(guard.unsafe_repo_path("../outside.json")[0])
        self.assertTrue(guard.unsafe_repo_path("/tmp/outside.json")[0])

    def test_symlinked_parent_directory_is_rejected(self):
        outside = self.root / "outside"
        outside.mkdir()
        (outside / "roster.json").write_text(self.baseline, encoding="utf-8")
        (outside / "games.json").write_text("{}", encoding="utf-8")
        (self.root / "data").rename(self.root / "data-original")
        (self.root / "data").symlink_to(outside, target_is_directory=True)
        errors = self.run_guard()
        self.assertTrue(any("manifiesto de integridad inseguro" in e.lower() for e in errors), errors)

if __name__ == "__main__":
    unittest.main()
