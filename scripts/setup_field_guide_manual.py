#!/usr/bin/env python3
"""Copiază PDF Ghid teren ArtGranit, generează pagini PNG și manifest."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DESKTOP_PDF = Path(r"c:\Users\AlioSol\Desktop\Ghid_Teren_Atentie_ArtGranit_163540.pdf")
FALLBACK_PDFS = [
    Path(r"c:\Users\AlioSol\Desktop\Ghid_Teren_Atentie_complet_152153.pdf"),
    Path(r"c:\Users\AlioSol\Desktop\Ghid_Teren_Atentie_complet_145433.pdf"),
]
EXISTING_PDF = ROOT / "public/docs/operational-guide/Ghid-teren-masurare.pdf"
PDF_OUT = ROOT / "public/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf"
PAGES_DIR = ROOT / "public/docs/operational-guide/field-guide/pages"
MANIFEST = ROOT / "src/data/field-guide-manifest.json"
RENDER_DPI = 450


def resolve_source() -> Path:
    if DESKTOP_PDF.exists():
        return DESKTOP_PDF
    for path in FALLBACK_PDFS:
        if path.exists():
            return path
    if EXISTING_PDF.exists():
        return EXISTING_PDF
    raise FileNotFoundError(f"Lipsește PDF sursă: {DESKTOP_PDF}")


def copy_pdf() -> None:
    source = resolve_source()
    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, PDF_OUT)
    EXISTING_PDF.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, EXISTING_PDF)
    print(f"PDF ← {source.name}")
    print(f"PDF → {PDF_OUT.relative_to(ROOT)} ({PDF_OUT.stat().st_size // 1024} KB)")


def render_pages() -> int:
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    for old in PAGES_DIR.glob("page-*.png"):
        old.unlink()
    doc = fitz.open(PDF_OUT)
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(dpi=RENDER_DPI, alpha=False)
        out = PAGES_DIR / f"page-{i + 1:02d}.png"
        pix.save(str(out))
        print(
            f"  page {i + 1:02d} → {out.name} "
            f"({pix.width}x{pix.height}px, {out.stat().st_size // 1024} KB)"
        )
    count = len(doc)
    doc.close()
    return count


def write_manifest(page_count: int) -> dict:
    manifest = {
        "pdf": "/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf",
        "pagesDir": "/docs/operational-guide/field-guide/pages",
        "pageCount": page_count,
        "source": "Ghid_Teren_Atentie_ArtGranit_163540.pdf",
        "structure": "etape-compact",
        "videoIds": [],
        "pageHotspots": {},
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)}")
    return manifest


def main() -> None:
    render_only = "--render-only" in sys.argv
    skip_patch = "--skip-equipment-links" in sys.argv
    if not render_only:
        copy_pdf()
    elif not PDF_OUT.exists():
        raise FileNotFoundError(f"Lipsește PDF: {PDF_OUT}")

    if not skip_patch:
        import subprocess

        patch_script = Path(__file__).resolve().parent / "patch_field_guide_equipment_links.py"
        print("Patch equipment links (Etapa 1.1)…")
        subprocess.check_call([sys.executable, str(patch_script), "--no-render"])

    print(f"Rendering pages at {RENDER_DPI} DPI…")
    count = render_pages()
    write_manifest(count)
    print("Done.")


if __name__ == "__main__":
    main()
