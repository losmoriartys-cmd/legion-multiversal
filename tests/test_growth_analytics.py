import unittest
from datetime import datetime, timedelta, timezone

from scripts.growth_analytics import (
    build_collaborations,
    build_content,
    build_shared_cases,
    build_windows,
    _authorized_audience_report,
)


class GrowthAnalyticsTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 20, 12, 0, tzinfo=timezone.utc)

    def make_twitch_history(self, days=180):
        snapshots = []
        followers = []
        for ago in range(days - 1, -1, -1):
            day = (self.now - timedelta(days=ago)).date()
            start = datetime(day.year, day.month, day.day, 10, 0, tzinfo=timezone.utc)
            stream_id = "stream-" + day.isoformat()
            viewers = 10 + (days - ago) % 20
            snapshots.extend([
                {
                    "sampled_at": start.isoformat().replace("+00:00", "Z"),
                    "is_live": True, "viewer_count": viewers, "stream_id": stream_id,
                    "game_name": "Game", "title": "Live", "started_at": start.isoformat().replace("+00:00", "Z"),
                },
                {
                    "sampled_at": (start + timedelta(minutes=60)).isoformat().replace("+00:00", "Z"),
                    "is_live": True, "viewer_count": viewers + 2, "stream_id": stream_id,
                    "game_name": "Game", "title": "Live", "started_at": start.isoformat().replace("+00:00", "Z"),
                },
            ])
            followers.append({
                "date": day.isoformat(),
                "captured_at": (start + timedelta(minutes=5)).isoformat().replace("+00:00", "Z"),
                "followers_total": 1000 + (days - ago),
            })
        return snapshots, followers

    def test_twitch_builds_7_30_90_windows_and_comparable_previous_periods(self):
        snapshots, followers = self.make_twitch_history()
        result = build_windows("twitch", snapshots, self.now, followers)
        self.assertEqual(set(result), {"7d", "30d", "90d"})
        self.assertEqual(result["7d"]["coverage"]["coverage_pct"], 100.0)
        self.assertEqual(result["7d"]["metrics"]["streams_observed"], 7)
        self.assertEqual(result["7d"]["metrics"]["active_days"], 7)
        self.assertGreater(result["7d"]["metrics"]["observed_live_hours"], 0)
        self.assertEqual(result["7d"]["comparison"]["status"], "available")
        self.assertIn("followers_gained", result["7d"]["comparison"]["metrics"])
        self.assertEqual(result["90d"]["coverage"]["coverage_pct"], 100.0)

    def test_partial_twitch_history_is_not_compared_to_a_full_previous_period(self):
        snapshots, followers = self.make_twitch_history(days=5)
        result = build_windows("twitch", snapshots, self.now, followers)
        self.assertLess(result["7d"]["coverage"]["coverage_pct"], 100)
        self.assertEqual(result["7d"]["comparison"]["status"], "insufficient_coverage")

    def test_youtube_growth_uses_daily_account_history_and_period_deltas(self):
        history = []
        for ago in range(179, -1, -1):
            captured = self.now - timedelta(days=ago)
            history.append({
                "captured_at": captured.isoformat().replace("+00:00", "Z"),
                "metrics": {
                    "subscribers": 100 + (179 - ago),
                    "total_views": 1000 + (179 - ago) * 10,
                    "videos_total": 10 + (179 - ago) // 30,
                }
            })
        result = build_windows("youtube", history, self.now)
        self.assertEqual(result["7d"]["coverage"]["coverage_pct"], 100.0)
        self.assertEqual(result["7d"]["metrics"]["subscribers_gained"]["status"], "available")
        self.assertGreater(result["7d"]["metrics"]["views_gained"]["change"], 0)
        self.assertEqual(result["90d"]["comparison"]["status"], "available")

    def test_clip_performance_needs_a_real_historical_baseline(self):
        record = {
            "status": "ok", "captured_at": "2026-11-20T10:00:00Z",
            "clips": [{
                "id": "clip-1", "title": "Moment", "url": "https://www.twitch.tv/demo/clip/clip-1",
                "view_count": 140,
                "view_history": [
                    {"date": "2026-11-13", "captured_at": "2026-11-13T10:00:00Z", "views": 120},
                    {"date": "2026-11-20", "captured_at": "2026-11-20T10:00:00Z", "views": 140},
                ],
            }]
        }
        result = build_content("twitch", record, {}, self.now)
        self.assertEqual(result["top_clips"][0]["views"], 140)
        self.assertEqual(result["top_clips"][0]["views_gained"]["7d"]["change"], 20)

    def test_youtube_content_rate_uses_public_views_likes_and_comments(self):
        record = {
            "status": "verified", "captured_at": "2026-11-20T10:00:00Z",
            "recent_videos": [{
                "video_id": "video-1", "title": "Video", "views": 150, "likes": 12, "comments": 3,
                "url": "https://www.youtube.com/watch?v=video-1",
                "view_history": [
                    {"date": "2026-11-13", "captured_at": "2026-11-13T10:00:00Z", "views": 100},
                    {"date": "2026-11-20", "captured_at": "2026-11-20T10:00:00Z", "views": 150},
                ],
            }]
        }
        result = build_content("youtube", {}, record, self.now)
        self.assertEqual(result["videos"][0]["public_interaction_rate_pct"], 10.0)
        self.assertEqual(result["videos"][0]["views_gained"]["7d"]["change"], 50)

    def test_shared_collaboration_case_collects_participants_and_only_documented_vods(self):
        roster = {"heroes": [
            {"id": "a", "bitacora": [{"type": "expediente", "title": "Expediente 001 · BarFender", "date": "2026-11-05", "url": "https://www.twitch.tv/videos/111"}]},
            {"id": "b", "bitacora": [{"type": "expediente", "title": "Expediente 001 · BarFender", "date": "2026-11-05", "url": "https://www.twitch.tv/videos/222"}]},
            {"id": "c", "bitacora": [{"type": "expediente", "title": "Expediente 001 · BarFender", "date": "2026-11-05"}]},
        ]}
        cases = build_shared_cases(roster)
        case = next(iter(cases.values()))
        self.assertEqual(case["participants"], ["a", "b", "c"])
        self.assertEqual(len(case["deliverables"]), 2)

    def test_collaboration_results_keep_creator_reported_metrics_separate(self):
        records = {"channels": {
            "a": {"collaboration_results": [{"case_id": "case", "verification_status": "creator_reported", "metrics": [{"value": 33}]}]},
            "b": {"collaboration_results": [{"case_id": "case", "verification_status": "creator_reported", "metrics": [{"value": 10.7}]}]},
        }}
        shared = {"case": {"title": "Case", "participants": ["a", "b"]}}
        a = build_collaborations("a", records, shared)
        b = build_collaborations("b", records, shared)
        self.assertEqual(a["reported_results"][0]["metrics"][0]["value"], 33)
        self.assertEqual(b["reported_results"][0]["metrics"][0]["value"], 10.7)
        self.assertEqual(a["shared_cases"], b["shared_cases"])

    def test_private_audience_metrics_require_explicit_public_consent_and_small_cells_are_hidden(self):
        report = {
            "authorization": {"status": "granted", "public_display": True},
            "captured_at": "2026-11-20T10:00:00Z",
            "period": {"from": "2026-11-01T00:00:00Z", "to": "2026-11-20T00:00:00Z"},
            "source": "Creator dashboard report",
            "metrics": [{"key": "unique_viewers", "label": "Espectadores únicos", "value": 100, "unit": "personas"}],
            "breakdowns": [
                {"dimension": "age_range", "label": "18-24", "share_pct": 25, "sample_size": 20},
                {"dimension": "country", "label": "Other", "share_pct": 2, "sample_size": 3},
            ],
        }
        result = _authorized_audience_report(report)
        self.assertEqual(result["status"], "authorized_public_aggregate")
        self.assertEqual(len(result["metrics"]), 1)
        self.assertEqual(len(result["breakdowns"]), 1)
        report["authorization"]["public_display"] = False
        self.assertEqual(_authorized_audience_report(report)["status"], "not_publicly_authorized")


if __name__ == "__main__":
    unittest.main()
