#!/usr/bin/env python3
"""
Scări exterioare: Obligații măsurător (pe loc) + Reguli pe teren.
Rescrie și 4.5 (pervazuri) pe aceeași pagină.
Apoi: python scripts/patch_glaf_field_rules.py  (dacă vrei doar glaf)
     sau python scripts/build_field_guide_per_type.py
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
.title { font-size: 10.5pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.sub { font-size: 8.2pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.body { font-size: 7.6pt; color: #1c1915; margin: 0; padding: 0; line-height: 1.15; }
"""


def main() -> None:
    if not MASTER.exists():
        raise SystemExit(f"Lipsește: {MASTER}")

    doc = fitz.open(MASTER)
    page = doc[9]
    hits = page.search_for("Etapa 4.4")
    if not hits:
        raise SystemExit("Nu găsesc «Etapa 4.4»")

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
    markers: dict[str, float] = {}

    def block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(LEFT, y, LEFT + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_CSS)
        y = rect.y1 + 1.4

    # --- 4.4 Scări exterioare ---
    markers["4.4"] = y
    block('<p class="title">Etapa 4.4 · Scări exterioare</p>', 13)
    block('<p class="sub">Ce se face</p>', 10)
    block(
        "<p class='body'>• Condiții: persoană cu putere de decizie; acces; schele la înălțime; "
        "placare veche demontată până la bază; ploaie/ninsoare → reprogramare.</p>",
        18,
    )

    block('<p class="sub">Obligații măsurător (pe loc)</p>', 11)
    block(
        "<p class='body'>1. Nu măsori fără schele sigure la înălțime.</p>",
        10,
    )
    block(
        "<p class='body'>2. La ploaie / ninsoare: oprești și reprogramezi — nu forțezi "
        "măsurarea.</p>",
        12,
    )
    block(
        "<p class='body'>3. Dacă există placare veche: verifică că e demontată până la bază.</p>",
        12,
    )
    block(
        "<p class='body'>4. Predai în Bitrix kit complet: Anexa 1 + poze + video + Proliner.</p>",
        12,
    )

    block('<p class="sub">Reguli pe teren — specifice acestui tip</p>', 11)
    block(
        "<p class='body'>1. Proliner: trepte + întoarceri + bază — doar cu schele sigure.</p>",
        11,
    )
    block(
        "<p class='body'>2. Exterior: picurător ≥7 mm de margine, adâncime ≤1/3; pantă 2–3 mm, "
        "fără contrapantă.</p>",
        16,
    )
    block(
        "<p class='body'>3. Fiecare treaptă se măsoară individual; puncte surplus pe trepte și "
        "la schimbări de direcție.</p>",
        16,
    )
    block(
        "<p class='body'>4. Măsori înălțimea fiecărei trepte; diferențe mari → ajustezi pe "
        "palier, nu degrosezi baza.</p>",
        16,
    )

    block('<p class="sub">De ce</p>', 10)
    block(
        "<p class='body'>Schele + meteo = siguranță. Placarea veche pe bază falsifică cotă. "
        "Kitul Bitrix închide măsurarea; fără el proiectarea nu are set complet.</p>",
        22,
    )

    y += 2
    markers["4.5"] = y
    # --- 4.5 Pervazuri (păstrat complet) ---
    block('<p class="title">Etapa 4.5 · Pervazuri / glafuri int. / ext.</p>', 13)
    block('<p class="sub">Condiții obligatorii (înainte de măsurare)</p>', 10)
    block(
        "<p class='body'>1. Prezența obligatorie a persoanei cu putere de decizie.</p>",
        10,
    )
    block(
        "<p class='body'>2. Acces pentru măsurare. Să nu fie obstacole care să restricționeze "
        "accesul inginerului spre obiectul care urmează a fi măsurat.</p>",
        16,
    )
    block("<p class='body'>3. Schele pentru pervazuri la înălțime.</p>", 10)
    block(
        "<p class='body'>4. Recomandat ca baza să fie pregătită 30 mm sub tocul ferestrei.</p>",
        11,
    )
    block(
        "<p class='body'>5. Să fie executat stratul final de tencuială sau termoizolare.</p>",
        11,
    )
    block(
        "<p class='body'>6. În cazul pervazurilor de exterior este necesar să fie prezente "
        "elementele decorative de subpervaz și/sau împrejurul acestuia.</p>",
        18,
    )
    block('<p class="sub">Ce se face</p>', 10)
    block(
        "<p class='body'>• Măsori fiecare gol individual — nu din serie.</p>",
        10,
    )
    block('<p class="sub">Reguli pe teren — specifice acestui tip</p>', 10)
    block(
        "<p class='body'>1. Exterior: pantă 2–3 mm (lățime ~100–300 mm) + picurător; "
        "recomandat SUB rama geamului.</p>",
        15,
    )
    block(
        "<p class='body'>2. Interior: fără pantă, fără picurător; în ramă sau sub ramă.</p>",
        11,
    )
    block(
        "<p class='body'>3. Proliner: fiecare gol F1…Fn pe toc + întoarceri; exterior = pantă.</p>",
        12,
    )
    block(
        "<p class='body'>4. Codurile de poziție (F1, F2… Fn) se scriu pe schiță și pe toc și "
        "se fotografiază.</p>",
        15,
    )
    block('<p class="sub">De ce</p>', 10)
    block(
        "<p class='body'>Fără condiții (schele, bază, tencuială/termo, subpervaz) măsurarea e "
        "incompletă. Codurile F pe toc evită amestecul la montaj.</p>",
        20,
    )

    print(f"  end y={y:.0f} markers={json.dumps({k: round(v,1) for k,v in markers.items()})}")
    if y > FOOTER_Y - 4:
        print("  WARN: overflow footer")

    tmp = MASTER.with_suffix(".scara-ext-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(MASTER)
    print(f"Patched → {MASTER.relative_to(ROOT)}")
    print(
        "TRIM HINTS:\n"
        f"  semineu keep_to ≈ {markers['4.4'] - 2:.1f}\n"
        f"  scara_exterior keep_from ≈ {markers['4.4'] - 4:.1f} "
        f"keep_to ≈ {markers['4.5'] - 2:.1f}\n"
        f"  glaf keep_from ≈ {markers['4.5'] - 4:.1f}"
    )


if __name__ == "__main__":
    main()
