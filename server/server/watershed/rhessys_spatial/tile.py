"""
Generate PNG map tiles from RHESSys spatial input GeoTIFFs using rio-tiler.

Supports three rendering modes based on the file's data type:
  - continuous: rescale to 0-255, apply 256-entry rainbow colormap
  - categorical: map raw pixel values to qualitative palette
  - stream: render value 1 as cyan, all else transparent
"""

from __future__ import annotations

from rio_tiler.io import Reader

from .colormap import (
    build_continuous_colormap,
    build_categorical_colormap,
    STREAM_COLORMAP,
)


def get_tile_png(
    tif_url: str,
    tile_z: int,
    tile_x: int,
    tile_y: int,
    *,
    data_type: str = "continuous",
    min_val: float = 0.0,
    max_val: float = 1.0,
    unique_values: list[int] | None = None,
    reversed_colormap: bool = False,
) -> bytes:
    """Return 256x256 PNG bytes for a Web Mercator tile.

    For continuous data, rio-tiler's ``rescale()`` maps the value range
    [min_val, max_val] → [0, 255].  The alpha mask from the source
    raster handles nodata transparency automatically during ``render()``.
    """
    with Reader(tif_url) as src:
        img = src.tile(tile_x, tile_y, tile_z, tilesize=256)

    if data_type == "stream":
        return img.render(colormap=STREAM_COLORMAP)

    if data_type == "categorical" and unique_values:
        cm = build_categorical_colormap(unique_values)
        return img.render(colormap=cm)

    # Continuous: rescale raw values to 0-255, let mask handle nodata
    rescaled = img.rescale(
        in_range=((min_val, max_val),),
        out_range=((0, 255),),
    )
    cm = build_continuous_colormap(reversed=reversed_colormap)
    return rescaled.render(colormap=cm)
