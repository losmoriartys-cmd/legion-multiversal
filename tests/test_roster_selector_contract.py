import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RosterCharacterSelectorContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "roster-selector.css").read_text(encoding="utf-8")
        cls.roster = json.loads((ROOT / "roster-data.json").read_text(encoding="utf-8"))
        start = cls.app.index("function renderRoster() {")
        end = cls.app.index("function renderCommercialQuickView(hero)", start)
        cls.active_renderer = cls.app[start:end]

    def test_all_eight_canonical_profiles_remain_the_source(self):
        heroes = self.roster["heroes"]
        self.assertEqual(len(heroes), 8)
        self.assertEqual(len({hero["id"] for hero in heroes}), 8)
        self.assertEqual(len({hero["slug"] for hero in heroes}), 8)
        self.assertIn("roster-data.json", self.app)

    def test_selector_is_the_only_active_roster_renderer(self):
        self.assertIn("renderRosterSelector();", self.active_renderer)
        self.assertNotIn("roster-grid", self.active_renderer)
        self.assertIn("function renderRosterSelector()", self.app)

    def test_selector_uses_existing_profiles_live_state_and_progress(self):
        self.assertIn("getRosterLiveState(hero)", self.app)
        self.assertIn("state?.fresh && state.channel?.live", self.app)
        self.assertIn("recordLegionProgress('profile'", self.app)
        self.assertIn("openHeroProfile(profileIndex", self.app)
        self.assertIn("getHeroRosterSlug(hero)", self.app)

    def test_keyboard_navigation_and_responsive_rail_are_present(self):
        for key in ("ArrowRight", "ArrowLeft", "event.key === 'Home'", "event.key === 'End'"):
            self.assertIn(key, self.app)
        self.assertIn("@media(max-width:900px)", self.css)
        self.assertIn("scroll-snap-type:x mandatory", self.css)

    def test_selector_mount_and_assets_are_loaded(self):
        home = self.html.index('<div id="roster-home">')
        mount = self.html.index('id="roster-selector"')
        self.assertGreater(mount, home)
        self.assertIn("roster-selector.css", self.html)
        self.assertIn("app.js?v=20261116-roster-selector-2", self.html)

    def test_comparator_does_not_publish_non_comparable_metrics(self):
        self.assertIn("MÉTRICAS COMPARABLES", self.app)
        self.assertIn('class="roster-selector-na">No disponible</td>', self.app)
        self.assertIn("metodología comparables para los ocho perfiles", self.app)

    def test_demo_live_simulation_is_not_in_production_selector(self):
        self.assertNotIn("simular directo", self.app)
        self.assertNotIn("new Set(['akuma','ardipii'])", self.app)

    def test_legacy_filters_and_grid_are_not_the_visible_entry_point(self):
        self.assertIn("#chapter-2 .roster-tools", self.css)
        self.assertIn("#chapter-2 #roster-container", self.css)
        self.assertIn("prefers-reduced-motion:reduce", self.css)


if __name__ == "__main__":
    unittest.main()
