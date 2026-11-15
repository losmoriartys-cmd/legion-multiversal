"""Static accessibility and interaction contracts for the Roster dossier."""
from __future__ import annotations
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class MarkupIndex(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.nodes = []
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))


class RosterAccessibilityContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.js = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")
        parser = MarkupIndex()
        parser.feed(cls.html)
        cls.nodes = parser.nodes
        cls.by_id = {}
        for tag, attrs in cls.nodes:
            identifier = attrs.get("id")
            if identifier:
                cls.by_id.setdefault(identifier, []).append((tag, attrs))

    def test_dialog_has_accessible_name_and_modal_semantics(self):
        dialog = self.by_id.get("hero-modal", [])
        self.assertEqual(len(dialog), 1)
        attrs = dialog[0][1]
        self.assertEqual(attrs.get("role"), "dialog")
        self.assertEqual(attrs.get("aria-modal"), "true")
        self.assertIn(attrs.get("aria-labelledby"), self.by_id)

    def test_three_tabs_reference_three_tabpanels(self):
        tabs = [attrs for _, attrs in self.nodes if attrs.get("role") == "tab"]
        panels = [attrs for _, attrs in self.nodes if attrs.get("role") == "tabpanel"]
        self.assertEqual(len(tabs), 3)
        self.assertEqual(len(panels), 3)
        tab_ids = {attrs.get("id") for attrs in tabs}
        panel_ids = {attrs.get("id") for attrs in panels}
        for tab in tabs:
            self.assertIn(tab.get("aria-controls"), panel_ids)
        for panel in panels:
            self.assertIn(panel.get("aria-labelledby"), tab_ids)

    def test_print_action_is_wired_to_complete_dossier(self):
        button = self.by_id.get("modal-print-btn", [])
        self.assertEqual(len(button), 1)
        self.assertEqual(button[0][1].get("onclick"), "printHeroDossier()")
        self.assertIn("function printHeroDossier()", self.js)
        self.assertIn("panes.forEach(pane=>{pane.hidden=false;})", self.js)
        self.assertIn("@media print", self.css)
        self.assertIn("#hero-modal .modal-tab-pane[hidden]", self.css)

    def test_background_is_inert_and_restored(self):
        self.assertIn("function setModalBackgroundInert(active)", self.js)
        self.assertIn("element.inert=true", self.js)
        self.assertIn("element.setAttribute('aria-hidden','true')", self.js)
        self.assertIn("setModalBackgroundInert(true)", self.js)
        self.assertIn("setModalBackgroundInert(false)", self.js)

    def test_canonical_names_are_rendered_without_changing_internal_ids(self):
        self.assertIn("function getHeroDisplayName(hero)", self.js)
        self.assertIn("hero?.display_name || hero?.name", self.js)
        self.assertIn("escapeStatsHtml(getHeroDisplayName(hero))", self.js)

    def test_no_script_directory_is_a_generated_block(self):
        self.assertEqual(self.html.count("<!-- ROSTER_NOSCRIPT_LINKS:START -->"), 1)
        self.assertEqual(self.html.count("<!-- ROSTER_NOSCRIPT_LINKS:END -->"), 1)
        self.assertIn("scripts/render_roster_noscript.py --check", (
            ROOT / ".github/workflows/validar-sitio.yml"
        ).read_text(encoding="utf-8"))

    def test_clip_section_remains_separate_from_editorial_records(self):
        self.assertIn("function renderAutomaticTwitchClips(hero)", self.js)
        self.assertIn("creatorRecordsData", self.js)
        self.assertIn("twitchClipsData", self.js)
        self.assertIn("CLIPS PÚBLICOS DETECTADOS", self.js)
        self.assertIn("La selección automática no reemplaza", self.js)

    def test_creator_records_use_canonical_roster_ids(self):
        self.assertIn("function getCreatorRecord(hero)", self.js)
        self.assertIn("return hero?.id || hero?.slug || '';", self.js)
        legacy_record_lookups = (
            "creatorRecordsData?.channels?.losmoriartys",
            "creatorRecordsData?.channels?.ladymoriarty01",
            "creatorRecordsData?.channels?.ther0d3r1k",
            "creatorRecordsData?.channels?.habitos_atomicos",
            "creatorRecordsData?.channels?.akumazoldyck",
            "creatorRecordsData?.channels?.daved0608",
            "creatorRecordsData?.channels?.patoteexplica",
        )
        for lookup in legacy_record_lookups:
            self.assertNotIn(lookup, self.js)
        moriartys_page = (ROOT / "roster-02-moriartys.html").read_text(encoding="utf-8")
        self.assertIn("records.channels?.[hero.id]", moriartys_page)
        self.assertNotIn("records.channels?.losmoriartys", moriartys_page)

    def test_roster_error_has_a_real_retry_control(self):
        self.assertIn("function renderRosterLoadError(error)", self.js)
        self.assertIn("roster-load-retry", self.js)
        self.assertIn("await loadRosterData()", self.js)


if __name__ == "__main__":
    unittest.main()
