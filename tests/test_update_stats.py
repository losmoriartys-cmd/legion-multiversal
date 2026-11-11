import unittest
from datetime import datetime, timedelta, timezone

from update_stats import summarize


class SummarizeSamplingTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 11, 12, 0, tzinfo=timezone.utc)

    def sample(self, minutes_ago, *, live=True, stream_id="stream-1", viewers=10):
        sampled_at = (self.now - timedelta(minutes=minutes_ago)).isoformat().replace("+00:00", "Z")
        return {
            "sampled_at": sampled_at,
            "is_live": live,
            "stream_id": stream_id,
            "viewer_count": viewers if live else None,
            "game_name": "Test game" if live else None,
        }

    def test_estimates_same_stream_using_observed_gap(self):
        snapshots = [
            self.sample(30, viewers=8),
            self.sample(0, viewers=12),
        ]

        result = summarize(snapshots, self.now)

        self.assertEqual(result["observed_live_hours"], 0.5)
        self.assertEqual(result["estimated_hours_watched"], 0.1)

    def test_caps_each_estimated_interval_at_55_minutes(self):
        snapshots = [
            self.sample(70, viewers=8),
            self.sample(0, viewers=12),
        ]

        result = summarize(snapshots, self.now)

        self.assertEqual(result["observed_live_hours"], round(55 / 60, 2))
        self.assertEqual(result["estimated_hours_watched"], 11.0)

    def test_ignores_gaps_longer_than_110_minutes(self):
        snapshots = [
            self.sample(111, viewers=8),
            self.sample(0, viewers=12),
        ]

        result = summarize(snapshots, self.now)

        self.assertEqual(result["observed_live_hours"], 0)
        self.assertEqual(result["estimated_hours_watched"], 0)

    def test_does_not_join_different_stream_ids(self):
        snapshots = [
            self.sample(30, stream_id="stream-old", viewers=8),
            self.sample(0, stream_id="stream-new", viewers=12),
        ]

        result = summarize(snapshots, self.now)

        self.assertEqual(result["observed_live_hours"], 0)
        self.assertEqual(result["estimated_hours_watched"], 0)

    def test_does_not_estimate_across_offline_sample(self):
        snapshots = [
            self.sample(60, viewers=8),
            self.sample(30, live=False),
            self.sample(0, viewers=12),
        ]

        result = summarize(snapshots, self.now)

        self.assertEqual(result["observed_live_hours"], 0)
        self.assertEqual(result["estimated_hours_watched"], 0)

    def test_excludes_samples_older_than_30_day_window(self):
        snapshots = [
            self.sample(60, viewers=8),
            {
                **self.sample(0, viewers=12),
                "sampled_at": (self.now - timedelta(days=31)).isoformat().replace("+00:00", "Z"),
            },
        ]

        result = summarize(snapshots, self.now)

        self.assertEqual(result["samples_total"], 1)
        self.assertEqual(result["live_samples"], 1)
        self.assertEqual(result["observed_live_hours"], 0)


if __name__ == "__main__":
    unittest.main()
