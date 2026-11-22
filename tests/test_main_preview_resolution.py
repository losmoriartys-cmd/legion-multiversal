"""Unit tests for resolving a fresh Cloudflare Pages baseline for main."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import resolve_main_preview


def cloudflare_check(sha: str, url: str, conclusion: str = "success", name: str = "Cloudflare Pages"):
    return {
        "name": name,
        "head_sha": sha,
        "status": "completed",
        "conclusion": conclusion,
        "completed_at": "2026-11-22T22:00:00Z",
        "output": {
            "summary": (
                "<table><tr><td><strong>Latest commit:</strong></td><td><code>"
                + sha[:7]
                + "</code></td></tr><tr><td><strong>Preview URL:</strong></td><td>"
                + f"<a href='{url}'>{url}</a></td></tr></table>"
            )
        },
    }


class MainPreviewResolverTests(unittest.TestCase):
    def test_extracts_only_the_project_cloudflare_preview(self):
        url = "https://575cb529.legion-multiversal.pages.dev"
        summary = f"<strong>Preview URL:</strong></td><td><a href='{url}'>{url}</a>"
        self.assertEqual(resolve_main_preview.extract_preview_url(summary), url)

    def test_rejects_other_hosts_and_non_https_urls(self):
        self.assertIsNone(resolve_main_preview.extract_preview_url(
            "<strong>Preview URL:</strong></td><td><a href='https://example.com'>example</a>"
        ))
        self.assertIsNone(resolve_main_preview.extract_preview_url(
            "<strong>Preview URL:</strong></td><td><a href='http://main.legion-multiversal.pages.dev'>main</a>"
        ))

    def test_selects_preview_for_the_exact_main_sha_only(self):
        main_sha = "a578714cbac39cef580887c3dbf80a35ce726835"
        old = cloudflare_check("18b09413f8882b7b42e7d748a8fa6912f86e3054", "https://old.legion-multiversal.pages.dev")
        current = cloudflare_check(main_sha, "https://575cb529.legion-multiversal.pages.dev")
        self.assertEqual(
            resolve_main_preview.select_main_preview([old, current], main_sha),
            "https://575cb529.legion-multiversal.pages.dev",
        )

    def test_ignores_failed_deploys_and_other_check_names(self):
        main_sha = "a578714cbac39cef580887c3dbf80a35ce726835"
        failed = cloudflare_check(main_sha, "https://failed.legion-multiversal.pages.dev", conclusion="failure")
        other = cloudflare_check(main_sha, "https://other.legion-multiversal.pages.dev", name="deploy")
        with self.assertRaises(RuntimeError):
            resolve_main_preview.select_main_preview([failed, other], main_sha)

    def test_fails_closed_when_no_exact_sha_preview_exists(self):
        with self.assertRaisesRegex(RuntimeError, "SHA exacto de main"):
            resolve_main_preview.select_main_preview([], "a578714cbac39cef580887c3dbf80a35ce726835")


if __name__ == "__main__":
    unittest.main()
