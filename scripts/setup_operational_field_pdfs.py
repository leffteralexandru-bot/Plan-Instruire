#!/usr/bin/env python3
"""Generează PDF + PNG pentru Echipament necesar și Pași de măsurare (Ghid Operațional)."""

from __future__ import annotations

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT_EQUIP = ROOT / "public/docs/operational-guide/equipment"
OUT_STEPS = ROOT / "public/docs/operational-guide/steps"
RENDER_DPI = 220

# artGRANIT palette (RGB 0–1)
BLACK = (0.07, 0.07, 0.07)
GOLD = (0.70, 0.56, 0.33)
MUTED = (0.45, 0.42, 0.38)
DARK = (0.12, 0.12, 0.12)
LINE = (0.85, 0.82, 0.78)
WHITE = (1, 1, 1)
SURFACE = (0.97, 0.96, 0.94)

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

EQUIPMENT = [
    "ANEXA Nr. 1",
    "Ochelari de înregistrare video",
    "Carnet măsurători + creion",
    "Aparatul de măsurat Proliner",
    "Nivelă laser Bosch GLL 3-80",
    "Ruletă Bosch 5 m",
]

# (slug, label, subtitle, steps)
CATEGORIES: list[tuple[str, str, str, list[str]]] = [
    (
        "blat",
        "Blat",
        "Blat / șorț",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru blat / șorț), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare blat / șorț, observații din discuția cu managerul).",
            "Verificați cu nivela laser Bosch GLL 3-80 nivelul / orizontalitatea mobilierului (dulapuri, blat).",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul blatului, suportul dulapurilor, șorțul și decupajele (chiuvetă, aragaz, baterie).",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lungimi, adâncimi, decupaje chiuvetă / aragaz / baterie).",
            "Completați pe carnet notele finale pentru blat (grosime, finisaj, abateri, observații teren).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de blat în Proliner.",
        ],
    ),
    (
        "placare",
        "Placare",
        "Placare perete",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru placare perete), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare placare perete, observații din discuția cu managerul).",
            "Verificați cu nivela laser Bosch GLL 3-80 verticalitatea și planeitatea peretelui / mobilierului adiacent.",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul zonei de placare și golurile (prize, ventilare, suport TV).",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (înălțimi, lățimi, poziții prize / ventilare / suport TV).",
            "Completați pe carnet notele finale pentru placare (grosime, finisaj, abateri planeitate, observații teren).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de placare în Proliner.",
        ],
    ),
    (
        "scara",
        "Scară",
        "Scări interior",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru scară interior), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare scară interior, tip trepte, observații din discuția cu managerul).",
            "Verificați cu nivela laser Bosch GLL 3-80 referințele pe trepte / perete (nivel și aliniere).",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner (Stairs) treptele, contratrepele și profilul scării.",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lățime treaptă, înălțime contratreaptă, lungime rampă).",
            "Completați pe carnet notele finale pentru scară (grosime, finisaj, tip trepte / LED, abateri, observații teren).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de scară în Proliner.",
        ],
    ),
    (
        "semineu",
        "Șemineu",
        "Placare cămin",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru placare șemineu / cămin), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare șemineu, observații din discuția cu managerul și din proiectul căminului).",
            "Verificați cu nivela laser Bosch GLL 3-80 verticalitatea portalului / elementelor de mobilier adiacente.",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul de placare și deschiderile (focar, grilă, nișe).",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lățimi portal, deschidere focar, poziție grilă / nișe).",
            "Completați pe carnet notele finale pentru șemineu (grosime, finisaj, abateri, observații teren).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de șemineu în Proliner.",
        ],
    ),
    (
        "glaf",
        "Glaf",
        "Pervazuri interior / exterior",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru glaf / pervaz), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare glaf interior / exterior, observații din discuția cu managerul).",
            "Verificați cu nivela laser Bosch GLL 3-80 planeitatea bazei pervazului / nivelul față de toc.",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner lungimea, adâncimea și unghiurile fiecărui glaf.",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lungime, adâncime, ieșire față de toc) pe fiecare glaf.",
            "Completați pe carnet notele finale pentru glaf (grosime, finisaj, abateri, observații teren — interior / exterior).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de glaf în Proliner.",
        ],
    ),
    (
        "scara-exterior",
        "Scări ext.",
        "Scări exterioare",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru scări exterioare), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare scări exterioare, observații din discuția cu managerul).",
            "Verificați cu nivela laser Bosch GLL 3-80 nivelul / alinierea treptelor exterioare și a bazei.",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner (Stairs) profilul treptelor exterioare.",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (lățime treaptă, înălțime, adâncime, aliniere bază).",
            "Completați pe carnet notele finale pentru scări exterioare (grosime, finisaj, stare bază, abateri, observații teren / vreme).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de scări exterioare în Proliner.",
        ],
    ),
    (
        "placare-exterior",
        "Placări ext.",
        "Placări exterioare / parapet (atic)",
        [
            "Discutați ANEXA Nr. 1 cu clientul (informațiile agreate cu managerul pentru placări exterioare / parapet), confirmați-le și obțineți semnătura clientului — înainte de măsurarea cu Proliner.",
            "Notați pe carnet datele esențiale (client, măsurare placare exterioară / parapet, observații din discuția cu managerul).",
            "Verificați cu nivela laser Bosch GLL 3-80 verticalitatea fațadei / parapetului și nivelul bazei.",
            "Porniți ochelarii de înregistrare video și măsurați cu Proliner conturul de placare și cotele pentru prindere mecanică.",
            "Controlați cu ruleta Bosch 5 m cotele primite de aparatul Proliner (înălțimi, lățimi, cote prindere mecanică).",
            "Completați pe carnet notele finale pentru placare exterioară (grosime, finisaj, prindere mecanică, stare bază, abateri, observații teren / vreme).",
            "Încărcați ANEXA Nr. 1 semnată și pozele de la locație + video-ul înregistrat de ochelari în Bitrix; salvați proiectul de placare exterioară în Proliner.",
        ],
    ),
]


