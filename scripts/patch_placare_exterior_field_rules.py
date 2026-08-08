#!/usr/bin/env python3
"""
Extinde Etapa 4.6 · Placări exterioare / parapet cu
«Reguli pe teren — specifice acestui tip».
Apoi: python scripts/build_field_guide_per_type.py
"""

from __future__ import annotations

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "public/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf"
FOOTER_Y = 800.0
LEFT = 42.52

PAGE_CSS = """
* { font-family: sans-serif; }
.title { font-size: 11.5pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.sub { font-size: 9pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.body { font-size: 8.4pt; color: #1c1915; margin: 0; padding: 0; line-height: 1.22; }
"""


def main() -> None:
    if not MASTER.exists():
        raise SystemExit(f"Lipsește: {MASTER}")

    doc = fitz.open(MASTER)
    page = doc[10]  # pagina 11
    hits = page.search_for("Etapa 4.6")
    if not hits:
        raise SystemExit("Nu găsesc «Etapa 4.6» pe pagina 11")

    top = min(h.y0 for h in hits) - 2
    width = page.rect.width - LEFT - 42

    for link in list(page.get_links()):
        fr = link.get("from")
        if fr and fr.y0 >= top - 2:
            page.delete_link(link)

    page.add_redact_annot(fitz.Rect(28, top, page.rect.width - 28, FOOTER_Y), fill=(1, 1, 1))
    page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
    )

    y = top + 2

    def block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(LEFT, y, LEFT + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_CSS)
        y = rect.y1 + 2.5

    block('<p class="title">Etapa 4.6 · Placări exterioare / parapet (atic)</p>', 15)
    block('<p class="sub">Ce se face</p>', 12)
    block(
        "<p class='body'>• Condiții: persoană cu putere de decizie; acces; schele la înălțime; "
        "ploaie/ninsoare → reprogramare; placare veche demontată; prindere mecanică necesară.</p>",
        24,
    )
    block(
        "<p class='body'>• Nu măsori fără schele sigure; confirmi prinderea mecanică pe Anexa 1 "
        "și pe schiță.</p>",
        18,
    )

    block('<p class="sub">Reguli pe teren — specifice acestui tip</p>', 13)
    block(
        "<p class='body'>1. Proliner: contur + întoarceri + zone prindere mecanică; schele; "
        "meteo → reprogramare.</p>",
        20,
    )
    block(
        "<p class='body'>2. Planeitate / verticalitate cu releveu laser.</p>",
        14,
    )
    block(
        "<p class='body'>3. Rosturi / îmbinări pe canting + Comanda de transfer "
        "(dimensiuni placă).</p>",
        18,
    )
    block(
        "<p class='body'>4. Livrare: etaj, lift/scări, nr. persoane — notezi dacă știi.</p>",
        14,
    )

    block('<p class="sub">De ce</p>', 12)
    block(
        "<p class='body'>Parapetul / aticul fără prindere mecanică clarificată pe Anexa 1 "
        "blochează proiectarea. Meteo și schele sunt condiții de siguranță — nu se forțează "
        "măsurarea. Cantingul + comanda de transfer fixează rosturile pe placa reală; datele "
        "de livrare evită blocaje la montaj.</p>",
        40,
    )

    print(f"  end y={y:.0f}")
    tmp = MASTER.with_suffix(".placare-ext-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(MASTER)
    print(f"Patched → {MASTER.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
