import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


class ValuesChapterContractTests(unittest.TestCase):
    def test_values_chapter_has_accessible_hero(self):
        self.assertEqual(HTML.count('id="chapter-11"'), 1)
        self.assertIn('aria-labelledby="manifesto-title"', HTML)
        self.assertIn('id="manifesto-title"', HTML)
        self.assertIn('data-editorial-number="2"', HTML)
        self.assertIn("CAPÍTULO 02 · QUIÉNES SOMOS", HTML)

    def test_six_values_are_preserved(self):
        section = re.search(r'<section id="chapter-11"(.*?)<section id="chapter-9"', HTML, re.S)
        self.assertIsNotNone(section)
        for value in (
            "IDENTIDAD PROPIA", "COMPAÑERISMO REAL", "RESPETO Y CONFIANZA",
            "LIBERTAD PARA CREAR", "CRECER EN EQUIPO", "HONESTIDAD CON LA COMUNIDAD",
        ):
            self.assertIn(value, section.group(1))

    def test_manifesto_has_three_observable_practices(self):
        for phrase in ("ACUERDOS CLAROS", "RESPETO Y AUTORÍA", "TRANSPARENCIA Y APRENDIZAJE"):
            self.assertIn(phrase, HTML)

    def test_history_and_onboarding_are_present_without_invented_dates(self):
        section = re.search(r'<section id="chapter-11"(.*?)<section id="chapter-9"', HTML, re.S).group(1)
        for phrase in ("S3X-MEN", "LEGIÓN MULTIVERSAL", "CONOCER", "PROBAR", "DOCUMENTAR",
                       "LO QUE OFRECEMOS", "LO QUE NO PROMETEMOS", "participación es voluntaria"):
            self.assertIn(phrase, section)
        self.assertNotRegex(section, r"20\d{2}[-/]\d{1,2}")

    def test_phase_tabs_have_accessible_relationships(self):
        section = HTML.split('<section id="chapter-11"', 1)[1].split('<section id="chapter-9"', 1)[0]
        for phase in ("before", "during", "after"):
            self.assertIn('data-manifesto-tab="' + phase + '"', section)
            self.assertIn('data-manifesto-panel="' + phase + '"', section)
            self.assertIn('aria-controls="manifesto-panel-' + phase + '"', section)
        self.assertIn("manifesto-chapter.js", HTML)

    def test_values_navigation_destinations_exist(self):
        targets = set(re.findall(r'onclick="switchChapter\((\d+)\)"', HTML))
        chapter_ids = set(re.findall(r'<section[^>]+id="chapter-(\d+)"', HTML))
        self.assertTrue({"6", "8", "9"}.issubset(targets))
        self.assertTrue({"6", "8", "9"}.issubset(chapter_ids))

    def test_practice_block_has_responsive_and_reduced_motion_rules(self):
        css = (ROOT / "styles.css").read_text(encoding="utf-8")
        for rule in ("@media(max-width:850px)", "@media(max-width:600px)", "@media(prefers-reduced-motion:reduce)"):
            self.assertIn(rule, css)
        self.assertIn(".manifesto-practice-grid", css)
        self.assertIn(".manifesto-phase-tabs", css)
        self.assertIn(".manifesto-history-line", css)


if __name__ == "__main__":
    unittest.main()
