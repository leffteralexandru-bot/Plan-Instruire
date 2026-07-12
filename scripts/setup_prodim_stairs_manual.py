#!/usr/bin/env python3
"""Copiază PDF SCĂRI PRODIM, generează pagini PNG și manifest hotspot-uri video."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(
    r"c:\Users\AlioSol\Desktop\5cd793bd5c516d8a96c601a2dad25018b9532275d687728e179eb92cca8c263c_0e4492029c0549a3b6b248ef93f87d94_output_a1691ebcf0a141ab9c486b33c4ac3eb4.pdf"
)
PDF_OUT = ROOT / "public/docs/equipment/prodim-stairs-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/prodim-stairs/pages"
MANIFEST = ROOT / "src/data/prodim-stairs-manifest.json"
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
    doc = fitz.open(PDF_OUT)
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []

    for pi, page in enumerate(doc):
        w, h = page.rect.width, page.rect.height
        by_id: dict[str, list[float]] = {}
        for link in page.get_links():
            uri = link.get("uri", "")
            if "youtu" not in uri:
                continue
            vid = youtube_id(uri)
            rect = link["from"]
            bbox = [
                round(rect.x0 / w * 100, 2),
                round(rect.y0 / h * 100, 2),
                round((rect.x1 - rect.x0) / w * 100, 2),
                round((rect.y1 - rect.y0) / h * 100, 2),
            ]
            if vid not in by_id:
                by_id[vid] = bbox
                all_ids.append(vid)

        if by_id:
            pages[str(pi + 1)] = [
                {"videoId": vid, "x": b[0], "y": b[1], "w": b[2], "h": b[3]}
                for vid, b in sorted(by_id.items())
            ]

    doc.close()
    unique_ids = sorted(set(all_ids))
    manifest = {
        "pdf": "/docs/equipment/prodim-stairs-manual-ro.pdf",
        "pagesDir": "/docs/equipment/prodim-stairs/pages",
        "videosDir": "/docs/equipment/prodim-stairs/videos",
        "pageCount": len(list(PAGES_DIR.glob("page-*.png"))),
        "videoIds": unique_ids,
        "pageHotspots": pages,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)} ({len(unique_ids)} videoclipuri)")
    return manifest


def main() -> None:
    copy_pdf()
    print("Rendering pages…")
    render_pages()
    extract_hotspots()
    (ROOT / "public/docs/equipment/prodim-stairs/videos").mkdir(parents=True, exist_ok=True)
    print("Done.")


if __name__ == "__main__":
    main()
