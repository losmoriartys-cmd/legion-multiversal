import pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class ConversionPhase2Contract(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.html=(ROOT/"index.html").read_text(encoding="utf-8");cls.js=(ROOT/"app.js").read_text(encoding="utf-8");cls.css=(ROOT/"conversion-phase2.css").read_text(encoding="utf-8")
 def test_home_and_three_guided_paths(self):
  home=self.html.split('id="chapter-0"',1)[1].split('id="chapter-1"',1)[0]
  self.assertIn("MIRAR EN VIVO",home);self.assertEqual(home.count('class="executive-directory-card"'),3);self.assertNotIn('class="home-live-strip"',home)
 def test_floating_live_drawer(self):
  self.assertIn('live-player-drawer',self.html);self.assertIn("openLiveDrawer()",self.js);self.assertIn("closeLiveDrawer()",self.js)
 def test_market_benchmark_and_activation_tabs(self):
  self.assertIn("BENCHMARK DE INDUSTRIA",self.html);self.assertIn("TIEMPO DE EJECUCIÓN",self.html);self.assertIn("selectAllianceModelTab",self.js)
 def test_barfender_continuity_and_clip_metadata(self):
  self.assertIn("SESIÓN 02 · 10 NOV 2026",self.html);self.assertIn("DURACIÓN NO REGISTRADA",self.html);self.assertIn("JUGADO POR LA LEGIÓN",self.html);self.assertIn("91 usuarios activos en chat",self.html)
 def test_arsenal_filters_and_recruitment_tabs(self):
  self.assertIn("filterArsenal",self.js);self.assertIn("setRecruitmentMode",self.js);self.assertIn('data-arsenal-filter="horror"',self.html)
 def test_mission_progress_is_discoverable(self):
  self.assertIn("mission-progress-trigger",self.html);self.assertIn("updateMissionHeader",self.js)
if __name__=="__main__":unittest.main()
