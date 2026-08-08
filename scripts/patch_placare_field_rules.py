#!/usr/bin/env python3
"""
Placare perete: Condiții obligatorii + Obligații măsurător + Reguli pe teren.
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
.title { font-size: 10.5pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.sub { font-size: 8.2pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.body { font-size: 7.5pt; color: #1c1915; margin: 0; padding: 0; line-height: 1.14; }
"""


def main() -> None:
    if not MASTER.exists():
        raise SystemExit(f"Lipsește: {MASTER}")

    doc = fitz.open(MASTER)
    page = doc[8]  # pagina 9
    hits = page.search_for("Etapa 4.2")
    if not hits:
        raise SystemExit("Nu găsesc «Etapa 4.2»")

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

    y = top + 1

    def block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(LEFT, y, LEFT + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_CSS)
        y = rect.y1 + 1.3

    block('<p class="title">Etapa 4.2 · Placare perete</p>', 13)
    block(
        "<p class='body'>• NOTĂ: Șorțul (placarea pe perete / spate la bucătărie) urmează "
        "ACELEAȘI reguli ca placarea de perete — nu se tratează în capitolul Blat.</p>",
        16,
    )

    block('<p class="sub">Condiții obligatorii (înainte de măsurare)</p>', 11)
    block(
        "<p class='body'>1. Prezența obligatorie a persoanei cu putere de decizie.</p>",
        10,
    )
    block(
        "<p class='body'>2. Acces pentru măsurare. Să nu fie obstacole care să restricționeze "
        "accesul inginerului spre obiectul care urmează a fi măsurat.</p>",
        16,
    )
    block(
        "<p class='body'>3. Pereții să fie pregătiți pentru placare (se interzice placare pe "
        "bază de gips).</p>",
        14,
    )
    block(
        "<p class='body'>4. Să fie montate toate prizele și conexiunile (apă, canalizare).</p>",
        12,
    )
    block("<p class='body'>5. Suportul TV montat în perete.</p>", 10)
    block("<p class='body'>6. Prezența grilei de ventilare.</p>", 10)

    block('<p class="sub">Obligații măsurător (pe loc)</p>', 11)
    block(
        "<p class='body'>1. Verifici planeitatea / verticalitatea cu laser — nu doar pe ochi.</p>",
        11,
    )
    block(
        "<p class='body'>2. Fotografiază prizele, întrerupătoarele și golurile tehnice perete "
        "cu perete și le numeri.</p>",
        14,
    )
    block(
        "<p class='body'>3. Întrebi prize: păstrați / anulați / adăugați / măriți? Aliniere OK?</p>",
        12,
    )
    block(
        "<p class='body'>4. Găuri prindere hotă/poliță: înainte de măsurare. Decupaje doar în "
        "fabrică (Waterjet) — interzis pe loc.</p>",
        16,
    )
    block(
        "<p class='body'>5. Clarifici LED sub mobilă, hotă (buză vs. mobilă), "
        "pardoseală→tavan / parchet.</p>",
        14,
    )
    block(
        "<p class='body'>6. Predai în Bitrix: Anexa 1 + poze + video + Proliner.</p>",
        11,
    )

    block('<p class="sub">Reguli pe teren — specifice acestui tip</p>', 11)
    block(
        "<p class='body'>1. Linie orizontală laser + verticală Proliner = reper; trasezi pe "
        "perete cu creionul, apoi conturul.</p>",
        14,
    )
    block(
        "<p class='body'>2. Laser vertical: adeziv min 3–4 mm / max ~15 mm; creion = linia din "
        "față a placării.</p>",
        14,
    )
    block(
        "<p class='body'>3. Îmbinări: canting + Comanda de transfer (dimensiuni placă) + "
        "lift/scări/persoane.</p>",
        14,
    )
    block(
        "<p class='body'>4. Proliner: contur + întoarceri + goluri (prize, ventilare, TV); "
        "planeitate/verticalitate.</p>",
        14,
    )
    block(
        "<p class='body'>5. Măsoară tot ce e posibil — inclusiv contururi care par "
        "„nefolositoare”.</p>",
        12,
    )

    block('<p class="sub">De ce</p>', 10)
    block(
        "<p class='body'>Fără condiții (gips, prize, TV, grilă) măsurarea e incompletă. "
        "Obligațiile pe loc prind golurile și LED-ul; kitul Bitrix închide setul. Laser + "
        "Proliner + canting fixează reperul și îmbinările.</p>",
        24,
    )

    print(f"  end y={y:.0f}")
    if y > FOOTER_Y - 4:
        print("  WARN: overflow")

    tmp = MASTER.with_suffix(".placare-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(MASTER)
    print(f"Patched → {MASTER.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
