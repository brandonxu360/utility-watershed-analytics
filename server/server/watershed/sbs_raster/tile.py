"""
Generate PNG map tiles from SBS GeoTIFF using rio-tiler.
"""

from rio_tiler.io import Reader
from .color_map import ColorMode, get_colormap


def get_tile_png(
    tif_url: str,
    tile_z: int,
    tile_x: int,
    tile_y: int,
    mode: ColorMode = ColorMode.LEGACY,
) -> bytes:
    """
    Return PNG bytes for the given Web Mercator tile (z, x, y).

    Fetches the colormap for the requested color mode from color_map so that
    the rendered tile always matches what the frontend legend displays.
    """
    colormap = get_colormap(mode)
    with Reader(tif_url) as src:
        img = src.tile(tile_x, tile_y, tile_z, tilesize=256)
    return img.render(colormap=colormap)


