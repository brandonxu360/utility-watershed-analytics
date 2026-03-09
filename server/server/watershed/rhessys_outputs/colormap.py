"""
Colormaps for RHESSys output map tiles.

Two strategies:
  - Sequential (viridis-like): for baseline/absolute value maps.
  - Diverging (blue-white-red): for change/delta maps where zero is the
    neutral midpoint and positive/negative changes are distinct.
"""

from __future__ import annotations

RGBA = tuple[int, int, int, int]


# ── Sequential (blue → green → yellow) ──────────────────────────────────────

_VIRIDIS_ANCHORS: list[tuple[float, tuple[int, int, int]]] = [
    (0.00, (68, 1, 84)),
    (0.25, (59, 82, 139)),
    (0.50, (33, 145, 140)),
    (0.75, (94, 201, 98)),
    (1.00, (253, 231, 37)),
]


def _lerp_color(
    t: float,
    anchors: list[tuple[float, tuple[int, int, int]]],
) -> tuple[int, int, int]:
    """Linearly interpolate between anchor colours."""
    t = max(0.0, min(1.0, t))
    for i in range(len(anchors) - 1):
        t0, c0 = anchors[i]
        t1, c1 = anchors[i + 1]
        if t <= t1:
            frac = (t - t0) / (t1 - t0) if t1 != t0 else 0.0
            return (
                round(c0[0] + frac * (c1[0] - c0[0])),
                round(c0[1] + frac * (c1[1] - c0[1])),
                round(c0[2] + frac * (c1[2] - c0[2])),
            )
    return anchors[-1][1]


def _build_sequential_colormap() -> dict[int, RGBA]:
    cm: dict[int, RGBA] = {}
    for i in range(256):
        r, g, b = _lerp_color(i / 255.0, _VIRIDIS_ANCHORS)
        cm[i] = (r, g, b, 255)
    return cm


_SEQUENTIAL_CM: dict[int, RGBA] = _build_sequential_colormap()


def build_sequential_colormap() -> dict[int, RGBA]:
    """256-entry viridis-like colormap for absolute value maps (cached)."""
    return _SEQUENTIAL_CM


# ── Diverging (blue → white → red) ──────────────────────────────────────────

_DIVERGING_ANCHORS: list[tuple[float, tuple[int, int, int]]] = [
    (0.00, (33, 102, 172)),
    (0.25, (103, 169, 207)),
    (0.50, (247, 247, 247)),
    (0.75, (239, 138, 98)),
    (1.00, (178, 24, 43)),
]


def _build_diverging_colormap() -> dict[int, RGBA]:
    cm: dict[int, RGBA] = {}
    for i in range(256):
        r, g, b = _lerp_color(i / 255.0, _DIVERGING_ANCHORS)
        cm[i] = (r, g, b, 255)
    return cm


_DIVERGING_CM: dict[int, RGBA] = _build_diverging_colormap()


def build_diverging_colormap() -> dict[int, RGBA]:
    """256-entry blue-white-red colormap for change/delta maps (cached)."""
    return _DIVERGING_CM


# ── Legend helpers ───────────────────────────────────────────────────────────

def get_legend_stops(
    min_val: float,
    max_val: float,
    is_change: bool = False,
    n_stops: int = 5,
) -> list[dict]:
    """Return evenly spaced legend entries for a continuous colormap."""
    anchors = _DIVERGING_ANCHORS if is_change else _VIRIDIS_ANCHORS
    stops = []
    for i in range(n_stops):
        frac = i / (n_stops - 1) if n_stops > 1 else 0.5
        value = min_val + frac * (max_val - min_val)
        r, g, b = _lerp_color(frac, anchors)
        stops.append({
            "value": round(value, 6),
            "hex": "#{:02X}{:02X}{:02X}".format(r, g, b),
        })
    return stops
