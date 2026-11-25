"""Additional adversarial path checks for the reinforced integrity guard."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import guard_data_integrity as guard

class GuardPathHardeningTests(unittest.TestCase):
    def test_rejects_traversal_and_absolute_paths(self):
        self.assertTrue(guard.unsafe_repo_path("../outside.json")[0])
        self.assertTrue(guard.unsafe_repo_path("/etc/passwd")[0])

    def test_rejects_windows_separators(self):
        self.assertTrue(guard.unsafe_repo_path(r"data\\roster.json")[0])

    def test_rejects_dot_and_noncanonical_paths(self):
        self.assertTrue(guard.unsafe_repo_path("data/./roster.json")[0])
        self.assertTrue(guard.unsafe_repo_path("data//roster.json")[0])

    def test_rejects_invalid_diff_format_fail_closed(self):
        from unittest.mock import patch
        with patch.object(guard, "git", return_value="M malformed\ttoo\tmany\tfields"):
            with self.assertRaises(RuntimeError):
                guard.parse_diff("base")

    def test_rejects_unknown_diff_status_fail_closed(self):
        from unittest.mock import patch
        with patch.object(guard, "git", return_value="Z\tdata/roster.json"):
            with self.assertRaises(RuntimeError):
                guard.parse_diff("base")

    def test_rejects_unmerged_unknown_and_broken_diff_statuses(self):
        from unittest.mock import patch
        for status in ("U", "X", "B"):
            with self.subTest(status=status):
                with patch.object(guard, "git", return_value=f"{status}\tdata/roster.json"):
                    with self.assertRaises(RuntimeError):
                        guard.parse_diff("base")

    def test_accepts_valid_rename_status_shape(self):
        from unittest.mock import patch
        with patch.object(guard, "git", return_value="R100\tdata/roster.json\tdata/roster-old.json"):
            self.assertEqual(
                guard.parse_diff("base"),
                [("R100", ["data/roster.json", "data/roster-old.json"])],
            )

    def test_rejects_duplicate_authorization_records(self):
        errors = []
        auth = {"id": "akuma", "reason": "valid", "reference": "PR #1"}
        guard.validate_authorizations([auth, auth], "fixture", errors)
        self.assertTrue(any("duplicada" in error for error in errors), errors)
