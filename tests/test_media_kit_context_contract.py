import pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class MediaKitContextContract(unittest.TestCase):
 def test_twitch_channel_cards_add_category_and_only_grounded_chat_signal(self):
  source=(ROOT/"brand-media-kit.js").read_text(encoding="utf-8")
  self.assertIn("Categoría principal (10 días)",source)
  self.assertIn('login === "losmoriartys"',source)
  self.assertIn('"91 / 80"',source)
  self.assertIn("VOD completo",source)
  self.assertIn("no se extrapola a otros canales",source)
 def test_media_kit_script_is_cache_busted(self):
  html=(ROOT/"marcas/index.html").read_text(encoding="utf-8")
  self.assertIn("brand-media-kit.js?v=20261116-context-1",html)
if __name__=="__main__":unittest.main()
