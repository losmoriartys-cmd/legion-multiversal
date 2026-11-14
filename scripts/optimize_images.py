#!/usr/bin/env python3
"""Generate review-only WebP candidates; never overwrite originals or references."""
from __future__ import annotations
import json, math
from pathlib import Path
from PIL import Image, ImageChops, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports" / "image-optimization"
SOURCES = [
    ("legion_logo_final_hybrid.png", "logo-lossless", {"lossless": True, "method": 6}),
    ("assets/heroes/rod3r1k_dark.webp", "rod3r1k-q90", {"quality": 90, "method": 6}),
    ("image_20261107_021355.jpg", "origenes-q88", {"quality": 88, "method": 6}),
    ("stream4.jpg", "stream4-q88", {"quality": 88, "method": 6}),
    ("image_20261106_124855.jpg", "banner-lcp-q88", {"quality": 88, "method": 6}),
    ("assets/carnet/DemuianCarnet.jpg", "demian-carnet-q88", {"quality": 88, "method": 6}),
]
def prepare(path):
    image = ImageOps.exif_transpose(Image.open(path))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    return image
def compare(a, b):
    if a.size != b.size:
        raise ValueError("Image dimensions changed")
    mode = "RGBA" if "A" in a.getbands() else "RGB"
    rms = ImageStat.Stat(ImageChops.difference(a.convert(mode), b.convert(mode))).rms
    mse = sum(v*v for v in rms) / len(rms)
    psnr = 99.0 if mse == 0 else 20*math.log10(255/math.sqrt(mse))
    return {"width": a.width, "height": a.height, "aspect_ratio": round(a.width/a.height, 8),
            "psnr_db": round(psnr, 3), "mean_channel_rmse": round(math.sqrt(mse), 4),
            "exact_pixel_match": mse == 0}
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    for rel, label, options in SOURCES:
        source = ROOT / rel
        if not source.is_file():
            results.append({"source": rel, "status": "missing"})
            continue
        image = prepare(source)
        output = OUT / (Path(rel).stem + "." + label + ".webp")
        image.save(output, format="WEBP", **options)
        with Image.open(output) as encoded:
            candidate = encoded.copy()
        metrics = compare(image, candidate)
        original_bytes, candidate_bytes = source.stat().st_size, output.stat().st_size
        item = {"source": rel, "candidate": str(output.relative_to(ROOT)), "status": "generated",
                "original_bytes": original_bytes, "candidate_bytes": candidate_bytes,
                "saved_bytes": original_bytes-candidate_bytes,
                "saved_percent": round((1-candidate_bytes/original_bytes)*100, 2),
                "format": "WEBP", "mode": image.mode, **metrics}
        results.append(item)
        print("{}: {} -> {} bytes ({}% saved), {}x{}, PSNR {} dB".format(
            rel, original_bytes, candidate_bytes, item["saved_percent"],
            metrics["width"], metrics["height"], metrics["psnr_db"]))
    report = {"policy": "review-only; originals and HTML/JSON references unchanged",
              "resize": False, "preserve_dimensions": True, "candidates": results}
    (OUT / "comparison.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    if any(item.get("status") != "generated" for item in results):
        raise SystemExit("Missing source image; inspect comparison.json")
    print("Report:", OUT / "comparison.json")
if __name__ == "__main__":
    main()
