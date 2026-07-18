#!/usr/bin/env python3
"""Copiază PDF mobilier Cosentino Spaces, generează pagini PNG și manifest."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\furniture-design-and-installation-en1_2a5d4032cff14a33b05f5e0761dc4380_output_b14f84545521466c8cd75ce001c3df3b.pdf"
)
PDF_OUT = ROOT / "public/docs/repository/cosentino-furniture/furniture-design-installation.pdf"
PAGES_DIR = ROOT / "public/docs/repository/cosentino-furniture/pages"
MANIFEST = ROOT / "src/data/cosentino-furniture-manifest.json"
RENDER_DPI = 450


def copy_pdf() -> None:
    if not SOURCE_PDF.exists():
        raise FileNotFoundError(f"Lipsește PDF sursă: {SOURCE_PDF}")
    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_PDF, PDF_OUT)
    print(f"PDF → {PDF_OUT.relative_to(ROOT)} ({PDF_OUT.stat().st_size // 1024} KB)")


def render_pages() -> int:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_OUT)
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(dpi=RENDER_DPI, alpha=False)
        out = PAGES_DIR / f"page-{i + 1:02d}.png"
        pix.save(str(out))
        print(
            f"  page {i + 1:02d} → {out.name} "
            f"({pix.width}x{pix.height}px, {out.stat().st_size // 1024} KB)"
        )
    count = len(doc)
    doc.close()
    return count


def write_manifest(page_count: int) -> None:
    manifest = {
        "pdf": "/docs/repository/cosentino-furniture/furniture-design-installation.pdf",
        "pagesDir": "/docs/repository/cosentino-furniture/pages",
        "pageCount": page_count,
        "videoIds": [],
        "pageHotspots": {},
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)}")


def main() -> None:
    render_only = "--render-only" in sys.argv
    if not render_only:
        copy_pdf()
    elif not PDF_OUT.exists():
        raise FileNotFoundError(f"Lipsește PDF: {PDF_OUT}")
    print(f"Rendering pages at {RENDER_DPI} DPI…")
    count = render_pages()
    write_manifest(count)
    print("Done.")


if __name__ == "__main__":
    main()
