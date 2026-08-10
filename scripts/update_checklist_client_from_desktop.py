#!/usr/bin/env python3
"""
Actualizează Checklist Client ArtGranit din Desktop:
- Blat = fișierul nou (Checklist_Client_ArtGranit..pdf) — include poze + notă
- Celelalte tipuri = conținut existent + ce lipsea (poze + notă + confirmare aliniată)
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path(r"c:\Users\AlioSol\Desktop")
# Fișierul nou (1 pagină Blat) — numele cu „..” de pe Desktop
NEW_BLAT = DESKTOP / "Checklist_Client_ArtGranit..pdf"
# Pachetul vechi cu 7 tipuri (sursă pentru tipurile non-Blat)
LEGACY_FULL = DESKTOP / "Checklist_Client_ArtGranit.pdf"

OUT_DIR = ROOT / "public/docs/operational-guide/checklists"
PAGES_DIR = OUT_DIR / "pages"
FULL_PDF = ROOT / "public/docs/operational-guide/Checklist_Client_ArtGranit.pdf"
LEGACY_MIRROR = ROOT / "public/docs/operational-guide/checklist-masuratori-full.pdf"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
RENDER_DPI = 300

NOTE_RO = (
    "Vă rog să luați în calcul toate aceste detalii pentru a putea efectua o "
    "măsurătoare corectă și pentru un proces de producție și, mai apoi, de montare optimă. "
    "Orice element lipsă sau informație necorespunzătoare vor duce la întârzieri ale proiectului."
)

# tip → (page 1-based în legacy, slug, app pdf, art pdf, items, photo_line)
# photo_line None = deja acoperit în NEW_BLAT
TYPES: list[tuple[int, str, str, str, list[str], str | None]] = [
    (
        1,
        "blat",
        "Checklist-masuratori-Blat.pdf",
        "Checklist_Client_ArtGranit-Blat.pdf",
        [],  # din PDF nou
        None,
    ),
    (
        2,
        "scara",
        "Checklist-masuratori-Scara.pdf",
        "Checklist_Client_ArtGranit-Scara.pdf",
        [
            "Prezența obligatorie a persoanei cu putere de decizie.",
            "Acces pentru măsurare. Să nu fie obstacole care să restricționeze accesul inginerului spre obiectul care urmează a fi măsurat.",
            "Să nu se execute lucrări sau alte tipuri de lucrări care produc praf, în nemijlocita apropiere de obiectul măsurat.",
            "Dacă scările sunt cu LED să fie mostră de profilul în care va fi instalat LED-ul.",
            "Pe suprafața scărilor care urmează a fi măsurate să nu fie montată schelă.",
            "Să fie stabilit tipul treptelor (ex. secțiune).",
        ],
        "Poze cu scările / zona de măsurat.",
    ),
    (
        3,
        "placare",
        "Checklist-masuratori-Placare.pdf",
        "Checklist_Client_ArtGranit-Placare.pdf",
        [
            "Prezența obligatorie a persoanei cu putere de decizie.",
            "Acces pentru măsurare. Să nu fie obstacole care să restricționeze accesul inginerului spre obiectul care urmează a fi măsurat.",
            "Pereții să fie pregătiți pentru placare (se interzice placare pe bază de gips).",
            "Să fie montate toate prizele și conexiunile (apă, canalizare).",
            "Suportul TV montat în perete.",
            "Prezența grilei de ventilare.",
        ],
        "Poze cu peretele / zona de placare.",
    ),
    (
        4,
        "semineu",
        "Checklist-masuratori-Semineu.pdf",
        "Checklist_Client_ArtGranit-Semineu.pdf",
        [
            "Prezența obligatorie a persoanei cu putere de decizie.",
            "Acces pentru măsurare. Să nu fie obstacole care să restricționeze accesul inginerului spre obiectul care urmează a fi măsurat.",
            "Căminul trebuie să fie construit.",
            "Termoizolarea trebuie să fie executată.",
            "Grila de ventilare prezentă.",
            "Trebuie să avem schiță conceptuală / proiectul căminului.",
        ],
        "Poze cu căminul / zona de măsurat.",
    ),
    (
        5,
        "scara-exterior",
        "Checklist-masuratori-Scari-exterioare.pdf",
        "Checklist_Client_ArtGranit-Scari-exterioare.pdf",
        [
            "Prezența obligatorie a persoanei cu putere de decizie.",
            "Acces pentru măsurare. Să nu fie obstacole care să restricționeze accesul inginerului spre obiectul care urmează a fi măsurat.",
            "Prezență schele în cazul măsurărilor la înălțime.",
            "În caz că este placare existentă trebuie să fie demontată până la măsurare pentru a avea acces la studierea bazei.",
            "În caz de ploaie sau ninsoare, măsurarea se reprogramează.",
        ],
        "Poze cu scările exterioare / zona de măsurat.",
    ),
    (
        6,
        "glaf",
        "Checklist-masuratori-Glaf.pdf",
        "Checklist_Client_ArtGranit-Glaf.pdf",
        [
            "Prezența obligatorie a persoanei cu putere de decizie.",
            "Acces pentru măsurare. Să nu fie obstacole care să restricționeze accesul inginerului spre obiectul care urmează a fi măsurat.",
            "Schele pentru pervazuri la înălțime.",
            "Recomandat ca baza să fie pregătită 30 mm sub tocul ferestrei.",
            "Să fie executat stratul final de tencuială sau termoizolare.",
            "În cazul pervazurilor de exterior este necesar să fie prezente elementele decorative de subpervaz și/sau împrejurul acestuia.",
        ],
        "Poze cu pervazurile / zona de măsurat.",
    ),
    (
        7,
        "placare-exterior",
        "Checklist-masuratori-Placari-exterioare.pdf",
        "Checklist_Client_ArtGranit-Placari-exterioare.pdf",
        [
            "Prezența obligatorie a persoanei cu putere de decizie.",
            "Acces pentru măsurare. Să nu fie obstacole care să restricționeze accesul inginerului spre obiectul care urmează a fi măsurat.",
            "Prezență schele în cazul măsurărilor la înălțime.",
            "În caz de ploaie sau ninsoare, măsurarea se reprogramează.",
            "În caz că este placare existentă trebuie să fie demontată până la măsurare pentru a avea acces la studierea bazei.",
            "Aceste tipuri de lucrări necesită prindere mecanică.",
        ],
        "Poze cu zona de placare exterioară.",
    ),
]

TIP_LABELS = {
    "blat": "Tip · Blat / șorț",
    "scara": "Tip · Scări",
    "placare": "Tip · Placare perete",
    "semineu": "Tip · Placare cămin",
    "scara-exterior": "Tip · Scări exterioare",
    "glaf": "Tip · Pervazuri interioare / exterioare",
    "placare-exterior": "Tip · Placări exterioare / parapet (atic)",
}


def build_html(tip_label: str, items: list[str]) -> str:
    lis = "".join(f"<li>{t}</li>" for t in items)
    return f"""
