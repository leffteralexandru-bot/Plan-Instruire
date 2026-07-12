#!/usr/bin/env python3
"""Descarcă videoclipurile Proliner de pe YouTube în public/docs/equipment/proliner/videos/."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public/docs/equipment/proliner/videos"
MANIFEST = OUT_DIR / "manifest.json"

# Pagină manual → ID YouTube (din prolinerPageHotspots.ts)
VIDEOS: dict[int, str] = {
    5: "L3hl_zLhrh8",
    6: "QQotdHG7LXY",
    9: "LQIOkWHIP3Q",
    10: "_mVfoiH0zfM",
    11: "SqE2UoNkMb4",
    12: "G9fAtCcAsOM",
    13: "WIySmjB6Uuc",
    14: "MqOXGqwkPTo",
    15: "HDwqWuRFcrI",
    16: "WvyB-Jb5LDE",
}


def download_one(page: int, video_id: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"page-{page:02d}.mp4"
    url = f"https://www.youtube.com/watch?v={video_id}"

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        url,
        "-f",
        "mp4[height<=720]/best[ext=mp4]/best",
        "--merge-output-format",
        "mp4",
        "-o",
        str(out_path),
        "--no-playlist",
        "--extractor-args",
        "youtube:player_client=android,web",
    ]
    print(f"Downloading page {page:02d} ({video_id})…")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 and not out_path.exists():
        raise RuntimeError(result.stderr or result.stdout or f"Download failed for {video_id}")
    print(f"  → {out_path.name} ({out_path.stat().st_size // 1024} KB)")
    return out_path


def write_manifest(entries: list[dict]) -> None:
    MANIFEST.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    entries: list[dict] = []
    for page, video_id in sorted(VIDEOS.items()):
        path = download_one(page, video_id)
        entries.append(
            {
                "page": page,
                "youtubeId": video_id,
                "file": f"/docs/equipment/proliner/videos/{path.name}",
                "bytes": path.stat().st_size,
            }
        )
    write_manifest(entries)
    total_mb = sum(e["bytes"] for e in entries) / (1024 * 1024)
    print(f"Done — {len(entries)} videos, {total_mb:.1f} MB total")


if __name__ == "__main__":
    main()
