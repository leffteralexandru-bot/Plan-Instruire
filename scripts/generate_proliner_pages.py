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

# Panou header din PDF (măsurători pe paginile de capitol)
BLACK_PANEL_X0_PCT = 4.8
BLACK_PANEL_X1_PCT = 70.8
HEADER_Y0_PCT = 3.2
HEADER_Y1_PCT = 9.9

# Logo compact — încape în panoul negru fără a acoperi titlul sau PRODIM
LOGO_MAX_HEIGHT_PCT = 2.15
LOGO_GAP_AFTER_TITLE_PCT = 1.8
LOGO_MARGIN_BLACK_RIGHT_PCT = 1.0
LOGO_ASPECT = 213 / 30


def load_artgranit_logo(target_height: int) -> Image.Image:
    svg = SVG.read_text(encoding="utf-8").replace("currentColor", LOGO_COLOR)
    doc = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    page = doc[0]
    scale = target_height / page.rect.height
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    doc.close()
    return Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)


def chapter_title_end_x_pct(page: fitz.Page) -> float:
    """Capătul drept al titlului din panoul negru (% lățime pagină)."""
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


def logo_placement(page: fitz.Page) -> tuple[float, float, float]:
    """Returnează (x%, y%, height%) pentru logo în panoul negru."""
    title_end = chapter_title_end_x_pct(page)
    logo_h = LOGO_MAX_HEIGHT_PCT
    logo_w = logo_h * LOGO_ASPECT

    # Aliniat la dreapta panoului negru, dar nu peste titlu
    x_right = BLACK_PANEL_X1_PCT - LOGO_MARGIN_BLACK_RIGHT_PCT
    x = x_right - logo_w
    x_min = title_end + LOGO_GAP_AFTER_TITLE_PCT
    if x < x_min:
        x = x_min
        # Micșorăm dacă nu încape între titlu și marginea albastră
        max_w = x_right - x_min
        if max_w < logo_w:
            logo_h = max(1.6, max_w / LOGO_ASPECT)
            logo_w = logo_h * LOGO_ASPECT
            x = x_right - logo_w

    header_mid = (HEADER_Y0_PCT + HEADER_Y1_PCT) / 2
    y = header_mid - logo_h / 2
    return x, y, logo_h


def add_artgranit_logo(page_img: Image.Image, page: fitz.Page) -> Image.Image:
    width, height = page_img.size
    x_pct, y_pct, h_pct = logo_placement(page)
    logo_h = max(1, int(height * h_pct / 100))
    logo = load_artgranit_logo(logo_h)
    x = int(width * x_pct / 100)
    y = int(height * y_pct / 100)
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
        image = add_artgranit_logo(image, page)
        out_path = OUT_DIR / f"page-{index + 1:02d}.png"
        image.save(out_path, "PNG", optimize=True)
        x_pct, y_pct, h_pct = logo_placement(page)
        print(f"Wrote {out_path.name} logo@{x_pct:.1f}%,{y_pct:.1f}% h={h_pct:.2f}%")

    doc.close()


if __name__ == "__main__":
    render_pages()
