import unittest
from datetime import datetime, timezone
from unittest.mock import patch

import update_clips


class NormalizeClipTests(unittest.TestCase):
    def test_accepts_twitch_clip_and_keeps_public_fields(self):
        clip = update_clips.normalize_clip({
            "id": "clip-1", "url": "https://www.twitch.tv/demo/clip/clip-1",
            "title": "Momentazo", "view_count": 123, "created_at": "2026-11-01T12:00:00Z",
            "thumbnail_url": "https://static-cdn.jtvnw.net/thumb.jpg",
        })
        self.assertEqual(clip["id"], "clip-1")
        self.assertEqual(clip["view_count"], 123)
        self.assertTrue(clip["thumbnail_url"].startswith("https://"))

    def test_rejects_non_twitch_urls(self):
        self.assertIsNone(update_clips.normalize_clip({
            "id": "bad", "url": "https://example.com/clip", "title": "No válido"
        }))

    def test_rejects_missing_ids(self):
        self.assertIsNone(update_clips.normalize_clip({
            "url": "https://clips.twitch.tv/clip", "title": "Sin ID"
        }))


class CollectClipsTests(unittest.TestCase):
    def setUp(self):
        self.account = {
            "creator_id": "demo", "display_name": "DEMO",
            "login": "demo", "url": "https://twitch.tv/demo",
        }
        self.now = datetime(2026, 11, 14, 12, 0, tzinfo=timezone.utc)

    @patch("update_clips.read_previous", return_value={})
    @patch("update_clips.request_json")
    @patch("update_clips.helix_get", return_value=[{"login": "demo", "id": "123"}])
    @patch("update_clips.get_token", return_value="token")
    @patch("update_clips.load_roster_accounts")
    def test_collects_public_clips_and_records_selection_method(self, roster, token, users, clips, previous):
        roster.return_value = [self.account]
        clips.return_value = {"data": [
            {"id": "clip-1", "url": "https://clips.twitch.tv/clip-1", "title": "Clip uno", "view_count": 22},
            {"id": "clip-2", "url": "https://clips.twitch.tv/clip-2", "title": "Clip dos", "view_count": 8},
        ], "pagination": {}}
        result = update_clips.collect(self.now)
        self.assertEqual(result["collection"]["successful_channels"], 1)
        self.assertEqual(result["creators"]["demo"]["status"], "ok")
        self.assertEqual(len(result["creators"]["demo"]["clips"]), 2)
        self.assertEqual(result["creators"]["demo"]["clips"][0]["id"], "clip-1")
        self.assertIn("no es inventario exhaustivo", result["selection"]["methodology"])
        self.assertIn("broadcaster_id=123", clips.call_args.args[0])

    @patch("update_clips.read_previous", return_value={
        "creators": {"demo": {"clips": [{"id": "old", "url": "https://clips.twitch.tv/old", "title": "Anterior"}], "captured_at": "2026-11-13T10:00:00Z"}}
    })
    @patch("update_clips.request_json", side_effect=RuntimeError("API no disponible"))
    @patch("update_clips.helix_get", return_value=[{"login": "demo", "id": "123"}])
    @patch("update_clips.get_token", return_value="token")
    @patch("update_clips.load_roster_accounts")
    def test_preserves_last_good_clips_when_one_channel_fails(self, roster, token, users, clips, previous):
        roster.return_value = [self.account]
        result = update_clips.collect(self.now)
        record = result["creators"]["demo"]
        self.assertEqual(record["status"], "error")
        self.assertEqual(record["clips"][0]["id"], "old")
        self.assertEqual(result["collection"]["complete"], False)
        self.assertEqual(result["collection"]["failed_channels"], 1)

    @patch("update_clips.helix_get", return_value=[])
    @patch("update_clips.get_token", return_value="token")
    @patch("update_clips.load_roster_accounts")
    def test_fails_closed_when_twitch_does_not_resolve_all_accounts(self, roster, token, users):
        roster.return_value = [self.account]
        with self.assertRaisesRegex(RuntimeError, "no resolvió"):
            update_clips.collect(self.now)


if __name__ == "__main__":
    unittest.main()
