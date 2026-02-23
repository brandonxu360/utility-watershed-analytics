"""
Generate PNG map tiles from SBS GeoTIFF using rio-tiler.
"""

from rio_tiler.io import Reader
from .color_map import ColorMode, get_render_colormap


def get_tile_png(
    tif_url: str,
    tile_z: int,
    tile_x: int,
    tile_y: int,
    mode: ColorMode = ColorMode.LEGACY,
) -> bytes:
    """
    Return PNG bytes for the given Web Mercator tile (z, x, y).

    Uses get_render_colormap() (0-based pixel keys) so the colormap indices
    match the raw pixel values stored in the SBS GeoTIFF (0–3).  The legend
    API continues to use the canonical 130-133 class codes.
    """
    colormap = get_render_colormap(mode)
    with Reader(tif_url) as src:
        img = src.tile(tile_x, tile_y, tile_z, tilesize=256)
    return img.render(colormap=colormap)


