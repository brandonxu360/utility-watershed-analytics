from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from server.watershed.sbs_raster.color_map import ColorMode, get_colormap_metadata

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