#!/usr/bin/env python3
"""Regenerează paginile manual Proliner: rezoluție înaltă + logo artGRANIT în panoul negru."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from statistics import median

import fitz
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = ROOT / "public/docs/equipment/proliner-quick-start-ro-source.pdf"
COVER_PDF = ROOT / "public/docs/equipment/proliner-cover-artgranit.pdf"
PDF_OUT = ROOT / "public/docs/equipment/proliner-quick-start-ro.pdf"
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

FONT_REGULAR_CANDIDATES = [
    Path("C:/Windows/Fonts/segoeui.ttf"),
    Path("C:/Windows/Fonts/calibri.ttf"),
    Path("C:/Windows/Fonts/arial.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
]
FONT_BOLD_CANDIDATES = [
    Path("C:/Windows/Fonts/segoeuib.ttf"),
    Path("C:/Windows/Fonts/calibrib.ttf"),
    Path("C:/Windows/Fonts/arialbd.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
]

DIACRITIC_CHARS = set("ăâîșțĂÂÎȘȚşţŞŢ")


@dataclass
class TextLineFix:
    bbox: fitz.Rect
    text: str
    color: tuple[float, float, float]
    fill: tuple[float, float, float]
    fontsize: float
    bold: bool


def resolve_font_path(candidates: list[Path]) -> Path:
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError(f"Lipsește un font TTF pentru regenerare: {candidates[0].name}")


def span_color_to_fitz_rgb(color: int) -> tuple[float, float, float]:
    if color == 0:
        return (0.0, 0.0, 0.0)
    return ((color >> 16) & 0xFF) / 255, ((color >> 8) & 0xFF) / 255, (color & 0xFF) / 255


def span_color_to_pil_rgb(color: int) -> tuple[int, int, int]:
    if color == 0:
        return (0, 0, 0)
    return (color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF


def normalize_ro_text(text: str) -> str:
    return (
        text.replace("ş", "ș")
        .replace("Ş", "Ș")
        .replace("ţ", "ț")
        .replace("Ţ", "Ț")
    )


def line_needs_text_enhance(spans: list[dict]) -> bool:
    if not spans:
        return False
    merged = "".join(span.get("text", "") for span in spans)
    if not merged.strip():
        return False
    if any(char in DIACRITIC_CHARS for char in merged):
        if any(char in "şţŞŢ" for char in merged):
            return True
    if len(spans) <= 1:
        return False
    fonts = {span.get("font", "") for span in spans}
    return "MyriadPro-Regular" in fonts and (
        "MyriadPro-Light" in fonts or "MyriadPro-Semibold" in fonts
    )


def median_rgb(samples: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    if not samples:
        return (255, 255, 255)
    return (
        int(median([pixel[0] for pixel in samples]) + 0.5),
        int(median([pixel[1] for pixel in samples]) + 0.5),
        int(median([pixel[2] for pixel in samples]) + 0.5),
    )


def sample_line_background(
    image: Image.Image,
    bbox: tuple[int, int, int, int],
    text_rgb: tuple[int, int, int],
) -> tuple[int, int, int]:
    x0, y0, x1, y1 = bbox
    width, height = image.size
    text_luma = sum(text_rgb) / 3
    samples: list[tuple[int, int, int]] = []

    for y in (y0 - 3, y0 - 1, y1 + 1, y1 + 3, (y0 + y1) // 2):
        if y < 0 or y >= height:
            continue
        for x in range(max(0, x0), min(width, x1 + 1), max(1, (x1 - x0) // 8 or 1)):
            pixel = image.getpixel((x, y))
            if abs(sum(pixel) / 3 - text_luma) < 18:
                continue
            samples.append(pixel)

    if not samples:
        for y in range(max(0, y0), min(height, y1 + 1)):
            for x in (max(0, x0 - 2), min(width - 1, x1 + 2)):
                samples.append(image.getpixel((x, y)))

    if text_rgb == (255, 255, 255):
        return (0, 0, 0)
    if text_rgb == (0, 0, 0):
        return median_rgb(samples) if samples else (255, 255, 255)
    return median_rgb(samples) if samples else (255, 255, 255)


def collect_text_line_fixes(page: fitz.Page, preview: Image.Image, scale: float) -> list[TextLineFix]:
    fixes: list[TextLineFix] = []
    fill_cache: dict[int, tuple[float, float, float]] = {}

    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            if not line_needs_text_enhance(spans):
                continue

            merged = normalize_ro_text("".join(span.get("text", "") for span in spans))
            if not merged.strip():
                continue

            bbox = fitz.Rect(line["bbox"]) + (-0.4, -0.6, 0.4, 0.6)
            color_int = spans[0].get("color", 0)
            text_rgb = span_color_to_pil_rgb(color_int)
            bbox_px = (
                max(0, int(bbox.x0 * scale)),
                max(0, int(bbox.y0 * scale)),
                min(preview.width, int(bbox.x1 * scale)),
                min(preview.height, int(bbox.y1 * scale)),
            )

            if color_int not in fill_cache:
                bg = sample_line_background(preview, bbox_px, text_rgb)
                fill_cache[color_int] = (bg[0] / 255, bg[1] / 255, bg[2] / 255)

            fixes.append(
                TextLineFix(
                    bbox=bbox,
                    text=merged,
                    color=span_color_to_fitz_rgb(color_int),
                    fill=fill_cache[color_int],
                    fontsize=spans[0].get("size", 9.0),
                    bold=any("Bold" in span.get("font", "") for span in spans),
                )
            )

    return fixes


def enhance_page_text_pdf(
    page: fitz.Page,
    font_regular: Path,
    font_bold: Path,
) -> int:
    """Re-desenează liniile cu diacritice fragmentate; imaginile rămân la loc."""
    preview_scale = 2.0
    preview = page.get_pixmap(matrix=fitz.Matrix(preview_scale, preview_scale), alpha=False)
    preview_img = Image.frombytes("RGB", (preview.width, preview.height), preview.samples)
    fixes = collect_text_line_fixes(page, preview_img, preview_scale)
    if not fixes:
        return 0

    for fix in fixes:
        page.add_redact_annot(fix.bbox, fill=fix.fill)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    redrawn = 0
    for fix in fixes:
        font_path = font_bold if fix.bold else font_regular
        font = fitz.Font(fontfile=str(font_path))
        writer = fitz.TextWriter(page.rect)
        baseline_y = fix.bbox.y1 - fix.fontsize * 0.22
        writer.append(
            (fix.bbox.x0, baseline_y),
            fix.text,
            font=font,
            fontsize=fix.fontsize,
        )
        writer.write_text(page, color=fix.color)
        redrawn += 1

    return redrawn


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


def apply_custom_cover(doc: fitz.Document) -> None:
    """Înlocuiește pagina 1 (copertă) cu versiunea artGRANIT editată de utilizator."""
    if not COVER_PDF.exists():
        print(f"Skip cover: lipsește {COVER_PDF.name}")
        return
    cover_doc = fitz.open(COVER_PDF)
    if len(cover_doc) != 1:
        raise ValueError(f"Coperta trebuie să aibă exact 1 pagină: {COVER_PDF}")
    doc.delete_page(0)
    doc.insert_pdf(cover_doc, from_page=0, to_page=0, start_at=0)
    cover_doc.close()
    print(f"Applied custom cover from {COVER_PDF.name}")


def brand_pdf() -> None:
    """Îmbunătățește textul, adaugă logo artGRANIT și salvează PDF-ul pentru descărcare."""
    if not SOURCE_PDF.exists():
        raise FileNotFoundError(f"Lipsește sursa PDF: {SOURCE_PDF}")

    font_regular = resolve_font_path(FONT_REGULAR_CANDIDATES)
    font_bold = resolve_font_path(FONT_BOLD_CANDIDATES)
    doc = fitz.open(SOURCE_PDF)
    total_text_fixes = 0
    for page_index, page in enumerate(doc):
        if page_index == 0:
            continue
        total_text_fixes += enhance_page_text_pdf(page, font_regular, font_bold)
        width, height = page.rect.width, page.rect.height
        black_right = width * (BLUE_PANEL_X0_PCT - LOGO_MARGIN_BEFORE_BLUE_PCT) / 100
        title_min_x = width * (chapter_title_end_x_pct(page) + LOGO_GAP_AFTER_TITLE_PCT) / 100
        header_y0 = height * HEADER_Y0_PCT / 100
        header_y1 = height * HEADER_Y1_PCT / 100

        logo_h = max(1, height * LOGO_MAX_HEIGHT_PCT / 100)
        svg = SVG.read_text(encoding="utf-8").replace("currentColor", LOGO_COLOR)
        logo_doc = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
        logo_page = logo_doc[0]
        scale = logo_h / logo_page.rect.height
        logo_w = logo_page.rect.width * scale

        x = black_right - logo_w
        if x < title_min_x:
            x = title_min_x
        available = black_right - title_min_x
        if logo_w > available and available > 0:
            scale = (available * 0.98) / logo_page.rect.width
            logo_h = logo_page.rect.height * scale
            logo_w = logo_page.rect.width * scale
            x = black_right - logo_w

        y = header_y0 + max(0, (header_y1 - header_y0 - logo_h) / 2)
        rect = fitz.Rect(x, y, x + logo_w, y + logo_h)
        logo_pix = logo_page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
        page.insert_image(rect, pixmap=logo_pix, keep_proportion=True)
        logo_doc.close()

    apply_custom_cover(doc)
    doc.save(PDF_OUT, deflate=True, garbage=4)
    doc.close()
    print(f"Wrote branded PDF {PDF_OUT.name} ({total_text_fixes} linii text îmbunătățite)")


def render_pages() -> None:
    """Generează PDF-ul branduit (descărcare) + PNG-uri din același PDF — logo o singură dată."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    brand_pdf()
    doc = fitz.open(PDF_OUT)
    matrix = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)

    for index, page in enumerate(doc):
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        image = image.filter(ImageFilter.UnsharpMask(radius=1.0, percent=110, threshold=2))
        out_path = OUT_DIR / f"page-{index + 1:02d}.png"
        image.save(out_path, "PNG", optimize=True)
        print(f"Wrote {out_path.name} (from branded PDF)")

    doc.close()


if __name__ == "__main__":
    render_pages()
