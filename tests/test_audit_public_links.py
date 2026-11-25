import unittest
from unittest.mock import Mock, patch
from urllib.error import HTTPError

from scripts.audit_public_links import classify_url, collect_public_urls, probe_url


class PublicLinkClassificationTests(unittest.TestCase):
    def test_two_consecutive_404_responses_confirm_dead_link(self):
        probe = Mock(side_effect=[404, 404])
        result = classify_url("https://example.test/missing", probe=probe)
        self.assertEqual(result["status"], "confirmed_dead")
        self.assertEqual(result["http_status"], 404)
        self.assertEqual(result["attempts"], [404, 404])

    def test_two_consecutive_410_responses_confirm_dead_link(self):
        probe = Mock(side_effect=[410, 410])
        result = classify_url("https://example.test/gone", probe=probe)
        self.assertEqual(result["status"], "confirmed_dead")
        self.assertEqual(result["attempts"], [410, 410])

    def test_404_followed_by_success_is_reachable(self):
        probe = Mock(side_effect=[404, 200])
        result = classify_url("https://example.test/recovered", probe=probe)
        self.assertEqual(result["status"], "reachable")
        self.assertEqual(result["http_status"], 200)
        self.assertEqual(result["attempts"], [404, 200])

    def test_single_404_attempt_is_inconclusive(self):
        probe = Mock(return_value=404)
        result = classify_url("https://example.test/unstable", probe=probe, attempts=1)
        self.assertEqual(result["status"], "inconclusive")
        self.assertEqual(result["attempts"], [404])

    def test_timeout_is_inconclusive(self):
        probe = Mock(return_value=None)
        result = classify_url("https://example.test/timeout", probe=probe)
        self.assertEqual(result["status"], "inconclusive")
        self.assertEqual(result["attempts"], [None])

    def test_403_429_and_5xx_are_inconclusive(self):
        for status in (403, 429, 500, 503):
            with self.subTest(status=status):
                probe = Mock(return_value=status)
                result = classify_url("https://example.test/blocked", probe=probe)
                self.assertEqual(result["status"], "inconclusive")
                self.assertEqual(result["http_status"], status)
                self.assertEqual(result["attempts"], [status])

    def test_success_statuses_are_reachable(self):
        for status in (200, 204, 206, 301, 302, 307):
            with self.subTest(status=status):
                result = classify_url("https://example.test/ok", probe=Mock(return_value=status))
                self.assertEqual(result["status"], "reachable")
                self.assertEqual(result["http_status"], status)


class PublicLinkCollectionTests(unittest.TestCase):
    def test_https_links_are_deduplicated_and_non_https_ignored(self):
        documents = {
            "data/roster.json": {
                "heroes": [{
                    "id": "creator",
                    "accounts": [{"url": "https://example.test/shared"}],
                    "socials": {"site": "http://example.test/ignored"},
                    "links": [{"url": "https://example.test/shared"}],
                    "bitacora": [{"url": "https://example.test/entry"}],
                }]
            }
        }
        entries = collect_public_urls(documents)
        urls = [entry["url"] for entry in entries]
        self.assertEqual(urls, ["https://example.test/entry", "https://example.test/shared"])
        self.assertEqual(len(urls), len(set(urls)))


class ProbeFallbackTests(unittest.TestCase):
    def test_head_405_falls_back_to_ranged_get(self):
        head_error = HTTPError("https://example.test", 405, "Method not allowed", {}, None)
        get_response = Mock()
        get_response.status = 206
        get_response.__enter__ = Mock(return_value=get_response)
        get_response.__exit__ = Mock(return_value=False)
        with patch("scripts.audit_public_links.urlopen", side_effect=[head_error, get_response]) as mocked:
            status = probe_url("https://example.test")
        self.assertEqual(status, 206)
        self.assertEqual(mocked.call_count, 2)
        self.assertEqual(mocked.call_args_list[1].args[0].get_method(), "GET")
        self.assertEqual(mocked.call_args_list[1].args[0].get_header("Range"), "bytes=0-0")


if __name__ == "__main__":
    unittest.main()
