#!/usr/bin/env python3
"""Checklist Client ArtGranit — copiază PDF, extrage 7 PDF-uri per tip + PNG."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(r"c:\Users\AlioSol\Desktop\Checklist_Client_ArtGranit.pdf")
# fallback — fișierul nou Blat (nume cu „..”) sau denumiri vechi
FALLBACK_SOURCES = [
    Path(r"c:\Users\AlioSol\Desktop\Checklist_Client_ArtGranit..pdf"),
    Path(r"c:\Users\AlioSol\Desktop\Chek list masuratori.pdf"),
]
OUT_DIR = ROOT / "public/docs/operational-guide/checklists"
PAGES_DIR = OUT_DIR / "pages"
FULL_PDF = ROOT / "public/docs/operational-guide/Checklist_Client_ArtGranit.pdf"
# oglindă legacy
LEGACY_FULL = ROOT / "public/docs/operational-guide/checklist-masuratori-full.pdf"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
RENDER_DPI = 300

# Pagină sursă (1-based) → slug + fișier app + fișier download „Checklist_Client_ArtGranit-…”
CATEGORY_PAGES: list[tuple[int, str, str, str]] = [
    (1, "blat", "Checklist-masuratori-Blat.pdf", "Checklist_Client_ArtGranit-Blat.pdf"),
    (2, "scara", "Checklist-masuratori-Scara.pdf", "Checklist_Client_ArtGranit-Scara.pdf"),
    (3, "placare", "Checklist-masuratori-Placare.pdf", "Checklist_Client_ArtGranit-Placare.pdf"),
    (4, "semineu", "Checklist-masuratori-Semineu.pdf", "Checklist_Client_ArtGranit-Semineu.pdf"),
    (5, "scara-exterior", "Checklist-masuratori-Scari-exterioare.pdf", "Checklist_Client_ArtGranit-Scari-exterioare.pdf"),
    (6, "glaf", "Checklist-masuratori-Glaf.pdf", "Checklist_Client_ArtGranit-Glaf.pdf"),
    (7, "placare-exterior", "Checklist-masuratori-Placari-exterioare.pdf", "Checklist_Client_ArtGranit-Placari-exterioare.pdf"),
]


def resolve_source() -> Path:
    if SOURCE_PDF.exists():
        return SOURCE_PDF
    for path in FALLBACK_SOURCES:
        if path.exists():
            return path
    raise FileNotFoundError(f"Lipsește PDF sursă: {SOURCE_PDF}")


def copy_full_pdf() -> Path:
    source = resolve_source()
    FULL_PDF.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, FULL_PDF)
    shutil.copy2(source, LEGACY_FULL)
    print(f"PDF complet ← {source.name}")
    print(f"PDF → {FULL_PDF.relative_to(ROOT)}")
    return FULL_PDF


def extract_category_pdfs(full: Path) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    LINKED_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(full)
    try:
        for page_num, slug, app_name, art_name in CATEGORY_PAGES:
            idx = page_num - 1
            if idx < 0 or idx >= len(doc):
                raise ValueError(f"Pagină invalidă {page_num} pentru {slug}")
            single = fitz.open()
            single.insert_pdf(doc, from_page=idx, to_page=idx)
            out_app = OUT_DIR / app_name
            single.save(str(out_app))
            # același conținut, denumire Checklist_Client_ArtGranit-…
            out_art = OUT_DIR / art_name
            shutil.copy2(out_app, out_art)
            linked = LINKED_DIR / art_name
            shutil.copy2(out_app, linked)
            single.close()
            print(f"  {slug} → {out_app.name} + {art_name}")
        # full în linked-manuals (pentru PDF ghid offline)
        shutil.copy2(full, LINKED_DIR / "Checklist_Client_ArtGranit.pdf")
        print(f"  linked ← Checklist_Client_ArtGranit.pdf")
    finally:
        doc.close()


def render_png_pages(full: Path) -> None:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(full)
    try:
        for page_num, slug, _, _ in CATEGORY_PAGES:
            idx = page_num - 1
            pix = doc[idx].get_pixmap(dpi=RENDER_DPI, alpha=False)
            out = PAGES_DIR / f"{slug}.png"
            pix.save(str(out))
            print(
                f"  PNG {slug} → {out.name} "
                f"({pix.width}x{pix.height}px, {out.stat().st_size // 1024} KB)"
            )
    finally:
        doc.close()


def main() -> None:
    render_only = "--render-only" in sys.argv
    if not render_only:
        full = copy_full_pdf()
        extract_category_pdfs(full)
    else:
        full = FULL_PDF if FULL_PDF.exists() else LEGACY_FULL
        if not full.exists():
            raise FileNotFoundError(f"Lipsește PDF: {FULL_PDF}")
    print(f"Rendering PNG at {RENDER_DPI} DPI…")
    render_png_pages(full)
    print("Done.")


if __name__ == "__main__":
    main()
