#!/usr/bin/env python3
"""
În PDF-ul Ghid teren: înlocuiește denumirile utilajelor din Etapa 1.1
cu același text colorat (link) + hyperlink către manualul Utilaje.
Copiază PDF-urile în linked-manuals/ și pune URI-uri HTTPS absolute
(către Vercel) ca linkurile să meargă pe telefon după descărcarea PDF-ului.
"""

from __future__ import annotations

import shutil
import sys
import zipfile
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF_OUT = ROOT / "public/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf"
EXISTING_PDF = ROOT / "public/docs/operational-guide/Ghid-teren-masurare.pdf"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
ZIP_OUT = ROOT / "public/docs/operational-guide/field-guide/Ghid-teren-masurare-cu-manuale.zip"
PAGES_DIR = ROOT / "public/docs/operational-guide/field-guide/pages"
RENDER_DPI = 450
DESKTOP_PDF = Path(r"c:\Users\AlioSol\Desktop\Ghid_Teren_Atentie_ArtGranit_163540.pdf")

# URL public (PWA pe Vercel) — linkuri absolute ca să meargă pe telefon după descărcare
APP_PUBLIC_BASE = "https://argranit-instruire-adaptare.vercel.app"
# Ghid Operațional e pe panoul angajat (container referință teren & proiectare)
APP_GHID_OPERATIONAL_URL = f"{APP_PUBLIC_BASE}/ingineri/panou-angajat"
# Text vizibil în PDF (brand) — click-ul duce la APP_GHID_OPERATIONAL_URL
APP_GHID_DISPLAY_URL = "https://argranit-instruire-adaptare@artgranit.ro"
# Documentație tehnică = Repository pe panou (același destinație ca pe site)
APP_DOC_TEHNICA_URL = f"{APP_PUBLIC_BASE}/ingineri/panou-angajat?ref=repo&doc=doc-tehnica"
LINKED_MANUALS_WEB = f"{APP_PUBLIC_BASE}/docs/operational-guide/field-guide/linked-manuals"


def abs_manual(filename: str) -> str:
    """
    Link din PDF → panou (?doc=) ca pe site; tipul se completează la build by-type.
    Fallback fără tip: panou deschide tipul curent / blat.
    """
    name = filename.lstrip("/")
    mapping = {
        "anexa-1-sablon.pdf": "anexa1",
        "Carnet-masuratori-creion.pdf": "carnet",
        "proliner-manual.pdf": "proliner",
        "bosch-gll-3-80-manual.pdf": "gll",
        "bosch-ruleta-5m.pdf": "ruleta",
        "Checklist_Client_ArtGranit.pdf": "checklist",
        "Canting.pdf": "canting",
        "Exemple_Fise_Tehnice_Accesorii.pdf": "fise",
        "Exemplu_Comanda_Material.pdf": "ctg",
    }
    doc_id = mapping.get(name)
    if doc_id:
        return f"{APP_GHID_OPERATIONAL_URL}?ref=guide&ghid=teren&doc={doc_id}"
    return f"{LINKED_MANUALS_WEB}/{name}"


# Albastru discret (aproape de UI)
LINK_COLOR = (47 / 255, 111 / 255, 237 / 255)  # #2f6fed
# Text corp PDF (aprox. #1c1915)
BODY_COLOR = (28 / 255, 25 / 255, 21 / 255)
# Indicator „deschide” (pătrat + săgeată) — lățime rezervată după text
INDICATOR_GAP = 3.2
INDICATOR_W = 9.5

# Pagina 2 (index 1) — rânduri din „Ce se face”
DESKTOP_ANEXA = Path(r"c:\Users\AlioSol\Desktop\Anexa 1 Sablon.pdf")
DESKTOP_CANTING = Path(r"c:\Users\AlioSol\Desktop\Cating.pdf")  # nume fișier pe Desktop; corect: Canting
DESKTOP_CTG = Path(r"c:\Users\AlioSol\Desktop\Exemplu_Comanda_Material.pdf")
FISE_TEHNICE_PDF = LINKED_DIR / "Exemple_Fise_Tehnice_Accesorii.pdf"

