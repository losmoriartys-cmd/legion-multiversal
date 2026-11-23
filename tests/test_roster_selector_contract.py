import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RosterComicCardsContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.brand_model = (ROOT / "roster-brand-model.js").read_text(encoding="utf-8")
        cls.social_links = (ROOT / "social-links.js").read_text(encoding="utf-8")
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "roster-selector.css").read_text(encoding="utf-8")
        cls.roster = json.loads((ROOT / "data/roster.json").read_text(encoding="utf-8"))
        cls.roster_schema = json.loads((ROOT / "schemas/roster-data.schema.json").read_text(encoding="utf-8"))
        cls.creator_records = json.loads((ROOT / "data/creator-records.json").read_text(encoding="utf-8"))

    def test_all_eight_canonical_profiles_remain_the_source(self):
        heroes = self.roster["heroes"]
        self.assertEqual(len(heroes), 8)
        self.assertEqual(len({hero["id"] for hero in heroes}), 8)
        self.assertEqual(len({hero["slug"] for hero in heroes}), 8)
        self.assertIn("data/roster.json", self.app)

    def test_each_card_uses_approved_art_and_keeps_identity_portraits(self):
        expected_art = {
            "moriartys": "Cyberpunk_Cyborg_Portrait-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "rod3r1k": "Superhero_Camera_Portrait-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "lady-moriarty": "Red_Haired_Mystic_Witch-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "ardipii": "Hooded_Atomic_Figure-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "akuma": "image_20261117_045605.jpg",
            "dave-nexus": "Purple_Cyberpunk_Warrior-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "pato-oratoris": "Bald_Man_In_Gold_Armor-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "habitos": "Sci_Fi_Superhero_Portrait-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
        }
        heroes = {hero["id"]: hero for hero in self.roster["heroes"]}
        self.assertEqual({hero_id: hero["img"] for hero_id, hero in heroes.items()}, expected_art)
        for hero in heroes.values():
            self.assertTrue(hero["portrait"].startswith("assets/carnet/"))
            self.assertNotEqual(hero["portrait"], hero["img"])
            self.assertTrue((ROOT / hero["portrait"]).is_file())
        for artwork in expected_art.values():
            self.assertTrue((ROOT / artwork).is_file())

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

    def test_cards_keep_character_art_separate_from_dossier_portraits(self):
        start = self.app.index("function renderRosterSelector()")
        end = self.app.index("\nfunction selectRosterCreator", start)
        renderer = self.app[start:end]
        self.assertIn("hero.portrait ?", renderer)
        self.assertIn('alt="Fotografía carnet de ', renderer)
        self.assertIn("hero.portrait", renderer)
        self.assertNotIn("hero.img ?", renderer)
        self.assertIn("const portrait = hero.portrait || hero.img || ''", self.app)
        self.assertNotIn("const characterArt = hero.fullbody || hero.img", self.app)
        self.assertNotIn("hero-profile-character-art", self.app)
        self.assertNotIn("hero-profile-internal-art", self.app)
        self.assertIn("hero-profile-character-card-link", self.app)

    def test_each_dossier_has_a_distinct_full_body_character_asset(self):
        expected_fullbody = {
            "moriartys": "Cyberpunk_Cyborg_Portrait-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "rod3r1k": "Superhero_Camera_Portrait-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "lady-moriarty": "Red_Haired_Mystic_Witch-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "ardipii": "Hooded_Atomic_Figure-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "akuma": "image_20261117_045605.jpg",
            "dave-nexus": "Purple_Cyberpunk_Warrior-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "pato-oratoris": "Bald_Man_In_Gold_Armor-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
            "habitos": "Sci_Fi_Superhero_Portrait-hay-muchas-que-dejaron-de-ser-animadas-la-idea-es.jpg",
        }
        expected_cards = {
            "moriartys": "assets/heroes/moriartys_dark.jpg",
            "rod3r1k": "assets/heroes/rod3r1k_dark.webp",
            "lady-moriarty": "assets/heroes/ladymoriarty_dark.jpg",
            "ardipii": "assets/heroes/ardipii_dark.webp",
            "akuma": "assets/heroes/akuma_dark.jpg",
            "dave-nexus": "assets/heroes/nexus_dark.webp",
            "pato-oratoris": "assets/heroes/oratoris_dark.webp",
            "habitos": "assets/heroes/habitos_dark.webp",
        }
        heroes = {hero["id"]: hero for hero in self.roster["heroes"]}
        self.assertEqual({hero_id: hero["fullbody"] for hero_id, hero in heroes.items()}, expected_fullbody)
        self.assertEqual({hero_id: hero["character_card"] for hero_id, hero in heroes.items()}, expected_cards)
        for asset in [*expected_fullbody.values(), *expected_cards.values()]:
            self.assertTrue((ROOT / asset).is_file())
        # Full-body and character-card assets stay out of the main dossier canvas.
        self.assertNotIn("hero.fullbody || hero.img", self.app)
        self.assertNotIn("hero-profile-character-art", self.app)
        self.assertIn("(hero.character_card ? '<section class=\"hero-profile-character-card-link\"", self.app)
        self.assertIn("VER CARTA COMPLETA", self.app)
        self.assertIn("openHeroModal(' + index + ')", self.app)

    def test_cards_use_normalized_metrics_as_the_commercial_source_of_truth(self):
        start = self.app.index("function renderRosterSelector()")
        end = self.app.index("\nfunction selectRosterCreator", start)
        renderer = self.app[start:end]
        context = self.app.split("function getRosterBrandContext", 1)[1].split("function normalizedMetricSlotDetail", 1)[0]
        slots = self.app.split("function getRosterBrandSlots", 1)[1].split("function renderRosterBrandSlots", 1)[0]
        self.assertIn("getRosterBrandContext(hero, channel, account)", renderer)
        self.assertIn("renderRosterBrandSlots(hero, brandContext)", renderer)
        self.assertIn("renderSocialIcons(hero)", renderer)
        self.assertIn("hero.tagline", renderer)
        self.assertNotIn("hero.role_label || platformName", renderer)
        self.assertIn("metric('average_viewers_sampled')", context)
        self.assertIn("metric('observed_live_hours')", context)
        self.assertIn("metric('streams_observed')", context)
        self.assertIn("metric('subscribers')", context)
        self.assertIn("metric('total_views')", context)
        self.assertIn("metric('videos_total')", context)
        self.assertNotIn("getCreatorAudienceMetric(hero)", context)
        self.assertNotIn("getCreatorAudienceMetric", self.app)
        self.assertIn("normalizedMetricValue", slots)
        self.assertIn("normalizedMetricSlotDetail", slots)
        self.assertIn("comic-roster-stat-average", self.app)
        self.assertIn("comic-roster-stat-activity", self.app)
        self.assertNotIn("window.LMBrand.cardSlots", self.app)
        self.assertIn("window.LMBrand.computeRhythm", self.app)
        self.assertIn("last_published", context)
        self.assertNotIn("RITMO: EN SEGUIMIENTO", renderer)
        self.assertIn("getNormalizedLiveStatus(hero)", renderer)
        self.assertNotIn("getRosterLiveState(hero)", renderer)
        self.assertNotIn("hero.schedule", renderer)
        self.assertIn("SIN DATOS SUFICIENTES", self.brand_model)
        self.assertIn("MIN_SAMPLES = 20", self.brand_model)
        self.assertIn("MIN_SPAN_DAYS = 14", self.brand_model)
        self.assertIn("WINDOW_DAYS = 28", self.brand_model)
        self.assertIn("creator-metrics.json", (ROOT / "creator-profile-core.js").read_text(encoding="utf-8"))

    def test_roster_schema_declares_confirmed_social_platforms(self):
        properties = self.roster_schema["properties"]["heroes"]["items"]["properties"]
        socials = properties["socials"]
        self.assertFalse(socials["additionalProperties"])
        self.assertEqual(set(socials["properties"]), {"twitch", "youtube", "instagram", "tiktok", "facebook"})
        for hero in self.roster["heroes"]:
            for platform, url in hero.get("socials", {}).items():
                self.assertRegex(url, socials["properties"][platform]["pattern"])
        self.assertIn("Beacons", properties["links"]["description"])
        self.assertIn("link_hub", self.roster["heroes"][1]["links"][0]["platform"])

    def test_confirmed_social_accounts_are_added_without_guessing_or_cross_domain_links(self):
        heroes = {hero["id"]: hero for hero in self.roster["heroes"]}
        project_socials = {
            "youtube": "https://www.youtube.com/@LosMoriartys",
            "tiktok": "https://www.tiktok.com/@losmoriartys",
            "instagram": "https://www.instagram.com/losmoriartys/",
        }
        self.assertEqual(heroes["moriartys"]["socials"], project_socials)
        self.assertEqual(heroes["lady-moriarty"]["socials"], project_socials)
        self.assertEqual(heroes["ardipii"]["socials"]["instagram"], "https://www.instagram.com/_ardipii_/")
        self.assertEqual(heroes["ardipii"]["socials"]["tiktok"], "https://www.tiktok.com/@ardipii")
        self.assertEqual(heroes["ardipii"]["socials"]["youtube"], "https://www.youtube.com/@ArDiPi")
        self.assertEqual(heroes["akuma"]["socials"]["instagram"], "https://www.instagram.com/akuma.zoldyck/")
        self.assertEqual(heroes["akuma"]["socials"]["youtube"], "https://youtube.com/@akuma.zoldyck")
        self.assertEqual(heroes["akuma"]["socials"]["tiktok"], "https://www.tiktok.com/@akumazoldyck")
        self.assertEqual(set(heroes["habitos"]["socials"]), {"instagram", "facebook", "tiktok"})
        self.assertEqual(heroes["rod3r1k"]["links"][0], {"platform": "link_hub", "url": "https://beacons.ai/ther0d3r1k"})
        self.assertIn("url.protocol !== 'https:'", self.social_links)
        self.assertIn("host.endsWith('.' + domain)", self.social_links)
        self.assertIn("TODOS MIS ENLACES", self.social_links)
        self.assertIn("facebook", self.social_links)
        self.assertIn("cafecito", self.social_links)

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
        self.assertIn('data-bitacora-view="marcas"', tabs)
        self.assertIn(">PROPUESTA COMERCIAL</button>", tabs)
        self.assertEqual(tabs.count("data-profile-tab="), 1)
        bitacora = tabs[tabs.index('id="profile-tab-bitacora"'):]
        self.assertIn('id="bitacora-panel-marcas"', bitacora)
        self.assertIn("renderHeroBrandSummary(hero)", bitacora)
        self.assertIn("renderHeroTimeline(hero,record)", tabs)
        self.assertNotIn("['marcas','INTERÉS PARA MARCAS']", tabs)
        self.assertNotIn("ABRIR BITÁCORA COMPLETA", tabs)
        self.assertIn("renderHeroBrandSummary(hero)", self.app)
        self.assertIn("hero-profile-brand-summary", self.app)
        self.assertIn("data-creator-proposal", self.app)
        contact_forms = (ROOT / "contact-forms.js").read_text(encoding="utf-8")
        self.assertIn("Perfil de interés:", contact_forms)
        self.assertIn("PROPONER UNA COLABORACIÓN", self.app)

    def test_growth_chapter_exposes_periods_content_collaborations_and_consent(self):
        self.assertIn("function renderGrowthWindowPanel", self.app)
        self.assertIn("data-growth-window", self.app)
        self.assertIn("data-growth-panel", self.app)
        self.assertIn("function renderGrowthContentPerformance", self.app)
        self.assertIn("function renderGrowthCollaborations", self.app)
        self.assertIn("function renderGrowthAdvancedAudience", self.app)
        self.assertIn("No hay datos privados autorizados para publicar", self.app)
        self.assertIn("DATO APORTADO POR EL CREADOR", self.app)
        self.assertIn("No se suman audiencias entre canales", self.app)
        for selector in (
            ".hero-growth-window-tabs",
            ".hero-growth-comparison",
            ".hero-growth-content-card",
            ".hero-growth-case",
            ".hero-growth-audience",
        ):
            self.assertIn(selector, self.css)

    def test_community_bitacora_mission_tracks_the_individual_dossier_tab(self):
        self.assertIn("button.dataset.profileTab==='bitacora'", self.app)
        playbook = json.loads((ROOT / "community-playbook.json").read_text(encoding="utf-8"))
        mission = next(item for item in playbook["missions"] if item["id"] == "bitacora")
        achievement = next(item for item in playbook["achievements"] if item["id"] == "cronista")
        self.assertIn("expediente", mission["title"].lower())
        self.assertIn("pestaña Bitácora", mission["description"])
        self.assertIn("expedientes", achievement["title"].lower())

    def test_dossier_visibility_rules_replace_roster_instead_of_appending_below(self):
        css = (ROOT / "roster-selector.css").read_text(encoding="utf-8")
        self.assertIn("#chapter-2 #roster-home[hidden]", css)
        self.assertIn("#chapter-2 #hero-profile-page[hidden]", css)
        self.assertIn("#chapter-2 .roster-selector-panel.is-active{display:block!important}", css)
        self.assertNotIn(".roster-selector-panel,#chapter-2 .roster-selector-progress,#chapter-2 .roster-selector-comparator,#chapter-2 .roster-selector-method{display:none!important}", css)
        self.assertIn("page.classList.add('is-active')", self.app)
        self.assertIn("page.classList.remove('is-active')", self.app)

    def test_dossier_stats_use_source_dashboard_and_clips_are_limited(self):
        self.assertIn("function renderCommercialQuickView(hero)", self.app)
        self.assertNotIn("renderCommercialQuickView(hero)", self.app.split("function renderHeroProfileTabs", 1)[1].split("function activateHeroProfileTab", 1)[0])
        self.assertIn("renderStatsDashboard(hero,channel,sullyChannel)", self.app)
        self.assertIn("clips.slice(0,4)", self.app)
        self.assertIn("MÁS JUGADO · ", self.app)
        self.assertIn("getMostPlayedGames(hero,channel,sullyChannel)", self.app)
        self.assertIn("JUEGOS Y RITMO", self.app)
        self.assertNotIn("JUEGO RECIENTE · ", self.app)
        self.assertNotIn("observaciones recientes", self.app)
        self.assertIn("average_viewers_sampled", self.app)
        self.assertIn("peak_viewers_sampled", self.app)
        self.assertIn("observed_live_hours", self.app)
        start = self.app.index("function renderHeroProfileTabs")
        end = self.app.index("\nfunction activateHeroProfileTab", start)
        tabs = self.app[start:end]
        self.assertIn('''id="profile-tab-perfil" role="tabpanel">'+overview''', tabs)
        self.assertIn("hero-profile-epic-codes", tabs)
        self.assertIn("renderEpicCreatorCodeCard", tabs)
        self.assertIn("renderHeroBrandSummary(hero)+brandHtml+((hero.id", tabs)
        self.assertNotIn('''id="profile-tab-perfil" role="tabpanel">'+overview+brandHtml''', tabs)

    def test_stats_dashboard_preserves_missing_sources_without_inventing_values(self):
        start = self.app.index("function renderStatsDashboard(")
        end = self.app.index("\nfunction renderAutomaticTwitchClips", start)
        renderer = self.app[start:end]
        self.assertIn("Object.entries(platformProfile.platforms)", renderer)
        self.assertIn("if(p.status!=='verified')return;", renderer)
        self.assertIn("sources.push(card)", renderer)
        self.assertIn("followers_total", renderer)
        self.assertIn("if(!cards.length)return '';", self.app)
        self.assertIn("item.value!==null", self.app)
        self.assertNotIn("renderStatsSourceDetails('TWITCH HELIX'", renderer)
        self.assertNotIn("renderStatsSourceDetails('SULLYGNOME'", renderer)
        self.assertNotIn("renderStatsSourceDetails('TWITCHMETRICS'", renderer)
        self.assertIn("stats-executive-empty", renderer)
        self.assertIn("function renderPlatformStats(hero,onlyPlatform=null)", self.app)

    def test_only_one_roster_directory_remains_in_the_chapter(self):
        self.assertIn('id="roster-selector"', self.html)
        self.assertIn('id="roster"', self.html)
        self.assertNotIn('id="roster-container"', self.html)
        self.assertNotIn('class="roster-tools"', self.html)
        self.assertNotIn('class="roster-product-nav"', self.html)
        self.assertIn("ARCHIVO CENTRAL · CAPÍTULO 03", self.app)

    def test_roster_is_chapter_three_after_who_we_are(self):
        nav = self.html[self.html.index('<nav class="primary-navigation"'):self.html.index('</nav>', self.html.index('<nav class="primary-navigation"'))]
        self.assertLess(nav.index('data-chapter="11"'), nav.index('data-chapter="2"'))
        self.assertLess(nav.index('data-chapter="1"'), nav.index('data-chapter="11"'))
        self.assertIn('>ORIGEN</button>', nav)
        self.assertIn('>QUIÉNES SOMOS</button>', nav)
        self.assertIn('>ROSTER</button>', nav)
        for label in (
            'CAPÍTULO 01 · ORIGEN', 'CAPÍTULO 02 · QUIÉNES SOMOS',
            'CAPÍTULO 03 · ROSTER', 'CAPÍTULO 04 · ESTADÍSTICAS',
            'CAPÍTULO 05 · COMUNIDAD', 'CAPÍTULO 06 · ALIANZAS',
            'CAPÍTULO 07 · COLABORACIONES',
            'CAPÍTULO 08 · EN VIVO', 'CAPÍTULO 09 · RECLUTAMIENTO',
        ):
            self.assertIn(label, self.html)
        self.assertNotIn('PILAR COMPLEMENTARIO', self.html)
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
        self.assertIn("roster-selector.css?v=20261119-brand-consistency-1", self.html)
        self.assertIn("social-links.css?v=20261119-social-links-1", self.html)
        self.assertIn("roster-brand-model.js?v=20261119-brand-model-1", self.html)
        self.assertIn("social-links.js?v=20261119-social-links-1", self.html)
        self.assertIn("contact-forms.js?v=20261119-brand-proposal-1", self.html)
        self.assertIn("function renderRosterSelector()", self.app)

    def test_global_navigation_and_legacy_routes_remain_supported(self):
        self.assertIn("setHeroProfileRoute", self.app)
        self.assertIn("hash.startsWith('#roster/')", self.app)
        self.assertIn("document.addEventListener('DOMContentLoaded', initializeLegionApp", self.app)
        self.assertNotIn("window.onload", self.app)

    def test_no_demo_live_simulation_is_introduced(self):
        self.assertNotIn("simular directo", self.app)
        self.assertNotIn("new Set(['akuma','ardipii'])", self.app)


    def test_approved_dossier_directive_is_kept_in_repository(self):
        directive = (ROOT / "DIRECTIVA_ROSTER_EXPEDIENTES.md").read_text(encoding="utf-8")
        for criterion in ("Pato / Oratoris", "4 clips por streamer", "Bitácora", "Lurkit", "Keymailer", "mejor juego", "cabecera global"):
            self.assertIn(criterion, directive)

    def test_profile_chapters_follow_directiva_without_duplicates(self):
        start = self.app.index("function renderHeroProfileTabs")
        end = self.app.index("\nfunction activateHeroProfileTab", start)
        tabs = self.app[start:end]
        profile = tabs[tabs.index('id="profile-tab-perfil"'):tabs.index('id="profile-tab-estadisticas"')]
        bitacora = tabs[tabs.index('id="profile-tab-bitacora"'):]
        self.assertNotIn("brandHtml", profile)
        self.assertIn("renderStatsDashboard(hero,channel,sullyChannel)", tabs)
        for source_renderer in ("renderHelixDashboard", "renderSullyStats", "renderTwitchMetricsStats", "renderPlatformStats"):
            self.assertIn(source_renderer, self.app)
        self.assertIn("clips.slice(0,4)", tabs)
        self.assertNotIn("muestras observadas", tabs.lower())
        self.assertIn("CAPTURAS EN DIRECTO", self.app)
        self.assertIn("hero-profile-character-card-link", self.app)
        self.assertIn("window.LMSocial?.renderSocialButtons(hero)", self.app)
        self.assertIn("href=\"#brand-proposal\"", self.app)
        self.assertIn("const found = new Map()", self.social_links)
        self.assertIn("found.has(platform)", self.social_links)
        self.assertIn("ORDER.filter(platform => found.has(platform))", self.social_links)
        for profile_id in ("lady-moriarty", "rod3r1k", "akuma", "habitos"):
            collaborations = self.creator_records["channels"][profile_id]["collaborations"]
            titles = {item["title"] for item in collaborations}
            self.assertIn("Acceso a keys · Lurkit", titles)
            self.assertIn("Acceso a keys · Keymailer", titles)
        self.assertIn("hero-profile-epic-codes", bitacora)
        self.assertNotIn("renderCommercialQuickView(hero)", bitacora)



