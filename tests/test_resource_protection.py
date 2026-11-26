"""Behavioral tests for the resource inventory and two-phase authorization gate."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_resource_change_policy as gate
import audit_resource_inventory as inventory

POLICY = {
    "authorization_file": "data/resource-change-authorizations.json",
    "policy_file": "data/resource-protection-policy.json",
    "routine_generated_data": ["creator-metrics.json", "data.json"],
    "explicit_paths": ["data/roster.json", "data/creator-records.json", "CODEOWNERS"],
    "explicit_patterns": ["schemas/**"],
    "explicit_extensions": [".jpg", ".png", ".webp", ".css", ".html"],
    "review_required_patterns": [".github/workflows/**", "scripts/**", "tests/**"],
}
EMPTY = {"schema_version": 1, "authorizations": []}


def authorization(path="cover.jpg", action="update", before="a" * 64, after="b" * 64):
    return {
        "id": "approve-cover-revision",
        "path": path,
        "action": action,
        "from_sha256": before,
        "to_sha256": after,
        "reason": "Reemplazo editorial aprobado para corregir el encuadre.",
        "reference": "Issue #95 / revisión visual"
    }


class ResourceChangeGateTests(unittest.TestCase):
    def evaluate(self, changed, baseline=EMPTY, current=EMPTY, before=None, after=None):
        before = before or (lambda _path: "a" * 64)
        after = after or (lambda _path: "b" * 64)
        return gate.evaluate_changes(POLICY, baseline, current, changed, before, after)

    def test_unapproved_image_change_fails_closed(self):
        errors = self.evaluate([("M", ["cover.jpg"])])
        self.assertTrue(any("Cambio sensible sin autorización previa" in item for item in errors), errors)

    def test_phase_a_accepts_only_append_to_authorization_ledger(self):
        proposed = {"schema_version": 1, "authorizations": [authorization()]}
        changed = [("M", ["data/resource-change-authorizations.json"])]
        errors = self.evaluate(
            changed, current=proposed,
            before=lambda path: "a" * 64 if path == "cover.jpg" else None
        )
        self.assertEqual(errors, [], errors)

    def test_phase_a_rejects_authorization_combined_with_resource_change(self):
        proposed = {"schema_version": 1, "authorizations": [authorization()]}
        changed = [
            ("M", ["data/resource-change-authorizations.json"]),
            ("M", ["cover.jpg"])
        ]
        errors = self.evaluate(
            changed, current=proposed,
            before=lambda path: "a" * 64 if path == "cover.jpg" else None
        )
        self.assertTrue(any("FASE A bloqueada" in item for item in errors), errors)

    def test_phase_b_accepts_only_the_exact_preapproved_hash_transition(self):
        approved = {"schema_version": 1, "authorizations": [authorization()]}
        errors = self.evaluate(
            [("M", ["cover.jpg"])],
            baseline=approved,
            current=approved,
            before=lambda _path: "a" * 64,
            after=lambda _path: "b" * 64
        )
        self.assertEqual(errors, [], errors)

    def test_phase_b_rejects_a_different_target_hash(self):
        approved = {"schema_version": 1, "authorizations": [authorization()]}
        errors = self.evaluate(
            [("M", ["cover.jpg"])],
            baseline=approved,
            current=approved,
            before=lambda _path: "a" * 64,
            after=lambda _path: "c" * 64
        )
        self.assertTrue(any("Cambio sensible sin autorización previa" in item for item in errors), errors)

    def test_new_asset_requires_an_add_authorization(self):
        approved = {"schema_version": 1, "authorizations": [
            authorization("new-cover.webp", "add", None, "b" * 64)
        ]}
        errors = self.evaluate(
            [("A", ["new-cover.webp"])],
            baseline=approved,
            current=approved,
            before=lambda _path: None,
            after=lambda _path: "b" * 64
        )
        self.assertEqual(errors, [], errors)

    def test_deletion_requires_a_preapproved_source_hash(self):
        approved = {"schema_version": 1, "authorizations": [
            authorization("old-cover.jpg", "delete", "a" * 64, None)
        ]}
        errors = self.evaluate(
            [("D", ["old-cover.jpg"])],
            baseline=approved,
            current=approved,
            before=lambda _path: "a" * 64,
            after=lambda _path: None
        )
        self.assertEqual(errors, [], errors)

    def test_routine_generated_data_is_allowed_under_existing_contract_checks(self):
        errors = self.evaluate(
            [("M", ["creator-metrics.json"])],
            before=lambda _path: "a" * 64,
            after=lambda _path: "b" * 64
        )
        self.assertEqual(errors, [], errors)

    def test_regular_code_changes_remain_subject_to_review_and_ci_not_extra_authorization(self):
        errors = self.evaluate(
            [("M", ["scripts/update_stats.py"])],
            before=lambda _path: "a" * 64,
            after=lambda _path: "b" * 64
        )
        self.assertEqual(errors, [], errors)

    def test_authorization_history_is_immutable(self):
        approved = {"schema_version": 1, "authorizations": [authorization()]}
        altered = {"schema_version": 1, "authorizations": []}
        errors = self.evaluate([], baseline=approved, current=altered)
        self.assertTrue(any("histórica modificada o eliminada" in item for item in errors), errors)

    def test_empty_ledger_bootstrap_is_allowed_with_initial_control_files(self):
        changed = [
            ("A", ["data/resource-change-authorizations.json"]),
            ("A", ["data/resource-protection-policy.json"]),
            ("M", [".github/workflows/validar-sitio.yml"]),
            ("A", ["scripts/check_resource_change_policy.py"])
        ]
        errors = self.evaluate(
            changed, baseline=EMPTY, current=EMPTY,
            before=lambda path: None if path == "data/resource-protection-policy.json" else "a" * 64
        )
        self.assertEqual(errors, [], errors)


class ResourceInventoryTests(unittest.TestCase):
    def evaluate(self, changed, baseline=EMPTY, current=EMPTY, before=None, after=None):
        before = before or (lambda _path: "a" * 64)
        after = after or (lambda _path: "b" * 64)
        return gate.evaluate_changes(POLICY, baseline, current, changed, before, after)

    def test_visual_assets_and_security_policy_require_explicit_authorization(self):
        for path in (
            "cover.jpg", "assets/heroes/akuma_dark.jpg", "styles.css", "index.html",
            "CODEOWNERS", "schemas/roster-data.schema.json", "data/resource-protection-policy.json"
        ):
            self.assertEqual(gate.classify(path, POLICY), "explicit_authorization")

    def test_policy_file_can_be_bootstrapped_once_but_not_changed_routinely(self):
        errors = self.evaluate(
            [("A", ["data/resource-protection-policy.json"])],
            before=lambda _path: None,
            after=lambda _path: "b" * 64
        )
        self.assertEqual(errors, [], errors)

        errors = self.evaluate(
            [("M", ["data/resource-protection-policy.json"])],
            before=lambda _path: "a" * 64,
            after=lambda _path: "b" * 64
        )
        self.assertTrue(any("Cambio sensible sin autorización previa" in item for item in errors), errors)

    def test_routine_data_and_reviewed_code_are_classified_separately(self):
        self.assertEqual(gate.classify("creator-metrics.json", POLICY), "routine_generated_data")
        self.assertEqual(gate.classify("scripts/update_stats.py", POLICY), "review_and_checks")

    def test_inventory_classification_matches_gate_for_policy_ledger_and_schemas(self):
        policy = {
            "policy_file": "data/resource-protection-policy.json",
            "authorization_file": "data/resource-change-authorizations.json",
            "explicit_paths": ["CODEOWNERS"],
            "explicit_patterns": ["schemas/**"],
            "explicit_extensions": [".svg", ".css"],
            "routine_generated_data": ["creator-metrics.json"],
            "review_required_patterns": ["scripts/**", "schemas/**"]
        }
        for path in (
            "data/resource-protection-policy.json",
            "data/resource-change-authorizations.json",
            "schemas/roster.schema.json",
            "CODEOWNERS",
            "cover.svg",
            "styles.css"
        ):
            self.assertEqual(inventory.change_policy(path, policy), "explicit_authorization")
        self.assertEqual(inventory.change_policy("creator-metrics.json", policy), "routine_generated_data")
        self.assertEqual(inventory.change_policy("scripts/update_stats.py", policy), "review_and_checks")

    def test_reference_scanner_links_an_asset_to_real_source_lines(self):
        sources = {
            "index.html": [
                '<img src="./assets/hero-cover.jpg" alt="Cover">',
                '<img src="./assets/hero-cover-small.jpg" alt="Small">'
            ]
        }
        refs = inventory.references_for("assets/hero-cover.jpg", sources, True)
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0]["source"], "index.html")
        self.assertEqual(refs[0]["line"], 1)
        self.assertEqual(refs[0]["token"], "assets/hero-cover.jpg")
        self.assertEqual(refs[0]["source_role"], "runtime_source")

    def test_reference_scanner_does_not_confuse_similar_basenames(self):
        sources = {"index.html": ['<img src="hero-cover-small.jpg">']}
        refs = inventory.references_for("hero-cover.jpg", sources, True)
        self.assertEqual(refs, [])

    def test_external_google_font_urls_exclude_test_and_workflow_examples(self):
        sources = {
            "index.html": [
                '<link rel="preconnect" href="https://fonts.googleapis.com">',
                '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
                '<link rel="preload" href="https://fonts.gstatic.com/s/bangers/v25/font.woff2">',
                '<link href="https://fonts.googleapis.com/css2?family=Bangers&display=optional">'
            ],
            "styles.css": ["h1 { font-family: 'Bangers', sans-serif; }"],
            "tests/test_resource_protection.py": [
                'fixture = "https://fonts.googleapis.com/css2?family=FakeTestFont"',
                'fixture = "https://fonts.gstatic.com/s/fake-test-font.woff2"'
            ],
            ".github/workflows/validar-sitio.yml": [
                'sample = "https://fonts.googleapis.com/css2?family=WorkflowFixture"'
            ],
            "docs/RESOURCE_PROTECTION.md": [
                'Example URL: https://fonts.googleapis.com/css2?family=DocumentationExample'
            ]
        }
        urls, families = inventory.external_resources(sources)
        self.assertEqual(len(urls), 2)
        self.assertEqual({item["source"] for item in urls}, {"index.html"})
        self.assertEqual({item["family"] for item in families}, {"Bangers"})

    def test_google_font_preconnect_hosts_are_not_listed_as_font_downloads(self):
        sources = {
            "index.html": [
                '<link rel="preconnect" href="https://fonts.googleapis.com">',
                '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            ]
        }
        urls, families = inventory.external_resources(sources)
        self.assertEqual(urls, [])
        self.assertEqual(families, [])

    def test_git_restore_rolls_back_an_asset_and_critical_data_fixture(self):
        import subprocess
        import tempfile

        def git(root, *args):
            return subprocess.run(
                ["git", "-C", str(root), *args],
                check=True, capture_output=True, text=True
            ).stdout.strip()

        with tempfile.TemporaryDirectory() as folder:
            repo = Path(folder)
            (repo / "data").mkdir()
            original_asset = b"approved-image-bytes"
            original_roster = b'{"heroes":[{"id":"akuma"}]}'
            (repo / "cover.jpg").write_bytes(original_asset)
            (repo / "data/roster.json").write_bytes(original_roster)
            git(repo, "init")
            git(repo, "config", "user.email", "base04-test@example.invalid")
            git(repo, "config", "user.name", "BASE-04 Test")
            git(repo, "add", "cover.jpg", "data/roster.json")
            git(repo, "commit", "-m", "approved baseline")
            baseline = git(repo, "rev-parse", "HEAD")

            (repo / "cover.jpg").write_bytes(b"unapproved-or-damaged-image")
            (repo / "data/roster.json").write_bytes(b'{"heroes":[]}')
            git(repo, "restore", "--source", baseline, "--", "cover.jpg", "data/roster.json")

            self.assertEqual((repo / "cover.jpg").read_bytes(), original_asset)
            self.assertEqual((repo / "data/roster.json").read_bytes(), original_roster)
            self.assertEqual(git(repo, "rev-parse", f"{baseline}:cover.jpg"), git(repo, "rev-parse", "HEAD:cover.jpg"))
            self.assertEqual(git(repo, "rev-parse", f"{baseline}:data/roster.json"), git(repo, "rev-parse", "HEAD:data/roster.json"))

    def test_resource_policy_workflow_is_part_of_required_site_validation(self):
        workflow = (ROOT / ".github/workflows/validar-sitio.yml").read_text(encoding="utf-8")
        self.assertIn("python scripts/check_resource_change_policy.py --base-ref origin/main --recovery-report", workflow)
        self.assertIn("python scripts/audit_resource_inventory.py --output reports/resource-inventory.json", workflow)
        self.assertIn("name: Publicar inventario canónico de recursos y referencias", workflow)

    def test_google_drive_backup_runs_on_main_for_base04_control_changes(self):
        workflow = (ROOT / ".github/workflows/independent-backup.yml").read_text(encoding="utf-8")
        self.assertIn("      - main", workflow)
        self.assertIn("'data/resource-protection-policy.json'", workflow)
        self.assertIn("'data/resource-change-authorizations.json'", workflow)
        self.assertIn("'docs/RESOURCE_PROTECTION.md'", workflow)
        for pattern in ("'**/*.json'", "'**/*.html'", "'**/*.css'", "'**/*.jpg'", "'**/*.png'", "'**/*.svg'", "'**/*.webp'", "'**/*.woff2'"):
            self.assertIn(pattern, workflow)
        self.assertIn("workflow_dispatch:", workflow)


if __name__ == "__main__":
    unittest.main()
