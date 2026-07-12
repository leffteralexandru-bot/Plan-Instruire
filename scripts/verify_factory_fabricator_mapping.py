#!/usr/bin/env python3
"""Verifică maparea video → buton pentru Fabricator fabrică."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

MANIFEST = ROOT / "src/data/factory-fabricator-manifest.json"
VIDEOS = ROOT / "public/docs/equipment/factory-fabricator/videos"
RO = ROOT / "public/docs/equipment/factory-fabricator-manual-ro.pdf"
EN = Path(
    r"C:\Users\AlioSol\Desktop\Instructie pentru ingineri\Prodim(Instructie pentru incepatori)\Prodim-Manual-Factory-Fabricator-software.pdf"
)

from manual_hotspot_utils import extract_film_icon_hotspots_from_pdf, merge_ro_en_film_hotspots


def main() -> int:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    ro_pages, _ = extract_film_icon_hotspots_from_pdf(RO)
    merged, _ = merge_ro_en_film_hotspots(RO, EN)

    print("=== FABRICATOR FABRICĂ — verificare butoane video ===\n")
    errors = 0
    total = 0

    for page in sorted(data["pageHotspots"], key=int):
        spots = data["pageHotspots"][page]
        print(f"Pagina {page} — {len(spots)} butoane")
        ro_lookup = {(s["videoId"], round(s["y"], 1)): s for s in ro_pages.get(page, [])}
        for i, spot in enumerate(spots, 1):
            total += 1
            vid = spot["videoId"]
            mp4 = VIDEOS / f"{vid}.mp4"
            has_mp4 = mp4.exists() and mp4.stat().st_size > 10_000
            key = (vid, round(spot["y"], 1))
            source = "RO" if key in ro_lookup else "EN"
            merged_spot = merged.get(page, [])[i - 1] if i - 1 < len(merged.get(page, [])) else None
            pos_ok = merged_spot and abs(merged_spot["x"] - spot["x"]) < 0.05 and abs(merged_spot["y"] - spot["y"]) < 0.05
            status = "OK" if has_mp4 and pos_ok else "PROBLEMĂ"
            if status != "OK":
                errors += 1
            print(
                f"  {i}. y={spot['y']}% x={spot['x']}% | {vid} | {source} | mp4={'da' if has_mp4 else 'LIPSEȘTE'} | {status}"
            )
        print()

    print(f"Total: {total} butoane, {len(data['videoIds'])} videoclipuri unice")
    if errors:
        print(f"Probleme: {errors}")
        return 1
    print("Toate butoanele au video și poziție corectă.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
