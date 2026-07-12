#!/usr/bin/env python3
"""Descarcă manualul Bosch GLM 40 și generează pagini PNG ilustrative."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF_URL = "https://www.boschtools.com/ca/en/ocsmedia/GLM_40_Manual.pdf"
PDF_OUT = ROOT / "public/docs/equipment/bosch-glm-40/bosch-glm-40-manual-ro.pdf"
PAGES_DIR = ROOT / "public/docs/equipment/bosch-glm-40/pages"
MANIFEST = ROOT / "src/data/bosch-glm-40-manifest.json"
ILLUSTRATION_PAGES = [2, 3, 4, 12, 14, 16, 17]
RENDER_SCALE = 3

VIDEO_IDS = {
    "overview": "ck8hgxavkR4",
    "howto": "6hZxO5xUjtE",
    "demo_ro": "d76uCeNqlRE",
}


def download_pdf() -> None:
    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    if PDF_OUT.exists() and PDF_OUT.stat().st_size > 100_000:
        print(f"PDF exists → {PDF_OUT.relative_to(ROOT)}")
        return
    print("Downloading official Bosch GLM 40 manual…")
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
        "pdf": "/docs/equipment/bosch-glm-40/bosch-glm-40-manual-ro.pdf",
        "pagesDir": "/docs/equipment/bosch-glm-40/pages",
        "videosDir": "/docs/equipment/bosch-glm-40/videos",
        "videoIds": list(VIDEO_IDS.values()),
        "videos": VIDEO_IDS,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)}")


def main() -> None:
    download_pdf()
    print("Rendering illustration pages…")
    render_pages()
    (ROOT / "public/docs/equipment/bosch-glm-40/videos").mkdir(parents=True, exist_ok=True)
    write_manifest()
    print("Done.")


if __name__ == "__main__":
    main()