TARGETS: list[dict] = [
    {
        "text": "• ANEXA Nr. 1 (șablon) + fișe tehnice",
        "source": DESKTOP_ANEXA,
        "linked_name": "anexa-1-sablon.pdf",
        "fallback": ROOT / "public/docs/operational-guide/field-guide/linked-manuals/anexa-1-sablon.pdf",
    },
    {
        "text": "• Aparatul de măsurat Proliner",
        "device_id": "eq-proliner",
        "source": ROOT / "public/docs/equipment/proliner-quick-start-ro.pdf",
        "linked_name": "proliner-manual.pdf",
    },
    {
        "text": "• Nivelă laser Bosch GLL 3-80",
        "device_id": "eq-bosch-gll-3-80",
        "source": ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf",
        "linked_name": "bosch-gll-3-80-manual.pdf",
    },
    {
        "text": "• Ruletă Bosch 5 m",
        "device_id": "eq-bosch-tape-5m",
        "source": ROOT / "public/docs/equipment/bosch-tape-5m/bosch-tape-5m-declaratie-ue.pdf",
        "linked_name": "bosch-ruleta-5m.pdf",
    },
]


def copy_linked_manuals() -> None:
    LINKED_DIR.mkdir(parents=True, exist_ok=True)
    for t in TARGETS:
        src: Path = t["source"]
        if not src.exists():
            fallback = t.get("fallback")
            if isinstance(fallback, Path) and fallback.exists() and fallback.resolve() != (LINKED_DIR / t["linked_name"]).resolve():
                src = fallback
            elif (LINKED_DIR / t["linked_name"]).exists():
                print(f"  keep existing linked-manuals/{t['linked_name']}")
                continue
            else:
                raise FileNotFoundError(f"Lipsește manualul sursă: {t['source']}")
        dest = LINKED_DIR / t["linked_name"]
        if src.resolve() == dest.resolve():
            print(f"  linked OK {dest.name}")
            continue
        shutil.copy2(src, dest)
        print(f"  linked ← {src.name} → linked-manuals/{dest.name}")

    # Canting — fișier Desktop „Cating.pdf” (ortografie greșită); stocăm ca Canting.pdf
    canting_dest = LINKED_DIR / "Canting.pdf"
    if DESKTOP_CANTING.exists():
        shutil.copy2(DESKTOP_CANTING, canting_dest)
        print(f"  linked ← {DESKTOP_CANTING.name} → linked-manuals/Canting.pdf")
    elif canting_dest.exists():
        print("  keep existing linked-manuals/Canting.pdf")
    else:
        raise FileNotFoundError(f"Lipsește PDF Canting: {DESKTOP_CANTING}")

    # CTG — Exemplu_Comanda_Material.pdf (Comandă transfer între gestiuni)
    ctg_dest = LINKED_DIR / "Exemplu_Comanda_Material.pdf"
    if DESKTOP_CTG.exists():
        shutil.copy2(DESKTOP_CTG, ctg_dest)
        print(f"  linked ← {DESKTOP_CTG.name} → linked-manuals/Exemplu_Comanda_Material.pdf")
    elif ctg_dest.exists():
        print("  keep existing linked-manuals/Exemplu_Comanda_Material.pdf")
    else:
        raise FileNotFoundError(f"Lipsește PDF CTG: {DESKTOP_CTG}")

    if FISE_TEHNICE_PDF.exists():
        print(f"  keep existing linked-manuals/{FISE_TEHNICE_PDF.name}")
    else:
        print("  WARN: lipsește Exemple_Fise_Tehnice_Accesorii.pdf — rulează setup_fise_tehnice_accesorii.py")

    carnet_pdf = LINKED_DIR / "Carnet-masuratori-creion.pdf"
    if carnet_pdf.exists():
        print(f"  keep existing linked-manuals/{carnet_pdf.name}")
    else:
        print("  WARN: lipsește Carnet-masuratori-creion.pdf — rulează setup_carnet_masuratori_pdf.py")


def restore_clean_pdf() -> None:
    """Repune PDF sursă curat (fără patch anterior), ca indicatorii să nu se acumuleze."""
    source = DESKTOP_PDF if DESKTOP_PDF.exists() else None
    if source is None and EXISTING_PDF.exists():
        # dacă mirror-ul e deja patch-uit, tot e mai bine decât nimic doar dacă
        # Desktop lipsește — preferăm Desktop
        source = None
    if DESKTOP_PDF.exists():
        PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(DESKTOP_PDF, PDF_OUT)
        print(f"PDF curat ← {DESKTOP_PDF.name}")
    elif not PDF_OUT.exists():
        raise FileNotFoundError(f"Lipsește PDF: {PDF_OUT}")


