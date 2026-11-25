"""Tests for exact SHA-256 verification of the 14 BASE-02 files."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from verify_critical_restore import verify_critical_files


class CriticalRestoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.repo = self.root / "repo"
        self.snapshot = self.root / "snapshot"
        self.repo.mkdir()
        self.snapshot.mkdir()
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.email", "test@example.invalid"], check=True)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.name", "Test"], check=True)
        self.paths = [f"data/critical-{index:02d}.json" for index in range(13)] + ["data/integrity-manifest.json"]
        for index, relative in enumerate(self.paths[:-1]):
            for root in (self.repo, self.snapshot):
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps({"index": index}), encoding="utf-8")
        manifest = {"version": 1, "critical_files": self.paths}
        for root in (self.repo, self.snapshot):
            path = root / "data/integrity-manifest.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(manifest), encoding="utf-8")
        subprocess.run(["git", "-C", str(self.repo), "add", "."], check=True)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-qm", "fixture"], check=True)
        self.commit = subprocess.run(
            ["git", "-C", str(self.repo), "rev-parse", "HEAD"],
            check=True, capture_output=True, text=True,
        ).stdout.strip()

    def tearDown(self):
        self.temp.cleanup()

    def test_all_fourteen_hashes_match(self):
        result = verify_critical_files(self.repo, self.snapshot, self.commit)
        self.assertEqual(len(result), 14)
        self.assertTrue(all(len(item["sha256"]) == 64 for item in result))

    def test_modified_restored_file_fails(self):
        (self.snapshot / self.paths[0]).write_text("tampered", encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "SHA-256 mismatch"):
            verify_critical_files(self.repo, self.snapshot, self.commit)

    def test_missing_restored_file_fails(self):
        (self.snapshot / self.paths[0]).unlink()
        with self.assertRaisesRegex(RuntimeError, "Missing restored"):
            verify_critical_files(self.repo, self.snapshot, self.commit)

    def test_inventory_with_thirteen_files_fails(self):
        manifest_path = self.snapshot / "data/integrity-manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["critical_files"].pop()
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "exactly 14"):
            verify_critical_files(self.repo, self.snapshot, self.commit)


if __name__ == "__main__":
    unittest.main()
