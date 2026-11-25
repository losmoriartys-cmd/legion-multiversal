"""Keep required GitHub status-check names stable for main protection."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"


def section(text: str, name: str) -> str:
    start = re.search(rf"(?m)^  {re.escape(name)}:\s*$", text)
    if not start:
        raise AssertionError(f"No se encontró la sección {name!r}.")
    next_section = re.search(r"(?m)^  [A-Za-z_][A-Za-z0-9_-]*:\s*$", text[start.end():])
    end = start.end() + next_section.start() if next_section else len(text)
    return text[start.end():end]


def has_main_branch_filter(text: str, event: str) -> bool:
    block = section(text, event)
    return bool(re.search(r"(?m)^    branches:\s*\n      - main\s*$", block))


class BranchProtectionPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.site = (WORKFLOWS / "validar-sitio.yml").read_text(encoding="utf-8")
        cls.stats = (WORKFLOWS / "test-stats.yml").read_text(encoding="utf-8")
        cls.audit = (WORKFLOWS / "audit-public-links.yml").read_text(encoding="utf-8")
        cls.policy = (ROOT / "docs" / "BRANCH_PROTECTION.md").read_text(encoding="utf-8")

    def test_required_status_check_jobs_exist_with_exact_names(self):
        self.assertIn("  validar:\n", self.site)
        self.assertIn("  python-tests:\n", self.stats)
        self.assertIn("  audit-public-links:\n", self.audit)
        for name in ("validar", "python-tests", "audit-public-links"):
            self.assertIn(f"`{name}`", self.policy)

    def test_site_validation_push_only_targets_main(self):
        self.assertTrue(has_main_branch_filter(self.site, "push"))

    def test_site_validation_runs_on_every_pull_request_to_main(self):
        block = section(self.site, "pull_request")
        self.assertTrue(has_main_branch_filter(self.site, "pull_request"))
        self.assertNotIn("paths:", block)

    def test_stats_workflow_runs_for_main_push_and_every_main_pull_request(self):
        self.assertTrue(has_main_branch_filter(self.stats, "push"))
        block = section(self.stats, "pull_request")
        self.assertTrue(has_main_branch_filter(self.stats, "pull_request"))
        self.assertNotIn("paths:", block)

    def test_external_link_audit_runs_for_every_main_pull_request_and_schedule(self):
        block = section(self.audit, "pull_request")
        self.assertTrue(has_main_branch_filter(self.audit, "pull_request"))
        self.assertNotIn("paths:", block)
        self.assertIn("  workflow_dispatch:\n", self.audit)
        self.assertIn("  schedule:\n", self.audit)

    def test_all_workflow_changes_are_in_scope_for_validation(self):
        self.assertIn("- '.github/workflows/**'", self.site)
        self.assertIn("- '.github/workflows/**'", self.stats)


if __name__ == "__main__":
    unittest.main()