def resolve_font(candidates: list[Path]) -> Path:
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("Nu s-a găsit un font TTF compatibil (Segoe/Calibri/Arial/DejaVu).")


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


def draw_header(
    page: fitz.Page,
    font_reg: fitz.Font,
    font_bold: fitz.Font,
    eyebrow: str,
    title: str,
    subtitle: str | None,
) -> float:
    """Desenează antetul; returnează y de start pentru conținut."""
    rect = page.rect
    header_h = 78
    page.draw_rect(fitz.Rect(0, 0, rect.width, header_h), color=BLACK, fill=BLACK)
    page.draw_rect(fitz.Rect(0, header_h - 3, rect.width, header_h), color=GOLD, fill=GOLD)

    tw = fitz.TextWriter(rect)
    tw.append((36, 28), "artGRANIT", font=font_bold, fontsize=9)
    tw.write_text(page, color=GOLD)

    tw = fitz.TextWriter(rect)
    tw.append((36, 46), eyebrow.upper(), font=font_bold, fontsize=8)
    tw.write_text(page, color=(0.75, 0.75, 0.72))

    tw = fitz.TextWriter(rect)
    tw.append((36, 64), title, font=font_bold, fontsize=16)
    tw.write_text(page, color=WHITE)

    y = header_h + 22
    if subtitle:
        tw = fitz.TextWriter(rect)
        tw.append((36, y), subtitle, font=font_reg, fontsize=10)
        tw.write_text(page, color=MUTED)
        y += 18
    return y


def draw_footer(page: fitz.Page, font_reg: fitz.Font, note: str) -> None:
    rect = page.rect
    y = rect.height - 28
    page.draw_line(fitz.Point(36, y - 10), fitz.Point(rect.width - 36, y - 10), color=LINE, width=0.6)
    tw = fitz.TextWriter(rect)
    tw.append((36, y), note, font=font_reg, fontsize=7.5)
    tw.write_text(page, color=MUTED)


