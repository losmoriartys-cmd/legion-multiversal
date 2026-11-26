"""Controlled mutation tests for the approved editorial asset guard."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import guard_approved_assets as guard


class GitFixture:
    def __init__(self, root: Path):
        self.root = root
        self.git("init", "-b", "main")
        self.git("config", "user.name", "BASE-04 fixture")
        self.git("config", "user.email", "base04-fixture@example.invalid")
        self.write("assets/carnet/profile.jpg", b"portrait-v1")
        self.write("assets/carnet/second.jpg", b"portrait-second")
        self.write("assets/heroes/card.webp", b"hero-card-v1")
        self.write("editorial.jpg", b"editorial-v1")
        self.write("README.md", b"fixture\n")
        self.git("add", ".")
        self.git("commit", "-m", "base with approved assets")

    def git(self, *args, input_bytes=None):
        result = subprocess.run(
            ["git", *args],
            cwd=self.root,
            input=input_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode:
            raise AssertionError(
                f"git {' '.join(args)} failed: {result.stderr.decode(errors='replace')}"
            )
        return result.stdout.decode().strip()

    def write(self, path: str, content: bytes):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    def blob(self, path: str, ref: str = "HEAD") -> str:
        return self.git("rev-parse", f"{ref}:{path}")

    def hash_bytes(self, content: bytes) -> str:
        return self.git("hash-object", "--stdin", input_bytes=content)

    def read_manifest(self) -> dict:
        return json.loads((self.root / guard.MANIFEST).read_text(encoding="utf-8"))

    def write_manifest(self, data: dict):
        self.write(guard.MANIFEST, (json.dumps(data, indent=2) + "\n").encode())

    def baseline(self):
        """Create the initial manifest as a separate bootstrap PR branch."""
        self.git("checkout", "-b", "baseline")
        data = {
            "version": 1,
            "algorithm": "git-blob-sha1",
            "description": "fixture",
            "protected_roots": list(guard.REQUIRED_ROOTS),
            "protected_assets": {
                "assets/carnet/profile.jpg": self.blob("assets/carnet/profile.jpg", "main"),
                "assets/carnet/second.jpg": self.blob("assets/carnet/second.jpg", "main"),
                "assets/heroes/card.webp": self.blob("assets/heroes/card.webp", "main"),
                "editorial.jpg": self.blob("editorial.jpg", "main"),
            },
            "approved_updates": [],
        }
        self.write_manifest(data)
        self.git("add", guard.MANIFEST)
        self.git("commit", "-m", "bootstrap approved asset manifest")
        return data

    def validate(self, base_ref: str = "main"):
        with patch.object(guard, "ROOT", self.root):
            return guard.check(base_ref)

    def merge_baseline_to_main(self):
        self.git("checkout", "main")
        self.git("merge", "--ff-only", "baseline")


class ApprovedAssetGuardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = GitFixture(Path(self.temp.name))

    def tearDown(self):
        self.temp.cleanup()

    def test_bootstrap_manifest_matches_the_base_blobs_and_complete_roster_roots(self):
        self.repo.baseline()
        errors, phase = self.repo.validate("main")
        self.assertEqual(phase, "bootstrap")
        self.assertEqual(errors, [])

    def test_bootstrap_cannot_omit_an_image_from_a_protected_roster_root(self):
        self.repo.git("checkout", "-b", "baseline")
        data = {
            "version": 1,
            "algorithm": "git-blob-sha1",
            "protected_roots": list(guard.REQUIRED_ROOTS),
            "protected_assets": {
                "assets/carnet/profile.jpg": self.repo.blob("assets/carnet/profile.jpg", "main"),
                "assets/heroes/card.webp": self.repo.blob("assets/heroes/card.webp", "main"),
                "editorial.jpg": self.repo.blob("editorial.jpg", "main"),
            },
            "approved_updates": [],
        }
        self.repo.write_manifest(data)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "incomplete asset baseline")
        errors, _ = self.repo.validate("main")
        self.assertTrue(any("deben incluirse todas las imágenes" in e for e in errors), errors)

    def test_bootstrap_cannot_rebaseline_an_asset_changed_in_the_same_pr(self):
        self.repo.git("checkout", "-b", "baseline")
        self.repo.write("assets/carnet/profile.jpg", b"unreviewed replacement")
        data = {
            "version": 1,
            "algorithm": "git-blob-sha1",
            "protected_roots": list(guard.REQUIRED_ROOTS),
            "protected_assets": {
                "assets/carnet/profile.jpg": self.repo.hash_bytes(b"unreviewed replacement"),
                "assets/carnet/second.jpg": self.repo.blob("assets/carnet/second.jpg", "main"),
                "assets/heroes/card.webp": self.repo.blob("assets/heroes/card.webp", "main"),
                "editorial.jpg": self.repo.blob("editorial.jpg", "main"),
            },
            "approved_updates": [],
        }
        self.repo.write_manifest(data)
        self.repo.git("add", ".")
        self.repo.git("commit", "-m", "replace asset while creating baseline")
        errors, _ = self.repo.validate("main")
        self.assertTrue(any("la huella no coincide con main" in e for e in errors), errors)

    def _main_with_baseline(self):
        self.repo.baseline()
        errors, _ = self.repo.validate("main")
        self.assertEqual(errors, [])
        self.repo.merge_baseline_to_main()
        self.repo.git("checkout", "-b", "change")

    def _approval(self, operation="replace", path="assets/carnet/profile.jpg", after_bytes=b"portrait-v2"):
        manifest = self.repo.read_manifest()
        before = manifest["protected_assets"].get(path)
        after = self.repo.hash_bytes(after_bytes)
        manifest["approved_updates"].append({
            "operation": operation,
            "path": path,
            "before_blob": before if operation == "replace" else "absent",
            "after_blob": after,
            "reason": "Cambio deliberado de recurso editorial para prueba BASE-04",
            "reference": "PR fixture BASE-04",
        })
        return manifest, after, after_bytes

    def test_unapproved_replacement_is_blocked(self):
        self._main_with_baseline()
        self.repo.write("assets/carnet/profile.jpg", b"unapproved portrait")
        self.repo.git("add", "assets/carnet/profile.jpg")
        self.repo.git("commit", "-m", "unapproved asset replacement")
        errors, phase = self.repo.validate("main")
        self.assertEqual(phase, "steady-state")
        self.assertTrue(any("diff de assets" in e or "sin autorización previa" in e for e in errors), errors)

    def test_phase_a_authorization_is_manifest_only_and_keeps_original_asset(self):
        self._main_with_baseline()
        manifest, _, _ = self._approval()
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "authorize asset replacement only")
        errors, phase = self.repo.validate("main")
        self.assertEqual(phase, "phase-a")
        self.assertEqual(errors, [])
        self.assertEqual((self.repo.root / "assets/carnet/profile.jpg").read_bytes(), b"portrait-v1")

    def test_phase_a_cannot_self_authorize_a_replacement_in_the_same_pr(self):
        self._main_with_baseline()
        manifest, _, new_bytes = self._approval()
        self.repo.write_manifest(manifest)
        self.repo.write("assets/carnet/profile.jpg", new_bytes)
        self.repo.git("add", ".")
        self.repo.git("commit", "-m", "self-authorize and replace")
        errors, _ = self.repo.validate("main")
        self.assertTrue(any("solo puede modificar" in e for e in errors), errors)

    def test_phase_b_replacement_passes_only_after_prior_phase_a(self):
        self._main_with_baseline()
        manifest, after, new_bytes = self._approval()
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "phase A: authorize replacement")
        errors, phase = self.repo.validate("main")
        self.assertEqual((phase, errors), ("phase-a", []))

        self.repo.git("checkout", "main")
        self.repo.git("merge", "--ff-only", "change")
        self.repo.git("checkout", "-b", "phase-b")
        manifest = self.repo.read_manifest()
        manifest["protected_assets"]["assets/carnet/profile.jpg"] = after
        self.repo.write_manifest(manifest)
        self.repo.write("assets/carnet/profile.jpg", new_bytes)
        self.repo.git("add", ".")
        self.repo.git("commit", "-m", "phase B: replace approved asset")
        errors, phase = self.repo.validate("main")
        self.assertEqual(phase, "phase-b")
        self.assertEqual(errors, [])

    def test_phase_b_rejects_bytes_that_do_not_match_the_prior_approval(self):
        self._main_with_baseline()
        manifest, after, _ = self._approval()
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "phase A: authorize replacement")
        self.repo.git("checkout", "main")
        self.repo.git("merge", "--ff-only", "change")
        self.repo.git("checkout", "-b", "phase-b")
        manifest = self.repo.read_manifest()
        manifest["protected_assets"]["assets/carnet/profile.jpg"] = after
        self.repo.write_manifest(manifest)
        self.repo.write("assets/carnet/profile.jpg", b"different replacement")
        self.repo.git("add", ".")
        self.repo.git("commit", "-m", "phase B: wrong bytes")
        errors, _ = self.repo.validate("main")
        self.assertTrue(any("sin autorización previa" in e or "no coincide" in e for e in errors), errors)

    def test_asset_deletion_and_rename_are_blocked(self):
        self._main_with_baseline()
        (self.repo.root / "assets/heroes/card.webp").unlink()
        self.repo.git("add", "-A")
        self.repo.git("commit", "-m", "delete protected card")
        errors, _ = self.repo.validate("main")
        self.assertTrue(errors, "La eliminación de un asset aprobado debe fallar.")

    def test_manifest_inventory_cannot_be_reduced(self):
        self._main_with_baseline()
        manifest = self.repo.read_manifest()
        del manifest["protected_assets"]["assets/carnet/second.jpg"]
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "drop protected inventory entry")
        errors, _ = self.repo.validate("main")
        self.assertTrue(any("no se pueden retirar rutas" in e for e in errors), errors)

    def test_approval_history_is_append_only(self):
        self._main_with_baseline()
        manifest, _, _ = self._approval()
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "phase A: authorize replacement")
        self.repo.git("checkout", "main")
        self.repo.git("merge", "--ff-only", "change")
        self.repo.git("checkout", "-b", "tamper-approval")
        manifest = self.repo.read_manifest()
        manifest["approved_updates"][0]["reason"] = "rewritten after approval"
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "rewrite approval history")
        errors, _ = self.repo.validate("main")
        self.assertTrue(any("historial" in e for e in errors), errors)

    def test_new_roster_asset_requires_a_separate_add_authorization(self):
        self._main_with_baseline()
        new_path = "assets/carnet/new-member.jpg"
        new_bytes = b"new approved portrait"
        manifest = self.repo.read_manifest()
        after = self.repo.hash_bytes(new_bytes)
        manifest["approved_updates"].append({
            "operation": "add",
            "path": new_path,
            "before_blob": "absent",
            "after_blob": after,
            "reason": "Alta deliberada de retrato para un nuevo perfil",
            "reference": "PR fixture add BASE-04",
        })
        self.repo.write_manifest(manifest)
        self.repo.git("add", guard.MANIFEST)
        self.repo.git("commit", "-m", "phase A: authorize new profile portrait")
        errors, phase = self.repo.validate("main")
        self.assertEqual((phase, errors), ("phase-a", []))

        self.repo.git("checkout", "main")
        self.repo.git("merge", "--ff-only", "change")
        self.repo.git("checkout", "-b", "phase-b-add")
        manifest = self.repo.read_manifest()
        manifest["protected_assets"][new_path] = after
        self.repo.write_manifest(manifest)
        self.repo.write(new_path, new_bytes)
        self.repo.git("add", ".")
        self.repo.git("commit", "-m", "phase B: add approved profile portrait")
        errors, phase = self.repo.validate("main")
        self.assertEqual((phase, errors), ("phase-b", []))


if __name__ == "__main__":
    unittest.main()
