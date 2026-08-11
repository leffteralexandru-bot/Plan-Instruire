#!/usr/bin/env python3
"""
Păstrează formatul PDF vechi (7 tipuri) și adaugă doar textul lipsă:
- punct Poze (unde lipsește)
- nota despre întârzieri
- tipografie ca originalul verificat: Arial 9.5 (corp), Confirmare 11/8.5
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path(r"c:\Users\AlioSol\Desktop")
SOURCE_FULL = DESKTOP / "Checklist_Client_ArtGranit.pdf"

OUT_DIR = ROOT / "public/docs/operational-guide/checklists"
PAGES_DIR = OUT_DIR / "pages"
FULL_PDF = ROOT / "public/docs/operational-guide/Checklist_Client_ArtGranit.pdf"
LEGACY_MIRROR = ROOT / "public/docs/operational-guide/checklist-masuratori-full.pdf"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
RENDER_DPI = 300

# Tipografie ca generatorul verificat (generate_client_checklist_pdf.py → font AG = Arial)
FONT_REG = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
FONT_NAME = "ag"
FONT_BOLD_NAME = "agb"

NOTE = (
    "Vă rog să luați în calcul toate aceste detalii pentru a putea efectua o "
    "măsurătoare corectă și pentru un proces de producție și, mai apoi, de montare optimă. "
    "Orice element lipsă sau informație necorespunzătoare vor duce la întârzieri ale proiectului."
)

CONFIRM = (
    "Am luat cunoștință cu conținutul checklist-ului și confirm asigurarea "
    "punctelor enumerate mai sus la efectuarea măsurărilor."
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

# Culori ca originalul (0–1 pentru PyMuPDF)
BODY_COLOR = (28 / 255, 25 / 255, 21 / 255)
BRAND_BLUE = (15 / 255, 55 / 255, 95 / 255)
SOFT = (92 / 255, 83 / 255, 72 / 255)

LEFT = 50.0  # ~14mm @ 72dpi ≈ 39.7; păstrăm alinierea PDF sursă
RIGHT_MARGIN = 50.0
# Mărimi verificate din generatorul Arial
SIZE_ITEM = 9.5
SIZE_CONFIRM_TITLE = 11.0
SIZE_CONFIRM_BODY = 8.5
SIZE_CONFIRM_FIELDS = 9.0
SIZE_CONFIRM_LOC = 8.0
LINE_H = 12.5


def find_markers(page: fitz.Page) -> tuple[float, float, float, float]:
    """Return (last_content_before_confirm_bottom, confirm_top, footer_top, body_size)."""
    confirm_top = None
    footer_top = None
    last_before = 0.0
    size = SIZE_ITEM
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


def put_text(
    page: fitz.Page,
    rect: fitz.Rect,
    text: str,
    *,
    bold: bool = False,
    fontsize: float,
    color: tuple[float, float, float],
) -> float:
    """Inserează text Arial; returnează rc din insert_textbox."""
    fontfile = str(FONT_BOLD if bold else FONT_REG)
    fontname = FONT_BOLD_NAME if bold else FONT_NAME
    return page.insert_textbox(
        rect,
        text,
        fontname=fontname,
        fontfile=fontfile,
        fontsize=fontsize,
        color=color,
        align=fitz.TEXT_ALIGN_LEFT,
    )


def patch_page(page: fitz.Page, photo_line: str) -> None:
    if not FONT_REG.exists():
        raise FileNotFoundError(f"Lipsește Arial: {FONT_REG}")
    if not FONT_BOLD.exists():
        raise FileNotFoundError(f"Lipsește Arial Bold: {FONT_BOLD}")

    last_before, confirm_top, footer_top, detected_size = find_markers(page)
    # Folosim mărimea detectată pe listă dacă e aproape de 9.5, altfel 9.5 verificat
    item_size = detected_size if 8.8 <= detected_size <= 10.2 else SIZE_ITEM

    wipe = fitz.Rect(36, last_before + 2, page.rect.width - 36, footer_top - 4)
    page.add_redact_annot(wipe, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    width = page.rect.width - LEFT - RIGHT_MARGIN
    y = last_before + 8

    # punct Poze — același tip + mărime ca lista (Arial 9.5)
    rc = put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width, y + LINE_H * 2.2),
        photo_line,
        fontsize=item_size,
        color=BODY_COLOR,
    )
    y += LINE_H * (2.0 if rc < 0 else 1.35)

    # notă — același tip + mărime ca lista (nu mai mic)
    put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width, y + LINE_H * 5.5),
        NOTE,
        fontsize=item_size,
        color=BODY_COLOR,
    )
    y += LINE_H * 4.8

    # Confirmare — ierarhia originală verificată
    put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width, y + 18),
        "Confirmare client",
        bold=True,
        fontsize=SIZE_CONFIRM_TITLE,
        color=BRAND_BLUE,
    )
    y += 16

    put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width, y + 42),
        CONFIRM,
        fontsize=SIZE_CONFIRM_BODY,
        color=BODY_COLOR,
    )
    y += 38

    put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width * 0.52, y + 16),
        "Prenume: ____________________",
        fontsize=SIZE_CONFIRM_FIELDS,
        color=BODY_COLOR,
    )
    put_text(
        page,
        fitz.Rect(LEFT + width * 0.48, y, LEFT + width, y + 16),
        "Nume: ____________________",
        fontsize=SIZE_CONFIRM_FIELDS,
        color=BODY_COLOR,
    )
    y += 16
    put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width * 0.52, y + 16),
        "Semnătură: __________________",
        fontsize=SIZE_CONFIRM_FIELDS,
        color=BODY_COLOR,
    )
    put_text(
        page,
        fitz.Rect(LEFT + width * 0.48, y, LEFT + width, y + 16),
        "Data: ____ / ____ / ________",
        fontsize=SIZE_CONFIRM_FIELDS,
        color=BODY_COLOR,
    )
    y += 18
    put_text(
        page,
        fitz.Rect(LEFT, y, LEFT + width, min(y + 16, footer_top - 4)),
        "Locație exactă: _______________________________________________________",
        fontsize=SIZE_CONFIRM_LOC,
        color=SOFT,
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
    print(f"Font ← Arial (AG) {SIZE_ITEM}pt corp · Confirmare {SIZE_CONFIRM_TITLE}/{SIZE_CONFIRM_BODY}")
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
