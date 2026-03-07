"""
Colormaps for RHESSys spatial input raster tiles.

Provides two rendering strategies:
  - Continuous data: 256-entry rainbow gradient (blue→red), with an
    optional reversal for metrics like canopy cover where low=bad.
  - Categorical data: a fixed 10-colour qualitative palette, cycled
    for datasets with more than 10 classes.
  - Stream data: cyan (0, 255, 255) for value 1, transparent otherwise.

The approach mirrors the spatial-inputs branch prototype, translated to
server-side rendering with rio-tiler colormaps.
"""

from __future__ import annotations

import colorsys


RGBA = tuple[int, int, int, int]


# ── Rainbow (continuous) ─────────────────────────────────────────────────────

def _rainbow_rgb(t: float) -> tuple[int, int, int]:
    """Map t ∈ [0, 1] to an RGB triple. 0 → blue, 1 → red."""
    t = max(0.0, min(1.0, t))
    hue = (1.0 - t) * 240.0 / 360.0
    r, g, b = colorsys.hls_to_rgb(hue, 0.5, 1.0)
    return (round(r * 255), round(g * 255), round(b * 255))


def build_continuous_colormap(reversed: bool = False) -> dict[int, RGBA]:
    """Build a 256-entry rainbow colormap for continuous data.

    After the tile data is rescaled to 0-255, each pixel value indexes
    into this colormap.  The alpha mask from the source raster handles
    nodata transparency during render(), so all 256 entries are opaque.
    """
    cm: dict[int, RGBA] = {}
    for i in range(256):
        t = i / 255.0
        if reversed:
            t = 1.0 - t
        r, g, b = _rainbow_rgb(t)
        cm[i] = (r, g, b, 255)
    return cm


# ── Categorical ──────────────────────────────────────────────────────────────

CATEGORICAL_PALETTE: list[tuple[int, int, int]] = [
    (31, 119, 180),
    (255, 127, 14),
    (44, 160, 44),
    (214, 39, 40),
    (148, 103, 189),
    (140, 86, 75),
    (227, 119, 194),
    (127, 127, 127),
    (188, 189, 34),
    (23, 190, 207),
]


def build_categorical_colormap(unique_values: list[int]) -> dict[int, RGBA]:
    """Build a colormap that maps each categorical value to a fixed colour."""
    cm: dict[int, RGBA] = {}
    for idx, val in enumerate(unique_values):
        r, g, b = CATEGORICAL_PALETTE[idx % len(CATEGORICAL_PALETTE)]
        cm[val] = (r, g, b, 255)
    return cm


# ── Stream ───────────────────────────────────────────────────────────────────

STREAM_COLORMAP: dict[int, RGBA] = {1: (0, 255, 255, 255)}


# ── Legend helpers ───────────────────────────────────────────────────────────

def get_continuous_legend_stops(
    min_val: float, max_val: float, reversed: bool = False, n_stops: int = 5,
) -> list[dict]:
    """Return evenly spaced legend entries for a continuous colormap."""
    stops = []
    for i in range(n_stops):
        frac = i / (n_stops - 1) if n_stops > 1 else 0.5
        value = min_val + frac * (max_val - min_val)
        t = frac
        if reversed:
            t = 1.0 - t
        r, g, b = _rainbow_rgb(t)
        stops.append({
            "value": round(value, 4),
            "hex": "#{:02X}{:02X}{:02X}".format(r, g, b),
        })
    return stops


def get_categorical_legend(unique_values: list[int]) -> list[dict]:
    """Return one legend entry per categorical value."""
    entries = []
    for idx, val in enumerate(unique_values):
        r, g, b = CATEGORICAL_PALETTE[idx % len(CATEGORICAL_PALETTE)]
        entries.append({
            "value": val,
            "hex": "#{:02X}{:02X}{:02X}".format(r, g, b),
        })
    return entries
