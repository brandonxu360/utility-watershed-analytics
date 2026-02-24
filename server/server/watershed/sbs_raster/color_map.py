"""
SBS (Soil Burn Severity) raster colormaps.

Class definitions sourced from:
  https://github.com/rogerlew/wepppy/blob/master/wepppy/nodb/mods/baer/README.sbs_map.md

The **backend is the source of truth** for all SBS colormaps.
tile.py uses get_render_colormap() to render PNG tiles server-side; the frontend
queries GET /api/watershed/sbs/colormap?mode=<legacy|shift> to build legends and
support the colorblind-friendly color-shift toggle — both sides always
agree because they share this single definition.
"""

from enum import Enum


class ColorMode(str, Enum):
    LEGACY = "legacy"
    SHIFT = "shift"   # Okabe-Ito colorblind-safe palette


# Human-readable labels for each SBS canonical class value
SBS_CLASS_LABELS: dict[int, str] = {
    130: "Unburned",
    131: "Low",
    132: "Moderate",
    133: "High",
}

# RGBA tuples (R, G, B, A) — alpha 255 = fully opaque

_LEGACY: dict[int, tuple[int, int, int, int]] = {
    130: (0,   115, 74,  255),  # #00734A  Unburned
    131: (77,  230, 0,   255),  # #4DE600  Low
    132: (255, 255, 0,   255),  # #FFFF00  Moderate
    133: (255, 0,   0,   255),  # #FF0000  High
}

_SHIFT: dict[int, tuple[int, int, int, int]] = {
    130: (0,   158, 115, 255),  # #009E73  Unburned (Okabe-Ito)
    131: (86,  180, 233, 255),  # #56B4E9  Low
    132: (240, 228, 66,  255),  # #F0E442  Moderate
    133: (204, 121, 167, 255),  # #CC79A7  High
}

_COLORMAPS: dict[ColorMode, dict[int, tuple[int, int, int, int]]] = {
    ColorMode.LEGACY: _LEGACY,
    ColorMode.SHIFT: _SHIFT,
}


# Render colormaps keyed by the raw pixel values stored in the raster (0–3).
# The raster encodes 0=Unburned, 1=Low, 2=Moderate, 3=High — these dicts are
# what tile.py passes to rio-tiler's img.render(colormap=...).
# The 130-based dicts above remain the API-facing representation (legend, etc.).

# Canonical class order shared between canonical (130–133) and render (0–3) maps.
# 0 → 130 (Unburned), 1 → 131 (Low), 2 → 132 (Moderate), 3 → 133 (High)
_CLASS_ORDER: list[int] = [130, 131, 132, 133]

def _build_render_colormap(canonical_colormap: dict[int, tuple[int, int, int, int]]) -> dict[int, tuple[int, int, int, int]]:
    """
    Derive a 0–3 render colormap from a canonical 130–133 colormap.
    This avoids duplicating RGBA tuples and ensures that legend and render
    outputs stay in sync if colors are updated.
    """
    return {
        idx: canonical_colormap[class_value]
        for idx, class_value in enumerate(_CLASS_ORDER)
    }

_RENDER_LEGACY: dict[int, tuple[int, int, int, int]] = _build_render_colormap(_LEGACY)
_RENDER_SHIFT: dict[int, tuple[int, int, int, int]] = _build_render_colormap(_SHIFT)

_RENDER_COLORMAPS: dict[ColorMode, dict[int, tuple[int, int, int, int]]] = {
    ColorMode.LEGACY: _RENDER_LEGACY,
    ColorMode.SHIFT:  _RENDER_SHIFT,
}

def get_colormap(
    mode: ColorMode = ColorMode.LEGACY,
) -> dict[int, tuple[int, int, int, int]]:
    """Return RGBA colormap dict keyed by canonical class codes (130–133).

    Used for API responses / legend metadata. For tile rendering, use
    get_render_colormap() instead.
    """
    return _COLORMAPS[mode]


def get_render_colormap(
    mode: ColorMode = ColorMode.LEGACY,
) -> dict[int, tuple[int, int, int, int]]:
    """Return RGBA colormap dict keyed by raw raster pixel values (0–3).

    The SBS GeoTIFF stores 0=Unburned, 1=Low, 2=Moderate, 3=High.
    Pass this dict to rio-tiler's img.render(colormap=...) so tiles are
    coloured correctly.
    """
    return _RENDER_COLORMAPS[mode]


def get_colormap_metadata(mode: ColorMode = ColorMode.LEGACY) -> list[dict]:
    """Return serialisable colormap metadata for an API response.

    Each entry contains the SBS class value, human-readable label, RGBA
    tuple, and hex string so the frontend can render a legend without
    embedding any color values of its own.
    """
    cm = _COLORMAPS[mode]
    return [
        {
            "class_value": cls,
            "label": SBS_CLASS_LABELS[cls],
            "rgba": list(cm[cls]),
            "hex": "#{:02X}{:02X}{:02X}".format(*cm[cls][:3]),
        }
        for cls in sorted(cm)
    ]