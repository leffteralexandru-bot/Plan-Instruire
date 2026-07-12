#!/usr/bin/env python3
"""Copiază PDF Fabricator fabrică, generează pagini PNG și manifest hotspot-uri video."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from manual_hotspot_utils import extract_film_icon_hotspots_from_pdf, normalize_film_icon_bbox, merge_ro_en_film_hotspots

SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\PROLINER-4X-Manual-de-utilizare-artGRANIT_c490b841d3f8482d84c2f14bf29a5d90_output_f76f3edda86142c28d63218988888241.pdf"
)
# Manual EN — are toate linkurile pe iconița film (PDF RO le are incomplete).
EN_PDF = Path(
    r"C:\Users\AlioSol\Desktop\Instructie pentru ingineri\Prodim(Instructie pentru incepatori)\Prodim-Manual-Factory-Fabricator-software.pdf"
)
PDF_OUT = ROOT / "public/docs/equipment/factory-fabricator-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/factory-fabricator/pages"
MANIFEST = ROOT / "src/data/factory-fabricator-manifest.json"
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
    print("Hotspot-uri: poziții RO + completări EN pentru iconițe fără link în RO")
    pages, unique_ids = merge_ro_en_film_hotspots(PDF_OUT, EN_PDF)
    hotspot_count = sum(len(v) for v in pages.values())
    manifest = {
        "pdf": "/docs/equipment/factory-fabricator-manual-ro.pdf",
        "pagesDir": "/docs/equipment/factory-fabricator/pages",
        "videosDir": "/docs/equipment/factory-fabricator/videos",
        "pageCount": len(list(PAGES_DIR.glob("page-*.png"))),
        "videoIds": unique_ids,
        "pageHotspots": pages,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)} ({len(unique_ids)} videoclipuri, {hotspot_count} iconițe film)")
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
    (ROOT / "public/docs/equipment/factory-fabricator/videos").mkdir(parents=True, exist_ok=True)
    print("Done.")


if __name__ == "__main__":
    main()
