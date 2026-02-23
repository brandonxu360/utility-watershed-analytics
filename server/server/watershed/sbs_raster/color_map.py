"""
SBS (Soil Burn Severity) raster colormaps.

Class definitions sourced from:
  https://github.com/rogerlew/wepppy/blob/master/wepppy/nodb/mods/baer/README.sbs_map.md

The **backend is the source of truth** for all SBS colormaps.
tile.py uses get_colormap() to render PNG tiles server-side; the frontend
queries GET /api/sbs/colormap?mode=<legacy|shift> to build legends and
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


def get_colormap(
    mode: ColorMode = ColorMode.LEGACY,
) -> dict[int, tuple[int, int, int, int]]:
    """Return RGBA colormap dict for the given color mode.

    Intended for use by tile.py when rendering PNG tiles via rio-tiler.
    """
    return _COLORMAPS[mode]


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