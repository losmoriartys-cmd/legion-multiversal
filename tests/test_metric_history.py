import unittest
from datetime import datetime, timezone

from scripts.validate_metric_history import validate_snapshot, validate_data


class SnapshotValidationTests(unittest.TestCase):
    def setUp(self):
        self.sample = {
            "sampled_at": "2026-11-14T12:00:00Z",
            "is_live": False,
            "viewer_count": None,
            "game_name": None,
            "title": None,
            "stream_id": None,
            "started_at": None,
        }

    def test_accepts_valid_offline_snapshot(self):
        self.assertEqual(validate_snapshot(self.sample), [])

    def test_rejects_viewers_in_offline_snapshot(self):
        invalid = {**self.sample, "viewer_count": 12}
        self.assertTrue(any("offline" in error for error in validate_snapshot(invalid)))

    def test_rejects_duplicate_or_out_of_order_timestamps(self):
        previous = datetime(2026, 11, 14, 12, 0, tzinfo=timezone.utc)
        self.assertTrue(any("ordenadas" in error for error in validate_snapshot(self.sample, previous)))

    def test_rejects_naive_timestamps(self):
        invalid = {**self.sample, "sampled_at": "2026-11-14T12:00:00"}
        self.assertTrue(any("zona horaria" in error for error in validate_snapshot(invalid)))


class DataValidationTests(unittest.TestCase):
    def test_rejects_unverified_followers_total(self):
        data = {
            "schema_version": 2,
            "active_channels": ["demo"],
            "channels": {
                "demo": {
                    "login": "demo", "live": False, "current_viewers": None,
                    "followers_total": 1, "snapshots": [],
                    "window": {"samples_total": 0, "live_samples": 0},
                }
            },
        }
        self.assertTrue(any("followers_total" in error for error in validate_data(data)))

    def test_rejects_sample_summary_mismatch(self):
        data = {
            "schema_version": 2,
            "active_channels": ["demo"],
            "channels": {
                "demo": {
                    "login": "demo", "live": False, "current_viewers": None,
                    "followers_total": None,
                    "snapshots": [ {
                        "sampled_at": "2026-11-14T12:00:00Z", "is_live": False,
                        "viewer_count": None, "game_name": None, "title": None,
                        "stream_id": None, "started_at": None,
                    } ],
                    "window": {"samples_total": 0, "live_samples": 0},
                }
            },
        }
        self.assertTrue(any("samples_total" in error for error in validate_data(data)))


if __name__ == "__main__":
    unittest.main()
