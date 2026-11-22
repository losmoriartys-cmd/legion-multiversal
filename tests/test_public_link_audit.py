"""Unit tests for conservative external URL availability classification."""
from __future__ import annotations
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import audit_public_links


class PublicLinkAuditTests(unittest.TestCase):
    def test_two_repeated_not_found_responses_confirm_dead(self):
        responses = iter([404, 404])
        result = audit_public_links.classify_url("https://example.com/dead", probe=lambda _: next(responses))
        self.assertEqual(result["status"], "confirmed_dead")
        self.assertEqual(result["attempts"], [404, 404])

    def test_gone_is_confirmed_only_after_two_responses(self):
        responses = iter([410, 410])
        result = audit_public_links.classify_url("https://example.com/gone", probe=lambda _: next(responses))
        self.assertEqual(result["status"], "confirmed_dead")

    def test_single_not_found_is_inconclusive(self):
        responses = iter([404, None])
        result = audit_public_links.classify_url("https://example.com/maybe", probe=lambda _: next(responses))
        self.assertEqual(result["status"], "inconclusive")
        self.assertEqual(result["attempts"], [404])

    def test_rate_limit_is_never_classified_as_dead(self):
        result = audit_public_links.classify_url("https://example.com/limited", probe=lambda _: 429)
        self.assertEqual(result["status"], "inconclusive")

    def test_forbidden_and_server_error_are_inconclusive(self):
        for status in (403, 500, 503):
            with self.subTest(status=status):
                result = audit_public_links.classify_url("https://example.com/restricted", probe=lambda _, code=status: code)
                self.assertEqual(result["status"], "inconclusive")

    def test_timeout_or_dns_failure_is_inconclusive(self):
        result = audit_public_links.classify_url("https://example.com/unavailable", probe=lambda _: None)
        self.assertEqual(result["status"], "inconclusive")

    def test_redirect_or_success_is_reachable(self):
        for status in (200, 301, 302, 399):
            with self.subTest(status=status):
                result = audit_public_links.classify_url("https://example.com/ok", probe=lambda _, code=status: code)
                self.assertEqual(result["status"], "reachable")

    def test_collector_deduplicates_urls_and_retains_source_pointer(self):
        docs = {
            "data/roster.json": {"heroes": [{"id": "moriartys", "accounts": [{"url": "https://twitch.tv/losmoriartys"}], "socials": {"twitch": "https://twitch.tv/losmoriartys"}, "links": []}]},
            "data/games.json": {"juegos": []},
            "data/creator-records.json": {"channels": {}},
            "clips-data.json": {"creators": {}},
            "platform-stats.json": {"creators": {}},
            "creator-programs.json": {"official_links": {}},
        }
        links = audit_public_links.collect_public_urls(docs)
        self.assertEqual(len(links), 1)
        self.assertIn("accounts/0/url", links[0]["source"])


if __name__ == "__main__":
    unittest.main()