def draw_open_indicator(page: fitz.Page, text_rect: fitz.Rect, color: tuple[float, float, float]) -> fitz.Rect:
    """
    Indicator discret tip „deschide / extern”:
    pătrat mic (ușă/fereastră) + săgeată spre dreapta-sus.
    """
    cy = (text_rect.y0 + text_rect.y1) / 2
    x0 = text_rect.x1 + INDICATOR_GAP
    box = 3.35
    # pătrat
    sq = fitz.Rect(x0, cy - box / 2, x0 + box, cy + box / 2)
    page.draw_rect(sq, color=color, width=0.85, fill=None)

    # săgeată ↗ ieșind din pătrat
    tip = fitz.Point(x0 + box + 3.6, cy - box / 2 - 0.9)
    page.draw_line(fitz.Point(x0 + box * 0.35, cy + box * 0.15), tip, color=color, width=0.85)
    page.draw_line(tip, fitz.Point(tip.x - 2.2, tip.y), color=color, width=0.85)
    page.draw_line(tip, fitz.Point(tip.x, tip.y + 2.2), color=color, width=0.85)

    return fitz.Rect(x0 - 0.5, text_rect.y0 - 0.8, tip.x + 1.2, text_rect.y1 + 0.8)


def find_span(page: fitz.Page, needle: str) -> dict | None:
    data = page.get_text("dict")
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span["text"].strip() == needle.strip():
                    return span
    # fallback: search_for + first matching span by overlap
    hits = page.search_for(needle)
    if not hits:
        return None
    rect = hits[0]
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if fitz.Rect(span["bbox"]).intersects(rect):
                    return span
    return None


def remove_photo_placeholders(doc: fitz.Document) -> int:
    """
    Șterge blocurile goale «Poză / screenshot» + cadru «[ Atașează poză ]» + legendă «Poză: …».
    """
    removed = 0
    for page in doc:
        titles = page.search_for("Poză / screenshot")
        if not titles:
            continue

        drawings = page.get_drawings()
        big_boxes = [
            fitz.Rect(d["rect"])
            for d in drawings
            if d.get("rect") and d["rect"].width > 180 and d["rect"].height > 30
        ]

        # legende sub cadru (nu titlul)
        captions: list[fitz.Rect] = []
        data = page.get_text("dict")
        for block in data["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                text = "".join(s["text"] for s in line["spans"]).strip()
                if text.startswith("Poză:") and "screenshot" not in text.lower():
                    captions.append(fitz.Rect(line["bbox"]))

        unions: list[fitz.Rect] = []
        for title in titles:
            union = fitz.Rect(title)
            # cadru mare imediat sub titlu
            candidates = [
                b for b in big_boxes if b.y0 >= title.y1 - 2 and b.y0 <= title.y1 + 25
            ]
            if candidates:
                box = min(candidates, key=lambda r: r.y0)
                union |= box
                bottom = box.y1
            else:
                # fallback: zonă tipică sub titlu
                union |= fitz.Rect(title.x0 - 4, title.y1, page.rect.x1 - 36, title.y1 + 58)
                bottom = union.y1

            # legendă imediat sub cadru
            for cap in captions:
                if bottom - 2 <= cap.y0 <= bottom + 18:
                    union |= cap

            # padding mic
            unions.append(union + (-2, -1.5, 2, 2))

        for u in unions:
            page.add_redact_annot(u, fill=(1, 1, 1))
            removed += 1

        if unions:
            page.apply_redactions(
                images=fitz.PDF_REDACT_IMAGE_NONE,
                graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
            )
            print(f"  photo-blocks p{page.number + 1}: removed {len(unions)}")

    return removed


def remove_ce_arata_poza_captions(doc: fitz.Document) -> int:
    """Șterge legendele rămase «Ce arată poza: …» (fără cadru)."""
    removed = 0
    for page in doc:
        hits = page.search_for("Ce arată poza")
        if not hits:
            continue
        for hit in hits:
            # întreaga linie
            data = page.get_text("dict")
            line_rect = fitz.Rect(hit)
            for block in data["blocks"]:
                if block.get("type") != 0:
                    continue
                for line in block["lines"]:
                    lr = fitz.Rect(line["bbox"])
                    if lr.intersects(hit):
                        line_rect |= lr
            page.add_redact_annot(line_rect + (-1, -0.5, 2, 0.8), fill=(1, 1, 1))
            removed += 1
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
        print(f"  ce-arata-poza p{page.number + 1}: removed captions")
    return removed


def insert_doc_link_button(
    page: fitz.Page,
    *,
    label: str,
    origin: fitz.Point,
    uri: str,
    fontsize: float = 9.0,
) -> fitz.Rect:
    """Text albastru + underline + icon deschide + link URI (Unicode OK)."""
    # htmlbox = font Unicode; TextWriter+helv pierde diacriticele
    text_width = max(
        fitz.get_text_length(label, fontname="helv", fontsize=fontsize) * 1.08,
        len(label) * fontsize * 0.52,
    )
    rect = fitz.Rect(
        origin.x,
        origin.y - fontsize + 1.2,
        origin.x + text_width + 4,
        origin.y + 3,
    )
    page.insert_htmlbox(
        rect,
        f'<p style="margin:0;padding:0;color:#2f6fed;font-size:{fontsize}pt;'
        f'font-family:sans-serif;font-weight:500;">{label}</p>',
    )
    page.draw_line(
        fitz.Point(rect.x0, rect.y1 - 0.8),
        fitz.Point(min(rect.x1 - 2, origin.x + text_width), rect.y1 - 0.8),
        color=LINK_COLOR,
        width=0.55,
    )
    # icon la dreapta textului
    icon_anchor = fitz.Rect(origin.x + text_width + 2, rect.y0, origin.x + text_width + 12, rect.y1)
    icon_rect = draw_open_indicator(page, icon_anchor, LINK_COLOR)
    hit = rect | icon_rect
    page.insert_link(
        {
            "kind": fitz.LINK_URI,
            "from": hit + (-1, -1, 1, 1),
            "uri": uri,
        }
    )
    print(f"  doc button → {label} ({uri})")
    return hit


TITLE_COLOR = (0.059, 0.216, 0.373)

PAGE_BODY_CSS = """
* { font-family: sans-serif; }
.title { font-size: 11.5pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.sub { font-size: 9pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.body { font-size: 8.6pt; color: #1c1915; margin: 0; padding: 0; line-height: 1.25; }
"""


def _clear_page_body(page: fitz.Page) -> None:
    for link in list(page.get_links()):
        page.delete_link(link)
    page.add_redact_annot(
        fitz.Rect(28, 78, page.rect.width - 28, 800),
        fill=(1, 1, 1),
    )
    page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
    )


