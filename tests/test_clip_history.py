import unittest

from update_clips import append_clip_view_history


class TwitchClipHistoryTests(unittest.TestCase):
    def test_history_records_daily_views_and_replaces_same_day_count(self):
        clips = [{"id": "clip-1", "view_count": 25}]
        first = append_clip_view_history(clips, [], "2026-11-19T09:00:00Z")
        self.assertEqual(first[0]["view_history"], [
            {"date": "2026-11-19", "captured_at": "2026-11-19T09:00:00Z", "views": 25}
        ])
        second = append_clip_view_history(
            [{"id": "clip-1", "view_count": 31}],
            first,
            "2026-11-19T18:00:00Z",
        )
        self.assertEqual(len(second[0]["view_history"]), 1)
        self.assertEqual(second[0]["view_history"][0]["views"], 31)
        third = append_clip_view_history(
            [{"id": "clip-1", "view_count": 44}],
            second,
            "2026-11-20T09:00:00Z",
        )
        self.assertEqual([row["views"] for row in third[0]["view_history"]], [31, 44])

    def test_history_migrates_duplicates_and_keeps_latest_valid_point_per_day(self):
        prior = [{
            "id": "clip-1",
            "view_history": [
                {"date": "2026-11-18", "captured_at": "2026-11-18T08:00:00Z", "views": 12},
                {"date": "2026-11-18", "captured_at": "2026-11-18T18:00:00Z", "views": 16},
                {"date": "2026-11-19", "captured_at": "2026-11-19T09:00:00Z", "views": -1},
            ],
        }]
        result = append_clip_view_history(
            [{"id": "clip-1", "view_count": 20}],
            prior,
            "2026-11-20T09:00:00Z",
        )
        self.assertEqual([(row["date"], row["views"]) for row in result[0]["view_history"]], [
            ("2026-11-18", 16),
            ("2026-11-20", 20),
        ])

    def test_history_is_trimmed_to_180_days_plus_current_date(self):
        history = [
            {"date": "2026-01-01", "captured_at": "2026-01-01T10:00:00Z", "views": 1},
            {"date": "2026-05-24", "captured_at": "2026-05-24T10:00:00Z", "views": 2},
            {"date": "2026-05-25", "captured_at": "2026-05-25T10:00:00Z", "views": 3},
        ]
        result = append_clip_view_history(
            [{"id": "clip-1", "view_count": 4}],
            [{"id": "clip-1", "view_history": history}],
            "2026-11-20T10:00:00Z",
        )
        self.assertEqual([row["date"] for row in result[0]["view_history"]], ["2026-05-24", "2026-05-25", "2026-11-20"])


if __name__ == "__main__":
    unittest.main()
