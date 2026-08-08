#!/usr/bin/env python3
"""Extrage poze echipament din manualele Utilaje și le pune în Ghid teren Etapa 1.1."""

from __future__ import annotations

import io
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/docs/operational-guide/field-guide/equipment"
PAGES = ROOT / "public/docs/operational-guide/field-guide/pages"

PROLINER_COVER = ROOT / "public/docs/equipment/proliner/pages/page-01.png"
PROLINER_PKG = ROOT / "public/docs/equipment/proliner/pages/page-04.png"
TAPE_PAGE = ROOT / "public/docs/equipment/bosch-tape-5m/pages/page-01.png"
GLL_PDF = ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf"

PAGE_W, PAGE_H = 1240, 1754


def font(size: int) -> ImageFont.ImageFont:
    for name in ("arial.ttf", "segoeui.ttf", "C:\\Windows\\Fonts\\arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def fit(im: Image.Image, max_w: int, max_h: int) -> Image.Image:
    iw, ih = im.size
    s = min(max_w / iw, max_h / ih)
    return im.resize((max(1, int(iw * s)), max(1, int(ih * s))), Image.Resampling.LANCZOS)


def extract_proliner() -> Image.Image:
    img = Image.open(PROLINER_COVER).convert("RGB")
    w, h = img.size
    return img.crop((int(w * 0.18), int(h * 0.18), int(w * 0.82), int(h * 0.62)))


def extract_tape() -> Image.Image:
    return Image.open(TAPE_PAGE).convert("RGB")


def extract_gll() -> Image.Image:
    doc = fitz.open(GLL_PDF)
    pix = doc[0].get_pixmap(dpi=250, alpha=False)
    cover = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    doc.close()
    w, h = cover.size
    return cover.crop((int(w * 0.48), int(h * 0.08), int(w * 0.92), int(h * 0.78)))


def extract_pen() -> Image.Image:
    """Stilou/creion din pachetul Proliner (pagina conținut pachet)."""
    pkg = Image.open(PROLINER_PKG).convert("RGB")
    w, h = pkg.size
    # rând 2, coloana stilou (aprox.)
    return pkg.crop((int(w * 0.42), int(h * 0.48), int(w * 0.58), int(h * 0.62)))


def build_carnet_card(pen: Image.Image) -> Image.Image:
    """Carnet + creion: card artGRANIT (nu există poză dedicată carnet în manuale)."""
    w, h = 1200, 900
    card = Image.new("RGB", (w, h), (248, 247, 244))
    draw = ImageDraw.Draw(card)
    draw.rectangle([0, 0, w, 70], fill=(28, 28, 28))
    draw.text((36, 22), "artGRANIT  ·  Carnet măsurători + creion", fill=(212, 175, 55), font=font(26))

    # notebook body
    nb = Image.new("RGB", (520, 640), (255, 255, 255))
    nd = ImageDraw.Draw(nb)
    nd.rectangle([0, 0, 519, 639], outline=(40, 40, 40), width=3)
    nd.rectangle([0, 0, 48, 639], fill=(212, 175, 55))
    for y in range(70, 600, 36):
        nd.line([(70, y), (490, y)], fill=(220, 220, 220), width=2)
    nd.text((70, 24), "MĂSURĂTORI", fill=(28, 28, 28), font=font(28))
    nd.text((70, 58), "artGRANIT · teren", fill=(120, 120, 120), font=font(18))
    card.paste(nb, (80, 140))

    pen2 = fit(pen, 420, 520)
    card.paste(pen2, (700, 180))
    draw.text((700, 720), "Stilou din pachet Proliner", fill=(90, 90, 90), font=font(18))
    draw.text((80, 820), "Notezi fiecare cotă pe loc — nu din memorie.", fill=(60, 60, 60), font=font(22))
    return card


def labeled_page(title: str, image: Image.Image, footnote: str, out: Path) -> None:
    page = Image.new("RGB", (PAGE_W, PAGE_H), (255, 255, 255))
    d = ImageDraw.Draw(page)
    d.rectangle([0, 0, PAGE_W, 100], fill=(28, 28, 28))
    d.text((40, 32), title, fill=(212, 175, 55), font=font(28))
    im = fit(image, PAGE_W - 120, PAGE_H - 220)
    page.paste(im, ((PAGE_W - im.width) // 2, 140 + (PAGE_H - 220 - im.height) // 2))
    d.text((40, PAGE_H - 56), footnote, fill=(120, 120, 120), font=font(18))
    page.save(out)


def build_gallery(items: list[tuple[str, Image.Image]], out: Path) -> None:
    gallery = Image.new("RGB", (PAGE_W, PAGE_H), (255, 255, 255))
    d = ImageDraw.Draw(gallery)
    d.rectangle([0, 0, PAGE_W, 110], fill=(28, 28, 28))
    d.text((40, 28), "Etapa 1.1 · Echipament necesar — poze", fill=(212, 175, 55), font=font(36))
    d.text((40, 74), "Imagini din manualele Utilaje teren (Proliner / Bosch)", fill=(200, 200, 200), font=font(18))

    pad, gap, top = 36, 24, 140
    cell_w = (PAGE_W - pad * 2 - gap) // 2
    cell_h = (PAGE_H - top - pad - gap) // 2
    for idx, (label, im) in enumerate(items):
        r, c = divmod(idx, 2)
        x0 = pad + c * (cell_w + gap)
        y0 = top + r * (cell_h + gap)
        d.rectangle([x0, y0, x0 + cell_w, y0 + cell_h], outline=(210, 210, 210), width=2)
        d.rectangle([x0, y0, x0 + cell_w, y0 + 48], fill=(245, 245, 243))
        d.text((x0 + 14, y0 + 12), f"{idx + 1}. {label}", fill=(28, 28, 28), font=font(18))
        im2 = fit(im, cell_w - 28, cell_h - 70)
        px = x0 + (cell_w - im2.width) // 2
        py = y0 + 56 + ((cell_h - 70) - im2.height) // 2
        gallery.paste(im2, (px, py))
    gallery.save(out)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PAGES.mkdir(parents=True, exist_ok=True)

    proliner = extract_proliner()
    tape = extract_tape()
    gll = extract_gll()
    pen = extract_pen()
    carnet = build_carnet_card(pen)

    proliner.save(OUT / "proliner.png")
    tape.save(OUT / "bosch-tape-5m.png")
    gll.save(OUT / "bosch-gll-3-80.png")
    carnet.save(OUT / "carnet-masuratori.png")

    items = [
        ("Carnet măsurători + creion", carnet),
        ("Aparatul de măsurat Proliner", proliner),
        ("Nivelă laser Bosch GLL 3-80", gll),
        ("Ruletă Bosch 5 m", tape),
    ]
    sources = [
        "Sursă: card artGRANIT + stilou din manual Proliner (conținut pachet)",
        "Sursă: Ghid pornire rapidă Proliner — copertă",
        "Sursă: Manual Bosch GLL 3-80 — copertă",
        "Sursă: Manual / fișă Bosch Ruletă 5 m",
    ]

    build_gallery(items, PAGES / "echipament-poze-01.png")
    for i, ((label, im), note) in enumerate(zip(items, sources), start=1):
        labeled_page(
            f"1.1 Echipament · {label}",
            im,
            note,
            PAGES / f"echipament-item-{i:02d}.png",
        )
        print(f"OK {label}")

    print(f"Gallery → {PAGES / 'echipament-poze-01.png'}")
    print("Done.")


if __name__ == "__main__":
    main()