if __name__ == "__main__":
    unittest.main()

    def test_canonical_name_registry_covers_all_eight_profiles(self):
        import json
        roster = json.loads((ROOT / "data/roster.json").read_text(encoding="utf-8"))
        registry = roster["name_registry"]
        self.assertEqual(len(registry), 8)
        expected = {
            "rod3r1k": ("ROD3R1K", "TheR0D3R1K", "EL FUERTE", "ROD3RIK"),
            "lady-moriarty": ("LADY MORIARTY", "ladymoriarty01", "LA BRUJA", "LADYMORIARTY"),
            "ardipii": ("ARDIPII", "ardipii", "EL FANTASMA", "Ardipi"),
            "pato-oratoris": ("PATO — ORATORIS", "@patoteexplica", "EL ORADOR", "Patoexpone"),
            "moriartys": ("LOS MORIARTYS", "losmoriartys", "EL ESTRATEGA", "LOS MORIARTYS"),
        }
        for creator_id, values in expected.items():
            identity = registry[creator_id]
            self.assertEqual((identity["display_name"], identity["username"], identity["character_alias"]), values[:3])
            self.assertIn(values[3], identity["variants"])
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        media_kit = (ROOT / "brand-media-kit.js").read_text(encoding="utf-8")
        self.assertIn("creatorNameRegistry = payload.name_registry || {}", app)
        self.assertIn("function getCanonicalCreatorName(value)", app)
        self.assertIn('rosterData.name_registry?.[id]?.display_name', media_kit)

    def test_roster_initial_state_is_skeleton_with_descriptive_noscript_fallback(self):
        self.assertNotIn("CARGANDO LOS OCHO EXPEDIENTES", self.html)
        self.assertIn('class="roster-skeleton-grid"', self.html)
        fallback = self.html.split("<!-- ROSTER_NOSCRIPT_LINKS:START -->", 1)[1].split("<!-- ROSTER_NOSCRIPT_LINKS:END -->", 1)[0]
        for label in ("DIRECCIÓN", "DOCENTE", "ESTUDIANTE", "COLABORADOR", "IRL"):
            self.assertNotIn(label, fallback)
        self.assertIn("just chatting y juegos retro", fallback)
        self.assertIn("nueva etapa", fallback)
        self.assertIn("divulgación, programación y charlas motivacionales", fallback)

    def test_profile_modal_uses_individual_language_and_editorial_tabs(self):
        self.assertIn("EXPEDIENTE INDIVIDUAL", self.html)
        self.assertIn("QUIÉN ES Y QUÉ OFRECE", self.html)
        self.assertNotIn("EXPEDIENTE DE HÉROE", self.html)
        self.assertNotIn("QUIÉNES SOMOS Y QUÉ OFRECEMOS", self.html)
        self.assertIn('>PERFIL Y CONTENIDO</button>', self.html)
        self.assertIn('>AUDIENCIA Y ESTADÍSTICAS</button>', self.html)
        self.assertIn('>TRAYECTORIA Y COLABORACIONES</button>', self.html)

    def test_bitacora_is_linked_from_roster_and_collaborations(self):
        self.assertEqual(self.html.count('href="./bitacora-preview.html"'), 2)
        self.assertIn("ABRIR BITÁCORA GENERAL (VISTA PREVIA)", self.html)
        self.assertIn("EXPLORAR BITÁCORA GENERAL (VISTA PREVIA)", self.html)
