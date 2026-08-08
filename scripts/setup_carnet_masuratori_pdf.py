#!/usr/bin/env python3
"""
Carnet măsurători + creion — card vizual + PDF în linked-manuals
(ca Exemple_Fise_Tehnice_Accesorii.pdf), pentru linkul din Etapa 1.1.
"""

from __future__ import annotations

from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / "public/docs/operational-guide/field-guide/equipment/carnet-masuratori.png"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
OUT_PDF = LINKED_DIR / "Carnet-masuratori-creion.pdf"


def font(size: int) -> ImageFont.ImageFont:
    for name in ("arial.ttf", "Arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_pencil(draw: ImageDraw.ImageDraw, x: int, y: int, length: int = 420, thick: int = 34) -> None:
    """Creion clasic orizontal: vârf stânga → radieră dreapta."""
    tip_w = 55
    eraser_w = 36
    ferrule_w = 22
    body_x0 = x + tip_w
    body_x1 = x + length - eraser_w - ferrule_w

    # vârf lemn
    draw.polygon(
        [
            (x + 4, y + thick // 2),
            (body_x0, y + 2),
            (body_x0, y + thick - 2),
        ],
        fill=(230, 200, 140),
        outline=(160, 120, 60),
    )
    # grafit
    draw.polygon(
        [
            (x, y + thick // 2),
            (x + 18, y + thick // 2 - 5),
            (x + 18, y + thick // 2 + 5),
        ],
        fill=(45, 45, 45),
    )
    # corp
    draw.rounded_rectangle(
        [body_x0 - 2, y, body_x1, y + thick],
        radius=3,
        fill=(242, 196, 68),
        outline=(180, 130, 40),
        width=2,
    )
    for i in range(5):
        bx = body_x0 + 28 + i * 52
        if bx < body_x1 - 8:
            draw.line([(bx, y + 4), (bx, y + thick - 4)], fill=(210, 160, 50), width=2)
    # ferrule
    fx0 = body_x1
    draw.rectangle([fx0, y + 2, fx0 + ferrule_w, y + thick - 2], fill=(185, 185, 190))
    # radieră
    draw.rounded_rectangle(
        [fx0 + ferrule_w - 2, y + 3, fx0 + ferrule_w + eraser_w, y + thick - 3],
        radius=4,
        fill=(220, 120, 130),
        outline=(160, 70, 80),
        width=1,
    )


def build_carnet_card() -> Image.Image:
    w, h = 1400, 1000
    card = Image.new("RGB", (w, h), (248, 247, 244))
    draw = ImageDraw.Draw(card)

    draw.rectangle([0, 0, w, 78], fill=(28, 28, 28))
    draw.text((40, 24), "artGRANIT  ·  Carnet măsurători + creion", fill=(212, 175, 55), font=font(30))

    # --- notebook ---
    nb_x, nb_y = 70, 130
    nb_w, nb_h = 620, 720
    draw.rounded_rectangle(
        [nb_x, nb_y, nb_x + nb_w, nb_y + nb_h],
        radius=8,
        fill=(255, 255, 255),
        outline=(40, 40, 40),
        width=3,
    )
    draw.rectangle([nb_x, nb_y, nb_x + 56, nb_y + nb_h], fill=(212, 175, 55))
    # spiral binding dots
    for i in range(14):
        cy = nb_y + 40 + i * 48
        draw.ellipse([nb_x + 18, cy, nb_x + 38, cy + 18], fill=(80, 80, 80))
        draw.ellipse([nb_x + 22, cy + 4, nb_x + 34, cy + 14], fill=(200, 200, 200))

    draw.text((nb_x + 90, nb_y + 36), "MĂSURĂTORI", fill=(28, 28, 28), font=font(36))
    draw.text((nb_x + 90, nb_y + 82), "artGRANIT · teren", fill=(120, 120, 120), font=font(20))

    # sample lines / fields
    fields = [
        "Client / proiect: _______________________________",
        "Dată / oră: ____________________________________",
        "Adresă: ________________________________________",
        "Tip măsurare: __________________________________",
        "Cote (pe loc, voce tare):",
        "  • ____________________________________________",
        "  • ____________________________________________",
        "  • ____________________________________________",
        "Observații teren / FAȚĂ VĂZUTĂ:",
        "  ______________________________________________",
        "  ______________________________________________",
    ]
    ty = nb_y + 140
    for line in fields:
        draw.text((nb_x + 90, ty), line, fill=(70, 70, 70), font=font(18))
        ty += 42
        if "Cote" not in line and "Observații" not in line and not line.startswith("  •") and not line.startswith("  _"):
            draw.line([(nb_x + 90, ty - 8), (nb_x + nb_w - 40, ty - 8)], fill=(230, 230, 230), width=1)

    # --- creion panel ---
    px, py = 760, 160
    draw.rounded_rectangle(
        [px, py, w - 60, py + 420],
        radius=10,
        fill=(255, 255, 255),
        outline=(210, 210, 210),
        width=2,
    )
    draw.text((px + 36, py + 28), "Creion pe teren", fill=(15, 55, 95), font=font(26))
    draw.text(
        (px + 36, py + 70),
        "Notezi cotele imediat — nu din memorie.",
        fill=(90, 90, 90),
        font=font(18),
    )
    draw_pencil(draw, px + 50, py + 180, length=420, thick=36)
    draw.text((px + 50, py + 250), "Creion HB / stilou — obligatoriu în kit", fill=(100, 100, 100), font=font(16))

    # checklist mini
    tips = [
        "✓ Fiecare cotă pe loc, în clipa măsurării",
        "✓ Cote critice citite cu voce tare",
        "✓ Observații + FAȚĂ VĂZUTĂ pe pagină",
        "✓ Nu completezi ulterior „din memorie”",
    ]
    ty = py + 300
    for tip in tips:
        draw.text((px + 36, ty), tip, fill=(40, 40, 40), font=font(17))
        ty += 28

    # footer
    draw.text(
        (70, 900),
        "Exemplu intern artGRANIT — carnetul real e cel pe care îl ai în trusă la măsurare.",
        fill=(110, 110, 110),
        font=font(18),
    )
    return card


def build_pdf(card: Image.Image) -> Path:
    LINKED_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    card.save(OUT_PNG, optimize=True)
    print(f"PNG → {OUT_PNG.relative_to(ROOT)} ({card.size[0]}x{card.size[1]})")

    # temp png for insert
    page_w, page_h = 595.28, 841.89
    margin = 32
    doc = fitz.open()
    page = doc.new_page(width=page_w, height=page_h)

    page.insert_text(
        fitz.Point(margin, 26),
        "Echipament necesar · Intern artGRANIT",
        fontsize=8,
        fontname="helv",
        color=(0.4, 0.4, 0.4),
    )
    page.insert_text(
        fitz.Point(margin, 46),
        "Carnet măsurători + creion",
        fontsize=14,
        fontname="hebo",
        color=(0.06, 0.22, 0.37),
    )
    page.insert_textbox(
        fitz.Rect(margin, 54, page_w - margin, 88),
        "Exemplu vizual pentru trusă. Notezi fiecare cotă pe loc — nu din memorie. "
        "Creionul / stiloul face parte din kitul obligatoriu înainte de drum.",
        fontsize=8.5,
        fontname="helv",
        color=(0.25, 0.25, 0.25),
    )

    # fit image
    tmp = OUT_PNG
    iw, ih = card.size
    max_w = page_w - 2 * margin
    max_h = page_h - 110
    scale = min(max_w / iw, max_h / ih)
    w, h = iw * scale, ih * scale
    x0 = (page_w - w) / 2
    y0 = 96
    rect = fitz.Rect(x0, y0, x0 + w, y0 + h)
    page.insert_image(rect, filename=str(tmp))
    page.draw_rect(rect, color=(0.75, 0.75, 0.75), width=0.6)

    doc.save(OUT_PDF, garbage=3, deflate=True)
    doc.close()
    print(f"PDF → {OUT_PDF.relative_to(ROOT)} ({OUT_PDF.stat().st_size // 1024} KB)")
    return OUT_PDF


def main() -> None:
    card = build_carnet_card()
    build_pdf(card)
    print("Done.")


if __name__ == "__main__":
    main()
