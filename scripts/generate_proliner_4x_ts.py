#!/usr/bin/env python3
"""Generează proliner4xVideos.ts și proliner4xPageHotspots.ts din manifest."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/proliner-4x-manifest.json"
VIDEOS_TS = ROOT / "src/data/proliner4xVideos.ts"
HOTSPOTS_TS = ROOT / "src/data/proliner4xPageHotspots.ts"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    video_ids: list[str] = data["videoIds"]
    videos_dir = data["videosDir"]

    videos_lines = [
        "/** Videoclipuri Proliner 4.X stocate local (public/docs/equipment/proliner-4x/videos/). */",
        f'const VIDEO = (id: string) => `{videos_dir}/${{id}}.mp4`;',
        "",
        "export const PROLINER_4X_LOCAL_VIDEOS: Record<string, string> = {",
    ]
    for vid in video_ids:
        videos_lines.append(f"  '{vid}': VIDEO('{vid}'),")
    videos_lines.append("};")
    videos_lines.append("")
    VIDEOS_TS.write_text("\n".join(videos_lines), encoding="utf-8")

    hotspot_lines = [
        "import { PROLINER_4X_LOCAL_VIDEOS } from '@/data/proliner4xVideos';",
        "import type { EquipmentManualPageVideoHotspot } from '@/data/equipmentOperations';",
        "",
        "export const PROLINER_4X_PAGE_HOTSPOTS: Record<number, EquipmentManualPageVideoHotspot[]> = {",
    ]
    for page_str, spots in sorted(data["pageHotspots"].items(), key=lambda x: int(x[0])):
        page = int(page_str)
        hotspot_lines.append(f"  {page}: [")
        for spot in spots:
            vid = spot["videoId"]
            hotspot_lines.append(
                f"    {{ videoUrl: PROLINER_4X_LOCAL_VIDEOS['{vid}'], "
                f"x: {spot['x']}, y: {spot['y']}, w: {spot['w']}, h: {spot['h']} }},"
            )
        hotspot_lines.append("  ],")
    hotspot_lines.append("};")
    hotspot_lines.append("")
    HOTSPOTS_TS.write_text("\n".join(hotspot_lines), encoding="utf-8")
    print(f"Wrote {VIDEOS_TS.name} and {HOTSPOTS_TS.name}")


if __name__ == "__main__":
    main()