def rebuild_page2_compact(doc: fitz.Document) -> dict[str, float]:
    """
    Etapa 1.1–1.4 pe pagina 2 — fără goluri de poze; linkuri + butoane Checklist/Anexa.
    Returnează y% pentru hotspot-uri în app.
    """
    page = doc[1]
    page_h = page.rect.height
    left = 42.52
    width = page.rect.width - left - 42
    _clear_page_body(page)

    y = 86.0
    btn_ys: dict[str, float] = {}

    def html_block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(left, y, left + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_BODY_CSS)
        y = rect.y1 + 3

    def button(key: str, label: str, uri: str) -> None:
        nonlocal y
        y += 1
        origin = fitz.Point(left, y + 9)
        insert_doc_link_button(page, label=label, origin=origin, uri=uri, fontsize=8.6)
        btn_ys[key] = origin.y - 8.6
        y += 15

    def link_bullet(key: str, text: str, uri: str) -> None:
        nonlocal y
        origin = fitz.Point(left, y + 9)
        insert_doc_link_button(page, label=text, origin=origin, uri=uri, fontsize=8.6)
        btn_ys[key] = origin.y - 8.6
        y += 14

    # --- 1.1 ---
    html_block('<p class="title">Etapa 1.1 · Echipament necesar</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    link_bullet("anexa11", "• ANEXA Nr. 1 (șablon) + fișe tehnice", abs_manual("anexa-1-sablon.pdf"))
    link_bullet(
        "carnet",
        "• Carnet măsurători + creion",
        abs_manual("Carnet-masuratori-creion.pdf"),
    )
    link_bullet("proliner", "• Aparatul de măsurat Proliner", abs_manual("proliner-manual.pdf"))
    link_bullet("gll", "• Nivelă laser Bosch GLL 3-80", abs_manual("bosch-gll-3-80-manual.pdf"))
    link_bullet("tape", "• Ruletă Bosch 5 m", abs_manual("bosch-ruleta-5m.pdf"))
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Aceeași listă pentru toate tipurile. Fără trusă completă, "
        "nu pleacă spre măsurare — pe teren nu poți „completa” echipamentul.</p>",
        28,
    )
    y += 4

    # --- 1.2 ---
    html_block('<p class="title">Etapa 1.2 · Programare confirmată</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Verifici dată, oră, adresă și acces în planificare / calendar.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Nu e un fișier pe care îl „bifezi” din atașamentele Bitrix — "
        "e organizare drum.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Fără programare confirmată riști să ajungi la o adresă greșită, "
        "fără acces sau fără persoana cu putere de decizie.</p>",
        28,
    )
    y += 4

    # --- 1.3 ---
    html_block('<p class="title">Etapa 1.3 · Checklist condiții client</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Descarci din Bitrix checklist-ul pe tip produs, "
        "semnat pe tipul de măsurare.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Verifici pe listă că condițiile clientului sunt bifate / "
        "semnate înainte de drum.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Checklist-ul confirmă că pe loc există condițiile minime "
        "(mobilă, acces, accesorii etc.). Fără el, măsori pe o situație nepregătită.</p>",
        28,
    )
    button("checklist", "Checklist_Client_ArtGranit", abs_manual("Checklist_Client_ArtGranit.pdf"))
    y += 4

    # --- 1.4 ---
    html_block('<p class="title">Etapa 1.4 · Anexa 1</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Citești Anexa 1 înainte de drum: muchie, finisaj, "
        "decupaje, accesorii, criterii.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Descarci Anexa proiectului din Bitrix — pe teren o completezi "
        "și o semnezi cu clientul.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Anexa 1 e contractul pe loc între măsurător și client: "
        "ce s-a agreat pe teren trebuie să fie scris și semnat — altfel proiectarea "
        "interpretează greșit.</p>",
        28,
    )
    button("anexa14", "Anexa 1 (șablon)", abs_manual("anexa-1-sablon.pdf"))

    print(f"  page2 rebuild end y={y:.0f} (footer ~815)")
    return {k: 100.0 * v / page_h for k, v in btn_ys.items()}


