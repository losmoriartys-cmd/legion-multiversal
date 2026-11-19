import json
import re
import unittest
from pathlib import Path

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
                self.assertIsInstance(metric.get("value"), (int, float))

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
        self.assertIn("twitch: 120", self.app)
        self.assertIn("function renderRosterMetricSummary(hero)", self.app)
        self.assertIn("renderRosterMetricSummary(hero)", self.app)
        self.assertIn("getNormalizedLiveStatus(hero)", self.app)
        self.assertIn("average_viewers_sampled", self.app)
        self.assertIn("peak_viewers_sampled", self.app)
        self.assertIn("observed_live_hours", self.app)

    def test_workflow_cadence_is_15_minutes_and_sample_window_remains_independent(self):
        workflow = re.search(r"cron:\s*'([^']+)'", self.workflow)
        self.assertIsNotNone(workflow)
        self.assertEqual(workflow.group(1), "7,22,37,52 * * * *")
        collector = (ROOT / "update_stats.py").read_text(encoding="utf-8")
        self.assertIn("SAMPLE_INTERVAL_MINUTES = 55", collector)
        self.assertIn("timedelta(minutes=45)", collector)


if __name__ == "__main__":
    unittest.main()
