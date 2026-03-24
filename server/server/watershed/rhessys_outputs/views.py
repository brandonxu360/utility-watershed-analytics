"""
API views for RHESSys output map data.

Three endpoints:
  GET /api/watershed/<runid>/rhessys/outputs
      → list of available scenarios and variables with legend metadata

  GET /api/watershed/<runid>/rhessys/outputs/<scenario>/<variable>/tiles/<z>/<x>/<y>.png
      → 256×256 PNG tile with appropriate colormap

  GET /api/watershed/<runid>/rhessys/outputs/geometry/<scale>
      → Proxy for hillslope/patch GeoJSON from WEPPcloud (avoids CORS)
"""

from __future__ import annotations

import json
import logging
import struct
import zlib

import rasterio.errors
import requests
from cachetools import TTLCache
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from rio_tiler.errors import TileOutsideBounds

from server.watershed.loaders.config import resolve_run_base_url
from .discovery import discover_output_maps, get_map_download_url
from .schema_serializers import RhessysOutputListResponseSerializer
from .registry import get_variable, is_change_scenario
from .tile import get_tile_png


def _build_transparent_png(width: int = 256, height: int = 256) -> bytes:
    """Build a minimal fully-transparent RGBA PNG with no external deps."""
    raw_row = b"\x00" + b"\x00\x00\x00\x00" * width  # filter-byte + RGBA
    raw = raw_row * height
    compressed = zlib.compress(raw)

    def _chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", ihdr)
        + _chunk(b"IDAT", compressed)
        + _chunk(b"IEND", b"")
    )


_TRANSPARENT_TILE_BYTES: bytes = _build_transparent_png()

logger = logging.getLogger("watershed.rhessys_outputs")


class RhessysOutputListView(APIView):
    """Discover available RHESSys output map products for a watershed."""

    @extend_schema(
        operation_id='watershed_rhessys_outputs_retrieve',
        summary='List RHESSys output map scenarios and variables',
        responses={
            200: OpenApiResponse(
                response=RhessysOutputListResponseSerializer,
                description='Available RHESSys output maps',
            ),
        },
    )
    def get(self, request, runid: str):
        catalog = discover_output_maps(runid)
        if catalog is None:
            return Response({"scenarios": [], "variables": [], "value_ranges": {}})

        return Response(catalog)


class RhessysOutputTileView(APIView):
    """Return a 256×256 PNG map tile for a RHESSys output GeoTIFF."""

    @extend_schema(
        operation_id='watershed_rhessys_outputs_tiles_png_retrieve',
        summary='Get RHESSys output map tile PNG',
        responses={
            (200, 'image/png'): OpenApiResponse(
                response=OpenApiTypes.BINARY,
                description='256x256 PNG tile',
            ),
        },
    )
    def get(
        self,
        request,
        runid: str,
        scenario: str,
        variable: str,
        z: int,
        x: int,
        y: int,
    ):
        var_meta = get_variable(variable)
        if not var_meta:
            raise NotFound(f"Unknown RHESSys output variable: {variable}")

        tif_url = get_map_download_url(runid, scenario, var_meta.filename)
        change = is_change_scenario(scenario)

        try:
            png_bytes = get_tile_png(tif_url, z, x, y, is_change=change)
        except TileOutsideBounds:
            return HttpResponse(
                _TRANSPARENT_TILE_BYTES, content_type="image/png"
            )
        except rasterio.errors.RasterioIOError:
            raise NotFound(
                "RHESSys output map not found or not available for this watershed."
            )

        return HttpResponse(png_bytes, content_type="image/png")


_GEOMETRY_FILES = {
    "hillslope": "rhessys/spatial_inputs_and_climates/masked_tol_1000cleaned_hillslop.geojson",
    "patch": "rhessys/spatial_inputs_and_climates/masked_daymet_patchID_1985.geojson",
}

_PATCH_2021_SCENARIOS = {"S2", "S4b"}

_PATCH_GEOMETRY_FILES = {
    "1985": "rhessys/spatial_inputs_and_climates/masked_daymet_patchID_1985.geojson",
    "2021": "rhessys/spatial_inputs_and_climates/masked_daymet_patchID_2021.geojson",
}

