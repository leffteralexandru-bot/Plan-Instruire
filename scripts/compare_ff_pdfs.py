#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from manual_hotspot_utils import extract_hotspots_from_pdf

RO = ROOT / "public/docs/equipment/factory-fabricator-manual-ro.pdf"
EN = Path(
    r"C:\Users\AlioSol\Desktop\Instructie pentru ingineri\Prodim(Instructie pentru incepatori)\Prodim-Manual-Factory-Fabricator-software.pdf"
)

ro_pages, ro_ids = extract_hotspots_from_pdf(RO)
en_pages, en_ids = extract_hotspots_from_pdf(EN)

print("RO videos:", len(ro_ids))
print("EN videos:", len(en_ids))
print("Missing in RO:", sorted(set(en_ids) - set(ro_ids)))

for vid in sorted(set(en_ids) - set(ro_ids)):
    for p, spots in sorted(en_pages.items(), key=lambda x: int(x[0])):
        for s in spots:
            if s["videoId"] == vid:
                print(f"  {vid} page {p}: x={s['x']} y={s['y']} w={s['w']} h={s['h']}")

print("\nPage diff counts:")
all_pages = sorted(set(ro_pages) | set(en_pages), key=int)
for p in all_pages:
    ro = [s["videoId"] for s in ro_pages.get(p, [])]
    en = [s["videoId"] for s in en_pages.get(p, [])]
    if ro != en:
        print(f"  page {p}: RO={ro}")
        print(f"           EN={en}")
