import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RosterComicCardsContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "roster-selector.css").read_text(encoding="utf-8")
        cls.roster = json.loads((ROOT / "roster-data.json").read_text(encoding="utf-8"))

    def test_all_eight_canonical_profiles_remain_the_source(self):
        heroes = self.roster["heroes"]
        self.assertEqual(len(heroes), 8)
        self.assertEqual(len({hero["id"] for hero in heroes}), 8)
        self.assertEqual(len({hero["slug"] for hero in heroes}), 8)
        self.assertIn("roster-data.json", self.app)

    def test_roster_renders_all_cards_without_a_selected_profile_gate(self):
        start = self.app.index("function renderRosterSelector()")
        end = self.app.index("\nfunction selectRosterCreator", start)
        renderer = self.app[start:end]
        self.assertIn("heroesData.map((hero, index)", renderer)
        self.assertIn("comic-roster-grid", renderer)
        self.assertIn("data-roster-select", renderer)
        self.assertNotIn("roster-selector-panel", renderer)
        self.assertNotIn("roster-selector-rail", renderer)
        self.assertIn("openHeroProfile(Number(button.dataset.rosterSelect)", renderer)

    def test_cards_use_real_metrics_and_no_fixed_schedule(self):
        start = self.app.index("function renderRosterSelector()")
        end = self.app.index("\nfunction selectRosterCreator", start)
        renderer = self.app[start:end]
        self.assertIn("average_viewers_sampled", renderer)
        self.assertIn("status === 'verified'", renderer)
        self.assertIn("ACTIVO ESTA SEMANA", renderer)
        self.assertIn("7 * 24 * 60 * 60 * 1000", renderer)
        self.assertNotIn("hero.schedule", renderer)
        self.assertIn("Seguidores", renderer)
        self.assertIn("Media de viewers", renderer)

    def test_profile_opens_directly_as_a_35_65_bitacora(self):
        start = self.app.index("function openHeroProfile(")
        end = self.app.index("\nfunction navigateHeroProfile", start)
        profile = self.app[start:end]
        self.assertIn("hero-profile-reference-layout comic-profile-layout", profile)
        self.assertIn("hero-profile-sidebar", profile)
        self.assertIn("hero-profile-socials", profile)
        self.assertIn("renderHeroProfileTabs(hero)", profile)
        self.assertNotIn("ABRIR BITÁCORA COMPLETA", profile)
        self.assertNotIn("hero-profile-poster", profile)
        self.assertIn("setHeroProfileRoute", profile)

    def test_bitacora_is_a_tab_not_a_second_modal(self):
        start = self.app.index("function renderHeroProfileTabs")
        end = self.app.index("\nfunction activateHeroProfileTab", start)
        tabs = self.app[start:end]
        self.assertIn("['bitacora','BITÁCORA']", tabs)
        self.assertNotIn("['marcas','INTERÉS PARA MARCAS']", tabs)
        self.assertNotIn("ABRIR BITÁCORA COMPLETA", tabs)
        self.assertIn("brandHtml", tabs)

    def test_roster_is_chapter_two_after_origin_without_intermediate_selector(self):
        nav = self.html[self.html.index('<nav class="primary-navigation"'):self.html.index('</nav>', self.html.index('<nav class="primary-navigation"'))]
        self.assertLess(nav.index('data-chapter="1"'), nav.index('data-chapter="2"'))
        self.assertIn('>ORIGEN</button>', nav)
        self.assertIn('>ROSTER</button>', nav)
        self.assertIn('CAPÍTULO 01 · ORIGEN', self.html)
        self.assertIn('CAPÍTULO 02 · ROSTER', self.html)
        self.assertIn('CAPÍTULO 03 · ESTADÍSTICAS', self.html)
        self.assertIn('PILAR COMPLEMENTARIO · VALORES', self.html)
        self.assertIn('PILAR COMPLEMENTARIO · COMUNIDAD', self.html)
        self.assertIn('PILAR COMPLEMENTARIO · ALIANZAS', self.html)
        for chapter in ('11','9','8'):
            self.assertRegex(self.html, rf'<section[^>]*id="chapter-{chapter}"[^>]*data-pager="false"')

    def test_comic_styles_are_responsive_and_respect_reduced_motion(self):
        self.assertIn(".comic-roster-grid", self.css)
        self.assertIn("grid-template-columns:repeat(4,minmax(0,1fr))", self.css)
        self.assertIn("grid-template-columns:repeat(2,minmax(0,1fr))", self.css)
        self.assertIn("grid-template-columns:minmax(260px,35%) minmax(0,65%)", self.css)
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.css)

    def test_selector_mount_and_assets_are_loaded(self):
        self.assertIn('id="roster-selector"', self.html)
        self.assertIn("roster-selector.css?v=20261117-comic-cards-1", self.html)
        self.assertIn("function renderRosterSelector()", self.app)

    def test_global_navigation_and_legacy_routes_remain_supported(self):
        self.assertIn("setHeroProfileRoute", self.app)
        self.assertIn("hash.startsWith('#roster/')", self.app)
        self.assertIn("document.addEventListener('DOMContentLoaded', initializeLegionApp", self.app)
        self.assertNotIn("window.onload", self.app)

    def test_no_demo_live_simulation_is_introduced(self):
        self.assertNotIn("simular directo", self.app)
        self.assertNotIn("new Set(['akuma','ardipii'])", self.app)


if __name__ == "__main__":
    unittest.main()
