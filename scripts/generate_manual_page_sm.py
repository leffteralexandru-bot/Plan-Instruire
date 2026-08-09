"""Generează variante -sm.png (max 1400px lățime) pentru paginile de manual — mobil/tabletă."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "public" / "docs"
MAX_WIDTH = 1400
# page-01.png → page-01-sm.png; skip already-sm and other names
PAGE_RE = __import__("re").compile(r"^page-\d{2}\.png$", __import__("re").IGNORECASE)


def sm_path(src: Path) -> Path:
    return src.with_name(f"{src.stem}-sm.png")


def should_write(src: Path, dest: Path) -> bool:
    if not dest.exists():
        return True
    return src.stat().st_mtime > dest.stat().st_mtime


def convert_one(src: Path) -> str:
    dest = sm_path(src)
    if not should_write(src, dest):
        return "skip"
    with Image.open(src) as im:
        im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
        w, h = im.size
        if w > MAX_WIDTH:
            nh = int(round(h * (MAX_WIDTH / w)))
            im = im.resize((MAX_WIDTH, nh), Image.Resampling.LANCZOS)
        im.save(dest, format="PNG", optimize=True)
    return "write"


def main() -> None:
    pages = sorted(
        p
        for p in DOCS.rglob("page-*.png")
        if PAGE_RE.match(p.name) and "-sm" not in p.stem
    )
    written = skipped = 0
    for i, src in enumerate(pages, 1):
        status = convert_one(src)
        if status == "write":
            written += 1
        else:
            skipped += 1
        if i % 50 == 0 or i == len(pages):
            print(f"  {i}/{len(pages)} … written={written} skipped={skipped}")
    print(f"Done. {written} sm pages, {skipped} up-to-date, total sources={len(pages)}")


if __name__ == "__main__":
    main()
    sys.exit(0)
