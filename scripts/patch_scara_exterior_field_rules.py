#!/usr/bin/env python3
"""
Extinde Etapa 4.4 · Scări exterioare cu «Reguli pe teren — specifice acestui tip».
Rescrie și 4.5 pe aceeași pagină (sub 4.4), ca să nu se suprapună.
Apoi: python scripts/build_field_guide_per_type.py
"""

from __future__ import annotations

import json
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
    page = doc[9]  # pagina 10 — 4.3 / 4.4 / 4.5
    hits = page.search_for("Etapa 4.4")
    if not hits:
        raise SystemExit("Nu găsesc «Etapa 4.4» pe pagina 10")

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
    markers: dict[str, float] = {}

    def block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(LEFT, y, LEFT + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_CSS)
        y = rect.y1 + 2.5

    # --- 4.4 ---
    markers["4.4"] = y
    block('<p class="title">Etapa 4.4 · Scări exterioare</p>', 15)
    block('<p class="sub">Ce se face</p>', 12)
    block(
        "<p class='body'>• Condiții: persoană cu putere de decizie; acces; schele la înălțime; "
        "placare veche demontată până la bază; ploaie/ninsoare → reprogramare.</p>",
        22,
    )
    block(
        "<p class='body'>• Nu măsori fără schele sigure la înălțime. La ploaie / ninsoare: "
        "oprești și reprogramezi.</p>",
        18,
    )

    block('<p class="sub">Reguli pe teren — specifice acestui tip</p>', 13)
    block(
        "<p class='body'>1. Proliner: trepte + întoarceri + bază — doar cu schele sigure.</p>",
        14,
    )
    block(
        "<p class='body'>2. Exterior: picurător ≥7 mm de margine, adâncime ≤1/3; pantă 2–3 mm, "
        "fără contrapantă.</p>",
        20,
    )
    block(
        "<p class='body'>3. Fiecare treaptă se măsoară individual; puncte surplus pe trepte și "
        "la schimbări de direcție.</p>",
        20,
    )
    block(
        "<p class='body'>4. Măsori înălțimea fiecărei trepte; diferențe mari → ajustezi pe "
        "palier, nu degrosezi baza.</p>",
        20,
    )

    block('<p class="sub">De ce</p>', 12)
    block(
        "<p class='body'>Exteriorul fără schele sau pe meteo nepotrivită e măsurare periculoasă "
        "și imprecisă. Picurătorul și panta protejează montajul — se notează pe loc. Fiecare "
        "treaptă e unică; diferențele se ajustează pe palier, nu prin degrosare.</p>",
        34,
    )

    y += 4
    markers["4.5"] = y
    block('<p class="title">Etapa 4.5 · Pervazuri / glafuri int. / ext.</p>', 15)
    block('<p class="sub">Ce se face</p>', 12)
    block(
        "<p class='body'>• Condiții: persoană cu putere de decizie; acces; schele la înălțime; "
        "bază recomandat 30 mm sub toc; tencuială / termoizolare finală; la exterior — elemente "
        "decorative subpervaz.</p>",
        28,
    )
    block(
        "<p class='body'>• Măsori fiecare gol individual — nu din serie. Coduri F1…Fn pe schiță "
        "și pe toc, fotografiate.</p>",
        18,
    )
    block(
        "<p class='body'>• Exterior: pantă 2–3 mm + picurător; recomandat SUB rama geamului. "
        "Interior: fără pantă, fără picurător.</p>",
        20,
    )
    block(
        "<p class='body'>• Proliner: fiecare gol F1…Fn pe toc + întoarceri; exterior = pantă "
        "înregistrată (interior / exterior / diferență).</p>",
        22,
    )
    block('<p class="sub">De ce</p>', 12)
    block(
        "<p class='body'>Golurile „din serie” diferă milimetric; fără cod F pe toc, montajul "
        "amestecă piesele. Panta exteriorului trebuie măsurată — altfel apă pe perete.</p>",
        28,
    )

    print(f"  end y={y:.0f} markers={json.dumps({k: round(v,1) for k,v in markers.items()})}")
    if y > FOOTER_Y - 8:
        print("  WARN: aproape de footer")

    tmp = MASTER.with_suffix(".scara-ext-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(MASTER)
    print(f"Patched → {MASTER.relative_to(ROOT)}")

    # trim hints for build_field_guide_per_type.py
    # 4.3 ends just before 4.4; 4.4 ends just before 4.5; 4.5 to footer
    print(
        "TRIM HINTS (page 10):\n"
        f"  semineu keep_to ≈ {markers['4.4'] - 2:.1f}\n"
        f"  scara_exterior keep_from ≈ {markers['4.4'] - 4:.1f} "
        f"keep_to ≈ {markers['4.5'] - 2:.1f}\n"
        f"  glaf keep_from ≈ {markers['4.5'] - 4:.1f}"
    )


if __name__ == "__main__":
    main()
