#!/usr/bin/env python3
"""Regenerează paginile manual Proliner: rezoluție înaltă + logo artGRANIT lângă PRODIM."""

from pathlib import Path

import fitz
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "public/docs/equipment/proliner-quick-start-ro.pdf"
OUT_DIR = ROOT / "public/docs/equipment/proliner/pages"
SVG = ROOT / "public/brand/artgranit-logo.svg"

# 4× față de 2× anterior — text și desene mai clare pe ecrane retina
RENDER_SCALE = 4

# Header negru (stânga) — logo artGRANIT auriu, vizibil lângă zona PRODIM
LOGO_X_PCT = 27.5
LOGO_Y_PCT = 2.55
LOGO_H_PCT = 4.6
LOGO_COLOR = "#B38F55"


def load_artgranit_logo(target_height: int) -> Image.Image:
    svg = SVG.read_text(encoding="utf-8").replace("currentColor", LOGO_COLOR)
    doc = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    page = doc[0]
    aspect = page.rect.width / page.rect.height
    target_width = max(1, int(target_height * aspect))
    scale = target_height / page.rect.height
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    doc.close()
    return Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)


def add_artgranit_logo(page_img: Image.Image) -> Image.Image:
    width, height = page_img.size
    logo_h = max(1, int(height * LOGO_H_PCT / 100))
    logo = load_artgranit_logo(logo_h)
    x = int(width * LOGO_X_PCT / 100)
    y = int(height * LOGO_Y_PCT / 100)
    composed = page_img.convert("RGBA")
    composed.paste(logo, (x, y), logo)
    return composed.convert("RGB")


def render_pages() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    matrix = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)

    for index, page in enumerate(doc):
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        image = image.filter(ImageFilter.UnsharpMask(radius=1.0, percent=110, threshold=2))
        image = add_artgranit_logo(image)
        out_path = OUT_DIR / f"page-{index + 1:02d}.png"
        image.save(out_path, "PNG", optimize=True)
        print(f"Wrote {out_path.name} ({image.width}×{image.height})")

    doc.close()


if __name__ == "__main__":
    render_pages()
