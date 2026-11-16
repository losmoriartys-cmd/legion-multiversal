#!/usr/bin/env python3
"""Create a visually faithful, first-screen WebP and wire it into the home hero."""
from pathlib import Path
from PIL import Image, ImageOps
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "image_20261106_124855.jpg"
OUTPUT = ROOT / "image_20261106_124855.webp"
HTML = ROOT / "index.html"
MAX_BYTES = 165 * 1024
MAX_WIDTH = 1536
RESPONSIVE_WIDTHS = (640, 960, 1280)
RESPONSIVE_QUALITIES = (82, 80, 78, 76, 74, 72)
SIZES = "(max-width: 640px) calc(100vw - 100px), (max-width: 900px) calc(100vw - 80px), 1200px"

if not SOURCE.is_file() or not HTML.is_file():
    raise SystemExit("Falta la imagen original o index.html; no se modifica el sitio.")

with Image.open(SOURCE) as opened:
    image = ImageOps.exif_transpose(opened).convert("RGB")
    original_size = SOURCE.stat().st_size
    if image.width > MAX_WIDTH:
        new_height = round(image.height * MAX_WIDTH / image.width)
        image = image.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
    selected_quality = None
    for quality in (86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64):
        image.save(OUTPUT, "WEBP", quality=quality, method=6, optimize=True)
        if OUTPUT.stat().st_size <= MAX_BYTES:
            selected_quality = quality
            break

if selected_quality is None:
    OUTPUT.unlink(missing_ok=True)
    raise SystemExit(f"No se alcanzó el límite de {MAX_BYTES} bytes sin bajar de calidad 64.")

# Crear candidatos responsive desde el original ya orientado; el master 1536px se conserva.
responsive_outputs = []
with Image.open(SOURCE) as opened:
    base = ImageOps.exif_transpose(opened).convert("RGB")
    for width in RESPONSIVE_WIDTHS:
        if width >= base.width:
            raise SystemExit(f"El candidato {width}px no es menor que el original {base.width}px.")
        height = round(base.height * width / base.width)
        resized = base.resize((width, height), Image.Resampling.LANCZOS)
        target = ROOT / f"image_20261106_124855-{width}.webp"
        selected = None
        for quality in RESPONSIVE_QUALITIES:
            resized.save(target, "WEBP", quality=quality, method=6, optimize=True)
            if target.stat().st_size < OUTPUT.stat().st_size:
                selected = quality
                break
        if selected is None:
            target.unlink(missing_ok=True)
            raise SystemExit(f"No se pudo generar un candidato {width}px más liviano que el master.")
        with Image.open(target) as check:
            check.load()
            if check.format != "WEBP" or check.size != (width, height):
                raise SystemExit(f"Verificación fallida del candidato {width}px.")
        responsive_outputs.append((width, height, target, selected, target.stat().st_size))

fallback_width, fallback_height = next(
    (width, height) for width, height, *_ in responsive_outputs if width == 960
)

html = HTML.read_text(encoding="utf-8")
old_src = "image_20261106_124855.jpg"
new_src = "image_20261106_124855.webp"
if old_src in html:
    html = html.replace(old_src, new_src, 1)
if new_src not in html:
    raise SystemExit("No se encontró la referencia esperada de la imagen principal.")

srcset = ", ".join(
    [f"image_20261106_124855-{width}.webp {width}w" for width in RESPONSIVE_WIDTHS]
    + [f"{new_src} {MAX_WIDTH}w"]
)
preload = (
    f'<link rel="preload" as="image" href="./image_20261106_124855-960.webp" '
    f'imagesrcset="{srcset}" imagesizes="{SIZES}" fetchpriority="high">'
)
preload_pattern = re.compile(r'<link rel="preload" as="image"[^>]*fetchpriority="high"[^>]*>')
if preload_pattern.search(html):
    html = preload_pattern.sub(preload, html, count=1)
else:
    anchor = '    <meta name="theme-color" content="#0b0f19">'
    if anchor not in html:
        raise SystemExit("No se encontró el punto seguro para insertar el preload en <head>.")
    html = html.replace(anchor, anchor + "\n    " + preload, 1)

# El marcador antiguo apuntaba a un SHA anterior; la identidad se verifica con
# el check Cloudflare Pages asociado al SHA exacto de cada ejecución.
html = re.sub(r'^\s*<meta name="lm-source-revision"[^>]*>\s*\n', '', html, flags=re.MULTILINE)

# Reparar el elemento img en una sola línea, sin regex que pueda cruzar otras etiquetas.
lines = html.splitlines(keepends=True)
indices = [i for i, line in enumerate(lines) if "<img" in line and new_src in line]
if len(indices) != 1:
    raise SystemExit(f"Se esperaba un único img principal WebP; encontrados: {len(indices)}.")
idx = indices[0]
line = lines[idx]
newline = "\n" if line.endswith("\n") else ""
tag = line.rstrip("\r\n").rstrip()
if not tag.endswith(">"):
    tag += ">"
tag = re.sub(r'\bsrc="[^"]+"', 'src="image_20261106_124855-960.webp"', tag, count=1)
tag = re.sub(r'\bwidth="\d+"', f'width="{fallback_width}"', tag, count=1)
tag = re.sub(r'\bheight="\d+"', f'height="{fallback_height}"', tag, count=1)
tag = re.sub(r'\bsrcset="[^"]+"', f'srcset="{srcset}"', tag, count=1)
if 'srcset=' not in tag:
    tag = tag[:-1] + f' srcset="{srcset}">'
tag = re.sub(r'\bsizes="[^"]+"', f'sizes="{SIZES}"', tag, count=1)
if 'sizes=' not in tag:
    tag = tag[:-1] + f' sizes="{SIZES}">'
if 'loading=' not in tag:
    tag = tag[:-1] + ' loading="eager">'
lines[idx] = tag + newline
html = "".join(lines)
HTML.write_text(html, encoding="utf-8")

new_size = OUTPUT.stat().st_size
print(f"Hero WebP maestro: {new_size:,} bytes; calidad={selected_quality}; dimensiones={image.width}x{image.height}")
print(f"Dimensiones intrínsecas HTML (fallback): {fallback_width}x{fallback_height}")
print(f"Original: {original_size:,} bytes; ahorro: {(1 - new_size / original_size) * 100:.1f}%")
for width, height, path, quality, size in responsive_outputs:
    print(f"Hero responsive {width}w: {size:,} bytes; calidad={quality}; dimensiones={width}x{height}")
if new_size > MAX_BYTES or new_size >= original_size * 0.41:
    raise SystemExit("El WebP no cumple el objetivo de reducción de peso; revisar antes de publicar.")
