#!/usr/bin/env python3
"""Copiază PDF Proliner 4.X, generează pagini PNG și manifest hotspot-uri video."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from manual_hotspot_utils import merge_ro_en_film_hotspots

SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\PROLINER-4X-Manual-de-utilizare-artGRANIT_c490b841d3f8482d84c2f14bf29a5d90_output_f76f3edda86142c28d63218988888241.pdf"
)
# Manual EN — linkuri YouTube pe iconița film (PDF RO tradus le are incomplete).
EN_PDF = Path(
    r"C:\Users\AlioSol\Desktop\Instructie pentru ingineri\Prodim(Instructie pentru incepatori)\Prodim-Manual-Factory-Fabricator-software.pdf"
)
PDF_OUT = ROOT / "public/docs/equipment/proliner-4x-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/proliner-4x/pages"
MANIFEST = ROOT / "src/data/proliner-4x-manifest.json"
RENDER_SCALE = 4


def youtube_id(uri: str) -> str:
    if "youtu.be/" in uri:
        return uri.split("youtu.be/")[-1].split("?")[0]
    m = re.search(r"[?&]v=([^&]+)", uri)
    return m.group(1) if m else uri


def resolve_source() -> Path:
    if len(sys.argv) > 1 and not sys.argv[1].startswith("--"):
        candidate = Path(sys.argv[1])
        if candidate.exists():
            return candidate
    if SOURCE_PDF.exists():
        return SOURCE_PDF
    raise FileNotFoundError(
        "Lipsește PDF-ul Proliner 4.X RO. Plasați fișierul pe Desktop sau pasați calea ca argument."
    )


def copy_pdf(source: Path) -> None:
    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, PDF_OUT)
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
        "pdf": "/docs/equipment/proliner-4x-manual-ro.pdf",
        "pagesDir": "/docs/equipment/proliner-4x/pages",
        "videosDir": "/docs/equipment/proliner-4x/videos",
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
        source = resolve_source()
        copy_pdf(source)
        print("Rendering pages…")
        render_pages()
    elif not PDF_OUT.exists():
        raise FileNotFoundError(f"Lipsește PDF: {PDF_OUT}")
    extract_hotspots()
    (ROOT / "public/docs/equipment/proliner-4x/videos").mkdir(parents=True, exist_ok=True)
    print("Done.")


if __name__ == "__main__":
    main()
