#!/usr/bin/env python3
"""Regenerează paginile manual Proliner: rezoluție înaltă + logo artGRANIT în panoul negru."""

from pathlib import Path

import fitz
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "public/docs/equipment/proliner-quick-start-ro.pdf"
OUT_DIR = ROOT / "public/docs/equipment/proliner/pages"
SVG = ROOT / "public/brand/artgranit-logo.svg"

RENDER_SCALE = 4
LOGO_COLOR = "#B38F55"

# Panou header din PDF
BLACK_PANEL_X1_PCT = 70.8
BLUE_PANEL_X0_PCT = 71.2
HEADER_Y0_PCT = 3.2
HEADER_Y1_PCT = 9.9

LOGO_MAX_HEIGHT_PCT = 2.15
LOGO_GAP_AFTER_TITLE_PCT = 1.8
# Margine față de panoul albastru PRODIM — logo rămâne strict în negru
LOGO_MARGIN_BEFORE_BLUE_PCT = 1.4


def load_artgranit_logo(target_height: int) -> Image.Image:
    svg = SVG.read_text(encoding="utf-8").replace("currentColor", LOGO_COLOR)
    doc = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    page = doc[0]
    scale = target_height / page.rect.height
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    doc.close()
    return Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)


def chapter_title_end_x_pct(page: fitz.Page) -> float:
    width = page.rect.width
    max_x = 0.0
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                bbox = span["bbox"]
                if bbox[1] > page.rect.height * HEADER_Y1_PCT / 100:
                    continue
                text = span.get("text", "").strip()
                if text and bbox[0] < width * 0.55:
                    max_x = max(max_x, bbox[2] / width * 100)
    return max_x


def place_logo_on_page(page_img: Image.Image, page: fitz.Page) -> tuple[Image.Image, int, int, int]:
    """Plasează logo în panoul negru; returnează imagine + x,y,lățime logo (px)."""
    width, height = page_img.size

    # Limita dreaptă = înainte de panoul albastru PRODIM
    black_right_px = int(width * (BLUE_PANEL_X0_PCT - LOGO_MARGIN_BEFORE_BLUE_PCT) / 100)
    title_min_x_px = int(width * (chapter_title_end_x_pct(page) + LOGO_GAP_AFTER_TITLE_PCT) / 100)

    header_y0_px = int(height * HEADER_Y0_PCT / 100)
    header_y1_px = int(height * HEADER_Y1_PCT / 100)

    logo_h_px = max(1, int(height * LOGO_MAX_HEIGHT_PCT / 100))
    logo = load_artgranit_logo(logo_h_px)

    for _ in range(16):
        available_w = black_right_px - title_min_x_px
        if available_w <= 0:
            return page_img, 0, 0, 0

        if logo.width > available_w:
            logo_h_px = max(1, int(logo_h_px * available_w / logo.width * 0.98))
            logo = load_artgranit_logo(logo_h_px)

        x = black_right_px - logo.width
        if x < title_min_x_px:
            x = title_min_x_px

        if x + logo.width <= black_right_px:
            break

        logo_h_px = max(1, int(logo_h_px * 0.9))
        logo = load_artgranit_logo(logo_h_px)
    else:
        x = title_min_x_px

    y = header_y0_px + max(0, (header_y1_px - header_y0_px - logo.height) // 2)

    composed = page_img.convert("RGBA")
    composed.paste(logo, (x, y), logo)
    return composed.convert("RGB"), x, y, logo.width


def render_pages() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    matrix = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)

    for index, page in enumerate(doc):
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        image = image.filter(ImageFilter.UnsharpMask(radius=1.0, percent=110, threshold=2))
        image, x, _y, lw = place_logo_on_page(image, page)
        out_path = OUT_DIR / f"page-{index + 1:02d}.png"
        image.save(out_path, "PNG", optimize=True)
        w = image.width
        end_pct = (x + lw) / w * 100 if lw else 0
        print(f"Wrote {out_path.name} logo end={end_pct:.1f}% (blue@{BLUE_PANEL_X0_PCT}%)")

    doc.close()


if __name__ == "__main__":
    render_pages()