def rebuild_page4_compact(doc: fitz.Document) -> None:
    """Etapa 2.1–2.4 pe pagina 4 — fără goluri de poze."""
    page = doc[3]
    left = 42.52
    width = page.rect.width - left - 42
    _clear_page_body(page)

    y = 86.0

    def html_block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(left, y, left + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_BODY_CSS)
        y = rect.y1 + 3

    html_block('<p class="title">Etapa 2.1 · Cotă pe loc · Voce tare</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Fiecare cotă se notează în clipa măsurării, pe loc — "
        "nu se lasă nimic pe memorie și nu se completează ulterior.</p>",
        14,
    )
    html_block(
        "<p class='body'>• La cotele critice se citesc valorile cu voce tare, "
        "ca să se evite transpozițiile (exemplu: 1180 scris greșit ca 1810).</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Memoria greșește sub presiune; vocea tare prinde inversările "
        "de cifre înainte să ajungă pe schiță și în proiect.</p>",
        28,
    )
    y += 4

    html_block('<p class="title">Etapa 2.2 · Unghiuri măsurate · Detalii semnate</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Unghiurile se măsoară întotdeauna — nu se presupune că sunt 90°. "
        "Dacă sunt mai mult de 2 îmbinări, se face șablon pe unghi.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Detaliile se finalizează cu clientul pe loc și se semnează "
        "pe schiță / Anexa 1 înainte de a pleca de pe șantier.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Unghiurile „presupuse” 90° produc blaturi care nu se potrivesc. "
        "Semnătura pe loc închide discuția: ce e pe Anexa 1, nu „am vorbit altfel”.</p>",
        28,
    )
    y += 4

    html_block('<p class="title">Etapa 2.3 · FAȚĂ VĂZUTĂ · Condiții improprii</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• FAȚA VĂZUTĂ și orientarea pieselor se marchează pe schiță "
        "și se confirmă cu fotografie, ca să nu se monteze invers.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Dacă condițiile de pe teren sunt improprii pentru o măsurare "
        "corectă, se anunță managerul: fie se reprogramează, fie se pregătesc "
        "condițiile înainte de continuare.</p>",
        28,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Fără marcaj FAȚĂ VĂZUTĂ, venele și fața se pot monta invers. "
        "Măsurarea forțată pe condiții improprii produce rebut — e mai ieftin să oprești pe loc.</p>",
        28,
    )
    y += 4

    html_block('<p class="title">Etapa 2.4 · Proliner — ce măsori</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• În fișier: toate golurile, toate cotele, toate fronturile, "
        "conturul pe mobilă / perete.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Tăvi și întoarceri (L, U, peninsula) — le incluzi pe contur.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Dimensiuni interioare și exterioare ale accesoriilor de pe loc "
        "(pentru re-verificare).</p>",
        14,
    )
    html_block(
        "<p class='body'>• Puncte surplus la fiecare îmbinare — ca proiectarea să vadă rostul real.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Măsoară tot ce e posibil — chiar dacă un colț sau o întoarcere "
        "pare „nefolositoare”.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Informația completă din teren evită erori la proiectare. "
        "Mai bine +10 minute de măsurare decât ore de proiectare și remăsurare "
        "pentru că a lipsit ceva esențial.</p>",
        28,
    )

    print(f"  page4 rebuild end y={y:.0f} (footer ~815)")


