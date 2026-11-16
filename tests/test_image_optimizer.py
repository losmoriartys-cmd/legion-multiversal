import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "audit_and_optimize_images",
    ROOT / "scripts" / "audit_and_optimize_images.py",
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ImageOptimizerReferenceTests(unittest.TestCase):
    def test_reference_variants_include_encoded_paths(self):
        image = ROOT / "assets" / "campaign art.jpg"
        source = ROOT / "index.html"
        variants = MODULE.reference_variants(image, source)

        self.assertIn("assets/campaign art.jpg", variants)
        self.assertIn("assets/campaign%20art.jpg", variants)

    def test_replacement_pairs_preserve_encoded_path_prefix(self):
        source = ROOT / "assets" / "campaign art.jpg"
        target = ROOT / "assets" / "campaign art.webp"
        html = ROOT / "index.html"
        observed = {
            "assets/campaign%20art.jpg",
            "./assets/campaign%20art.jpg",
        }

        pairs = MODULE.replacement_pairs(source, target, html, observed, True)

        self.assertEqual(
            pairs["assets/campaign%20art.jpg"],
            "assets/campaign%20art.webp",
        )
        self.assertEqual(
            pairs["./assets/campaign%20art.jpg"],
            "./assets/campaign%20art.webp",
        )

    def test_replacement_pairs_keep_relative_paths(self):
        source = ROOT / "assets" / "campaign.jpg"
        target = ROOT / "assets" / "campaign.webp"
        page = ROOT / "chapters" / "index.html"
        observed = {"../assets/campaign.jpg"}

        pairs = MODULE.replacement_pairs(source, target, page, observed, True)

        self.assertEqual(pairs["../assets/campaign.jpg"], "../assets/campaign.webp")

    def test_duplicate_basenames_are_not_replaced_without_path(self):
        source = ROOT / "one" / "shared.jpg"
        target = ROOT / "one" / "shared.webp"
        page = ROOT / "index.html"
        observed = {"shared.jpg"}

        pairs = MODULE.replacement_pairs(source, target, page, observed, False)

        self.assertNotIn("shared.jpg", pairs)


if __name__ == "__main__":
    unittest.main()
