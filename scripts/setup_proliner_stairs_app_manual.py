#!/usr/bin/env python3
"""Copiază PDF APLICAȚIE PROLINER SCĂRI, generează pagini PNG și manifest."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from manual_hotspot_utils import (
    extract_film_icon_hotspots_from_pdf,
    extract_orphan_filmstrip_hotspots_from_pdf,
    extract_thumbnail_hotspots_from_pdf,
)

# Link YouTube pierdut la traducerea PDF — pag. 4 are miniatură film strip (1.1 Rezumat).
ORPHAN_FILMSTRIP_VIDEOS: dict[str, str] = {
    "4": "ZbYBUY10qtU",
}

SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\3ac1cf78ac51b3d4c3c2559d8321e27b06e0432bea1a64165b02c2ec10fb3292_fa3cb1dff8394c7199486cff3e50d392_output_e723d872971c4faea7487e4c88ff6265.pdf"
)
PDF_OUT = ROOT / "public/docs/equipment/proliner-stairs-app-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/proliner-stairs-app/pages"
MANIFEST = ROOT / "src/data/proliner-stairs-app-manifest.json"
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
    thumbs, thumb_ids = extract_thumbnail_hotspots_from_pdf(PDF_OUT)
    icons, icon_ids = extract_film_icon_hotspots_from_pdf(PDF_OUT)
    orphans, orphan_ids = extract_orphan_filmstrip_hotspots_from_pdf(
        PDF_OUT, ORPHAN_FILMSTRIP_VIDEOS
    )
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []
    for page_key in sorted(set(thumbs) | set(icons) | set(orphans), key=int):
        combined = thumbs.get(page_key, []) + icons.get(page_key, []) + orphans.get(page_key, [])
        pages[page_key] = sorted(combined, key=lambda s: s["y"])
        all_ids.extend(s["videoId"] for s in combined)
    unique_ids = sorted(set(all_ids))
    manifest = {
        "pdf": "/docs/equipment/proliner-stairs-app-manual-ro.pdf",
        "pagesDir": "/docs/equipment/proliner-stairs-app/pages",
        "videosDir": "/docs/equipment/proliner-stairs-app/videos",
        "pageCount": len(list(PAGES_DIR.glob("page-*.png"))),
        "videoIds": unique_ids,
        "pageHotspots": pages,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    hotspot_count = sum(len(v) for v in pages.values())
    print(f"Manifest → {MANIFEST.relative_to(ROOT)} ({len(unique_ids)} videoclipuri, {hotspot_count} hotspot-uri)")
    return manifest


def main() -> None:
    hotspots_only = "--hotspots-only" in sys.argv
    if not hotspots_only:
        copy_pdf()
        print("Rendering pages…")
        render_pages()
    elif not PDF_OUT.exists():
        copy_pdf()
    extract_hotspots()
    (ROOT / "public/docs/equipment/proliner-stairs-app/videos").mkdir(parents=True, exist_ok=True)
    print("Done.")


if __name__ == "__main__":
    main()
