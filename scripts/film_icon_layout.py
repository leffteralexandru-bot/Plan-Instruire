"""Aliniere și mascare iconițe film albastre din manuale echipament."""

from __future__ import annotations


def film_icon_rect(spot: dict) -> tuple[float, float, float, float]:
    x, y, w, h = spot["x"], spot["y"], spot["w"], spot["h"]
    x_shift = w * 0.35 if x < 20 or x > 40 else w * 0.42
    y_shift = h * 0.06
    return (x + x_shift, y - y_shift, w * 1.05, h * 1.12)


def is_thumbnail_hotspot(w: float, h: float) -> bool:
    return w >= 20 and h >= 8
