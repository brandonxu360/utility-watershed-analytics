import rasterio.errors

from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from rio_tiler.errors import TileOutsideBounds

from server.watershed.sbs_raster.color_map import ColorMode, get_colormap_metadata
from server.watershed.sbs_raster.schema_serializers import SbsColormapResponseSerializer
from server.watershed.sbs_raster.tile import get_tile_png
from server.watershed.loaders.config import resolve_run_base_url


class SbsColormapView(APIView):
    """
    Returns SBS colormap metadata for the requested color mode.

    The backend is the single source of truth for all SBS color definitions.
    Both tile rendering and frontend legend/toggle consume this data so they
    always agree.

    Query params:
        mode (str): "legacy" (default) or "shift" (Okabe-Ito colorblind-safe).
    """

    @extend_schema(
        operation_id='watershed_sbs_colormap_retrieve',
        summary='Get SBS colormap metadata',
        parameters=[
            OpenApiParameter(
                name='mode',
                description='Color mode: "legacy" or "shift" (Okabe-Ito)',
                required=False,
                type=str,
                enum=[m.value for m in ColorMode],
            ),
        ],
        responses={
            200: OpenApiResponse(response=SbsColormapResponseSerializer, description='SBS color map metadata for the selected mode'),
        },
    )
    def get(self, request):
        raw_mode = request.query_params.get('mode', ColorMode.LEGACY.value)
        try:
            mode = ColorMode(raw_mode)
        except ValueError:
            mode = ColorMode.LEGACY

        return Response({
            'mode': mode.value,
            'entries': get_colormap_metadata(mode),
        })


class SbsRasterTileView(APIView):
    """
    Returns a 256×256 PNG map tile for the SBS raster at Web Mercator tile
    coords (z, x, y).

    Intended for use as a slippy-map TileLayer URL template, e.g.:
        /api/watershed/{runid}/sbs/tiles/{z}/{x}/{y}.png?mode=shift

    URL params:
        runid: Watershed run identifier.
        z, x, y: Web Mercator tile coordinates.

    Query params:
        mode (str): "legacy" (default) or "shift" (Okabe-Ito colorblind-safe).
    """

    @extend_schema(
        operation_id='watershed_sbs_tiles_png_retrieve',
        summary='Get SBS raster tile PNG',
        parameters=[
            OpenApiParameter(
                name='mode',
                description='Color mode: "legacy" or "shift" (Okabe-Ito)',
                required=False,
                type=str,
                enum=[m.value for m in ColorMode],
            ),
        ],
        responses={
            (200, 'image/png'): OpenApiResponse(response=OpenApiTypes.BINARY, description='256x256 PNG tile'),
        },
    )
    def get(self, request, runid: str, z: int, x: int, y: int):
        raw_mode = request.query_params.get('mode', ColorMode.LEGACY.value)
        try:
            mode = ColorMode(raw_mode)
        except ValueError:
            mode = ColorMode.LEGACY

        run_base = resolve_run_base_url(runid)
        tif_url = f"{run_base}/download/disturbed/sbs_4class.tif"

        try:
            png_bytes = get_tile_png(tif_url, z, x, y, mode)
        except TileOutsideBounds:
            raise NotFound("Tile is outside the bounds of this raster.")
        except rasterio.errors.RasterioIOError:
            raise NotFound("SBS raster data not found or not available for this watershed.")

        return HttpResponse(png_bytes, content_type='image/png')
