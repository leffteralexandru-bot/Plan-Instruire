#!/usr/bin/env python3
"""Descarcă imagini produs + PDF Bosch Ruletă 5 m și generează pagini ilustrative."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public/docs/equipment/bosch-tape-5m"
PAGES_DIR = OUT_DIR / "pages"
MANIFEST = ROOT / "src/data/bosch-tape-5m-manifest.json"

PDF_URL = "https://www.bosch-professional.com/binary/manualsmedia/o410100v21_160992A8HJ_202302.pdf"
PDF_OUT = OUT_DIR / "bosch-tape-5m-declaratie-ue.pdf"

# Imagini oficiale Bosch Professional (pagina produs gb/en)
IMAGE_SOURCES = {
    "page-01.png": (
        "https://www.bosch-professional.com/gb/en/ocsmedia/"
        "586311-82/product-image/full/tape-measure-5-m-1600a016bh.png"
    ),
    "page-02.png": (
        "https://www.bosch-professional.com/gb/en/ocsmedia/"
        "586066-82/application-image/full/tape-measure-5-m-professional-7867372.png"
    ),
    "page-03.png": (
        "https://www.bosch-professional.com/gb/en/ocsmedia/"
        "586067-82/application-image/full/tape-measure-5-m-professional-7867372.png"
    ),
}

VIDEO_IDS = {
    "howto_ro": "D4XjvT04RxM",
    "tips_ro": "Eyv967IsKlw",
    "pro_tips": "OGsf-SZtW-s",
}


def download_url(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1000:
        print(f"  exists → {dest.relative_to(ROOT)}")
        return
    print(f"  download {dest.name}…")
    data = urllib.request.urlopen(url, timeout=120).read()
    dest.write_bytes(data)
    print(f"  → {dest.relative_to(ROOT)} ({len(data) // 1024} KB)")


def download_pdf() -> None:
    download_url(PDF_URL, PDF_OUT)


def download_images() -> None:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in IMAGE_SOURCES.items():
        download_url(url, PAGES_DIR / name)


def upscale_small_images() -> None:
    """Mărește miniaturile mici la dimensiune lizibilă în manual."""
    for path in sorted(PAGES_DIR.glob("page-*.png")):
        doc = fitz.open()
        img_doc = fitz.open(path)
        pix = img_doc[0].get_pixmap(alpha=False)
        img_doc.close()
        if pix.width >= 600:
            continue
        scale = max(3, 600 // max(pix.width, 1))
        page = doc.new_page(width=pix.width * scale, height=pix.height * scale)
        page.insert_image(page.rect, filename=str(path))
        pix2 = page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
        pix2.save(str(path))
        doc.close()
        print(f"  upscaled {path.name} → {path.stat().st_size // 1024} KB")


def write_manifest() -> None:
    manifest = {
        "pdf": "/docs/equipment/bosch-tape-5m/bosch-tape-5m-declaratie-ue.pdf",
        "pagesDir": "/docs/equipment/bosch-tape-5m/pages",
        "videosDir": "/docs/equipment/bosch-tape-5m/videos",
        "videoIds": list(VIDEO_IDS.values()),
        "videos": VIDEO_IDS,
        "productCode": "1600A016BH",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)}")


def main() -> None:
    print("Bosch Tape 5 m — setup assets…")
    download_pdf()
    print("Product images…")
    download_images()
    upscale_small_images()
    (OUT_DIR / "videos").mkdir(parents=True, exist_ok=True)
    write_manifest()
    print("Done.")


if __name__ == "__main__":
    main()
