import io
import json
import unittest
from pathlib import Path
import urllib.error
from datetime import datetime, timezone
from email.message import Message
from unittest.mock import patch

import update_stats
import update_platform_stats
from scripts.build_creator_metrics import build
from scripts.validate_roster_data import validate_activity


def http_error(code, headers=None):
    return urllib.error.HTTPError(
        "https://example.test/api", code, "test", Message() if headers is None else headers, None
    )


class HttpRetryContractTests(unittest.TestCase):
    def test_twitch_retries_rate_limit_then_succeeds(self):
        response = io.BytesIO(b'{"ok": true}')
        with patch.object(update_stats.urllib.request, "urlopen", side_effect=[http_error(429), response]) as call:
            with patch.object(update_stats.time, "sleep") as sleep:
                self.assertEqual(update_stats.request_json("https://example.test"), {"ok": True})
        self.assertEqual(call.call_count, 2)
        sleep.assert_called_once_with(2)

    def test_platform_collector_does_not_retry_authentication_failure(self):
        with patch.object(update_platform_stats.urllib.request, "urlopen", side_effect=http_error(401)) as call:
            with patch.object(update_platform_stats.time, "sleep") as sleep:
                with self.assertRaises(urllib.error.HTTPError):
                    update_platform_stats.request("https://example.test")
        call.assert_called_once()
        sleep.assert_not_called()

    def test_retry_after_is_capped_at_thirty_seconds(self):
        headers = Message()
        headers["Retry-After"] = "120"
        response = io.BytesIO(b'{"ok": true}')
        with patch.object(update_stats.urllib.request, "urlopen", side_effect=[http_error(429, headers), response]):
            with patch.object(update_stats.time, "sleep") as sleep:
                update_stats.request_json("https://example.test")
        sleep.assert_called_once_with(30)

    def test_twitch_stops_after_three_total_attempts(self):
        with patch.object(update_stats.urllib.request, "urlopen", side_effect=[http_error(503), http_error(503), http_error(503)]) as call:
            with patch.object(update_stats.time, "sleep"):
                with self.assertRaises(urllib.error.HTTPError):
                    update_stats.request_json("https://example.test")
        self.assertEqual(call.call_count, 3)


    def test_committed_twitch_source_satisfies_status_freshness_contract(self):
        root = Path(__file__).resolve().parents[1]
        roster = json.loads((root / "roster-data.json").read_text(encoding="utf-8"))
        activity = json.loads((root / "data.json").read_text(encoding="utf-8"))
        self.assertEqual(validate_activity(roster, activity), [])

    def test_roster_validator_accepts_fresh_status_without_new_snapshot(self):
        roster = {"heroes": [{"accounts": [{"platform": "twitch", "login": "channel-a"}]}]}
        activity = {
            "active_channels": ["channel-a"],
            "collection": {
                "expected_channels": 1,
                "complete": False,
                "status_complete": True,
                "sampling_complete": False,
                "coverage_complete": True,
                "sampled_channels": [],
                "skipped_channels": ["channel-a"]
            },
            "channels": {"channel-a": {
                "updated_at": "2026-11-16T15:00:00Z",
                "last_status_at": "2026-11-16T15:00:00Z",
                "snapshots": []
            }}
        }
        self.assertEqual(validate_activity(roster, activity), [])

    def test_roster_validator_rejects_missing_helix_status_completeness(self):
        roster = {"heroes": [{"accounts": [{"platform": "twitch", "login": "channel-a"}]}]}
        activity = {
            "active_channels": ["channel-a"],
            "collection": {
                "expected_channels": 1,
                "complete": False,
                "status_complete": False,
                "sampling_complete": False,
                "coverage_complete": True,
                "sampled_channels": [],
                "skipped_channels": ["channel-a"]
            },
            "channels": {"channel-a": {
                "updated_at": "2026-11-16T15:00:00Z",
                "last_status_at": "2026-11-16T15:00:00Z",
                "snapshots": []
            }}
        }
        self.assertTrue(validate_activity(roster, activity))

    def test_twitch_status_success_is_distinct_from_new_snapshot_completion(self):
        flags = update_stats.collection_flags(
            ["a", "b", "c"], ["a", "b", "c"], [], ["a", "b", "c"]
        )
        self.assertTrue(flags["status_complete"])
        self.assertTrue(flags["coverage_complete"])
        self.assertFalse(flags["complete"])
        self.assertFalse(flags["sampling_complete"])

class IncrementalHistoryTests(unittest.TestCase):
    def test_history_deduplicates_same_utc_day(self):
        record = {"metrics": {"subscribers": 56}, "history": []}
        update_platform_stats.append_history(record, "2026-11-16T15:31:24Z")
        update_platform_stats.append_history(record, "2026-11-16T15:58:00Z")
        self.assertEqual(len(record["history"]), 1)

    def test_history_appends_next_day_and_keeps_181_daily_points(self):
        record = {"metrics": {"subscribers": 56}, "history": [
            {"captured_at": "2026-11-15T00:00:00Z", "metrics": {}}
        ]}
        update_platform_stats.append_history(record, "2026-11-16T16:00:00Z")
        self.assertEqual(len(record["history"]), 2)
        record["history"] = [
            {"captured_at": (datetime(2026, 11, 20, tzinfo=timezone.utc) - __import__("datetime").timedelta(days=days)).isoformat().replace("+00:00", "Z"), "metrics": {}}
            for days in range(200, 0, -1)
        ]
        update_platform_stats.append_history(record, "2026-11-20T16:00:00Z")
        self.assertEqual(len(record["history"]), 181)

    def test_youtube_video_view_history_is_daily_and_keeps_old_baseline(self):
        current = [{"video_id": "v1", "views": 140, "likes": 12, "comments": 3}]
        previous = [{"video_id": "v1", "view_history": [
            {"date": "2026-11-19", "captured_at": "2026-11-19T10:00:00Z", "views": 120, "likes": 10, "comments": 2}
        ]}]
        result = update_platform_stats.append_video_history(current, previous, "2026-11-20T10:00:00Z")
        self.assertEqual([point["views"] for point in result[0]["view_history"]], [120, 140])
        same_day = update_platform_stats.append_video_history(
            [{"video_id": "v1", "views": 145, "likes": 13, "comments": 4}],
            result,
            "2026-11-20T16:00:00Z",
        )
        self.assertEqual(len(same_day[0]["view_history"]), 2)
        self.assertEqual(same_day[0]["view_history"][-1]["views"], 145)

    def test_creator_metrics_uses_account_capture_timestamp_not_global_attempt(self):
        now = datetime(2026, 11, 16, 16, 0, tzinfo=timezone.utc)
        roster = {"heroes": [{
            "id": "creator", "display_name": "Creator",
            "accounts": [{"platform": "youtube", "handle": "@creator", "account_type": "creator_channel"}]
        }]}
        twitch = {"updated_at": "2026-11-16T16:00:00Z", "channels": {}}
        platforms = {
            "updated_at": "2026-11-16T16:00:00Z",
            "creators": {"creator": {"platforms": {"youtube": {
                "status": "verified", "captured_at": "2026-11-01T16:00:00Z",
                "metrics": {"subscribers": 56, "total_views": 431, "videos_total": 6}
            }}}}
        }
        result = build(roster, twitch, platforms, {}, now=now)
        metrics = result["creators"]["creator"]["metrics"]
        self.assertTrue(metrics)
        self.assertTrue(all(metric["status"] == "delayed" for metric in metrics))


if __name__ == "__main__":
    unittest.main()
