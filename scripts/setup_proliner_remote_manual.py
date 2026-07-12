#!/usr/bin/env python3
"""Copiază PDF PROLINER TELECOMANDĂ, generează pagini PNG și manifest hotspot-uri video."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from manual_hotspot_utils import extract_thumbnail_hotspots_from_pdf
SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\d8f63bae6a688140f1d92d9da696e7fd475ab7941d61e6063482018d0501bd06_d0137887898f424f94fe82f4504fb598_output_7ad8f82ffe434d52adb85d0089343f9a.pdf"
)
PDF_OUT = ROOT / "public/docs/equipment/proliner-remote-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/proliner-remote/pages"
MANIFEST = ROOT / "src/data/proliner-remote-manifest.json"
RENDER_SCALE = 4


def youtube_id(uri: str) -> str:
    if "youtu.be/" in uri:
        return uri.split("youtu.be/")[-1].split("?")[0]
    m = re.search(r"[?&]v=([^&]+)", uri)
    return m.group(1) if m else uri


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
        pix = page.get_pixmap(matrix=fitz.Matrix(RENDER_SCALE, RENDER_SCALE), alpha=False)
        out = PAGES_DIR / f"page-{i + 1:02d}.png"
        pix.save(str(out))
        print(f"  page {i + 1:02d} → {out.name} ({out.stat().st_size // 1024} KB)")
    count = len(doc)
    doc.close()
    return count


def extract_hotspots() -> dict:
    pages, unique_ids = extract_thumbnail_hotspots_from_pdf(PDF_OUT)
    manifest = {
        "pdf": "/docs/equipment/proliner-remote-manual-ro.pdf",
        "pagesDir": "/docs/equipment/proliner-remote/pages",
        "videosDir": "/docs/equipment/proliner-remote/videos",
        "pageCount": len(list(PAGES_DIR.glob("page-*.png"))),
        "videoIds": unique_ids,
        "pageHotspots": pages,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)} ({len(unique_ids)} videoclipuri)")
    return manifest


def main() -> None:
    hotspots_only = "--hotspots-only" in sys.argv
    if not hotspots_only:
        copy_pdf()
        print("Rendering pages…")
        render_pages()
    elif not PDF_OUT.exists():
        raise FileNotFoundError(f"Lipsește PDF: {PDF_OUT}")
    extract_hotspots()
    (ROOT / "public/docs/equipment/proliner-remote/videos").mkdir(parents=True, exist_ok=True)
    print("Done.")


if __name__ == "__main__":
    main()
