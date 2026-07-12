#!/usr/bin/env python3
"""Descarcă manualul Bosch GLL 3-80 și generează pagini PNG ilustrative."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF_URL = "https://www.bosch-professional.com/binary/manualsmedia/o401920v21_160992A8AT_202211.pdf"
PDF_OUT = ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/bosch-gll-3-80/pages"
MANIFEST = ROOT / "src/data/bosch-gll-3-80-manifest.json"
# Pagini cu desene din manualul oficial (secțiune EN — ilustrații universale)
ILLUSTRATION_PAGES = [13, 14, 15, 16, 17, 18]
RENDER_SCALE = 3

VIDEO_IDS = {
    "overview": "qFUVfZ27hh0",
    "operation": "7zhZHo0UIrg",
    "crossline": "zlsrkgk8Rmw",
}


def download_pdf() -> None:
    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    if PDF_OUT.exists() and PDF_OUT.stat().st_size > 500_000:
        print(f"PDF exists → {PDF_OUT.relative_to(ROOT)}")
        return
    print("Downloading official Bosch manual…")
    data = urllib.request.urlopen(PDF_URL, timeout=120).read()
    PDF_OUT.write_bytes(data)
    print(f"PDF → {PDF_OUT.relative_to(ROOT)} ({len(data) // 1024} KB)")


def render_pages() -> None:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_OUT)
    for p in ILLUSTRATION_PAGES:
        if p > len(doc):
            continue
        pix = doc[p - 1].get_pixmap(matrix=fitz.Matrix(RENDER_SCALE, RENDER_SCALE), alpha=False)
        out = PAGES_DIR / f"page-{p:02d}.png"
        pix.save(str(out))
        print(f"  page {p:02d} → {out.name} ({out.stat().st_size // 1024} KB)")
    doc.close()


def write_manifest() -> None:
    manifest = {
        "pdf": "/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf",
        "pagesDir": "/docs/equipment/bosch-gll-3-80/pages",
        "videosDir": "/docs/equipment/bosch-gll-3-80/videos",
        "videoIds": list(VIDEO_IDS.values()),
        "videos": VIDEO_IDS,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)}")


def main() -> None:
    download_pdf()
    print("Rendering illustration pages…")
    render_pages()
    (ROOT / "public/docs/equipment/bosch-gll-3-80/videos").mkdir(parents=True, exist_ok=True)
    write_manifest()
    print("Done.")


if __name__ == "__main__":
    main()
