#!/usr/bin/env python3
"""Copiază PDF CT 3.1 TELECOMANDĂ NOUĂ, generează pagini PNG și manifest."""

from __future__ import annotations

import json
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

SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\30ad2775232c43b3099ee259e093d3b74af3a72ed5c9fcf7a38279ac6cec07e2_0b6fdf528fc94aebb6acecfdefb57c44_output_74a84ec8e15e41c19ab2c635eaa41074.pdf"
)
PDF_OUT = ROOT / "public/docs/equipment/proliner-new-remote-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/proliner-new-remote/pages"
MANIFEST = ROOT / "src/data/proliner-new-remote-manifest.json"
RENDER_SCALE = 4


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
    thumbs, _ = extract_thumbnail_hotspots_from_pdf(PDF_OUT)
    icons, _ = extract_film_icon_hotspots_from_pdf(PDF_OUT)
    orphans, _ = extract_orphan_filmstrip_hotspots_from_pdf(PDF_OUT)
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []
    for page_key in sorted(set(thumbs) | set(icons) | set(orphans), key=int):
        combined = thumbs.get(page_key, []) + icons.get(page_key, []) + orphans.get(page_key, [])
        pages[page_key] = sorted(combined, key=lambda s: s["y"])
        all_ids.extend(s["videoId"] for s in combined)
    unique_ids = sorted(set(all_ids))
    manifest = {
        "pdf": "/docs/equipment/proliner-new-remote-manual-ro.pdf",
        "pagesDir": "/docs/equipment/proliner-new-remote/pages",
        "videosDir": "/docs/equipment/proliner-new-remote/videos",
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
    (ROOT / "public/docs/equipment/proliner-new-remote/videos").mkdir(parents=True, exist_ok=True)
    print("Done.")


if __name__ == "__main__":
    main()
