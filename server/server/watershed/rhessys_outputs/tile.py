"""
Generate PNG map tiles from RHESSys output GeoTIFFs using rio-tiler.

Supports two rendering modes:
  - sequential: viridis-like gradient for baseline/absolute maps
  - diverging: blue-white-red gradient for change/delta maps

Global raster statistics (min/max) are computed once per GeoTIFF and cached
so that every tile is rescaled against the same range, producing a coherent
colormap across the entire map.
"""

from __future__ import annotations

from cachetools import TTLCache
from rio_tiler.io import Reader

from .colormap import build_sequential_colormap, build_diverging_colormap

_global_stats_cache: TTLCache[str, tuple[float, float]] = TTLCache(
    maxsize=128, ttl=3600,
)


def _get_global_minmax(tif_url: str) -> tuple[float, float]:
    """Return (min, max) for the first band of *tif_url*, cached."""
    cached = _global_stats_cache.get(tif_url)
    if cached is not None:
        return cached

    with Reader(tif_url) as src:
        stats = src.statistics()

    band_key = next(iter(stats))
    band_stats = stats[band_key]
    result = (band_stats.min, band_stats.max)
    _global_stats_cache[tif_url] = result
    return result


def get_tile_png(
    tif_url: str,
    tile_z: int,
    tile_x: int,
    tile_y: int,
    *,
    is_change: bool = False,
) -> bytes:
    """Return 256x256 PNG bytes for a Web Mercator tile.

    The GeoTIFF is read remotely via rio-tiler. Data is rescaled to 0-255
    using the **global** raster min/max so that colours are consistent
    across all tiles.  Change maps use a diverging colormap; baseline maps
    use a sequential one.
    """
    min_val, max_val = _get_global_minmax(tif_url)

    if is_change and min_val < 0:
        abs_max = max(abs(min_val), abs(max_val))
        min_val = -abs_max
        max_val = abs_max

    with Reader(tif_url) as src:
        img = src.tile(tile_x, tile_y, tile_z, tilesize=256)

    rescaled = img.rescale(
        in_range=((min_val, max_val),),
        out_range=((0, 255),),
    )

    cm = build_diverging_colormap() if is_change else build_sequential_colormap()
    return rescaled.render(colormap=cm)
