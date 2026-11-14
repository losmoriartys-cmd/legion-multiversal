import unittest
from datetime import datetime, timezone

from scripts.build_creator_metrics import build
from scripts.validate_creator_metrics import validate


class NormalizedCreatorMetricsTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 14, 22, 0, tzinfo=timezone.utc)
        self.roster = {
            "heroes": [
                {
                    "id": "demo",
                    "name": "DEMO",
                    "display_name": "DEMO PROJECT",
                    "identity_scope": "shared_project",
                    "represented_people": ["A", "B"],
                    "accounts": [
                        {
                            "platform": "twitch", "account_type": "creator_channel",
                            "handle": "demo", "login": "demo", "url": "https://twitch.tv/demo",
                            "ownership": "shared", "status": "confirmed",
                            "collection": {"mode": "public_app_token", "source": "Twitch Helix"},
                            "restricted_metrics": ["private_analytics"],
                        },
                        {
                            "platform": "youtube", "account_type": "creator_channel",
                            "handle": "@demo", "login": None, "url": "https://youtube.com/@demo",
                            "ownership": "individual", "status": "confirmed",
                            "collection": {"mode": "public_api_key", "source": "YouTube Data API v3"},
                            "restricted_metrics": ["youtube_analytics_private"],
                        },
                    ],
                }
            ]
        }
        self.twitch = {
            "channels": {
                "demo": {
                    "login": "demo", "live": True, "current_viewers": 7,
                    "updated_at": "2026-11-14T21:30:00Z",
                    "snapshots": [
                        {"sampled_at": "2026-11-14T20:30:00Z"},
                        {"sampled_at": "2026-11-14T21:30:00Z"},
                    ],
                    "window": {
                        "samples_total": 2, "live_samples": 2, "streams_observed": 1,
                        "average_viewers_sampled": 6.5, "peak_viewers_sampled": 7,
                        "observed_live_hours": 1.0, "estimated_hours_watched": 6.5,
                    },
                }
            }
        }
        self.platforms = {
            "updated_at": "2026-11-14T21:00:00Z",
            "creators": {
                "demo": {
                    "platforms": {
                        "youtube": {
                            "platform": "youtube", "handle": "@demo", "status": "verified",
                            "source": "YouTube Data API v3",
                            "metrics": {"subscribers": 55, "total_views": 500, "videos_total": 4},
                        }
                    }
                }
            },
        }
        self.clips = {
            "creators": {
                "demo": {"status": "awaiting_collection", "captured_at": None, "clips": []}
            }
        }

    def test_builds_one_creator_with_platform_scoped_metrics_and_separate_units(self):
        result = build(self.roster, self.twitch, self.platforms, self.clips, self.now)
        creator = result["creators"]["demo"]
        self.assertEqual(creator["display_name"], "DEMO PROJECT")
        self.assertEqual(creator["identity_scope"], "shared_project")
        self.assertEqual(len(creator["accounts"]), 2)
        values = {(m["platform"], m["key"]): m for m in creator["metrics"]}
        self.assertEqual(values[("twitch", "current_viewers")]["value"], 7)
        self.assertEqual(values[("twitch", "current_viewers")]["unit"], "viewers")
        self.assertEqual(values[("twitch", "average_viewers_sampled")]["unit"], "viewers_sampled_avg")
        self.assertEqual(values[("youtube", "subscribers")]["value"], 55)
        self.assertEqual(values[("youtube", "subscribers")]["unit"], "subscribers")
        self.assertEqual(creator["content"]["twitch_clips_status"], "awaiting_collection")

    def test_stale_twitch_live_state_and_viewers_are_not_current(self):
        self.twitch["channels"]["demo"]["updated_at"] = "2026-11-14T18:00:00Z"
        result = build(self.roster, self.twitch, self.platforms, self.clips, self.now)
        values = {(m["platform"], m["key"]): m for m in result["creators"]["demo"]["metrics"]}
        self.assertEqual(values[("twitch", "live_status")]["status"], "delayed")
        self.assertIsNone(values[("twitch", "live_status")]["value"])
        self.assertEqual(values[("twitch", "current_viewers")]["status"], "delayed")
        self.assertIsNone(values[("twitch", "current_viewers")]["value"])
        self.assertEqual(values[("twitch", "average_viewers_sampled")]["status"], "sampled")

    def test_old_public_youtube_metrics_are_preserved_as_delayed_history(self):
        self.platforms["updated_at"] = "2026-11-01T21:00:00Z"
        result = build(self.roster, self.twitch, self.platforms, self.clips, self.now)
        metric = next(m for m in result["creators"]["demo"]["metrics"] if m["platform"] == "youtube" and m["key"] == "subscribers")
        self.assertEqual(metric["status"], "delayed")
        self.assertEqual(metric["value"], 55)
        self.assertIn("histórico", metric["interpretation"])

    def test_registry_validator_rejects_unknown_creator_and_mixed_private_data(self):
        result = build(self.roster, self.twitch, self.platforms, self.clips, self.now)
        self.assertEqual(validate(result, self.roster), [])
        result["creators"]["demo"]["metrics"][0]["visibility"] = "authorized"
        errors = validate(result, self.roster)
        self.assertTrue(any("datos autorizados" in error for error in errors))

    def test_unavailable_metrics_must_not_keep_values(self):
        result = build(self.roster, self.twitch, self.platforms, self.clips, self.now)
        metric = next(m for m in result["creators"]["demo"]["metrics"] if m["platform"] == "youtube")
        metric["status"] = "unavailable"
        metric["value"] = 55
        errors = validate(result, self.roster)
        self.assertTrue(any("no disponible" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
