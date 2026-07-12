"""Utilitare comune pentru extragerea hotspot-urilor video din PDF-uri manuale."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def youtube_id(uri: str) -> str:
    if "youtu.be/" in uri:
        return uri.split("youtu.be/")[-1].split("?")[0]
    m = re.search(r"[?&]v=([^&]+)", uri)
    return m.group(1) if m else uri


def improve_hotspot_bbox(x: float, y: float, w: float, h: float) -> tuple[list[float], str] | None:
    """Miniatură video mare (Proliner) sau icon play mic; ignoră linkurile text subliniate."""
    if w >= 12 and h <= 4:
        return None
    if w >= 10 and h <= 4 and w / max(h, 0.5) >= 5:
        return None
    if w >= 20 and h >= 5:
        return [round(x, 2), round(max(0, y - 8), 2), round(max(w, 28), 2), 13.0], "thumb"
    return [
        round(max(0, x - 0.5), 2),
        round(max(0, y - 0.5), 2),
        round(max(w, 3.5), 2),
        round(max(h, 3.5), 2),
    ], "icon"


def is_text_link_hotspot(w: float, h: float) -> bool:
    return (w >= 12 and h <= 4) or (w >= 10 and h <= 4 and w / max(h, 0.5) >= 5)


def is_thumbnail_hotspot(w: float, h: float) -> bool:
    return w >= 20 and h >= 8


def extract_thumbnail_hotspots_from_pdf(pdf_path) -> tuple[dict[str, list[dict]], list[str]]:
    """Miniaturi video mari (film strip + Play în desen) — bbox brut din PDF."""
    import fitz

    doc = fitz.open(pdf_path)
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []

    for pi, page in enumerate(doc):
        w, h = page.rect.width, page.rect.height
        spots: list[dict] = []
        for link in page.get_links():
            uri = link.get("uri", "")
            if "youtu" not in uri:
                continue
            vid = youtube_id(uri)
            rect = link["from"]
            bw = round((rect.x1 - rect.x0) / w * 100, 2)
            bh = round((rect.y1 - rect.y0) / h * 100, 2)
            if is_text_link_hotspot(bw, bh):
                continue
            if bw < 20 or bh < 5:
                continue
            spots.append(
                {
                    "videoId": vid,
                    "x": round(rect.x0 / w * 100, 2),
                    "y": round(rect.y0 / h * 100, 2),
                    "w": bw,
                    "h": bh,
                }
            )
            all_ids.append(vid)
        if spots:
            pages[str(pi + 1)] = spots

    doc.close()
    return pages, sorted(set(all_ids))


def extract_orphan_filmstrip_hotspots_from_pdf(
    pdf_path,
    video_by_page: dict[str, str] | None = None,
) -> tuple[dict[str, list[dict]], list[str]]:
    """Miniaturi film strip fără link YouTube (pierdut la export PDF tradus).

    Heuristică: imagine medie, sub titlu, nu captură UI full-width de sus.
    """
    import fitz

    video_by_page = video_by_page or {}
    doc = fitz.open(pdf_path)
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []

    for pi, page in enumerate(doc):
        page_key = str(pi + 1)
        vid = video_by_page.get(page_key)
        if not vid:
            continue

        w, h = page.rect.width, page.rect.height
        has_youtube = any("youtu" in link.get("uri", "") for link in page.get_links())
        if has_youtube:
            continue

        candidates: list[dict] = []
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 1:
                continue
            x0, y0, x1, y1 = block["bbox"]
            bw = round((x1 - x0) / w * 100, 2)
            bh = round((y1 - y0) / h * 100, 2)
            bx = round(x0 / w * 100, 2)
            by = round(y0 / h * 100, 2)
            if 35 <= bw <= 55 and 15 <= bh <= 22 and by >= 28:
                candidates.append({"videoId": vid, "x": bx, "y": by, "w": bw, "h": bh})

        if candidates:
            best = max(candidates, key=lambda s: s["w"] * s["h"])
            pages[page_key] = [best]
            all_ids.append(vid)

    doc.close()
    return pages, sorted(set(all_ids))


def extract_film_icon_hotspots_from_pdf(pdf_path) -> tuple[dict[str, list[dict]], list[str]]:
    """Toate iconițele film din PDF — fără deduplicare pe videoId (aceeași clip de 2× pe pagină)."""
    import fitz

    doc = fitz.open(pdf_path)
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []

    for pi, page in enumerate(doc):
        w, h = page.rect.width, page.rect.height
        spots: list[dict] = []
        seen: set[tuple[str, float, float]] = set()

        for link in page.get_links():
            uri = link.get("uri", "")
            if "youtu" not in uri:
                continue
            vid = youtube_id(uri)
            rect = link["from"]
            x = round(rect.x0 / w * 100, 2)
            y = round(rect.y0 / h * 100, 2)
            bw = round((rect.x1 - rect.x0) / w * 100, 2)
            bh = round((rect.y1 - rect.y0) / h * 100, 2)
            if is_text_link_hotspot(bw, bh):
                continue
            if is_thumbnail_hotspot(bw, bh):
                continue

            key = (vid, x, y)
            if key in seen:
                continue
            seen.add(key)
            spots.append({"videoId": vid, "x": x, "y": y, "w": bw, "h": bh})
            all_ids.append(vid)

        if spots:
            pages[str(pi + 1)] = sorted(spots, key=lambda s: s["y"])

    doc.close()
    return pages, sorted(set(all_ids))


def normalize_film_icon_bbox(spot: dict) -> dict:
    """Păstrează doar iconița din stânga — nu întinde spre textul linkului."""
    w = spot["w"]
    if w > 3.2:
        spot = {**spot, "w": 3.1}
    return spot


def merge_ro_en_film_hotspots(ro_pdf, en_pdf) -> tuple[dict[str, list[dict]], list[str]]:
    """Poziții din PDF RO (pagini afișate) + iconițe lipsă din manual EN."""
    ro_pages, _ = extract_film_icon_hotspots_from_pdf(ro_pdf)
    en_pages, _ = extract_film_icon_hotspots_from_pdf(en_pdf) if Path(en_pdf).exists() else ({}, [])

    merged: dict[str, list[dict]] = {}
    all_ids: list[str] = []
    page_keys = sorted(set(ro_pages) | set(en_pages), key=int)

    for page_key in page_keys:
        ro_spots = [normalize_film_icon_bbox(dict(s)) for s in ro_pages.get(page_key, [])]
        en_spots = [normalize_film_icon_bbox(dict(s)) for s in en_pages.get(page_key, [])]
        ro_y = {round(s["y"], 1) for s in ro_spots}
        combined = list(ro_spots)

        for es in en_spots:
            if any(abs(es["y"] - ry) < 1.5 for ry in ro_y):
                continue
            combined.append(es)
            ro_y.add(round(es["y"], 1))

        combined = sorted(combined, key=lambda s: s["y"])
        if combined:
            merged[page_key] = combined
            all_ids.extend(s["videoId"] for s in combined)

    return merged, sorted(set(all_ids))


def extract_hotspots_from_pdf(
    pdf_path,
    supplemental: dict[str, list[dict[str, Any]]] | None = None,
) -> tuple[dict[str, list[dict]], list[str]]:
    import fitz

    doc = fitz.open(pdf_path)
    pages: dict[str, list[dict]] = {}
    all_ids: list[str] = []

    for pi, page in enumerate(doc):
        w, h = page.rect.width, page.rect.height
        raw_spots: list[tuple[dict, str]] = []
        for link in page.get_links():
            uri = link.get("uri", "")
            if "youtu" not in uri:
                continue
            vid = youtube_id(uri)
            rect = link["from"]
            raw = [
                round(rect.x0 / w * 100, 2),
                round(rect.y0 / h * 100, 2),
                round((rect.x1 - rect.x0) / w * 100, 2),
                round((rect.y1 - rect.y0) / h * 100, 2),
            ]
            improved_kind = improve_hotspot_bbox(*raw)
            if improved_kind is None:
                continue
            improved, kind = improved_kind
            raw_spots.append(
                (
                    {
                        "videoId": vid,
                        "x": improved[0],
                        "y": improved[1],
                        "w": improved[2],
                        "h": improved[3],
                    },
                    kind,
                )
            )
            all_ids.append(vid)

        if not raw_spots:
            continue

        thumbs = [s for s, k in raw_spots if k == "thumb"]
        icons = [s for s, k in raw_spots if k == "icon"]

        if thumbs:
            by_vid: dict[str, dict] = {}
            for spot in thumbs:
                area = spot["w"] * spot["h"]
                prev = by_vid.get(spot["videoId"])
                if not prev or area > prev["w"] * prev["h"]:
                    by_vid[spot["videoId"]] = spot
            spots = list(by_vid.values())
        else:
            by_vid: dict[str, dict] = {}
            for spot in icons:
                area = spot["w"] * spot["h"]
                prev = by_vid.get(spot["videoId"])
                if not prev or area < prev["w"] * prev["h"]:
                    by_vid[spot["videoId"]] = spot
            spots = list(by_vid.values())

        pages[str(pi + 1)] = sorted(spots, key=lambda s: s["y"])

    doc.close()

    supplemental = supplemental or {}
    for page_str, extra in supplemental.items():
        if page_str not in pages:
            pages[page_str] = list(extra)
            for spot in extra:
                all_ids.append(spot["videoId"])
        else:
            existing_y = {s["y"] for s in pages[page_str]}
            for spot in extra:
                if spot["y"] not in existing_y:
                    pages[page_str].append(spot)
                    all_ids.append(spot["videoId"])
        pages[page_str] = sorted(pages[page_str], key=lambda s: s["y"])

    return pages, sorted(set(all_ids))
