#!/usr/bin/env python3
"""
Generează manuale de instruire artGRANIT pentru utilajele Bosch (cărțile 8–10):
  - aceleași capitole ca în Mentenanță (text RO cu diacritice)
  - linkuri ▶ Video către panoul angajatului

Output:
  public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-artgranit.pdf
  public/docs/equipment/bosch-glm-40/bosch-glm-40-manual-artgranit.pdf
  public/docs/equipment/bosch-tape-5m/bosch-tape-5m-manual-artgranit.pdf

Copiază și în linked-manuals (ghid teren):
  bosch-gll-3-80-manual.pdf, bosch-ruleta-5m.pdf
"""

from __future__ import annotations

import shutil
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
APP_PANOU = "https://argranit-instruire-adaptare.vercel.app/ingineri/panou-angajat"
LINKED = ROOT / "public/docs/operational-guide/field-guide/linked-manuals"

PAGE_W, PAGE_H = 595, 842  # A4
MARGIN = 48
GOLD = (0.72, 0.55, 0.18)
DARK = (0.12, 0.12, 0.14)
MUTED = (0.35, 0.35, 0.38)
LINE = (0.82, 0.82, 0.84)

FONT_REG_CANDIDATES = [
    Path("C:/Windows/Fonts/segoeui.ttf"),
    Path("C:/Windows/Fonts/calibri.ttf"),
    Path("C:/Windows/Fonts/arial.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
]
FONT_BOLD_CANDIDATES = [
    Path("C:/Windows/Fonts/segoeuib.ttf"),
    Path("C:/Windows/Fonts/calibrib.ttf"),
    Path("C:/Windows/Fonts/arialbd.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]


def resolve_font(candidates: list[Path]) -> Path:
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("Nu s-a găsit un font TTF Unicode (Segoe/Calibri/Arial/DejaVu).")


FONT_REG = fitz.Font(fontfile=str(resolve_font(FONT_REG_CANDIDATES)))
FONT_BOLD = fitz.Font(fontfile=str(resolve_font(FONT_BOLD_CANDIDATES)))


def site_url(device_id: str, chapter_id: str | None = None, play: bool = False) -> str:
    q = f"ref=equipment&device={device_id}"
    if chapter_id:
        q += f"&eqCh={chapter_id}"
    if play:
        q += "&play=1"
    return f"{APP_PANOU}?{q}"


def new_page(doc: fitz.Document) -> fitz.Page:
    return doc.new_page(width=PAGE_W, height=PAGE_H)


def wrap_text(font: fitz.Font, text: str, fontsize: float, max_width: float) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if font.text_length(trial, fontsize=fontsize) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_text(
    page: fitz.Page,
    xy: tuple[float, float],
    text: str,
    *,
    font: fitz.Font = FONT_REG,
    size: float = 10,
    color=DARK,
) -> None:
    tw = fitz.TextWriter(page.rect)
    tw.append(xy, text, font=font, fontsize=size)
    tw.write_text(page, color=color)


def draw_header(page: fitz.Page, eyebrow: str, title: str) -> float:
    y = MARGIN
    draw_text(page, (MARGIN, y), "artGRANIT · Mentenanță & operare", font=FONT_REG, size=9, color=MUTED)
    y += 16
    draw_text(page, (MARGIN, y), eyebrow, font=FONT_BOLD, size=8, color=GOLD)
    y += 18
    # Title may be long — wrap if needed
    max_w = PAGE_W - 2 * MARGIN
    for line in wrap_text(FONT_BOLD, title, 15, max_w):
        draw_text(page, (MARGIN, y), line, font=FONT_BOLD, size=15, color=DARK)
        y += 18
    page.draw_line(fitz.Point(MARGIN, y), fitz.Point(PAGE_W - MARGIN, y), color=LINE, width=0.6)
    return y + 18


def add_paragraph(
    page: fitz.Page,
    y: float,
    text: str,
    *,
    size: float = 10,
    color=DARK,
    font: fitz.Font = FONT_REG,
    leading: float | None = None,
) -> float:
    line_h = leading if leading is not None else size + 4
    max_w = PAGE_W - 2 * MARGIN
    for line in wrap_text(font, text, size, max_w):
        if y > PAGE_H - 56:
            break
        draw_text(page, (MARGIN, y), line, font=font, size=size, color=color)
        y += line_h
    return y + 6


def add_bullets(page: fitz.Page, y: float, items: list[str]) -> float:
    for item in items:
        y = add_paragraph(page, y, f"• {item}", size=10, leading=13)
        if y > PAGE_H - 80:
            break
    return y


def add_video_button(page: fitz.Page, y: float, label: str, url: str) -> float:
    rect = fitz.Rect(MARGIN, y, MARGIN + 220, y + 28)
    page.draw_rect(rect, color=GOLD, fill=(0.98, 0.95, 0.88), width=0.8)
    draw_text(page, (MARGIN + 10, y + 18), f"▶  {label}", font=FONT_BOLD, size=10, color=DARK)
    page.insert_link({"kind": fitz.LINK_URI, "from": rect, "uri": url})
    return y + 40


def build_cover(doc: fitz.Document, *, device_name: str, subtitle: str, chapters: list[str]) -> None:
    page = new_page(doc)
    y = draw_header(page, device_name, f"{device_name} · Manual instruire artGRANIT")
    y = add_paragraph(page, y, subtitle, size=11, color=MUTED)
    y = add_paragraph(
        page,
        y + 4,
        "Acest PDF are aceleași capitole ca pe Mentenanță. Butoanele ▶ Video deschid demonstrația pe panoul angajatului.",
        size=10,
    )
    y = add_paragraph(page, y + 8, "Cuprins", size=12, font=FONT_BOLD)
    y = add_bullets(page, y, [f"{i}. {t}" for i, t in enumerate(chapters, start=1)])


def build_chapter_page(
    doc: fitz.Document,
    *,
    device_id: str,
    device_name: str,
    chapter_num: int,
    chapter_id: str,
    title: str,
    summary: str,
    body_lines: list[str],
    video_label: str | None = None,
    image_path: Path | None = None,
) -> None:
    page = new_page(doc)
    y = draw_header(page, device_name, f"Capitol {chapter_num} — {title}")
    y = add_paragraph(page, y, summary, size=10, color=MUTED)
    for line in body_lines:
        y = add_paragraph(page, y, line, size=10)
        if y > PAGE_H - 200:
            break
    if image_path and image_path.exists():
        img_h = 180
        top = min(y, PAGE_H - 260)
        img_rect = fitz.Rect(MARGIN, top, PAGE_W - MARGIN, top + img_h)
        try:
            page.insert_image(img_rect, filename=str(image_path), keep_proportion=True)
            y = img_rect.y1 + 12
        except Exception:
            pass
    if video_label:
        add_video_button(page, min(y, PAGE_H - 90), video_label, site_url(device_id, chapter_id, play=True))


def finalize_footers(doc: fitz.Document) -> None:
    total = doc.page_count
    for i, page in enumerate(doc, start=1):
        page.draw_rect(
            fitz.Rect(MARGIN - 2, PAGE_H - 40, PAGE_W - MARGIN + 2, PAGE_H - 14),
            color=(1, 1, 1),
            fill=(1, 1, 1),
        )
        draw_text(
            page,
            (MARGIN, PAGE_H - 24),
            "artGRANIT · Manual instruire = aceleași capitole ca pe site",
            font=FONT_REG,
            size=8,
            color=MUTED,
        )
        draw_text(
            page,
            (PAGE_W - MARGIN - 40, PAGE_H - 24),
            f"{i} / {total}",
            font=FONT_REG,
            size=8,
            color=MUTED,
        )


def write_manual(path: Path, builder) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    builder(doc)
    finalize_footers(doc)
    doc.save(path, deflate=True, garbage=4)
    doc.close()
    print(f"PDF → {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB, pages ok)")


def build_gll(doc: fitz.Document) -> None:
    device_id = "eq-bosch-gll-3-80"
    name = "BOSCH GLL 3-80"
    pages = ROOT / "public/docs/equipment/bosch-gll-3-80/pages"
    chapters = [
        "Documentație completă",
        "Prezentare produs",
        "Siguranță și componente",
        "Pornire și autonivelare",
        "Utilizare pe șantier",
        "Verificare precizie",
        "Întreținere și depozitare",
    ]
    build_cover(
        doc,
        device_name=name,
        subtitle="Nivelă laser 3×360° — prezentare, siguranță, pornire, șantier, precizie, întreținere (+ video pe site).",
        chapters=chapters,
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=1,
        chapter_id="bosch-gll-380-ch-1",
        title="Documentație completă",
        summary="PDF-ul pe care îl ții acum = aceleași capitole ca pe site.",
        body_lines=[
            "Manualul OEM Bosch (multi-limbă) rămâne ca referință tehnică; acest PDF este ghidul scurt artGRANIT pentru instruire pe panou.",
            "Deschide cartea 8 în Mentenanță pentru imagini, video și capitolul activ.",
        ],
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=2,
        chapter_id="bosch-gll-380-ch-2",
        title="Prezentare produs",
        summary="GLL 3-80 Professional — 3 linii 360°, rază 30 m, precizie ±0,2 mm/m",
        body_lines=[
            "Nivelă laser cu 3 linii la 360° — nivelare orizontală și verticală simultană.",
            "Domeniu 30 m (fără receptor) / până la 80–120 m cu receptor. IP54. 4× AA.",
            "Aplicații: tavane false, pardoseli, plăci, geamuri, rigips, conducte.",
        ],
        video_label="Video prezentare",
        image_path=pages / "page-03.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=3,
        chapter_id="bosch-gll-380-ch-3",
        title="Siguranță și componente",
        summary="Laser clasa 2, carcasă, lentile, baterii",
        body_lines=[
            "Nu priviți fasciculul. Nu îndreptați spre persoane. Blocați pendulul la transport.",
            "4× baterii AA — înlocuiți toate simultan, aceeași marcă.",
        ],
        image_path=pages / "page-04.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=4,
        chapter_id="bosch-gll-380-ch-4",
        title="Pornire și autonivelare",
        summary="Alimentare, deblocare pendul, liniile 360°",
        body_lines=[
            "1. Montați pe trepied / suprafață stabilă.",
            "2. Deblocați pendulul (transport lock).",
            "3. Așteptați autonivelarea (±4°, ~4 s).",
            "4. Selectați liniile (H / V / ambele).",
        ],
        video_label="Video operare",
        image_path=pages / "page-05.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=5,
        chapter_id="bosch-gll-380-ch-5",
        title="Utilizare pe șantier",
        summary="Trasare nivel, verificare și lucru cu receptor",
        body_lines=[
            "Stabilizați trepiedul. Marcați referința pe mai multe puncte. Folosiți receptor la distanțe mari.",
            "Documentați setup-ul cu fotografie pentru dosarul proiectului.",
        ],
        video_label="Video linii 360°",
        image_path=pages / "page-134.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=6,
        chapter_id="bosch-gll-380-ch-6",
        title="Verificare precizie",
        summary="Control periodic înainte de măsurători critice",
        body_lines=[
            "Verificați precizia înainte de fiecare proiect critic (axă orizontală / verticală).",
            "La 5 m, diferența A↔B după 180° trebuie ≤ 3 mm.",
        ],
        image_path=pages / "page-137.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=7,
        chapter_id="bosch-gll-380-ch-7",
        title="Întreținere și depozitare",
        summary="Curățare, baterii și transport în valiză",
        body_lines=[
            "Opriți aparatul. Ștergeți carcasa fără solvenți. Curățați lentilele. Depozitați în valiză.",
            "Scoateți bateriile la depozitare lungă. Calibrare la service Bosch la abateri repetate.",
        ],
        image_path=pages / "page-05.png",
    )


def build_glm(doc: fitz.Document) -> None:
    device_id = "eq-bosch-glm-40"
    name = "BOSCH GLM 40"
    pages = ROOT / "public/docs/equipment/bosch-glm-40/pages"
    chapters = [
        "Documentație completă",
        "Prezentare produs",
        "Siguranță și componente",
        "Măsurare distanță",
        "Suprafață, volum, Pythagora",
        "Memorie și unități",
        "Întreținere și verificare",
    ]
    build_cover(
        doc,
        device_name=name,
        subtitle="Telemetru laser 40 m — distanță, suprafață, volum, Pythagora (+ video pe site).",
        chapters=chapters,
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=1,
        chapter_id="bosch-glm-40-ch-1",
        title="Documentație completă",
        summary="PDF artGRANIT = aceleași capitole ca pe Mentenanță.",
        body_lines=[
            "Cod produs UE: 0 601 072 900. Manualul OEM rămâne referință tehnică; pe panou folosești acest ghid RO.",
        ],
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=2,
        chapter_id="bosch-glm-40-ch-2",
        title="Prezentare produs",
        summary="GLM 40 Professional — 0,15–40 m, precizie ±1,5 mm, memorie 10 valori",
        body_lines=[
            "Telemetru compact pentru distanță, suprafață și volum — display iluminat.",
            "Clasă laser 2 · IP54 · ≈ 5.000 măsurători · ≈ 90 g.",
        ],
        video_label="Video prezentare",
        image_path=pages / "page-02.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=3,
        chapter_id="bosch-glm-40-ch-3",
        title="Siguranță și componente",
        summary="Butoane, lentile laser și baterii AAA",
        body_lines=[
            "Nu îndreptați fasciculul spre ochi. Opriți aparatul după utilizare.",
            "2× AAA alcaline. Curățați lentila de recepție ca pe o lentilă foto.",
        ],
        image_path=pages / "page-02.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=4,
        chapter_id="bosch-glm-40-ch-4",
        title="Măsurare distanță",
        summary="Pornire, măsurare lungime și timp real",
        body_lines=[
            "Punct de referință: spatele telemetrului pe perete/colț.",
            "Țintiți perpendicular. Apăsați Măsurare. Mod timp real ≈ 0,5 s.",
        ],
        video_label="Video cum se utilizează",
        image_path=pages / "page-04.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=5,
        chapter_id="bosch-glm-40-ch-5",
        title="Suprafață, volum, Pythagora",
        summary="Calcule automate și înălțime indirectă",
        body_lines=[
            "Suprafață: L × l. Volum: L × l × h. Pythagora: orizontală + diagonală → înălțime.",
        ],
        image_path=pages / "page-14.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=6,
        chapter_id="bosch-glm-40-ch-6",
        title="Memorie și unități",
        summary="Ultimele 10 valori, m/cm și ft/inch",
        body_lines=[
            "Memorie automată 10 măsurători. Schimbați unitățile din Funcție.",
            "Puteți aduna/scădea măsurători în modul lungime.",
        ],
        image_path=pages / "page-16.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=7,
        chapter_id="bosch-glm-40-ch-7",
        title="Întreținere și verificare",
        summary="Curățare lentile, verificare precizie",
        body_lines=[
            "Comparați cu o distanță etalon (±1,5 mm). După șoc, reverificați.",
            "Fără solvenți. Depozitați în geantă; scoateți bateriile la depozitare lungă.",
        ],
        image_path=pages / "page-17.png",
    )


def build_tape(doc: fitz.Document) -> None:
    device_id = "eq-bosch-tape-5m"
    name = "BOSCH Ruletă 5 m"
    pages = ROOT / "public/docs/equipment/bosch-tape-5m/pages"
    chapters = [
        "Documentație completă",
        "Prezentare produs",
        "Cum se măsoară — baze",
        "Cârlig magnetic și stand-out",
        "Flexi Stop și blocare bandă",
        "Trucuri de precizie",
        "Întreținere",
    ]
    build_cover(
        doc,
        device_name=name,
        subtitle="Ruletă 5 m Professional — măsurare liniară pe șantier (+ video pe site). Declarația UE Bosch e fișier separat, pentru audit.",
        chapters=chapters,
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=1,
        chapter_id="bosch-tape-5m-ch-1",
        title="Documentație completă",
        summary="PDF artGRANIT = aceleași capitole + video pe site",
        body_lines=[
            "Acesta este manualul de instruire. Declarația UE (DoC) nu înlocuiește instruirea — rămâne atașament de audit.",
            "Cod produs: 1600A016BH.",
        ],
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=2,
        chapter_id="bosch-tape-5m-ch-2",
        title="Prezentare produs",
        summary="5 m · bandă nylon 27 mm · cârlig magnetic · Flexi Stop · clasă II",
        body_lines=[
            "Carcasă aluminiu, bandă nylon coat, clema de centură.",
            "Stand-out maxim ≈ 2,7 m fără sprijin.",
        ],
        image_path=pages / "page-01.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=3,
        chapter_id="bosch-tape-5m-ch-3",
        title="Cum se măsoară — baze",
        summary="Poziționare, citire marcaje, exterior și interior",
        body_lines=[
            "Țineți banda dreaptă. Exterior: citiți la muchia cârligului. Interior: spatele carcasei pe perete.",
            "Retrageți banda controlat — nu lăsați să sară spre degete.",
        ],
        video_label="Video măsurare (RO)",
        image_path=pages / "page-02.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=4,
        chapter_id="bosch-tape-5m-ch-4",
        title="Cârlig magnetic și stand-out",
        summary="Măsurare pe o singură persoană, prindere pe metal",
        body_lines=[
            "Prindeți cârligul pe profil metalic. Peste 2,7 m sprijiniți banda.",
        ],
        video_label="Video trucuri (RO)",
        image_path=pages / "page-03.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=5,
        chapter_id="bosch-tape-5m-ch-5",
        title="Flexi Stop și blocare bandă",
        summary="Buton retragere și cursor lateral",
        body_lines=[
            "Flexi Stop ține banda extinsă. Cursorul lateral blochează lungimea pentru transfer repetat.",
        ],
        image_path=pages / "page-01.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=6,
        chapter_id="bosch-tape-5m-ch-6",
        title="Trucuri de precizie",
        summary="Punct de zero, diagonale și verificare",
        body_lines=[
            "Marcă roșie la fiecare metru. Verificați 1 m cu o riglă etalon (±1 mm/m clasă II).",
        ],
        video_label="Video pro tips",
        image_path=pages / "page-02.png",
    )
    build_chapter_page(
        doc,
        device_id=device_id,
        device_name=name,
        chapter_num=7,
        chapter_id="bosch-tape-5m-ch-7",
        title="Întreținere",
        summary="Curățare bandă, depozitare, uzură",
        body_lines=[
            "Ștergeți praful, uscați banda înainte de retragere, depozitați în cutie.",
            "Înlocuiți ruleta dacă banda e tăiată, cârligul îndoit sau marcajele șterse.",
        ],
        image_path=pages / "page-01.png",
    )


def extract_gll_ro_pages() -> None:
    """Din OEM multi-limbă: diagrame + secțiunea Română → PNG pentru cartea 8."""
    oem = ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-ro.pdf"
    out_dir = ROOT / "public/docs/equipment/bosch-gll-3-80/pages"
    out_dir.mkdir(parents=True, exist_ok=True)
    if not oem.exists() or oem.stat().st_size < 500_000:
        print("Skip GLL extract — OEM PDF missing")
        return
    doc = fitz.open(oem)
    wanted = [3, 4, 5, 133, 134, 135, 136, 137, 138]
    scale = fitz.Matrix(2.5, 2.5)
    for p in wanted:
        if p > doc.page_count:
            continue
        pix = doc[p - 1].get_pixmap(matrix=scale, alpha=False)
        dest = out_dir / f"page-{p:02d}.png"
        pix.save(str(dest))
        print(f"  GLL page {p:03d} → {dest.name}")
    ro_pdf = ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-romana.pdf"
    ro = fitz.open()
    for p in [3, 4, 5, 133, 134, 135, 136, 137, 138]:
        if p <= doc.page_count:
            ro.insert_pdf(doc, from_page=p - 1, to_page=p - 1)
    ro.save(ro_pdf, deflate=True, garbage=4)
    ro.close()
    doc.close()
    print(f"  GLL RO extract → {ro_pdf.relative_to(ROOT)} ({ro_pdf.stat().st_size // 1024} KB)")


def copy_linked() -> None:
    LINKED.mkdir(parents=True, exist_ok=True)
    pairs = [
        (
            ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-artgranit.pdf",
            LINKED / "bosch-gll-3-80-manual.pdf",
        ),
        (
            ROOT / "public/docs/equipment/bosch-tape-5m/bosch-tape-5m-manual-artgranit.pdf",
            LINKED / "bosch-ruleta-5m.pdf",
        ),
    ]
    for src, dst in pairs:
        if src.exists():
            shutil.copy2(src, dst)
            print(f"Linked ← {dst.name} ({dst.stat().st_size // 1024} KB)")


def main() -> None:
    print(f"Font: {resolve_font(FONT_REG_CANDIDATES).name}")
    print("Extract GLL RO/diagram pages…")
    extract_gll_ro_pages()
    print("Build artGRANIT training manuals…")
    write_manual(ROOT / "public/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-artgranit.pdf", build_gll)
    write_manual(ROOT / "public/docs/equipment/bosch-glm-40/bosch-glm-40-manual-artgranit.pdf", build_glm)
    write_manual(ROOT / "public/docs/equipment/bosch-tape-5m/bosch-tape-5m-manual-artgranit.pdf", build_tape)
    copy_linked()
    print("Done.")


if __name__ == "__main__":
    main()
