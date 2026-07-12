#!/usr/bin/env python3
"""Verifică hotspot-uri și fișiere video pentru toate manualele echipament."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from manual_hotspot_utils import is_text_link_hotspot, is_thumbnail_hotspot

MANUALS = [
    {
        "name": "GHID PORNIRE RAPIDĂ PROLINER",
        "manifest": None,
        "hotspots_ts": ROOT / "src/data/prolinerPageHotspots.ts",
        "videos_dir": ROOT / "public/docs/equipment/proliner/videos",
        "legacy": True,
    },
    {
        "name": "Manual Prodim CT 3.2 & 3.3",
        "manifest": ROOT / "src/data/prodim-ct-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/prodim-ct/videos",
    },
    {
        "name": "PROLINER 4.X MANUAL",
        "manifest": ROOT / "src/data/proliner-4x-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/proliner-4x/videos",
    },
    {
        "name": "SCĂRI PRODIM",
        "manifest": ROOT / "src/data/prodim-stairs-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/prodim-stairs/videos",
    },
    {
        "name": "APLICAȚIE PROLINER SCĂRI",
        "manifest": ROOT / "src/data/proliner-stairs-app-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/proliner-stairs-app/videos",
    },
    {
        "name": "PROLINER TELECOMANDĂ",
        "manifest": ROOT / "src/data/proliner-remote-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/proliner-remote/videos",
    },
    {
        "name": "CT 3.1 TELECOMANDĂ NOUĂ",
        "manifest": ROOT / "src/data/proliner-new-remote-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/proliner-new-remote/videos",
    },
    {
        "name": "BOSCH GLL 3-80",
        "manifest": ROOT / "src/data/bosch-gll-3-80-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/bosch-gll-3-80/videos",
    },
    {
        "name": "BOSCH GLM 40",
        "manifest": ROOT / "src/data/bosch-glm-40-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/bosch-glm-40/videos",
    },
    {
        "name": "FABRICATOR FABRICĂ",
        "manifest": ROOT / "src/data/factory-fabricator-manifest.json",
        "videos_dir": ROOT / "public/docs/equipment/factory-fabricator/videos",
    },
]


def load_hotspots(manual: dict) -> tuple[dict, list[str]]:
    if manual.get("legacy"):
        import re

        text = manual["hotspots_ts"].read_text(encoding="utf-8")
        pages: dict[str, list[dict]] = {}
        video_ids: list[str] = []
        for page_match in re.finditer(
            r"(\d+):\s*\{[^}]*videoUrl:\s*PROLINER_LOCAL_VIDEOS\[(\d+)\][^}]*x:\s*([\d.]+)[^}]*y:\s*([\d.]+)[^}]*w:\s*([\d.]+)[^}]*h:\s*([\d.]+)",
            text,
        ):
            page, _vid_key, x, y, w, h = page_match.groups()
            pages.setdefault(page, []).append(
                {"videoId": f"page-{page}", "x": float(x), "y": float(y), "w": float(w), "h": float(h)}
            )
        return pages, video_ids

    data = json.loads(manual["manifest"].read_text(encoding="utf-8"))
    return data.get("pageHotspots", {}), data.get("videoIds", [])


def main() -> int:
    errors = 0
    print("=== Verificare manuale echipament ===\n")

    for manual in MANUALS:
        name = manual["name"]
        pages, video_ids = load_hotspots(manual)
        hotspot_count = sum(len(v) for v in pages.values())
        thumbs = icons = text_links = 0
        missing_mp4: list[str] = []

        for spots in pages.values():
            for spot in spots:
                w, h = spot["w"], spot["h"]
                if is_text_link_hotspot(w, h):
                    text_links += 1
                elif is_thumbnail_hotspot(w, h):
                    thumbs += 1
                else:
                    icons += 1

        videos_dir: Path = manual["videos_dir"]
        mp4_ids = {p.stem for p in videos_dir.glob("*.mp4")} if videos_dir.exists() else set()
        for vid in video_ids:
            if vid not in mp4_ids:
                missing_mp4.append(vid)

        status = "OK" if text_links == 0 and not missing_mp4 else "PROBLEME"
        if text_links or missing_mp4:
            errors += 1

        print(f"[{status}] {name}")
        print(f"  pagini cu video: {len(pages)} | hotspot-uri: {hotspot_count}")
        print(f"  tipuri: miniatură={thumbs} | icon+play={icons} | text-link greșit={text_links}")
        print(f"  videoclipuri manifest: {len(video_ids)} | mp4 pe disc: {len(mp4_ids)}")
        if missing_mp4:
            print(f"  LIPSESC mp4: {', '.join(missing_mp4[:8])}{'…' if len(missing_mp4) > 8 else ''}")
        if text_links:
            print("  ATENȚIE: există zone text-link (invizibile) — regenerați hotspot-urile")
        print()

    if errors:
        print(f"Total manuale cu probleme: {errors}")
        return 1
    print("Toate manualele sunt în regulă.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
