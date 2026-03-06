"""
API views for RHESSys spatial input raster data.

Two endpoints:
  GET /api/watershed/<runid>/rhessys/spatial-inputs/
      → list of available GeoTIFFs with metadata (discovery + registry)

  GET /api/watershed/<runid>/rhessys/spatial-inputs/<filename>/tiles/<z>/<x>/<y>.png
      → 256×256 PNG tile with colormap applied
"""

from __future__ import annotations

import rasterio.errors
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema
from rio_tiler.errors import TileOutsideBounds

from .discovery import discover_spatial_inputs, get_download_url
from .registry import get_meta, get_render_range
from .tile import get_tile_png
from .colormap import (
    get_continuous_legend_stops,
    get_categorical_legend,
)


class RhessysSpatialListView(APIView):
    """Discover available RHESSys spatial input GeoTIFFs for a watershed.

    Probes the WEPPcloud file browser for the given runid and returns
    metadata for every .tif file found.  Returns an empty list (200) if
    the watershed has no RHESSys data.
    """

    @extend_schema(responses={200: None})
    def get(self, request, runid: str):
        files = discover_spatial_inputs(runid)
        if files is None:
            return Response({"files": []})

        for f in files:
            if f["type"] == "categorical" and f.get("unique_values"):
                f["legend"] = get_categorical_legend(f["unique_values"])
            elif f["type"] == "stream":
                f["legend"] = [{"value": 1, "hex": "#00FFFF"}]
            elif f["type"] == "continuous" and f.get("min") is not None:
                f["legend"] = get_continuous_legend_stops(
                    f["min"], f["max"], reversed=f.get("reversed", False),
                )
            else:
                f["legend"] = None

        return Response({"files": files})


class RhessysSpatialTileView(APIView):
    """Return a 256×256 PNG map tile for a RHESSys spatial input GeoTIFF.

    URL params:
        runid: Watershed run identifier.
        filename: GeoTIFF filename (e.g. ``wbt_slope.tif``).
        z, x, y: Web Mercator tile coordinates.
    """

    @extend_schema(responses={200: bytes})
    def get(self, request, runid: str, filename: str, z: int, x: int, y: int):
        tif_url = get_download_url(runid, filename)

        meta = get_meta(filename)
        if meta:
            lo, hi = get_render_range(meta)
            kwargs = dict(
                data_type=meta.data_type,
                min_val=lo,
                max_val=hi,
                unique_values=meta.unique_values,
                reversed_colormap=meta.reversed_colormap,
            )
        else:
            kwargs = dict(data_type="continuous", min_val=0.0, max_val=1.0)

        try:
            png_bytes = get_tile_png(tif_url, z, x, y, **kwargs)
        except TileOutsideBounds:
            raise NotFound("Tile is outside the bounds of this raster.")
        except rasterio.errors.RasterioIOError:
            raise NotFound(
                "RHESSys spatial input not found or not available for this watershed."
            )

        return HttpResponse(png_bytes, content_type="image/png")