def rebuild_page3_compact(doc: fitz.Document) -> dict[str, float]:
    """
    Rescrie Etapa 1.5–1.8 pe pagina 3 fără goluri de poze și fără overlap pe butoane.
    Păstrează header + footer. Unicode via insert_htmlbox. Returnează y% hotspot-uri.
    """
    page = doc[2]
    page_w = page.rect.width
    page_h = page.rect.height
    left = 42.52
    width = page_w - left - 42

    _clear_page_body(page)

    y = 86.0
    btn_ys: dict[str, float] = {}
    css = PAGE_BODY_CSS

    def html_block(html: str, height: float) -> None:
        nonlocal y
        rect = fitz.Rect(left, y, left + width, y + height)
        page.insert_htmlbox(rect, html, css=css)
        y = rect.y1 + 3

    def button(key: str, label: str, uri: str) -> None:
        nonlocal y
        y += 1
        origin = fitz.Point(left, y + 9)
        insert_doc_link_button(page, label=label, origin=origin, uri=uri, fontsize=8.6)
        btn_ys[key] = origin.y - 8.6
        y += 15

    # --- 1.5 ---
    html_block('<p class="title">Etapa 1.5 · Canting + fișe accesorii</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Descarci din Bitrix / task (fișiere pentru măsurare): "
        "cantingul + fișele tehnice accesorii.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Le ai la tine pe teren — verifici îmbinările și golurile față de fișe.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Cantingul fixează poziția îmbinărilor gândită la ofertare. "
        "Fișele accesorii îți arată golurile reale (chiuvetă, plită etc.) — fără ele măsori „din ochi”.</p>",
        28,
    )
    button("canting", "Canting", abs_manual("Canting.pdf"))
    button(
        "fise",
        "Fișe tehnice accesorii (exemple)",
        abs_manual("Exemple_Fise_Tehnice_Accesorii.pdf"),
    )
    y += 4

    # --- 1.6 ---
    html_block('<p class="title">Etapa 1.6 · Comandă material (CTG)</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Ai la tine comanda de material / fișa CTG din Bitrix: "
        "material, muchie, decupări, sens vene.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Verifici pe teren că tipul materialului și datele din comandă "
        "coincid cu ce măsori.</p>",
        14,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>CTG-ul leagă măsurarea de materialul real: tip, denumire, grosime, vene. "
        "Fără el riști să măsori pentru alt material decât cel comandat.</p>",
        28,
    )
    button("ctg", "CTG — Exemplu_Comanda_Material", abs_manual("Exemplu_Comanda_Material.pdf"))
    y += 4

    # --- 1.7 ---
    html_block('<p class="title">Etapa 1.7 · Fișa tehnică material</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Consultați fișa tehnică a materialului după tipul din comandă "
        "(Documentație tehnică).</p>",
        14,
    )
    html_block(
        "<p class='body'>• Nu e neapărat un fișier atașat în Bitrix — o găsiți pe panoul angajat.</p>",
        14,
    )
    html_block(
        f"<p class='body'>Link Documentație tehnică: "
        f"<a href='{APP_DOC_TEHNICA_URL}'>{APP_GHID_DISPLAY_URL}</a> "
        f"— panou angajat → Repository tehnic.</p>",
        28,
    )
    page.insert_link(
        {
            "kind": fitz.LINK_URI,
            "from": fitz.Rect(left, y - 30, left + width, y - 2),
            "uri": APP_DOC_TEHNICA_URL,
        }
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Fișa tehnică spune spațiile de dilatare, suportul necesar, "
        "limitările materialului. Pe teren le aplici imediat — nu le lași „de văzut la proiectare”.</p>",
        28,
    )
    y += 4

    # --- 1.8 ---
    html_block('<p class="title">Etapa 1.8 · Regulă Full Kit</p>', 16)
    html_block('<p class="sub">Ce se face</p>', 13)
    html_block(
        "<p class='body'>• Kitul e COMPLET sau INCOMPLET — nu există „aproape gata”.</p>",
        14,
    )
    html_block(
        "<p class='body'>• Fără documentele din Bitrix (Checklist, Anexa 1, Canting, CTG) + "
        "echipament, nu pleacă spre măsurare.</p>",
        28,
    )
    html_block('<p class="sub">De ce</p>', 13)
    html_block(
        "<p class='body'>Un kit incomplet pe teren înseamnă măsurare pe date incomplete — "
        "erori la proiectare și remăsurări. Regula e binară ca să nu se plece „cu ce avem”.</p>",
        28,
    )

    print(f"  page3 rebuild end y={y:.0f} (footer ~815)")
    return {k: 100.0 * v / page_h for k, v in btn_ys.items()}


