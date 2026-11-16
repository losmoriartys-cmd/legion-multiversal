import pathlib
import tempfile
import unittest

from scripts.audit_image_references import audit


class ImageReferenceAuditTests(unittest.TestCase):
    def test_classifies_runtime_javascript_docs_and_unreferenced_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            (root / "assets").mkdir()
            (root / "assets" / "active.jpg").write_bytes(b"active")
            (root / "assets" / "dynamic.png").write_bytes(b"dynamic")
            (root / "assets" / "history.webp").write_bytes(b"history")
            (root / "assets" / "orphan.avif").write_bytes(b"orphan")
            (root / "index.html").write_text('<img src="./assets/active.jpg">', encoding="utf-8")
            (root / "app.js").write_text('const portrait = "assets/dynamic.png";', encoding="utf-8")
            (root / "README.md").write_text("Archivo histórico: assets/history.webp", encoding="utf-8")
            results = {record["path"]: record for record in audit(root)}
            self.assertEqual(results["assets/active.jpg"]["classification"], "runtime")
            self.assertEqual(results["assets/dynamic.png"]["classification"], "javascript")
            self.assertEqual(results["assets/history.webp"]["classification"], "docs/tooling")
            self.assertEqual(results["assets/orphan.avif"]["classification"], "orphan")

    def test_bare_duplicate_basename_is_not_counted_as_a_reference(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            (root / "a").mkdir()
            (root / "b").mkdir()
            (root / "a" / "logo.png").write_bytes(b"a")
            (root / "b" / "logo.png").write_bytes(b"b")
            (root / "README.md").write_text("logo.png", encoding="utf-8")
            results = audit(root)
            self.assertEqual(len(results), 2)
            self.assertTrue(all(item["classification"] == "orphan" for item in results))


if __name__ == "__main__":
    unittest.main()
