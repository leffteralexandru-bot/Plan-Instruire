#!/usr/bin/env python3
"""
Păstrează formatul PDF vechi (7 tipuri) și adaugă doar textul lipsă:
- punct Poze (unde lipsește)
- nota despre întârzieri
- fără redesign HTML
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path(r"c:\Users\AlioSol\Desktop")
# Formatul original (7 pagini)
SOURCE_FULL = DESKTOP / "Checklist_Client_ArtGranit.pdf"

OUT_DIR = ROOT / "public/docs/operational-guide/checklists"
PAGES_DIR = OUT_DIR / "pages"
FULL_PDF = ROOT / "public/docs/operational-guide/Checklist_Client_ArtGranit.pdf"
LEGACY_MIRROR = ROOT / "public/docs/operational-guide/checklist-masuratori-full.pdf"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
RENDER_DPI = 300
FONT_PATH = ROOT / "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"
FONT_NAME = "dejavu"

NOTE = (
    "Vă rog să luați în calcul toate aceste detalii pentru a putea efectua o "
    "măsurătoare corectă și pentru un proces de producție și, mai apoi, de montare optimă. "
    "Orice element lipsă sau informație necorespunzătoare vor duce la întârzieri ale proiectului."
)

# page index 0-based → (slug, app_name, art_name, photo_line)
PAGES: list[tuple[str, str, str, str]] = [
    ("blat", "Checklist-masuratori-Blat.pdf", "Checklist_Client_ArtGranit-Blat.pdf", "6. Poze cu mobilierul montat."),
    ("scara", "Checklist-masuratori-Scara.pdf", "Checklist_Client_ArtGranit-Scara.pdf", "7. Poze cu scările / zona de măsurat."),
    ("placare", "Checklist-masuratori-Placare.pdf", "Checklist_Client_ArtGranit-Placare.pdf", "7. Poze cu peretele / zona de placare."),
    ("semineu", "Checklist-masuratori-Semineu.pdf", "Checklist_Client_ArtGranit-Semineu.pdf", "7. Poze cu căminul / zona de măsurat."),
    (
        "scara-exterior",
        "Checklist-masuratori-Scari-exterioare.pdf",
        "Checklist_Client_ArtGranit-Scari-exterioare.pdf",
        "6. Poze cu scările exterioare / zona de măsurat.",
    ),
    ("glaf", "Checklist-masuratori-Glaf.pdf", "Checklist_Client_ArtGranit-Glaf.pdf", "7. Poze cu pervazurile / zona de măsurat."),
    (
        "placare-exterior",
        "Checklist-masuratori-Placari-exterioare.pdf",
        "Checklist_Client_ArtGranit-Placari-exterioare.pdf",
        "7. Poze cu zona de placare exterioară.",
    ),
]

BODY_COLOR = (0.12, 0.12, 0.12)
LEFT = 50.0
RIGHT_MARGIN = 50.0
FONTSIZE = 9.5
LINE_H = 12.5


def find_markers(page: fitz.Page) -> tuple[float, float, float, float]:
    """Return (last_content_before_confirm_bottom, confirm_top, footer_top, body_size)."""
    confirm_top = None
    footer_top = None
    last_before = 0.0
    size = FONTSIZE
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text:
                continue
            y0, y1 = line["bbox"][1], line["bbox"][3]
            for span in line["spans"]:
                if span["text"].strip()[:2] in {"1.", "2.", "3."}:
                    size = float(span["size"])
            if text.startswith("Confirmare"):
                confirm_top = y0
            elif "Checklist planificare" in text or (
                text.startswith("artgranit.ro") and "Checklist" in text
            ):
                footer_top = y0
            elif confirm_top is None:
                last_before = max(last_before, y1)
    if confirm_top is None:
        raise RuntimeError("Nu găsesc «Confirmare client»")
    if footer_top is None:
        footer_top = page.rect.height - 30
    return last_before, confirm_top, footer_top, size


def extract_confirm_block(page: fitz.Page, confirm_top: float, footer_top: float) -> str:
    lines: list[str] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            y0 = line["bbox"][1]
            if y0 < confirm_top - 1 or y0 >= footer_top - 1:
                continue
            text = "".join(s["text"] for s in line["spans"]).rstrip()
            if text:
                lines.append(text)
    return "\n".join(lines)


def patch_page(page: fitz.Page, photo_line: str) -> None:
    if not FONT_PATH.exists():
        raise FileNotFoundError(f"Lipsește fontul RO: {FONT_PATH}")
    last_before, confirm_top, footer_top, size = find_markers(page)
    confirm_text = extract_confirm_block(page, confirm_top, footer_top)

    # Șterge zona dintre ultimul punct și footer (reinserăm conținutul completat)
    wipe = fitz.Rect(36, last_before + 2, page.rect.width - 36, footer_top - 4)
    page.add_redact_annot(wipe, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    width = page.rect.width - LEFT - RIGHT_MARGIN
    y = last_before + 8
    fontsize = size
    page.insert_font(fontname=FONT_NAME, fontfile=str(FONT_PATH))

    # punct Poze
    rc = page.insert_textbox(
        fitz.Rect(LEFT, y, LEFT + width, y + LINE_H * 2.2),
        photo_line,
        fontname=FONT_NAME,
        fontsize=fontsize,
        color=BODY_COLOR,
        align=fitz.TEXT_ALIGN_LEFT,
    )
    y += LINE_H * (2.0 if rc < 0 else 1.35)

    # notă
    note_box = fitz.Rect(LEFT, y, LEFT + width, y + LINE_H * 5.5)
    page.insert_textbox(
        note_box,
        NOTE,
        fontname=FONT_NAME,
        fontsize=max(fontsize - 0.3, 8.8),
        color=BODY_COLOR,
        align=fitz.TEXT_ALIGN_LEFT,
    )
    y += LINE_H * 4.6

    # Confirmare (textul original, pe formatul vechi)
    conf_box = fitz.Rect(LEFT, y, LEFT + width, footer_top - 6)
    page.insert_textbox(
        conf_box,
        confirm_text,
        fontname=FONT_NAME,
        fontsize=fontsize,
        color=BODY_COLOR,
        align=fitz.TEXT_ALIGN_LEFT,
    )


def save_singles(doc: fitz.Document) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    LINKED_DIR.mkdir(parents=True, exist_ok=True)
    for i, (slug, app_name, art_name, _) in enumerate(PAGES):
        single = fitz.open()
        single.insert_pdf(doc, from_page=i, to_page=i)
        out_app = OUT_DIR / app_name
        single.save(str(out_app))
        shutil.copy2(out_app, OUT_DIR / art_name)
        shutil.copy2(out_app, LINKED_DIR / art_name)
        pix = doc[i].get_pixmap(dpi=RENDER_DPI, alpha=False)
        pix.save(str(PAGES_DIR / f"{slug}.png"))
        single.close()
        print(f"  {slug} → {art_name}")


def main() -> None:
    if not SOURCE_FULL.exists():
        raise FileNotFoundError(f"Lipsește formatul vechi: {SOURCE_FULL}")

    print(f"Format sursă ← {SOURCE_FULL.name}")
    doc = fitz.open(SOURCE_FULL)
    if len(doc) != 7:
        raise RuntimeError(f"Aștept 7 pagini, am {len(doc)}")

    for i, (_slug, _a, _b, photo) in enumerate(PAGES):
        print(f"Patch p{i + 1}: + {photo}")
        patch_page(doc[i], photo)

    FULL_PDF.parent.mkdir(parents=True, exist_ok=True)
    tmp = FULL_PDF.with_suffix(".tmp.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(FULL_PDF)
    shutil.copy2(FULL_PDF, LEGACY_MIRROR)
    shutil.copy2(FULL_PDF, LINKED_DIR / "Checklist_Client_ArtGranit.pdf")

    doc2 = fitz.open(FULL_PDF)
    save_singles(doc2)
    doc2.close()
    print(f"Full → {FULL_PDF.relative_to(ROOT)} ({FULL_PDF.stat().st_size // 1024} KB)")
    print("Done.")


if __name__ == "__main__":
    main()
    sys.exit(0)
