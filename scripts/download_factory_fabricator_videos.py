#!/usr/bin/env python3
"""Descarcă videoclipurile Fabricator fabrică în public/docs/equipment/factory-fabricator/videos/."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/factory-fabricator-manifest.json"
OUT_DIR = ROOT / "public/docs/equipment/factory-fabricator/videos"
FALLBACK_DIR = ROOT / "public/docs/equipment/proliner-4x/videos"


def copy_fallback(video_id: str) -> Path | None:
    src = FALLBACK_DIR / f"{video_id}.mp4"
    if not src.exists() or src.stat().st_size <= 0:
        return None
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{video_id}.mp4"
    if out_path.exists() and out_path.stat().st_size > 0:
        return out_path
    import shutil

    shutil.copy2(src, out_path)
    print(f"Fallback copy {video_id} from proliner-4x ({out_path.stat().st_size // 1024} KB)")
    return out_path


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
        fallback = copy_fallback(video_id)
        if fallback:
            return fallback
        raise RuntimeError(result.stderr or result.stdout or f"Download failed for {video_id}")
    print(f"  → {out_path.name} ({out_path.stat().st_size // 1024} KB)")
    return out_path


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries: list[dict] = []
    failed: list[str] = []
    for video_id in data["videoIds"]:
        try:
            path = download_one(video_id)
        except RuntimeError as err:
            fallback = copy_fallback(video_id)
            if fallback:
                path = fallback
            else:
                print(f"FAILED {video_id}: {err}")
                failed.append(video_id)
                continue
        entries.append(
            {
                "youtubeId": video_id,
                "file": f"/docs/equipment/factory-fabricator/videos/{path.name}",
                "bytes": path.stat().st_size,
            }
        )
    out_manifest = OUT_DIR / "manifest.json"
    out_manifest.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total_mb = sum(e["bytes"] for e in entries) / (1024 * 1024)
    print(f"Done — {len(entries)} videos, {total_mb:.1f} MB total")
    if failed:
        print(f"Failed ({len(failed)}): {', '.join(failed)}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