<html><head><meta charset="utf-8"/>
<style>
  body {{ font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 10.2pt; }}
  .hdr {{ font-size: 8.5pt; color: #333; line-height: 1.35; margin-bottom: 10px; }}
  .tip {{ font-size: 12pt; font-weight: bold; margin: 14px 0 10px; color: #111; }}
  ol {{ margin: 0 0 12px 18px; padding: 0; }}
  li {{ margin: 0 0 6px; line-height: 1.35; }}
  .note {{ margin: 12px 0 14px; line-height: 1.4; font-size: 9.8pt; }}
  .conf-title {{ font-weight: bold; margin: 10px 0 6px; }}
  .conf {{ font-size: 9.8pt; line-height: 1.55; }}
  .row {{ margin: 4px 0; }}
</style></head><body>
<div class="hdr">
Otopeni, str. Drumul Gării Odăi nr. 42, Ilfov<br/>
Departament Logistică &amp; Planificare: Ionut Ghita<br/>
Mobil: +40 759 780 780 · Email: Ionut.ghita@artgranit.ro &nbsp;&nbsp;&nbsp; www.artgranit.ro
</div>
<div class="tip">{tip_label}</div>
<ol>{lis}</ol>
<p class="note">{NOTE_RO}</p>
<div class="conf-title">Confirmare client</div>
<div class="conf">
Am luat cunoștință cu conținutul checklist-ului și confirm asigurarea
punctelor enumerate mai sus la efectuarea măsurărilor.<br/><br/>
<div class="row">Prenume: ____________________</div>
<div class="row">Nume: ____________________ &nbsp;&nbsp;&nbsp; Data: ____ / ____ / ________</div>
<div class="row">Locație exactă: ______________________________________________________</div>
<div class="row">Semnătură: __________________</div>
</div>
</body></html>
"""


def make_generated_page(tip_slug: str, items: list[str], photo: str) -> fitz.Document:
    all_items = list(items) + [photo]
    html = build_html(TIP_LABELS[tip_slug], all_items)
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    rect = fitz.Rect(36, 36, 559, 806)
    page.insert_htmlbox(rect, html)
    return doc


def main() -> None:
    if not NEW_BLAT.exists():
        raise FileNotFoundError(f"Lipsește checklist-ul nou: {NEW_BLAT}")
    if not LEGACY_FULL.exists():
        raise FileNotFoundError(f"Lipsește pachetul vechi 7 tipuri: {LEGACY_FULL}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    LINKED_DIR.mkdir(parents=True, exist_ok=True)

    master = fitz.open()
    print(f"Blat ← {NEW_BLAT.name}")
    blat_src = fitz.open(NEW_BLAT)
    master.insert_pdf(blat_src)
    # salvează Blat single
    blat_only = fitz.open()
    blat_only.insert_pdf(blat_src)
    for _, slug, app_name, art_name, items, photo in TYPES:
        if slug != "blat":
            continue
        out_app = OUT_DIR / app_name
        blat_only.save(str(out_app))
        shutil.copy2(out_app, OUT_DIR / art_name)
        shutil.copy2(out_app, LINKED_DIR / art_name)
        pix = blat_src[0].get_pixmap(dpi=RENDER_DPI, alpha=False)
        png = PAGES_DIR / f"{slug}.png"
        pix.save(str(png))
        print(f"  {slug} → {art_name} + {png.name}")
    blat_only.close()
    blat_src.close()

    for _page_num, slug, app_name, art_name, items, photo in TYPES:
        if slug == "blat":
            continue
        assert photo is not None
        print(f"Generate {slug} (+ poze + notă)…")
        gen = make_generated_page(slug, items, photo)
        master.insert_pdf(gen)
        out_app = OUT_DIR / app_name
        gen.save(str(out_app))
        shutil.copy2(out_app, OUT_DIR / art_name)
        shutil.copy2(out_app, LINKED_DIR / art_name)
        pix = gen[0].get_pixmap(dpi=RENDER_DPI, alpha=False)
        png = PAGES_DIR / f"{slug}.png"
        pix.save(str(png))
        print(f"  {slug} → {art_name} + {png.name}")
        gen.close()

    FULL_PDF.parent.mkdir(parents=True, exist_ok=True)
    master.save(str(FULL_PDF))
    shutil.copy2(FULL_PDF, LEGACY_MIRROR)
    shutil.copy2(FULL_PDF, LINKED_DIR / "Checklist_Client_ArtGranit.pdf")
    master.close()
    print(f"Full → {FULL_PDF.relative_to(ROOT)} ({FULL_PDF.stat().st_size // 1024} KB)")
    print("Done.")


if __name__ == "__main__":
    main()
    sys.exit(0)
