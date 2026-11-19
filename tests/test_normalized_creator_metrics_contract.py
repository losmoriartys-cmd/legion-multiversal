import json
import re
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from scripts.build_creator_metrics import (
    FRESHNESS_MINUTES as BUILDER_FRESHNESS_MINUTES,
    build,
    capture_status as builder_capture_status,
)
from scripts.validate_creator_metrics import (
    FRESHNESS_MINUTES as VALIDATOR_FRESHNESS_MINUTES,
    capture_status as validator_capture_status,
    validate,
)

ROOT = Path(__file__).resolve().parents[1]

EXPECTED_ACCOUNTS = {
    "moriartys": ("twitch", "losmoriartys"),
    "rod3r1k": ("twitch", "TheR0D3R1K"),
    "lady-moriarty": ("twitch", "ladymoriarty01"),
    "ardipii": ("twitch", "ardipii"),
    "akuma": ("twitch", "akumazoldyck"),
    "dave-nexus": ("twitch", "daved0608"),
    "pato-oratoris": ("youtube", "@patoteexplica"),
    "habitos": ("twitch", "habitos_atomicos"),
}

EXPECTED_UNITS = {
    ("twitch", "average_viewers_sampled"): "viewers_sampled_avg",
    ("twitch", "peak_viewers_sampled"): "viewers_sampled_peak",
    ("twitch", "observed_live_hours"): "hours_observed",
    ("youtube", "subscribers"): "subscribers",
    ("youtube", "total_views"): "views",
    ("youtube", "videos_total"): "videos",
}


def normalized_handle(value):
    return str(value or "").strip().removeprefix("@").lower()


class NormalizedCreatorMetricsContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.roster = json.loads((ROOT / "roster-data.json").read_text(encoding="utf-8"))
        cls.metrics = json.loads((ROOT / "creator-metrics.json").read_text(encoding="utf-8"))
        cls.platform_stats = json.loads((ROOT / "platform-stats.json").read_text(encoding="utf-8"))
        cls.twitch = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
        cls.clips = json.loads((ROOT / "clips-data.json").read_text(encoding="utf-8"))
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.workflow = (ROOT / ".github/workflows/actualizar-stats.yml").read_text(encoding="utf-8")
        cls.heroes = {hero["id"]: hero for hero in cls.roster["heroes"]}

    def test_exactly_eight_canonical_ids_and_metric_records(self):
        self.assertEqual(set(EXPECTED_ACCOUNTS), set(self.heroes))
        self.assertEqual(set(EXPECTED_ACCOUNTS), set(self.metrics["creators"]))

    def test_every_metric_belongs_to_the_registered_account_for_its_creator(self):
        for creator_id, creator in self.metrics["creators"].items():
            platform, expected_handle = EXPECTED_ACCOUNTS[creator_id]
            accounts = [
                account for account in creator.get("accounts", [])
                if account.get("platform") == platform
                and account.get("account_type") == "creator_channel"
            ]
            self.assertTrue(accounts, creator_id)
            allowed_handles = {
                normalized_handle(accounts[0].get("handle")),
                normalized_handle(accounts[0].get("login")),
            }
            self.assertIn(normalized_handle(expected_handle), allowed_handles)
            for metric in creator.get("metrics", []):
                self.assertEqual(metric.get("platform"), platform, creator_id)
                self.assertIn(
                    normalized_handle(metric.get("account_handle")),
                    allowed_handles,
                    f"{creator_id} / {metric.get('key')}",
                )
                self.assertEqual(metric.get("visibility"), "public")
                self.assertTrue(metric.get("captured_at"), f"{creator_id} / {metric.get('key')}")

    def test_twitch_metrics_keep_their_exact_keys_and_units(self):
        creators = self.metrics["creators"]
        for creator_id, (platform, _) in EXPECTED_ACCOUNTS.items():
            if platform != "twitch":
                continue
            metric_map = {
                (item.get("platform"), item.get("key")): item
                for item in creators[creator_id].get("metrics", [])
            }
            for key in ("average_viewers_sampled", "peak_viewers_sampled", "observed_live_hours"):
                metric = metric_map[(platform, key)]
                self.assertEqual(metric.get("unit"), EXPECTED_UNITS[(platform, key)])
                value = metric.get("value")
                if value is not None:
                    self.assertIsInstance(value, (int, float))
                    self.assertGreaterEqual(value, 0)

    def test_pato_is_youtube_only_in_the_normalized_metrics_source(self):
        pato = self.metrics["creators"]["pato-oratoris"]
        self.assertEqual({metric["platform"] for metric in pato["metrics"]}, {"youtube"})
        metric_map = {metric["key"]: metric for metric in pato["metrics"]}
        for key in ("subscribers", "total_views", "videos_total"):
            self.assertEqual(metric_map[key]["unit"], EXPECTED_UNITS[("youtube", key)])
        roster_accounts = self.heroes["pato-oratoris"]["accounts"]
        self.assertTrue(any(a["platform"] == "youtube" and a["account_type"] == "creator_channel" for a in roster_accounts))
        self.assertFalse(any(a["platform"] == "twitch" and a["account_type"] == "creator_channel" for a in roster_accounts))
        self.assertIn("pato-oratoris", self.platform_stats["creators"])

    def test_app_uses_one_bundle_resolver_and_a_120_minute_freshness_window(self):
        self.assertIn("creatorProfileBundle=bundle", self.app)
        self.assertIn("creatorRecordsData=bundle.records", self.app)
        self.assertIn("creatorMetricsData=bundle.metrics", self.app)
        self.assertIn("creatorProfileBundle.getCreator(hero)", self.app)
        self.assertIn("window.LegionCreatorProfiles?.findMetric(profile,metricKey,selectedPlatform)", self.app)
        self.assertIn("captured_at", self.app)
        freshness_match = re.search(
            r"NORMALIZED_METRIC_FRESHNESS_MINUTES = Object\\.freeze\\(\\{\\s*twitch:\\s*(\\d+),\\s*youtube:\\s*(\\d+),\\s*kick:\\s*(\\d+)\\s*\\}\\)",
            self.app,
        )
        self.assertIsNotNone(freshness_match)
        self.assertEqual(tuple(map(int, freshness_match.groups())), (120, 120, 120))
        expected_policy = {"twitch": 120, "youtube": 120, "kick": 120}
        self.assertEqual(BUILDER_FRESHNESS_MINUTES, expected_policy)
        self.assertEqual(VALIDATOR_FRESHNESS_MINUTES, expected_policy)
        self.assertIn("function renderRosterMetricSummary(hero)", self.app)
        self.assertIn("renderRosterMetricSummary(hero)", self.app)
        self.assertIn("getNormalizedLiveStatus(hero)", self.app)
        self.assertIn("average_viewers_sampled", self.app)
        self.assertIn("peak_viewers_sampled", self.app)
        self.assertIn("observed_live_hours", self.app)


    def test_freshness_boundaries_are_deterministic_for_every_platform(self):
        now = datetime(2026, 11, 19, 12, 0, tzinfo=timezone.utc)
        exact_boundary = (now - timedelta(minutes=120)).isoformat()
        one_second_old = (now - timedelta(minutes=120, seconds=1)).isoformat()
        exact_clock_skew = (now + timedelta(minutes=5)).isoformat()
        excessive_clock_skew = (now + timedelta(minutes=5, seconds=1)).isoformat()
        for platform in ("twitch", "youtube", "kick"):
            for classifier in (builder_capture_status, validator_capture_status):
                self.assertEqual(classifier(platform, exact_boundary, now), "fresh")
                self.assertEqual(classifier(platform, one_second_old, now), "delayed")
                self.assertEqual(classifier(platform, exact_clock_skew, now), "fresh")
                self.assertEqual(classifier(platform, excessive_clock_skew, now), "unavailable")

    def test_checked_in_generated_registry_has_deterministic_freshness(self):
        self.assertEqual(validate(self.metrics, self.roster), [])

    def test_builder_uses_source_capture_times_and_validates_generated_registry(self):
        reference_now = datetime.fromisoformat(self.metrics["generated_at"].replace("Z", "+00:00"))
        generated = build(
            self.roster,
            self.twitch,
            self.platform_stats,
            self.clips,
            now=reference_now,
        )
        self.assertEqual(validate(generated, self.roster, reference_now), [])

        channel = self.twitch["channels"]["losmoriartys"]
        metrics = {
            metric["key"]: metric
            for metric in generated["creators"]["moriartys"]["metrics"]
        }
        self.assertEqual(metrics["live_status"]["captured_at"], channel["last_status_at"])
        self.assertEqual(metrics["average_viewers_sampled"]["captured_at"], channel["last_snapshot_at"])
        self.assertEqual(metrics["peak_viewers_sampled"]["captured_at"], channel["last_snapshot_at"])

    def test_workflow_cadence_is_15_minutes_and_sample_window_remains_independent(self):
        workflow = re.search(r"cron:\s*'([^']+)'", self.workflow)
        self.assertIsNotNone(workflow)
        self.assertEqual(workflow.group(1), "7,22,37,52 * * * *")
        collector = (ROOT / "update_stats.py").read_text(encoding="utf-8")
        self.assertIn("SAMPLE_INTERVAL_MINUTES = 55", collector)
        self.assertIn("timedelta(minutes=45)", collector)


if __name__ == "__main__":
    unittest.main()
