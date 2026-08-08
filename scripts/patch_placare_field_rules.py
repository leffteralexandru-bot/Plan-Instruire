#!/usr/bin/env python3
"""
Extinde Etapa 4.2 · Placare perete în Ghid teren cu:
«Reguli pe teren — specifice acestui tip» (5 puncte).
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
    page = doc[8]  # pagina 9 — 4.1 Scări + 4.2 Placare
    hits = page.search_for("Etapa 4.2")
    if not hits:
        raise SystemExit("Nu găsesc «Etapa 4.2» pe pagina 9")

    top = min(h.y0 for h in hits) - 2
    width = page.rect.width - LEFT - 42

    # păstrează Scări; șterge doar blocul Placare până la footer
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

    block('<p class="title">Etapa 4.2 · Placare perete</p>', 15)
    block('<p class="sub">Ce se face</p>', 12)
    block(
        "<p class='body'>• NOTĂ: Șorțul (placarea pe perete / spate la bucătărie) urmează "
        "ACELEAȘI reguli ca placarea de perete — nu se tratează în capitolul Blat.</p>",
        22,
    )
    block(
        "<p class='body'>• Condiții: persoană cu putere de decizie; acces; pereți pregătiți "
        "(interzis pe gips); prize și conexiuni montate; suport TV; grilă ventilare.</p>",
        22,
    )
    block(
        "<p class='body'>• Verifici planeitatea / verticalitatea cu laser — nu doar pe ochi.</p>",
        12,
    )
    block(
        "<p class='body'>• Fotografiază prizele, întrerupătoarele și golurile tehnice perete cu "
        "perete și le numeri; întrebi: păstrați / anulați / adăugați / măriți?</p>",
        22,
    )
    block(
        "<p class='body'>• Găuri prindere hotă/poliță: înainte de măsurare. Decupaje doar în "
        "fabrică (Waterjet) — interzis pe loc.</p>",
        20,
    )

    block('<p class="sub">Reguli pe teren — specifice acestui tip</p>', 13)
    block(
        "<p class='body'>1. Linie orizontală laser + verticală Proliner = reper; trasezi pe "
        "perete cu creionul, apoi conturul.</p>",
        20,
    )
    block(
        "<p class='body'>2. Laser vertical: adeziv min 3–4 mm / max ~15 mm; creion = linia din "
        "față a placării.</p>",
        20,
    )
    block(
        "<p class='body'>3. Îmbinări: canting + Comanda de transfer (dimensiuni placă) + "
        "lift/scări/persoane.</p>",
        20,
    )
    block(
        "<p class='body'>4. Proliner: contur + întoarceri + goluri (prize, ventilare, TV); "
        "planeitate/verticalitate.</p>",
        20,
    )
    block(
        "<p class='body'>5. Măsoară tot ce e posibil — inclusiv contururi care par "
        "„nefolositoare”.</p>",
        18,
    )

    block('<p class="sub">De ce</p>', 12)
    block(
        "<p class='body'>Prizele și golurile netrecute pe poză dispar din proiect. Laserul + "
        "Proliner dau reperul pentru planeitate și adeziv; șorțul = placare, ca să nu se "
        "amestece cu blatul. Cantingul și comanda de transfer fixează îmbinările pe placa "
        "reală.</p>",
        36,
    )

    print(f"  Placare rules end y={y:.0f} (footer ~{FOOTER_Y})")
    if y > FOOTER_Y - 10:
        print("  WARN: conținut aproape de footer")

    tmp = MASTER.with_suffix(".placare-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(MASTER)
    print(f"Patched → {MASTER.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
