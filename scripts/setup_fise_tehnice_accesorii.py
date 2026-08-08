#!/usr/bin/env python3
"""
Exemple fișe tehnice accesorii (Etapa 1.7) — descarcă spec sheets publice
(chiuvetă / baterie / plită), extrage pagina 1 ca imagine, construiește PDF exemplu.
"""

from __future__ import annotations

import ssl
import sys
import urllib.request
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public/docs/operational-guide/field-guide/fise-tehnice-exemple"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
OUT_PDF = LINKED_DIR / "Exemple_Fise_Tehnice_Accesorii.pdf"
CACHE_DIR = OUT_DIR / "_source"
RENDER_DPI = 160

# Spec sheets publice (producători) — doar pag. 1 ca exemplu vizual
SOURCES: list[dict] = [
    {
        "id": "chiuveta",
        "label": "Chiuvetă — exemplu fișă tehnică (Franke Cube)",
        "note": "Cote decupaj / adâncime / tip montaj — pe teren le verifici pe fișa reală din Bitrix.",
        "url": "https://www.franke.com/content/dam/franke/us/en/home-solutions/documents/2022-franke-spec-sheets/sinks/cube/CUX11023.pdf",
        "file": "franke-chiuveta.pdf",
    },
    {
        "id": "baterie",
        "label": "Baterie — exemplu fișă tehnică (Hansgrohe Zesis)",
        "note": "Ø găuri pe blat / adâncime maximă blat — esențial la măsurare.",
        "url": "https://assets.hansgrohe.com/mam/celum/celum_assets/16__hruh1202_pdf.pdf",
        "file": "hansgrohe-baterie.pdf",
    },
    {
        "id": "plita",
        "label": "Plită — exemplu fișă tehnică (Bosch Induction)",
        "note": "Decupaj HxLxA + distanțe minime — fără fișă, golul pe blat e greșit.",
        "url": "https://media3.bosch-home.com/Documents/25980173_NIT8461UC_Spec_Sheet.pdf",
        "file": "bosch-plita.pdf",
    },
]


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 10_000:
        print(f"  cache OK {dest.name}")
        return
    print(f"  download ← {url.split('/')[-1]}")
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (artgranit-training)"})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        dest.write_bytes(resp.read())
    print(f"  saved {dest.name} ({dest.stat().st_size // 1024} KB)")


def page1_pixmap(pdf_path: Path) -> fitz.Pixmap:
    doc = fitz.open(pdf_path)
    try:
        page = doc[0]
        return page.get_pixmap(dpi=RENDER_DPI, alpha=False)
    finally:
        doc.close()


def build_example_pdf() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    LINKED_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # A4
    page_w, page_h = 595.28, 841.89
    margin = 36
    out = fitz.open()

    for src in SOURCES:
        cache_pdf = CACHE_DIR / src["file"]
        download(src["url"], cache_pdf)
        pix = page1_pixmap(cache_pdf)
        png_path = OUT_DIR / f"{src['id']}.png"
        pix.save(str(png_path))
        print(f"  png → {png_path.name} ({pix.width}x{pix.height})")

        page = out.new_page(width=page_w, height=page_h)
        # header
        page.insert_text(
            fitz.Point(margin, 28),
            "Exemple fișe tehnice accesorii · Intern artGRANIT",
            fontsize=8,
            fontname="helv",
            color=(0.4, 0.4, 0.4),
        )
        page.insert_text(
            fitz.Point(margin, 48),
            src["label"],
            fontsize=12,
            fontname="hebo",
            color=(0.06, 0.27, 0.55),
        )
        page.insert_textbox(
            fitz.Rect(margin, 56, page_w - margin, 78),
            src["note"] + " Documentul REAL e cel din Bitrix / Documentație tehnică.",
            fontsize=8,
            fontname="helv",
            color=(0.25, 0.25, 0.25),
        )

        # fit image below header
        max_w = page_w - 2 * margin
        max_h = page_h - 100
        scale = min(max_w / pix.width, max_h / pix.height)
        w, h = pix.width * scale, pix.height * scale
        x0 = (page_w - w) / 2
        y0 = 88
        rect = fitz.Rect(x0, y0, x0 + w, y0 + h)
        page.insert_image(rect, filename=str(png_path))
        page.draw_rect(rect, color=(0.75, 0.75, 0.75), width=0.6)

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT_PDF, garbage=3, deflate=True)
    out.close()
    print(f"PDF → {OUT_PDF.relative_to(ROOT)} ({OUT_PDF.stat().st_size // 1024} KB)")
    return OUT_PDF


def main() -> None:
    try:
        build_example_pdf()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
    print("Done.")


if __name__ == "__main__":
    main()