# In-memory cache: (runid, scale, scenario_key) → reprojected GeoJSON bytes
_geometry_cache: TTLCache[tuple[str, str, str | None], bytes] = TTLCache(maxsize=20, ttl=3600)


def _reproject_geojson(geojson: dict) -> dict:
    """Reproject a GeoJSON FeatureCollection to WGS84 (EPSG:4326).

    The upstream GeoJSON files are vectorised rasters in projected CRS
    (typically EPSG:26910 / UTM Zone 10N).  Leaflet requires WGS84.
    """
    from pyproj import Transformer

    crs_info = geojson.get("crs", {})
    crs_name = (
        crs_info.get("properties", {}).get("name", "")
        if isinstance(crs_info, dict)
        else ""
    )

    # Extract EPSG code from URN like "urn:ogc:def:crs:EPSG::26910"
    src_epsg = None
    if "EPSG" in crs_name:
        parts = crs_name.split(":")
        for i, part in enumerate(parts):
            if part == "EPSG" and i + 1 < len(parts):
                code = parts[-1]
                if code.isdigit():
                    src_epsg = int(code)
                    break

    if not src_epsg or src_epsg == 4326:
        # Already WGS84 or no CRS info — return as-is
        geojson.pop("crs", None)
        return geojson

    transformer = Transformer.from_crs(
        f"EPSG:{src_epsg}", "EPSG:4326", always_xy=True,
    )

    def transform_coords(coords):
        """Recursively transform coordinate arrays."""
        if isinstance(coords[0], (int, float)):
            x, y = transformer.transform(coords[0], coords[1])
            return [x, y] + coords[2:]
        return [transform_coords(c) for c in coords]

    for feature in geojson.get("features", []):
        geom = feature.get("geometry", {})
        if "coordinates" in geom:
            geom["coordinates"] = transform_coords(geom["coordinates"])

    geojson.pop("crs", None)
    return geojson


class RhessysOutputGeometryView(APIView):
    """Proxy hillslope/patch GeoJSON from WEPPcloud, reprojected to WGS84.

    The upstream GeoJSON files are in a projected CRS (EPSG:26910 UTM 10N)
    and the WEPPcloud download endpoint lacks CORS headers.  This view
    fetches the GeoJSON server-side, reprojects coordinates to WGS84 for
    Leaflet, and serves the result with proper headers.
    """

    @extend_schema(
        operation_id='watershed_rhessys_outputs_geometry_retrieve',
        summary='Get RHESSys hillslope/patch GeoJSON geometry (WGS84)',
        responses={
            (200, 'application/geo+json'): OpenApiResponse(
                description='GeoJSON FeatureCollection in WGS84',
            ),
        },
    )
    def get(self, request, runid: str, scale: str):
        scenario = request.query_params.get("scenario")

        if scale == "patch" and scenario in _PATCH_2021_SCENARIOS:
            geojson_path = _PATCH_GEOMETRY_FILES["2021"]
        else:
            geojson_path = _GEOMETRY_FILES.get(scale)

        if not geojson_path:
            raise NotFound(f"Unknown spatial scale: {scale}. Use 'hillslope' or 'patch'.")

        cache_key = (runid, scale, scenario if scale == "patch" else None)
        cached = _geometry_cache.get(cache_key)
        if cached is not None:
            return HttpResponse(cached, content_type="application/geo+json")

        base = resolve_run_base_url(runid)
        url = f"{base}/download/{geojson_path}"

        try:
            resp = requests.get(url, timeout=60)
        except requests.RequestException as exc:
            logger.warning("Failed to fetch geometry for runid=%s scale=%s: %s", runid, scale, exc)
            raise NotFound("Failed to fetch geometry from WEPPcloud.")

        if resp.status_code != 200:
            raise NotFound(
                f"Geometry not available for this watershed (upstream returned {resp.status_code})."
            )

        geojson = resp.json()
        reprojected = _reproject_geojson(geojson)
        body = json.dumps(reprojected).encode("utf-8")

        _geometry_cache[cache_key] = body

        return HttpResponse(body, content_type="application/geo+json")