def draw_numbered_list(
    page: fitz.Page,
    font_reg: fitz.Font,
    font_bold: fitz.Font,
    items: list[str],
    start_y: float,
    item_fontsize: float = 10,
) -> None:
    rect = page.rect
    left = 36
    right = rect.width - 36
    content_w = right - left - 28
    y = start_y
    line_gap = item_fontsize * 1.35
    block_gap = 10

    for index, item in enumerate(items, start=1):
        lines = wrap_text(font_reg, item, item_fontsize, content_w)
        block_h = max(18.0, len(lines) * line_gap + 8)

        # card background
        card = fitz.Rect(left, y - 2, right, y + block_h)
        page.draw_rect(card, color=LINE, fill=SURFACE, width=0.5)

        # number badge
        badge = fitz.Rect(left + 6, y + 3, left + 22, y + 19)
        page.draw_rect(badge, color=BLACK, fill=BLACK)
        tw = fitz.TextWriter(rect)
        num = str(index)
        num_w = font_bold.text_length(num, fontsize=8)
        tw.append((badge.x0 + (16 - num_w) / 2, badge.y0 + 11.5), num, font=font_bold, fontsize=8)
        tw.write_text(page, color=GOLD)

        text_x = left + 30
        text_y = y + 14
        for line in lines:
            tw = fitz.TextWriter(rect)
            tw.append((text_x, text_y), line, font=font_reg, fontsize=item_fontsize)
            tw.write_text(page, color=DARK)
            text_y += line_gap

        y += block_h + block_gap


def build_list_pdf(
    out_pdf: Path,
    eyebrow: str,
    title: str,
    subtitle: str | None,
    items: list[str],
    footer: str,
    item_fontsize: float = 10,
) -> None:
    font_reg = fitz.Font(fontfile=str(resolve_font(FONT_REG_CANDIDATES)))
    font_bold = fitz.Font(fontfile=str(resolve_font(FONT_BOLD_CANDIDATES)))

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    page.draw_rect(page.rect, color=WHITE, fill=WHITE)

    y = draw_header(page, font_reg, font_bold, eyebrow, title, subtitle)
    draw_numbered_list(page, font_reg, font_bold, items, y, item_fontsize=item_fontsize)
    draw_footer(page, font_reg, footer)

    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(out_pdf))
    doc.close()
    print(f"  PDF → {out_pdf.relative_to(ROOT)}")


def render_png(pdf_path: Path, png_path: Path) -> None:
    doc = fitz.open(pdf_path)
    try:
        pix = doc[0].get_pixmap(dpi=RENDER_DPI, alpha=False)
        png_path.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(png_path))
        print(f"  PNG → {png_path.relative_to(ROOT)} ({pix.width}x{pix.height})")
    finally:
        doc.close()


def main() -> None:
    OUT_EQUIP.mkdir(parents=True, exist_ok=True)
    OUT_STEPS.mkdir(parents=True, exist_ok=True)
    (OUT_EQUIP / "pages").mkdir(parents=True, exist_ok=True)
    (OUT_STEPS / "pages").mkdir(parents=True, exist_ok=True)

    print("Echipament necesar…")
    equip_pdf = OUT_EQUIP / "Echipament-necesar.pdf"
    build_list_pdf(
        equip_pdf,
        eyebrow="Pregătire teren",
        title="Echipament necesar",
        subtitle="Listă standard artGRANIT — aceeași pentru toate tipurile de măsurare",
        items=EQUIPMENT,
        footer="artGRANIT · Ghid Operațional · echipament măsurători — referință teren",
        item_fontsize=11,
    )
    render_png(equip_pdf, OUT_EQUIP / "pages" / "echipament.png")

    print("Pași de măsurare…")
    for slug, label, subtitle, steps in CATEGORIES:
        pdf = OUT_STEPS / f"Pasi-masurare-{slug}.pdf"
        build_list_pdf(
            pdf,
            eyebrow="Pe teren",
            title=f"Pași de măsurare — {label}",
            subtitle=subtitle,
            items=steps,
            footer=f"artGRANIT · Ghid Operațional · pași măsurare {label} — referință teren",
            item_fontsize=9.2,
        )
        render_png(pdf, OUT_STEPS / "pages" / f"{slug}.png")

    print("Done.")


if __name__ == "__main__":
    main()
