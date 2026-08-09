#!/usr/bin/env python3
"""
Re-randare PNG ghid măsurare + proiectare la DPI ridicat (din PDF-urile deja în repo).
Nu necesită PDF-uri de pe Desktop.

  python scripts/rerender_guide_pages.py
  python scripts/rerender_guide_pages.py --dpi 480
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DPI = 450


def render_pdf(pdf_path: Path, pages_dir: Path, dpi: int) -> int:
    if not pdf_path.exists():
        print(f"  skip (lipsește PDF): {pdf_path.relative_to(ROOT)}")
        return 0
    pages_dir.mkdir(parents=True, exist_ok=True)
    for old in pages_dir.glob("page-*.png"):
        old.unlink()
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        pix = doc[i].get_pixmap(dpi=dpi, alpha=False)
        out = pages_dir / f"page-{i + 1:02d}.png"
        pix.save(out.as_posix())
        print(
            f"  {out.relative_to(ROOT)} "
            f"{pix.width}x{pix.height}px ({out.stat().st_size // 1024} KB)"
        )
    n = len(doc)
    doc.close()
    return n


def main() -> None:
    parser = argparse.ArgumentParser(description="Re-randare pagini ghid la DPI mare")
    parser.add_argument("--dpi", type=int, default=DEFAULT_DPI)
    parser.add_argument(
        "--only",
        choices=("field", "design", "all"),
        default="all",
        help="Doar măsurare, doar proiectare, sau ambele",
    )
    args = parser.parse_args()
    dpi = args.dpi
    print(f"DPI = {dpi}")

    jobs: list[tuple[Path, Path]] = []

    if args.only in ("field", "all"):
        field = ROOT / "public/docs/operational-guide/field-guide"
        jobs.append((field / "Ghid-teren-masurare.pdf", field / "pages"))
        by_type = field / "by-type"
        if by_type.is_dir():
            for tip_dir in sorted(by_type.iterdir()):
                if tip_dir.is_dir():
                    pdf = tip_dir / "Ghid-teren-masurare.pdf"
                    if pdf.exists():
                        jobs.append((pdf, tip_dir / "pages"))

    if args.only in ("design", "all"):
        design = ROOT / "public/docs/operational-guide/design-guide"
        jobs.append((design / "Ghid-proiectare-cad.pdf", design / "pages"))
        by_type = design / "by-type"
        if by_type.is_dir():
            for tip_dir in sorted(by_type.iterdir()):
                if tip_dir.is_dir():
                    pdf = tip_dir / "Ghid-proiectare-cad.pdf"
                    if pdf.exists():
                        jobs.append((pdf, tip_dir / "pages"))

    if not jobs:
        raise SystemExit("Nicio țintă de randat.")

    total = 0
    for pdf, pages in jobs:
        print(f"Render {pdf.relative_to(ROOT)}…")
        total += render_pdf(pdf, pages, dpi)

    print(f"Done — {total} pagini la {dpi} DPI.")


if __name__ == "__main__":
    main()
