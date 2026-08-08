#!/usr/bin/env python3
"""
Placare cămin (șemineu): Condiții obligatorii (6 puncte) — fără a atinge 4.4/4.5.
Apoi: python scripts/build_field_guide_per_type.py
"""

from __future__ import annotations

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "public/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf"
LEFT = 42.52

PAGE_CSS = """
* { font-family: sans-serif; }
.title { font-size: 10.5pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.sub { font-size: 8.2pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.body { font-size: 7.6pt; color: #1c1915; margin: 0; padding: 0; line-height: 1.15; }
"""


def main() -> None:
    if not MASTER.exists():
        raise SystemExit(f"Lipsește: {MASTER}")

    doc = fitz.open(MASTER)
    page = doc[9]
    h43 = page.search_for("Etapa 4.3")
    h44 = page.search_for("Etapa 4.4")
    if not h43 or not h44:
        raise SystemExit("Nu găsesc Etapa 4.3 / 4.4 pe pagina 10")

    top = min(h.y0 for h in h43) - 2
    bottom = min(h.y0 for h in h44) - 4
    width = page.rect.width - LEFT - 42

    for link in list(page.get_links()):
        fr = link.get("from")
        if fr and top - 2 <= fr.y0 < bottom:
            page.delete_link(link)

    page.add_redact_annot(fitz.Rect(28, top, page.rect.width - 28, bottom), fill=(1, 1, 1))
    page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
    )

    y = top + 1

    def block(html: str, height: float) -> None:
        nonlocal y
        if y + height > bottom:
            height = max(8, bottom - y - 1)
        rect = fitz.Rect(LEFT, y, LEFT + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_CSS)
        y = rect.y1 + 1.2

    block('<p class="title">Etapa 4.3 · Placare cămin</p>', 13)
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
    block("<p class='body'>3. Căminul trebuie să fie construit.</p>", 10)
    block("<p class='body'>4. Termoizolarea trebuie să fie executată.</p>", 10)
    block("<p class='body'>5. Grila de ventilare prezentă.</p>", 10)
    block(
        "<p class='body'>6. Trebuie să avem schiță conceptuală / proiectul căminului.</p>",
        12,
    )

    block('<p class="sub">Ce se face</p>', 10)
    block(
        "<p class='body'>• Ai la tine schița / proiectul căminului și compari măsurătoarea "
        "cu proiectul pe loc.</p>",
        14,
    )
    block(
        "<p class='body'>• Verifici termoizolarea și grila înainte de Proliner.</p>",
        11,
    )
    block(
        "<p class='body'>• Proliner: contur cămin + întoarceri + grile + zone termoizolare; "
        "planeitate / verticalitate cu releveu laser.</p>",
        16,
    )
    block(
        "<p class='body'>• Îmbinări pe canting; dezacord → Anexa: surplus + anunț.</p>",
        11,
    )

    block('<p class="sub">De ce</p>', 10)
    block(
        "<p class='body'>Căminul fără proiect pe loc se măsoară „în orb”. Termoizolarea și "
        "grila lipsă schimbă conturul după măsurare — remăsurare garantată.</p>",
        18,
    )

    print(f"  4.3 end y={y:.0f} (4.4 starts ~{bottom + 4:.0f})")
    if y > bottom - 2:
        print("  WARN: 4.3 almost overlaps 4.4")

    tmp = MASTER.with_suffix(".semineu-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(MASTER)
    print(f"Patched → {MASTER.relative_to(ROOT)}")
    print(f"TRIM HINT semineu keep_to ≈ {bottom + 2:.1f}")


if __name__ == "__main__":
    main()
