#!/usr/bin/env python3
"""Checklist măsurători — copiază PDF sursă, extrage 7 PDF-uri per categorie + PNG."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(r"c:\Users\AlioSol\Desktop\Chek list masuratori.pdf")
OUT_DIR = ROOT / "public/docs/operational-guide/checklists"
PAGES_DIR = OUT_DIR / "pages"
FULL_PDF = ROOT / "public/docs/operational-guide/checklist-masuratori-full.pdf"
RENDER_DPI = 300

# Pagină sursă (1-based) → slug fișier
CATEGORY_PAGES: list[tuple[int, str, str]] = [
    (1, "blat", "Checklist-masuratori-Blat.pdf"),
    (2, "scara", "Checklist-masuratori-Scara.pdf"),
    (3, "placare", "Checklist-masuratori-Placare.pdf"),
    (4, "semineu", "Checklist-masuratori-Semineu.pdf"),
    (5, "scara-exterior", "Checklist-masuratori-Scari-exterioare.pdf"),
    (6, "glaf", "Checklist-masuratori-Glaf.pdf"),
    (7, "placare-exterior", "Checklist-masuratori-Placari-exterioare.pdf"),
]


def copy_full_pdf() -> None:
    if not SOURCE_PDF.exists():
        raise FileNotFoundError(f"Lipsește PDF sursă: {SOURCE_PDF}")
    FULL_PDF.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_PDF, FULL_PDF)
    print(f"PDF complet → {FULL_PDF.relative_to(ROOT)}")


def extract_category_pdfs() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(FULL_PDF)
    try:
        for page_num, slug, filename in CATEGORY_PAGES:
            idx = page_num - 1
            if idx < 0 or idx >= len(doc):
                raise ValueError(f"Pagină invalidă {page_num} pentru {slug}")
            single = fitz.open()
            single.insert_pdf(doc, from_page=idx, to_page=idx)
            out_pdf = OUT_DIR / filename
            single.save(str(out_pdf))
            single.close()
            print(f"  {slug} → {out_pdf.relative_to(ROOT)}")
    finally:
        doc.close()


def render_png_pages() -> None:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(FULL_PDF)
    try:
        for page_num, slug, _ in CATEGORY_PAGES:
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
        copy_full_pdf()
        extract_category_pdfs()
    elif not FULL_PDF.exists():
        raise FileNotFoundError(f"Lipsește PDF: {FULL_PDF}")
    print(f"Rendering PNG at {RENDER_DPI} DPI…")
    render_png_pages()
    print("Done.")


if __name__ == "__main__":
    main()
