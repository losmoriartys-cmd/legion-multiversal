import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import update_stats


class TwitchFollowerCountTests(unittest.TestCase):
    def test_follower_endpoint_returns_only_public_total(self):
        with patch.object(update_stats, "CLIENT_ID", "client-id"), patch.object(
            update_stats, "request_json", return_value={"total": 321, "data": [{"user_name": "must-not-be-stored"}]}
        ) as request:
            self.assertEqual(update_stats.get_channel_followers_total("12345", "user-token"), 321)
        args, kwargs = request.call_args
        self.assertIn("/helix/channels/followers?broadcaster_id=12345", args[0])
        headers = args[1] if len(args) > 1 else kwargs.get("headers", {})
        self.assertEqual(headers["Authorization"], "Bearer user-token")
        self.assertEqual(set(headers), {"Client-ID", "Authorization"})

    def test_follower_endpoint_rejects_missing_or_invalid_total(self):
        for payload in ({"data": []}, {"total": None}, {"total": -1}, {"total": True}):
            with self.subTest(payload=payload), patch.object(update_stats, "request_json", return_value=payload):
                with self.assertRaises(RuntimeError):
                    update_stats.get_channel_followers_total("12345", "user-token")

    def test_missing_oauth_bootstrap_secret_skips_optional_follower_collection(self):
        with tempfile.TemporaryDirectory() as temp:
            token_file = Path(temp) / "token.enc"
            with patch.object(update_stats, "FOLLOWERS_TOKEN_FILE", str(token_file)), patch.dict(
                os.environ,
                {"TWITCH_FOLLOWERS_REFRESH_TOKEN": "", "TWITCH_FOLLOWERS_TOKEN_KEY": ""},
                clear=False,
            ):
                os.environ.pop("TWITCH_FOLLOWERS_REFRESH_TOKEN", None)
                os.environ.pop("TWITCH_FOLLOWERS_TOKEN_KEY", None)
                self.assertIsNone(update_stats.get_followers_user_token())

    def test_rotated_refresh_token_is_encrypted_and_access_token_is_reused(self):
        try:
            from cryptography.fernet import Fernet
        except ImportError:
            self.skipTest("cryptography no está instalada en el entorno local.")
        with tempfile.TemporaryDirectory() as temp:
            token_file = Path(temp) / "token.enc"
            key = Fernet.generate_key().decode("ascii")
            env = {
                "TWITCH_FOLLOWERS_REFRESH_TOKEN": "initial-refresh-secret",
                "TWITCH_FOLLOWERS_TOKEN_KEY": key,
            }
            with patch.object(update_stats, "FOLLOWERS_TOKEN_FILE", str(token_file)), patch.object(
                update_stats, "CLIENT_ID", "client-id"
            ), patch.object(update_stats, "CLIENT_SECRET", "client-secret"), patch.dict(os.environ, env, clear=False), patch.object(
                update_stats, "request_json",
                return_value={"access_token": "new-access-secret", "refresh_token": "rotated-refresh-secret", "expires_in": 14400},
            ) as request:
                token = update_stats.get_followers_user_token()
                self.assertEqual(token, "new-access-secret")
                self.assertEqual(request.call_count, 1)
                encrypted = token_file.read_bytes()
                self.assertNotIn(b"rotated-refresh-secret", encrypted)
                stored = json.loads(Fernet(key.encode("ascii")).decrypt(encrypted).decode("utf-8"))
                self.assertEqual(stored["refresh_token"], "rotated-refresh-secret")
                self.assertEqual(update_stats.get_followers_user_token(), "new-access-secret")
                self.assertEqual(request.call_count, 1)


if __name__ == "__main__":
    unittest.main()
