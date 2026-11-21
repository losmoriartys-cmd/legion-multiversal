"""Guard the canonical roster location and lossless BASE-01B migration."""
from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROSTER = ROOT / "data" / "roster.json"
ORIGINAL_GIT_BLOB_SHA = "1228911b33d594473ef6e99d43f4b2934eb195a5"
EXPECTED_CREATOR_IDS = {
    "moriartys", "rod3r1k", "lady-moriarty", "ardipii",
    "akuma", "dave-nexus", "pato-oratoris", "habitos",
}


def git_blob_sha(content: bytes) -> str:
    header = f"blob {len(content)}".encode("ascii") + bytes([0])
    return hashlib.sha1(header + content).hexdigest()


class CanonicalRosterLayoutTests(unittest.TestCase):
    def test_roster_migration_preserves_the_exact_original_blob(self):
        raw = ROSTER.read_bytes()
        self.assertEqual(git_blob_sha(raw), ORIGINAL_GIT_BLOB_SHA)

    def test_legacy_root_roster_path_is_removed(self):
        self.assertFalse((ROOT / "roster-data.json").exists())

    def test_eight_canonical_creator_ids_and_slugs_are_preserved(self):
        roster = json.loads(ROSTER.read_text(encoding="utf-8"))
        heroes = roster.get("heroes")
        self.assertIsInstance(heroes, list)
        self.assertEqual(len(heroes), 8)
        self.assertEqual({hero.get("id") for hero in heroes}, EXPECTED_CREATOR_IDS)
        self.assertEqual(len({hero.get("slug") for hero in heroes}), 8)

    def test_shared_loader_uses_the_only_canonical_roster_path(self):
        loader = (ROOT / "creator-profile-core.js").read_text(encoding="utf-8")
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("roster: './data/roster.json'", loader)
        self.assertIn("fetch('./data/roster.json'", app)


if __name__ == "__main__":
    unittest.main()