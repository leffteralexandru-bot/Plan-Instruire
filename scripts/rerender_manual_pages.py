#!/usr/bin/env python3
"""
Re-randare pagini Repository Tehnic + Utilaje (Mentenanță) la DPI ridicat.

Ghidul operațional e deja la 450 DPI (A4 ≈ 3721×5262).
Utilajele erau la scale 3–4 (≈216–288 DPI) — se ridică la 450.
Repository (Silestone/Dekton A5) era deja ~450 pentru format; se urcă la 500
pentru text mai clar pe ecran.

  python scripts/rerender_manual_pages.py
  python scripts/rerender_manual_pages.py --only equipment
  python scripts/rerender_manual_pages.py --only repository --dpi 500
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EQUIPMENT_DPI = 450
DEFAULT_REPO_DPI = 500

# PDF complet → folder pages (toate paginile, page-01…)
FULL_PDF_JOBS: list[tuple[Path, Path]] = [
    # Repository Tehnic
    (
        ROOT / "public/docs/repository/silestone/silestone-countertops-manual.pdf",
        ROOT / "public/docs/repository/silestone/pages",
    ),
    (
        ROOT / "public/docs/repository/dekton-kitchen/dekton-kitchen-countertops-manual.pdf",
        ROOT / "public/docs/repository/dekton-kitchen/pages",
    ),
    (
        ROOT / "public/docs/repository/cosentino-furniture/furniture-design-installation.pdf",
        ROOT / "public/docs/repository/cosentino-furniture/pages",
    ),
    (
        ROOT / "public/docs/repository/silestone-sinks/integrity-guide.pdf",
        ROOT / "public/docs/repository/silestone-sinks/integrity-guide/pages",
    ),
    (
        ROOT / "public/docs/repository/silestone-sinks/install-drawings.pdf",
        ROOT / "public/docs/repository/silestone-sinks/install-drawings/pages",
    ),
    # Utilaje / Mentenanță
    (
        ROOT / "public/docs/equipment/proliner-quick-start-ro.pdf",
        ROOT / "public/docs/equipment/proliner/pages",
    ),
    (
        ROOT / "public/docs/equipment/proliner-soft-manual-ro.pdf",
        ROOT / "public/docs/equipment/proliner-soft/pages",
    ),
    (
        ROOT / "public/docs/equipment/prodim-ct-manual-ro.pdf",
        ROOT / "public/docs/equipment/prodim-ct/pages",
    ),
    (
        ROOT / "public/docs/equipment/prodim-stairs-manual-ro.pdf",
        ROOT / "public/docs/equipment/prodim-stairs/pages",
    ),
    (
        ROOT / "public/docs/equipment/proliner-stairs-app-manual-ro.pdf",
        ROOT / "public/docs/equipment/proliner-stairs-app/pages",
    ),
    (
        ROOT / "public/docs/equipment/proliner-remote-manual-ro.pdf",
        ROOT / "public/docs/equipment/proliner-remote/pages",
    ),
    (
        ROOT / "public/docs/equipment/proliner-new-remote-manual-ro.pdf",
        ROOT / "public/docs/equipment/proliner-new-remote/pages",
    ),
    (
        ROOT / "public/docs/equipment/factory-fabricator-manual-ro.pdf",
        ROOT / "public/docs/equipment/factory-fabricator/pages",
    ),
]

# Doar pagini selectate (index 1-based), păstrează numele page-NN.png
SELECTIVE_JOBS: list[tuple[Path, Path, list[int]]] = [
    (
        ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf",
        ROOT / "public/docs/equipment/bosch-gll-3-80/pages",
        [3, 4, 5, 133, 134, 135, 136, 137, 138],
    ),
    (
        ROOT / "public/docs/equipment/bosch-glm-40/bosch-glm-40-manual-ro.pdf",
        ROOT / "public/docs/equipment/bosch-glm-40/pages",
        [2, 3, 4, 12, 14, 16, 17],
    ),
]


def render_all_pages(pdf_path: Path, pages_dir: Path, dpi: int) -> int:
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


def render_selective(pdf_path: Path, pages_dir: Path, page_nums: list[int], dpi: int) -> int:
    if not pdf_path.exists():
        print(f"  skip (lipsește PDF): {pdf_path.relative_to(ROOT)}")
        return 0
    pages_dir.mkdir(parents=True, exist_ok=True)
    # păstrează alte PNG-uri (ex. tape product shots) — șterge doar paginile regenerabile
    for n in page_nums:
        old = pages_dir / f"page-{n:02d}.png"
        if old.exists():
            old.unlink()
    doc = fitz.open(pdf_path)
    count = 0
    for n in page_nums:
        if n < 1 or n > len(doc):
            print(f"  skip page {n} (în afara PDF)")
            continue
        pix = doc[n - 1].get_pixmap(dpi=dpi, alpha=False)
        out = pages_dir / f"page-{n:02d}.png"
        pix.save(out.as_posix())
        print(
            f"  {out.relative_to(ROOT)} "
            f"{pix.width}x{pix.height}px ({out.stat().st_size // 1024} KB)"
        )
        count += 1
    doc.close()
    return count


def is_repo(path: Path) -> bool:
    return "repository" in path.as_posix().replace("\\", "/")


def main() -> None:
    parser = argparse.ArgumentParser(description="Re-randare manuale Repository + Utilaje")
    parser.add_argument("--dpi-equipment", type=int, default=DEFAULT_EQUIPMENT_DPI)
    parser.add_argument("--dpi-repo", type=int, default=DEFAULT_REPO_DPI)
    parser.add_argument(
        "--only",
        choices=("equipment", "repository", "all"),
        default="all",
    )
    args = parser.parse_args()

    print(f"Equipment DPI = {args.dpi_equipment}")
    print(f"Repository DPI = {args.dpi_repo}")

    total = 0
    for pdf, pages in FULL_PDF_JOBS:
        repo = is_repo(pdf)
        if args.only == "equipment" and repo:
            continue
        if args.only == "repository" and not repo:
            continue
        dpi = args.dpi_repo if repo else args.dpi_equipment
        print(f"\n→ {pdf.relative_to(ROOT)} @ {dpi} DPI")
        total += render_all_pages(pdf, pages, dpi)

    if args.only in ("equipment", "all"):
        for pdf, pages, nums in SELECTIVE_JOBS:
            print(f"\n→ {pdf.relative_to(ROOT)} (pagini selective) @ {args.dpi_equipment} DPI")
            total += render_selective(pdf, pages, nums, args.dpi_equipment)

    print(f"\nGata — {total} pagini regenerate.")
    print("Notă: Bosch Ruletă 5 m rămâne pe imagini produs (nu PDF paginat).")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"Eroare: {exc}", file=sys.stderr)
        sys.exit(1)
