#!/usr/bin/env python3
"""
Generează câte un ghid teren per tip de măsurare:
  - cuprins (pagina 1) COMPLET — toate etapele pentru toate tipurile
  - pagini conținut: Etapa 1–2 comune + doar tipul curent
  - PDF + ZIP download per tip
"""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
MASTER_PDF = ROOT / "public/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
BY_TYPE_DIR = ROOT / "public/docs/operational-guide/field-guide/by-type"
RENDER_DPI = 300

APP_PUBLIC_BASE = "https://argranit-instruire-adaptare.vercel.app"
APP_PANOU = f"{APP_PUBLIC_BASE}/ingineri/panou-angajat"

# Fișier din linked-manuals → ?doc= pe panou (același destinație ca pe site)
FILENAME_TO_DOC_ID = {
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

# Zona cuprins tipuri pe pagina 1 (de la Etapa 3 până înainte de ATENȚIE Bitrix)
TOC_TYPE_TOP = 348.0
TOC_TYPE_BOTTOM = 560.0
TOC_LEFT = 42.52
TOC_RIGHT_MARGIN = 36.0

# Footer pe paginile de conținut
CONTENT_FOOTER_Y = 800.0

TYPE_SPECS: list[dict] = [
    {
        "id": "blat",
        "label": "Blat",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare BLAT</p>
            <p class="n">Doar pentru tipul Blat — nu se aplică la scări, placări, glafuri etc.</p>
            <p class="i">3.1  Condiții obligatorii (înainte de măsurare)</p>
            <p class="i">3.2  Întrebări pe loc</p>
            <p class="i">3.3  Reguli tip blat</p>
            <p class="i">3.4  Momentul măsurării</p>
            <p class="i">3.5  Reverificare pe loc</p>
        """,
        "keep_pages": [1, 2, 3, 4, 5, 6, 7, 8],
        "trim": {},  # pagini întregi doar Blat
    },
    {
        "id": "scara",
        "label": "Scări",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare SCĂRI</p>
            <p class="n">Doar pentru tipul Scări — nu include Blat sau alte tipuri.</p>
            <p class="i">3.1  Scări (obligații pe loc, reguli pe teren, Bitrix)</p>
        """,
        "keep_pages": [1, 2, 3, 4, 9],
        "trim": {
            # pagina 9 (0-based 8): păstrează 4.1, ascunde 4.2
            9: {"keep_from": 78.0, "keep_to": 282.0},
        },
    },
    {
        "id": "placare",
        "label": "Placare perete",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare PLACARE / ȘORȚ</p>
            <p class="n">Doar pentru placare perete / șorț — nu include Blat sau alte tipuri.</p>
            <p class="i">3.1  Placare perete (laser, goluri, Proliner)</p>
        """,
        "keep_pages": [1, 2, 3, 4, 9],
        "trim": {
            9: {"keep_from": 280.0, "keep_to": CONTENT_FOOTER_Y},
        },
    },
    {
        "id": "semineu",
        "label": "Placare cămin",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare PLACARE CĂMIN</p>
            <p class="n">Doar pentru placare cămin — nu include Blat sau alte tipuri.</p>
            <p class="i">3.1  Placare cămin (proiect pe loc, termoizolare, grilă)</p>
        """,
        "keep_pages": [1, 2, 3, 4, 10],
        "trim": {
            10: {"keep_from": 78.0, "keep_to": 290.0},
        },
    },
    {
        "id": "scara_exterior",
        "label": "Scări exterioare",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare SCĂRI EXTERIOARE</p>
            <p class="n">Doar pentru scări exterioare — nu include Blat sau alte tipuri.</p>
            <p class="i">3.1  Scări exterioare (schele, meteo, picurător, pantă)</p>
        """,
        "keep_pages": [1, 2, 3, 4, 10],
        "trim": {
            10: {"keep_from": 288.0, "keep_to": 513.0},
        },
    },
    {
        "id": "glaf",
        "label": "Pervazuri / glafuri",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare PERVAZURI / GLAFURI</p>
            <p class="n">Doar pentru pervazuri / glafuri — nu include Blat sau alte tipuri.</p>
            <p class="i">3.1  Pervazuri / glafuri (coduri F1…Fn, pantă exterior)</p>
        """,
        "keep_pages": [1, 2, 3, 4, 10],
        "trim": {
            10: {"keep_from": 511.0, "keep_to": CONTENT_FOOTER_Y},
        },
    },
    {
        "id": "placare_exterior",
        "label": "Placări exterioare",
        "toc_html": """
            <p class="h">Etapa 3 · Tip măsurare PLACĂRI EXTERIOARE</p>
            <p class="n">Doar pentru placări exterioare / parapet — nu include Blat sau alte tipuri.</p>
            <p class="i">3.1  Placări exterioare / parapet (atic)</p>
        """,
        "keep_pages": [1, 2, 3, 4, 11],
        "trim": {},
    },
]

TOC_CSS = """
p { margin: 0 0 6px 0; font-family: sans-serif; color: #1c1915; }
.h { font-size: 11pt; font-weight: 700; color: #0f3760; margin-bottom: 4px; }
.n { font-size: 8pt; color: #5c564e; margin-bottom: 10px; }
.i { font-size: 9.5pt; margin: 0 0 8px 14px; }
"""


def rewrite_links_to_panou(doc: fitz.Document, tip: str) -> int:
    """
    Linkurile din PDF-ul descărcat duc pe panou la același document
    ca butonul de pe poza din site (?ghid=teren&tip=&doc=).
    """
    changed = 0
    for page in doc:
        for link in list(page.get_links()):
            if link.get("kind") != fitz.LINK_URI:
                continue
            uri = link.get("uri") or ""
            new_uri = None
            if "linked-manuals/" in uri:
                name = uri.rsplit("/", 1)[-1].split("?")[0]
                if name.startswith("Checklist_Client_ArtGranit"):
                    doc_id = "checklist"
                else:
                    doc_id = FILENAME_TO_DOC_ID.get(name)
                if doc_id:
                    new_uri = (
                        f"{APP_PANOU}?ref=guide&ghid=teren&tip={tip}&doc={doc_id}"
                    )
            elif "/ingineri/panou-angajat" in uri and "doc=" not in uri:
                # Vanity / „deschide ghidul” → tipul curent, nu repository
                new_uri = f"{APP_PANOU}?ref=guide&ghid=teren&tip={tip}"
            if new_uri and new_uri != uri:
                page.delete_link(link)
                link["uri"] = new_uri
                page.insert_link(link)
                changed += 1
    return changed


def customize_toc(page: fitz.Page, toc_html: str, label: str) -> None:
    """Înlocuiește Etapa 3–4 din cuprins cu un singur tip."""
    for link in list(page.get_links()):
        fr = link.get("from")
        if fr and fr.y0 >= TOC_TYPE_TOP - 5 and fr.y1 <= TOC_TYPE_BOTTOM + 5:
            page.delete_link(link)

    rect = fitz.Rect(TOC_LEFT - 2, TOC_TYPE_TOP, page.rect.x1 - TOC_RIGHT_MARGIN, TOC_TYPE_BOTTOM)
    page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    box = fitz.Rect(TOC_LEFT, TOC_TYPE_TOP + 2, page.rect.x1 - TOC_RIGHT_MARGIN, TOC_TYPE_BOTTOM - 4)
    page.insert_htmlbox(box, toc_html, css=TOC_CSS)

    # mică etichetă tip sub titlul ghidului (opțional vizibil pe cuprins)
    _ = label


def build_type_pdf(master: fitz.Document, spec: dict) -> fitz.Document:
    out = fitz.open()
    keep_pages: list[int] = spec["keep_pages"]
    trim: dict = spec["trim"]

    for page_no in keep_pages:
        idx = page_no - 1
        out.insert_pdf(master, from_page=idx, to_page=idx)
        new_page = out[-1]

        if page_no == 1:
            # Cuprins complet: Etapa 1–2 + Blat + toate tipurile (Etapa 4) —
            # același cuprins indiferent de tipul selectat în app.
            continue

        if page_no in trim:
            cfg = trim[page_no]
            # reconstruim pagina: header + secțiune mutată sus + footer din master
            src = master[idx]
            w, h = src.rect.width, src.rect.height
            keep_from = float(cfg["keep_from"])
            keep_to = float(cfg["keep_to"])
            header_bottom = 78.0

            # pagină goală + header
            new_page.add_redact_annot(
                fitz.Rect(28, header_bottom, w - 28, CONTENT_FOOTER_Y),
                fill=(1, 1, 1),
            )
            new_page.apply_redactions(
                images=fitz.PDF_REDACT_IMAGE_NONE,
                graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
            )

            clip = fitz.Rect(0, keep_from, w, keep_to)
            dest = fitz.Rect(0, header_bottom, w, header_bottom + clip.height)
            if dest.y1 > CONTENT_FOOTER_Y:
                # scale down if needed
                scale = (CONTENT_FOOTER_Y - header_bottom) / clip.height
                dest = fitz.Rect(0, header_bottom, w, header_bottom + clip.height * scale)
            new_page.show_pdf_page(dest, master, idx, clip=clip)

    return out


def render_pdf_pages(pdf_path: Path, pages_dir: Path) -> None:
    pages_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        pix = doc[i].get_pixmap(dpi=RENDER_DPI, alpha=False)
        out = pages_dir / f"page-{i + 1:02d}.png"
        pix.save(out.as_posix())
        print(f"  render {out.relative_to(ROOT)}")
    doc.close()


def write_zip(pdf_path: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(pdf_path, arcname=pdf_path.name)
        if LINKED_DIR.is_dir():
            for pdf in sorted(LINKED_DIR.glob("*.pdf")):
                zf.write(pdf, arcname=f"linked-manuals/{pdf.name}")
    print(f"  ZIP {zip_path.relative_to(ROOT)} ({zip_path.stat().st_size // 1024} KB)")


def main() -> None:
    if not MASTER_PDF.exists():
        raise SystemExit(f"Lipsește master PDF: {MASTER_PDF}")

    master = fitz.open(MASTER_PDF)
    BY_TYPE_DIR.mkdir(parents=True, exist_ok=True)

    for spec in TYPE_SPECS:
        tid = spec["id"]
        out_dir = BY_TYPE_DIR / tid
        if out_dir.exists():
            shutil.rmtree(out_dir)
        out_dir.mkdir(parents=True)

        print(f"Build tip: {tid} ({spec['label']})…")
        doc = build_type_pdf(master, spec)
        n_links = rewrite_links_to_panou(doc, tid)
        pdf_path = out_dir / "Ghid-teren-masurare.pdf"
        doc.save(pdf_path, garbage=3, deflate=True)
        doc.close()
        print(
            f"  PDF {pdf_path.relative_to(ROOT)} "
            f"({len(spec['keep_pages'])} pagini, {n_links} linkuri → panou)"
        )

        render_pdf_pages(pdf_path, out_dir / "pages")
        write_zip(pdf_path, out_dir / "Ghid-teren-masurare-cu-manuale.zip")

    master.close()
    print("Done.")


if __name__ == "__main__":
    main()
