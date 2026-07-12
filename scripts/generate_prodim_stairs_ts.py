#!/usr/bin/env python3
"""Generează prodimStairsVideos.ts și prodimStairsPageHotspots.ts din manifest."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/prodim-stairs-manifest.json"
VIDEOS_TS = ROOT / "src/data/prodimStairsVideos.ts"
HOTSPOTS_TS = ROOT / "src/data/prodimStairsPageHotspots.ts"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    video_ids: list[str] = data["videoIds"]
    videos_dir = data["videosDir"]

    videos_lines = [
        "/** Videoclipuri SCĂRI PRODIM stocate local (public/docs/equipment/prodim-stairs/videos/). */",
    ]
    if video_ids:
        videos_lines.append(f'const VIDEO = (id: string) => `{videos_dir}/${{id}}.mp4`;')
        videos_lines.append("")
    videos_lines.append("export const PRODIM_STAIRS_LOCAL_VIDEOS: Record<string, string> = {")
    for vid in video_ids:
        videos_lines.append(f"  '{vid}': VIDEO('{vid}'),")
    videos_lines.append("};")
    videos_lines.append("")
    VIDEOS_TS.write_text("\n".join(videos_lines), encoding="utf-8")

    hotspot_lines = [
        "import type { EquipmentManualPageVideoHotspot } from '@/data/equipmentOperations';",
        "",
        "export const PRODIM_STAIRS_PAGE_HOTSPOTS: Record<number, EquipmentManualPageVideoHotspot[]> = {",
    ]
    if data["pageHotspots"]:
        hotspot_lines = [
            "import { PRODIM_STAIRS_LOCAL_VIDEOS } from '@/data/prodimStairsVideos';",
            "import type { EquipmentManualPageVideoHotspot } from '@/data/equipmentOperations';",
            "",
            "export const PRODIM_STAIRS_PAGE_HOTSPOTS: Record<number, EquipmentManualPageVideoHotspot[]> = {",
        ]
    for page_str, spots in sorted(data["pageHotspots"].items(), key=lambda x: int(x[0])):
        page = int(page_str)
        hotspot_lines.append(f"  {page}: [")
        for spot in spots:
            vid = spot["videoId"]
            hotspot_lines.append(
                f"    {{ videoUrl: PRODIM_STAIRS_LOCAL_VIDEOS['{vid}'], "
                f"x: {spot['x']}, y: {spot['y']}, w: {spot['w']}, h: {spot['h']} }},"
            )
        hotspot_lines.append("  ],")
    hotspot_lines.append("};")
    hotspot_lines.append("")
    HOTSPOTS_TS.write_text("\n".join(hotspot_lines), encoding="utf-8")
    print(f"Wrote {VIDEOS_TS.name} and {HOTSPOTS_TS.name}")


if __name__ == "__main__":
    main()
