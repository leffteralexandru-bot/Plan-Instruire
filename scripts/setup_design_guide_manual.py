#!/usr/bin/env python3
"""
Ghid proiectare CAD — din Desktop Ghid_Proiectare_Detaliat_v9_nou.pdf:
  - copiază PDF, scoate poze goale, linkuri documente, vanity URL
  - randează PNG
  - generează PDF pe tip (comune + doar punctele tipului de pe p.22)
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DESKTOP_PDF = Path(r"c:\Users\AlioSol\Desktop\Ghid_Proiectare_Detaliat_v9_nou.pdf")
OUT_DIR = ROOT / "public/docs/operational-guide/design-guide"
PDF_OUT = OUT_DIR / "Ghid-proiectare-cad.pdf"
PAGES_DIR = OUT_DIR / "pages"
BY_TYPE_DIR = OUT_DIR / "by-type"
LINKED_DIR = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"
MANIFEST = ROOT / "src/data/design-guide-manifest.json"
RENDER_DPI = 300

APP_PUBLIC_BASE = "https://argranit-instruire-adaptare.vercel.app"
APP_GHID_URL = f"{APP_PUBLIC_BASE}/ingineri/panou-angajat"
APP_DISPLAY = "https://argranit-instruire-adaptare@artgranit.ro"
LINKED_WEB = f"{APP_PUBLIC_BASE}/docs/operational-guide/field-guide/linked-manuals"
LINK_COLOR = (47 / 255, 111 / 255, 237 / 255)

# tip → interval y pe pagina 22 (keep_from, keep_to) — înainte de următorul tip / footer
TYPE_PAGE22: dict[str, tuple[float, float, str]] = {
    "blat": (120.0, 185.0, "Blat / șorț"),
    "scara": (182.0, 232.0, "Scări"),
    "placare": (230.0, 293.0, "Placare perete"),
    "semineu": (290.0, 340.0, "Placare cămin"),
    "scara_exterior": (338.0, 388.0, "Scări exterioare"),
    "glaf": (385.0, 448.0, "Pervazuri int. / ext."),
    "placare_exterior": (446.0, 510.0, "Placări ext. / parapet (atic)"),
}


def abs_manual(name: str) -> str:
    return f"{LINKED_WEB}/{name}"


def draw_open_indicator(page: fitz.Page, near: fitz.Rect, color: tuple) -> fitz.Rect:
    x0 = near.x1 + 3.2
    y0 = near.y0 + 1.0
    s = 7.5
    r = fitz.Rect(x0, y0, x0 + s, y0 + s)
    page.draw_rect(r, color=color, width=0.7)
    page.draw_line(fitz.Point(x0 + 1.6, y0 + s - 1.6), fitz.Point(x0 + s - 1.4, y0 + 1.5), color=color, width=0.75)
    page.draw_line(fitz.Point(x0 + s - 1.4, y0 + 1.5), fitz.Point(x0 + s - 1.4, y0 + 3.6), color=color, width=0.65)
    page.draw_line(fitz.Point(x0 + s - 1.4, y0 + 1.5), fitz.Point(x0 + s - 3.5, y0 + 1.5), color=color, width=0.65)
    return r


def insert_doc_button(page: fitz.Page, label: str, origin: fitz.Point, uri: str, fontsize: float = 9.0) -> None:
    text_width = max(
        fitz.get_text_length(label, fontname="helv", fontsize=fontsize) * 1.08,
        len(label) * fontsize * 0.52,
    )
    rect = fitz.Rect(origin.x, origin.y - fontsize + 1.2, origin.x + text_width + 4, origin.y + 3)
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
    icon_anchor = fitz.Rect(origin.x + text_width + 2, rect.y0, origin.x + text_width + 12, rect.y1)
    icon = draw_open_indicator(page, icon_anchor, LINK_COLOR)
    hit = rect | icon
    page.insert_link({"kind": fitz.LINK_URI, "from": hit + (-1, -1, 1, 1), "uri": uri})
    print(f"  button → {label}")


def remove_photo_placeholders(doc: fitz.Document) -> int:
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
        captions: list[fitz.Rect] = []
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                text = "".join(s["text"] for s in line["spans"]).strip()
                if text.startswith("Ce arată poza") or (text.startswith("Poză:") and "screenshot" not in text.lower()):
                    captions.append(fitz.Rect(line["bbox"]))
        unions: list[fitz.Rect] = []
        for title in titles:
            union = fitz.Rect(title)
            candidates = [b for b in big_boxes if b.y0 >= title.y1 - 2 and b.y0 <= title.y1 + 40]
            if candidates:
                box = min(candidates, key=lambda r: r.y0)
                union |= box
                bottom = box.y1
            else:
                union |= fitz.Rect(title.x0 - 4, title.y1, page.rect.x1 - 36, title.y1 + 70)
                bottom = union.y1
            for cap in captions:
                if bottom - 4 <= cap.y0 <= bottom + 30:
                    union |= cap
            # also captions that say Ce arată near title block
            for cap in captions:
                if title.y1 - 5 <= cap.y0 <= title.y1 + 120:
                    union |= cap
            unions.append(union + (-2, -1.5, 2, 2))
        for u in unions:
            page.add_redact_annot(u, fill=(1, 1, 1))
            removed += 1
        if unions:
            page.apply_redactions(
                images=fitz.PDF_REDACT_IMAGE_NONE,
                graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
            )
            print(f"  photo-blocks p{page.number + 1}: {len(unions)}")
    return removed


def fix_page1_link(doc: fitz.Document) -> None:
    page = doc[0]
    for link in list(page.get_links()):
        uri = (link.get("uri") or "").lower()
        if "argranit-instruire" in uri or "panou-angajat" in uri:
            page.delete_link(link)

    markers = ("puteți găsi pe linkul", "containerul ghid operațional", "argranit-instruire")
    rects: list[fitz.Rect] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            txt = "".join(s["text"] for s in line["spans"]).lower()
            if any(m in txt for m in markers):
                rects.append(fitz.Rect(line["bbox"]))
    if not rects:
        print("  WARN: page1 link line missing")
        return
    union = rects[0]
    for r in rects[1:]:
        union |= r
    union = fitz.Rect(42.0, union.y0 - 1.5, page.rect.x1 - 36, union.y1 + 14)
    page.add_redact_annot(union, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
    box = fitz.Rect(42.52, union.y0, page.rect.x1 - 36, union.y0 + 26)
    page.insert_htmlbox(
        box,
        f'<p style="margin:0;font-family:sans-serif;font-size:8pt;color:#1c1915;line-height:1.3;">'
        f'Îl puteți găsi pe linkul: '
        f'<a href="{APP_GHID_URL}" style="color:#2f6fed;">{APP_DISPLAY}</a>'
        f' — în containerul Ghid Operațional (referință teren &amp; proiectare).</p>',
    )
    page.insert_link(
        {
            "kind": fitz.LINK_URI,
            "from": fitz.Rect(42.52, union.y0, page.rect.x1 - 36, union.y0 + 22),
            "uri": APP_GHID_URL,
        }
    )
    print("  page1 vanity link OK")


PAGE_BODY_CSS = """
* { font-family: sans-serif; }
.title { font-size: 11pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.sub { font-size: 8.5pt; font-weight: bold; color: #0f375f; margin: 0; padding: 0; }
.body { font-size: 8.2pt; color: #1c1915; margin: 0; padding: 0; line-height: 1.22; }
"""

FOOTER_Y = 800.0
BODY_TOP = 86.0


def _clear_page_body(page: fitz.Page) -> None:
    for link in list(page.get_links()):
        page.delete_link(link)
    page.add_redact_annot(
        fitz.Rect(28, 78, page.rect.width - 28, FOOTER_Y),
        fill=(1, 1, 1),
    )
    page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
    )


def rebuild_etapa1_compact(doc: fitz.Document) -> dict[str, float]:
    """
    Strânge Etapa 1.1–1.4 pe 1 pagină (sau 2 dacă nu încape) — fără poze goale.
    Șterge paginile vechi 1.2 / 1.3 / 1.4 rămase goale.
    Returnează y% hotspot-uri (raportat la pagina pe care e butonul).
    """
    # pagini originale: idx 1=1.1, 2=1.2, 3=1.3, 4=1.4
    page_a = doc[1]
    page_h = page_a.rect.height
    left = 42.52
    width = page_a.rect.width - left - 42

    _clear_page_body(page_a)

    y = BODY_TOP
    btn_ys: dict[str, float] = {}
    page = page_a
    used_second = False

    def ensure_space(need: float) -> None:
        nonlocal y, page, used_second
        if y + need <= FOOTER_Y - 8:
            return
        if used_second:
            return
        # spill pe pagina 3 (idx 2) — păstrează header-ul
        used_second = True
        page = doc[2]
        _clear_page_body(page)
        y = BODY_TOP
        print("  Etapa 1 spill → pagina 2 (compact)")

    def html_block(html: str, height: float) -> None:
        nonlocal y
        ensure_space(height + 4)
        rect = fitz.Rect(left, y, left + width, y + height)
        page.insert_htmlbox(rect, html, css=PAGE_BODY_CSS)
        y = rect.y1 + 2.5

    def button(key: str, label: str, uri: str) -> None:
        nonlocal y
        ensure_space(16)
        y += 0.5
        origin = fitz.Point(left, y + 9)
        insert_doc_button(page, label, origin, uri, fontsize=8.4)
        # y% pe pagina curentă (1-based page number for app = page.number+1)
        btn_ys[key] = {
            "page": page.number + 1,
            "y": 100.0 * (origin.y - 8.4) / page_h,
            "x": 100.0 * left / page_a.rect.width,
        }
        y += 14

    # --- 1.1 ---
    html_block('<p class="title">Etapa 1.1 · Anexa 1</p>', 15)
    html_block('<p class="sub">Ce se face</p>', 12)
    html_block(
        "<p class='body'>• Îndeplinită de măsurători la locație și semnată de client "
        "(rubrica / rândul măsurători).</p>",
        13,
    )
    html_block(
        "<p class='body'>• Este prima resursă din măsurarea efectuată — o folosești la "
        "proiectare, nu o completezi tu.</p>",
        13,
    )
    html_block(
        "<p class='body'>• Fără Anexa 1 semnată: nu începi proiectarea.</p>",
        12,
    )
    html_block('<p class="sub">De ce</p>', 12)
    html_block(
        "<p class='body'>Anexa 1 îți permite să efectuezi proiectarea fără erori de "
        "interpretare: detalii agreate pe teren (muchie, finisaj, accesorii, observații) "
        "sunt deja confirmate cu clientul.</p>",
        26,
    )
    button("anexa", "Anexa 1 (șablon)", abs_manual("anexa-1-sablon.pdf"))
    y += 3

    # --- 1.2 ---
    html_block('<p class="title">Etapa 1.2 · Fișe tehnice accesorii</p>', 15)
    html_block('<p class="sub">Ce se face</p>', 12)
    html_block(
        "<p class='body'>• Se atașează în proiect (chiuvetă, plită, LED, alte accesorii — "
        "unde e cazul).</p>",
        13,
    )
    html_block(
        "<p class='body'>• Se folosesc la proiectare pentru verificarea măsurării de la "
        "locație.</p>",
        12,
    )
    html_block(
        "<p class='body'>• Confirmați că decupajele din teren coincid cu fișa tehnică a "
        "accesoriului.</p>",
        13,
    )
    html_block('<p class="sub">De ce</p>', 12)
    html_block(
        "<p class='body'>Fișele tehnice asigură că decupajele vor fi proiectate corect — "
        "fără diferențe între ce s-a măsurat pe șantier și ce cere accesoriul real.</p>",
        24,
    )
    button(
        "fise",
        "Fișe tehnice accesorii (exemple)",
        abs_manual("Exemple_Fise_Tehnice_Accesorii.pdf"),
    )
    y += 3

    # --- 1.3 ---
    html_block('<p class="title">Etapa 1.3 · Cantingul</p>', 15)
    html_block('<p class="sub">Ce se face</p>', 12)
    html_block("<p class='body'>• Atașat de manager la ofertare.</p>", 11)
    html_block(
        "<p class='body'>• Se descarcă din taskul de măsurare → fișiere pentru măsurare "
        "(nu montare).</p>",
        13,
    )
    html_block(
        "<p class='body'>• Respectați poziția îmbinărilor din canting — este regula de "
        "proiectare.</p>",
        13,
    )
    html_block(
        "<p class='body'>• Excepție: clientul acceptă cost suplimentar pentru altă poziție "
        "a îmbinării; măsurătorul notează și își asumă costul.</p>",
        22,
    )
    html_block('<p class="sub">De ce</p>', 12)
    html_block(
        "<p class='body'>Cantingul fixează îmbinările gândite la ofertare. Dacă nu îl "
        "respeți, managerul returnează la reproiectare sau reofertare — cost / timp "
        "suplimentar.</p>",
        26,
    )
    button("canting", "Canting", abs_manual("Canting.pdf"))
    y += 3

    # --- 1.4 ---
    html_block('<p class="title">Etapa 1.4 · Comanda de transfer</p>', 15)
    html_block('<p class="sub">Ce se face</p>', 12)
    html_block(
        "<p class='body'>• Tipul și denumirea corectă a materialului — din comandă.</p>",
        12,
    )
    html_block(
        "<p class='body'>• Verificați dimensiunile reale ale plăcii (nu doar cotele din "
        "ofertă).</p>",
        12,
    )
    html_block(
        "<p class='body'>• Decideți: încape măsurarea în placă sau e nevoie de "
        "îmbinare.</p>",
        12,
    )
    html_block(
        "<p class='body'>• Verificați venele și grosimea (producție din grosimea existentă "
        "sau îngroșare — risc fisurare).</p>",
        20,
    )
    html_block('<p class="sub">De ce</p>', 12)
    html_block(
        "<p class='body'>Comanda de transfer leagă proiectul de materialul real din stoc: "
        "tip, denumire, dimensiuni, vene și grosime — ca nesting-ul și debitarea să fie pe "
        "placa corectă.</p>",
        26,
    )
    button("ctg", "CTG — Exemplu_Comanda_Material", abs_manual("Exemplu_Comanda_Material.pdf"))

    # Șterge paginile vechi rămase: dacă am folosit 1 pagină → șterge idx 2,3,4
    # dacă am folosit 2 → șterge idx 3,4
    if used_second:
        for _ in range(2):
            doc.delete_page(3)
        print("  Etapa 1 compact: 2 pagini (1.1–1.2 + 1.3–1.4)")
    else:
        for _ in range(3):
            doc.delete_page(2)
        print("  Etapa 1 compact: 1 pagină (1.1–1.4)")

    # normalize btn_ys to float y% only for same-page assumption in app —
    # return both page and y for caller
    flat: dict[str, float] = {}
    for k, v in btn_ys.items():
        if isinstance(v, dict):
            flat[f"{k}_page"] = float(v["page"])
            flat[f"{k}_y"] = float(v["y"])
            flat[f"{k}_x"] = float(v["x"])
        else:
            flat[k] = float(v)
    return flat


def patch_master(pdf_path: Path) -> dict[str, float]:
    doc = fitz.open(pdf_path)
    print("Fix page 1 link…")
    fix_page1_link(doc)
    print("Rebuild Etapa 1 compact (1–2 pagini)…")
    hotspots = rebuild_etapa1_compact(doc)
    tmp = pdf_path.with_suffix(".patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    print(f"  pages after compact: {len(doc)}")
    doc.close()
    tmp.replace(pdf_path)
    return hotspots


def render_pages(pdf_path: Path, pages_dir: Path) -> int:
    pages_dir.mkdir(parents=True, exist_ok=True)
    for old in pages_dir.glob("page-*.png"):
        old.unlink()
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        pix = doc[i].get_pixmap(dpi=RENDER_DPI, alpha=False)
        out = pages_dir / f"page-{i + 1:02d}.png"
        pix.save(str(out))
        print(f"  render {out.name}")
    n = len(doc)
    doc.close()
    return n


def build_type_pdfs(master: Path) -> None:
    BY_TYPE_DIR.mkdir(parents=True, exist_ok=True)
    src = fitz.open(master)
    tip_page_idx = len(src) - 1  # ultima pagină = puncte pe tip
    common_last = tip_page_idx - 1
    for tid, (keep_from, keep_to, label) in TYPE_PAGE22.items():
        out_dir = BY_TYPE_DIR / tid
        if out_dir.exists():
            shutil.rmtree(out_dir)
        out_dir.mkdir(parents=True)
        out = fitz.open()
        out.insert_pdf(src, from_page=0, to_page=common_last)
        out.insert_pdf(src, from_page=tip_page_idx, to_page=tip_page_idx)
        page = out[-1]
        w, h = page.rect.width, page.rect.height
        header_bottom = 78.0
        footer = 800.0
        page.add_redact_annot(fitz.Rect(28, header_bottom, w - 28, footer), fill=(1, 1, 1))
        page.apply_redactions(
            images=fitz.PDF_REDACT_IMAGE_NONE,
            graphics=getattr(fitz, "PDF_REDACT_LINE_ART_REMOVE", 1),
        )
        page.insert_htmlbox(
            fitz.Rect(42.52, header_bottom + 4, w - 42, header_bottom + 50),
            f"<p style='margin:0;font-family:sans-serif;font-size:12pt;font-weight:700;color:#0f375f;'>"
            f"Puncte extra — {label}</p>"
            f"<p style='margin:4px 0 0;font-family:sans-serif;font-size:8.5pt;color:#5c564e;'>"
            f"Doar pentru tipul selectat — după etapele comune de proiectare CAD.</p>",
        )
        clip = fitz.Rect(0, keep_from, w, keep_to)
        dest = fitz.Rect(0, header_bottom + 56, w, header_bottom + 56 + clip.height)
        page.show_pdf_page(dest, src, tip_page_idx, clip=clip)

        pdf_path = out_dir / "Ghid-proiectare-cad.pdf"
        out.save(pdf_path, garbage=3, deflate=True)
        out.close()
        print(f"  type {tid} → {pdf_path.relative_to(ROOT)} ({len(list(out_dir.glob('*.pdf')))} pdf)")
        render_pages(pdf_path, out_dir / "pages")
    src.close()


def main() -> None:
    if not DESKTOP_PDF.exists():
        raise SystemExit(f"Lipsește: {DESKTOP_PDF}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DESKTOP_PDF, PDF_OUT)
    print(f"PDF ← {DESKTOP_PDF.name}")

    hotspots: dict[str, float] = {}
    if "--no-patch" not in sys.argv:
        hotspots = patch_master(PDF_OUT)

    print("Render master pages…")
    count = render_pages(PDF_OUT, PAGES_DIR)

    print("Build per-type PDFs…")
    build_type_pdfs(PDF_OUT)

    manifest = {
        "pdf": "/docs/operational-guide/design-guide/Ghid-proiectare-cad.pdf",
        "pagesDir": "/docs/operational-guide/design-guide/pages",
        "pageCount": count,
        "source": DESKTOP_PDF.name,
        "byType": "/docs/operational-guide/design-guide/by-type",
        "etapa1Hotspots": hotspots,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest → {MANIFEST.relative_to(ROOT)}")
    print("Hotspots:", json.dumps(hotspots, indent=2))
    print("Done.")


if __name__ == "__main__":
    main()
