from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rio_tiler.errors import TileOutsideBounds

from server.watershed.models import Watershed
from server.watershed.sbs_raster.color_map import ColorMode, get_colormap_metadata
from server.watershed.sbs_raster.tile import get_tile_png
from server.watershed.loaders.config import get_config


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
        parameters=[
            OpenApiParameter(
                name='mode',
                description='Color mode: "legacy" or "shift" (Okabe-Ito)',
                required=False,
                type=str,
                enum=[m.value for m in ColorMode],
            ),
        ],
        responses={200: None},
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
        /api/watersheds/{runid}/sbs/tiles/{z}/{x}/{y}.png?mode=shift

    URL params:
        runid: Watershed run identifier.
        z, x, y: Web Mercator tile coordinates.

    Query params:
        mode (str): "legacy" (default) or "shift" (Okabe-Ito colorblind-safe).
    """

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='mode',
                description='Color mode: "legacy" or "shift" (Okabe-Ito)',
                required=False,
                type=str,
                enum=[m.value for m in ColorMode],
            ),
        ],
        responses={200: bytes},
    )
    def get(self, request, runid: str, z: int, x: int, y: int):
        # Verify the watershed exists before attempting an expensive tile fetch.
        if not Watershed.objects.filter(runid=runid).exists():
            raise NotFound(f"Watershed '{runid}' not found.")

        raw_mode = request.query_params.get('mode', ColorMode.LEGACY.value)
        try:
            mode = ColorMode(raw_mode)
        except ValueError:
            mode = ColorMode.LEGACY

        config = get_config()
        base = config.api.weppcloud_base_url.rstrip('/')
        tif_url = f"{base}/runs/{runid}/disturbed_wbt/download/sbs/sbs_map.tif"

        try:
            png_bytes = get_tile_png(tif_url, z, x, y, mode)
        except TileOutsideBounds:
            raise NotFound("Tile is outside the bounds of this raster.")

        return HttpResponse(png_bytes, content_type='image/png')
