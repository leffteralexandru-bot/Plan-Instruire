#!/usr/bin/env python3
"""Descarcă videoclipurile APLICAȚIE PROLINER SCĂRI în public/docs/equipment/proliner-stairs-app/videos/."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/proliner-stairs-app-manifest.json"
OUT_DIR = ROOT / "public/docs/equipment/proliner-stairs-app/videos"


def download_one(video_id: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{video_id}.mp4"
    if out_path.exists() and out_path.stat().st_size > 0:
        print(f"Skip {video_id} (exists)")
        return out_path

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
    print(f"Downloading {video_id}…")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 and not out_path.exists():
        raise RuntimeError(result.stderr or result.stdout or f"Download failed for {video_id}")
    print(f"  → {out_path.name} ({out_path.stat().st_size // 1024} KB)")
    return out_path


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries: list[dict] = []
    for video_id in data["videoIds"]:
        path = download_one(video_id)
        entries.append(
            {
                "youtubeId": video_id,
                "file": f"/docs/equipment/proliner-stairs-app/videos/{path.name}",
                "bytes": path.stat().st_size,
            }
        )
    if entries:
        out_manifest = OUT_DIR / "manifest.json"
        out_manifest.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        total_mb = sum(e["bytes"] for e in entries) / (1024 * 1024)
        print(f"Done — {len(entries)} videos, {total_mb:.1f} MB total")
    else:
        print("Done — 0 videos")


if __name__ == "__main__":
    main()
