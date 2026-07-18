#!/usr/bin/env python3
"""Copiază PDF-uri chiuvete Silestone Integrity, generează pagini PNG și manifeste."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
RENDER_DPI = 450

MANUALS = [
    {
        "key": "integrity-guide",
        "source": Path(r"c:\Users\AlioSol\Desktop\INTEGRITY.pdf"),
        "pdf_out": ROOT / "public/docs/repository/silestone-sinks/integrity-guide.pdf",
        "pages_dir": ROOT / "public/docs/repository/silestone-sinks/integrity-guide/pages",
        "manifest": ROOT / "src/data/silestone-integrity-manifest.json",
        "public_pdf": "/docs/repository/silestone-sinks/integrity-guide.pdf",
        "public_pages_dir": "/docs/repository/silestone-sinks/integrity-guide/pages",
    },
    {
        "key": "install-drawings",
        "source": Path(
            r"c:\Users\AlioSol\Desktop\INIntegritySilestoneSinksDWGEN_a8eacd8f4b3f485f985aae0be0c2d091_output_f935275ca2b847cfbd703b733e721c4c.pdf"
        ),
        "pdf_out": ROOT / "public/docs/repository/silestone-sinks/install-drawings.pdf",
        "pages_dir": ROOT / "public/docs/repository/silestone-sinks/install-drawings/pages",
        "manifest": ROOT / "src/data/silestone-integrity-drawings-manifest.json",
        "public_pdf": "/docs/repository/silestone-sinks/install-drawings.pdf",
        "public_pages_dir": "/docs/repository/silestone-sinks/install-drawings/pages",
    },
]


def copy_pdf(source: Path, pdf_out: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Lipsește PDF sursă: {source}")
    pdf_out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, pdf_out)
    print(f"PDF → {pdf_out.relative_to(ROOT)} ({pdf_out.stat().st_size // 1024} KB)")


def render_pages(pdf_out: Path, pages_dir: Path) -> int:
    pages_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_out)
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(dpi=RENDER_DPI, alpha=False)
        out = pages_dir / f"page-{i + 1:02d}.png"
        pix.save(str(out))
        print(
            f"  page {i + 1:02d} → {out.name} "
            f"({pix.width}x{pix.height}px, {out.stat().st_size // 1024} KB)"
        )
    count = len(doc)
    doc.close()
    return count


def write_manifest(manifest_path: Path, public_pdf: str, public_pages_dir: str, page_count: int) -> None:
    manifest = {
        "pdf": public_pdf,
        "pagesDir": public_pages_dir,
        "pageCount": page_count,
        "videoIds": [],
        "pageHotspots": {},
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {manifest_path.relative_to(ROOT)}")


def process_manual(cfg: dict, render_only: bool) -> None:
    print(f"\n=== {cfg['key']} ===")
    if not render_only:
        copy_pdf(cfg["source"], cfg["pdf_out"])
    elif not cfg["pdf_out"].exists():
        raise FileNotFoundError(f"Lipsește PDF: {cfg['pdf_out']}")
    print(f"Rendering pages at {RENDER_DPI} DPI…")
    count = render_pages(cfg["pdf_out"], cfg["pages_dir"])
    write_manifest(cfg["manifest"], cfg["public_pdf"], cfg["public_pages_dir"], count)


def main() -> None:
    render_only = "--render-only" in sys.argv
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = arg.split("=", 1)[1]
    for cfg in MANUALS:
        if only and cfg["key"] != only:
            continue
        process_manual(cfg, render_only)
    print("\nDone.")


if __name__ == "__main__":
    main()