def fix_page1_ghid_link(doc: fitz.Document) -> None:
    """
    Text vizibil: https://argranit-instruire-adaptare@artgranit.ro
    Click → panou angajat (Ghid Operațional pe Vercel).
    """
    page = doc[0]

    # șterge doar linkuri către app / URL greșit (nu tot pe pagină)
    for link in list(page.get_links()):
        uri = (link.get("uri") or "").lower()
        if (
            "argranit-instruire-adaptare" in uri
            or "panou-angajat" in uri
            or "@artgranit.ro" in uri
        ):
            page.delete_link(link)

    # adună toate fragmentele liniei (URL vechi era între două span-uri)
    markers = (
        "puteți găsi pe linkul",
        "containerul ghid operațional",
        "argranit-instruire-adaptare",
        "adaptare@artgranit",
    )
    rects: list[fitz.Rect] = []
    data = page.get_text("dict")
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            txt = "".join(s["text"] for s in line["spans"]).lower()
            if any(m in txt for m in markers):
                rects.append(fitz.Rect(line["bbox"]))

    if not rects:
        print("  WARN: nu am găsit linia cu linkul pe pagina 1")
        return

    union = rects[0]
    for r in rects[1:]:
        union |= r
    # acoperă și spațiul dintre «linkul:» și «în containerul…»
    union = fitz.Rect(42.0, union.y0 - 1.5, page.rect.x1 - 36, union.y1 + 14)

    page.add_redact_annot(union, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    box = fitz.Rect(42.52, union.y0, page.rect.x1 - 36, union.y0 + 26)
    page.insert_htmlbox(
        box,
        f'<p style="margin:0;font-family:sans-serif;font-size:8pt;color:#1c1915;line-height:1.3;">'
        f'Îl puteți găsi pe linkul: '
        f'<a href="{APP_GHID_OPERATIONAL_URL}" style="color:#2f6fed;">'
        f'{APP_GHID_DISPLAY_URL}</a>'
        f' — în containerul Ghid Operațional (referință teren &amp; proiectare).</p>',
    )
    page.insert_link(
        {
            "kind": fitz.LINK_URI,
            "from": fitz.Rect(42.52, union.y0, page.rect.x1 - 36, union.y0 + 22),
            "uri": APP_GHID_OPERATIONAL_URL,
        }
    )
    print(f"  page1 text → {APP_GHID_DISPLAY_URL}")
    print(f"  page1 href → {APP_GHID_OPERATIONAL_URL}")


def insert_checklist_button(doc: fitz.Document) -> None:
    """Etapa 1.3 — Checklist_Client_ArtGranit."""
    insert_doc_link_button(
        doc[1],
        label="Checklist_Client_ArtGranit",
        origin=fitz.Point(42.52, 541.0),
        uri=abs_manual("Checklist_Client_ArtGranit.pdf"),
    )


def insert_anexa14_button(doc: fitz.Document) -> None:
    """Etapa 1.4 — același șablon Anexa 1 ca la echipament."""
    insert_doc_link_button(
        doc[1],
        label="Anexa 1 (șablon)",
        origin=fitz.Point(42.52, 655.0),
        uri=abs_manual("anexa-1-sablon.pdf"),
    )


def apply_text_fixes(doc: fitz.Document) -> int:
    """Înlocuiește «drumul nu pleacă» → «nu pleacă spre măsurare» pe toate paginile."""
    needle = "drumul nu pleacă"
    replacement = "nu pleacă spre măsurare"
    fixed = 0

    for page in doc:
        to_replace: list[dict] = []
        data = page.get_text("dict")
        for block in data["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    if needle in span["text"]:
                        to_replace.append(span)

        if not to_replace:
            continue

        for span in to_replace:
            rect = fitz.Rect(span["bbox"])
            page.add_redact_annot(rect + (-0.5, -0.35, 0.8, 0.45), fill=(1, 1, 1))
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

        for span in to_replace:
            new_text = span["text"].replace(needle, replacement)
            fontsize = float(span["size"])
            box = fitz.Rect(
                span["bbox"][0],
                span["bbox"][1] - 0.3,
                page.rect.x1 - 36,
                span["bbox"][3] + 2.0,
            )
            rc = page.insert_textbox(
                box,
                new_text,
                fontname="helv",
                fontsize=max(fontsize - 0.5, 7.5),
                color=BODY_COLOR,
                align=fitz.TEXT_ALIGN_LEFT,
            )
            if rc < 0:
                tw = fitz.TextWriter(page.rect, color=BODY_COLOR)
                tw.append(
                    fitz.Point(span["origin"]),
                    new_text,
                    fontsize=max(fontsize - 1.0, 7.2),
                    font=fitz.Font("helv"),
                )
                tw.write_text(page)
            fixed += 1
            print(f"  text-fix p{page.number + 1}: «{needle}» → «{replacement}»")

    return fixed


def patch_pdf(pdf_path: Path) -> None:
    doc = fitz.open(pdf_path)

    print("Remove empty photo placeholders…")
    n_photos = remove_photo_placeholders(doc)
    print(f"  {n_photos} blocuri poză șterse")

    print("Remove leftover «Ce arată poza»…")
    n_cap = remove_ce_arata_poza_captions(doc)
    print(f"  {n_cap} legende șterse")

    print("Fix page 1 Ghid Operațional link…")
    fix_page1_ghid_link(doc)

    print("Apply wording fixes…")
    n = apply_text_fixes(doc)
    print(f"  {n} formulări corectate")

    print("Rebuild page 2 (Etapa 1.1–1.4 compact)…")
    p2 = rebuild_page2_compact(doc)
    for k, v in p2.items():
        print(f"  hotspot%p2.{k}={v:.2f}")

    print("Rebuild page 3 (Etapa 1.5–1.8 compact + butoane)…")
    btn_pct = rebuild_page3_compact(doc)
    for k, v in btn_pct.items():
        print(f"  hotspot%{k}={v:.2f}")

    print("Rebuild page 4 (Etapa 2 compact)…")
    rebuild_page4_compact(doc)

    tmp = pdf_path.with_suffix(".patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(pdf_path)
    print(f"PDF patched → {pdf_path.relative_to(ROOT)}")


def sync_mirror() -> None:
    if PDF_OUT.exists():
        EXISTING_PDF.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(PDF_OUT, EXISTING_PDF)
        print(f"Mirror → {EXISTING_PDF.relative_to(ROOT)}")


def write_download_zip() -> None:
    with zipfile.ZipFile(ZIP_OUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(PDF_OUT, arcname="Ghid-teren-masurare.pdf")
        for pdf in sorted(LINKED_DIR.glob("*.pdf")):
            zf.write(pdf, arcname=f"linked-manuals/{pdf.name}")
    print(f"ZIP → {ZIP_OUT.relative_to(ROOT)} ({ZIP_OUT.stat().st_size // 1024} KB)")


def render_pages(page_numbers: list[int]) -> None:
    """page_numbers: 1-based."""
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_OUT)
    for n in page_numbers:
        page = doc[n - 1]
        pix = page.get_pixmap(dpi=RENDER_DPI, alpha=False)
        out = PAGES_DIR / f"page-{n:02d}.png"
        pix.save(str(out))
        print(f"Re-render → {out.relative_to(ROOT)} ({pix.width}x{pix.height})")
    doc.close()


def main() -> None:
    print("Restore PDF curat…")
    restore_clean_pdf()
    if not PDF_OUT.exists():
        raise FileNotFoundError(f"Lipsește PDF: {PDF_OUT} — rulează mai întâi field-guide-pages")
    print("Copy linked manuals…")
    copy_linked_manuals()
    print("Patch PDF (wording + equipment links)…")
    patch_pdf(PDF_OUT)
    sync_mirror()
    write_download_zip()
    if "--no-render" not in sys.argv:
        print("Re-render all pages…")
        doc = fitz.open(PDF_OUT)
        render_pages(list(range(1, len(doc) + 1)))
        doc.close()
    # Variante per tip (cuprins + conținut fără alte tipuri)
    print("Build per-type guides…")
    import runpy

    runpy.run_path(str(ROOT / "scripts/build_field_guide_per_type.py"), run_name="__main__")
    print("Done.")


if __name__ == "__main__":
    main()