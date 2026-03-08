from django.views import View
from rest_framework import viewsets
from server.watershed.models import Watershed, Subcatchment, Channel
from server.watershed.geojson import geojson_response
from drf_spectacular.utils import extend_schema, OpenApiParameter

class WatershedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides read-only access to watersheds.
    """
    _properties = (
        'pws_name',
        'county_nam',
        'shape_area',
        'srcname',
        'srctype',
        'owner_type',
        'pop_group',
        'treat_type',
        'huc10_utility_count',
        'huc10_pws_names',
    )

    # No logic changes, only decorating for documentation
    @extend_schema(
        parameters=[
            OpenApiParameter(name='simplified_geom', description='Use simplified geometry', required=False, type=bool),
        ]
    )
    def list(self, request, *args, **kwargs):
        """Gets all the available watersheds with the original or simplified geometries (depending on simplified_geom query parameter)"""
        simplified = request.query_params.get('simplified_geom', '').lower() == 'true'
        geo_field = 'simplified_geom' if simplified else 'geom'
        return geojson_response(
            Watershed.objects.all(),
            geo_field=geo_field,
            id_field='runid',
            properties=self._properties,
        )
    
    # No logic changes, only decorating for documentation
    @extend_schema(
        parameters=[
            OpenApiParameter(name='simplified_geom', description='Use simplified geometry', required=False, type=bool),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        """Gets the specified watershed with the original or simplified geometries (depending on simplified_geom query parameter)"""
        simplified = request.query_params.get('simplified_geom', '').lower() == 'true'
        geo_field = 'simplified_geom' if simplified else 'geom'
        return geojson_response(
            Watershed.objects.filter(pk=kwargs['pk']),
            geo_field=geo_field,
            id_field='runid',
            properties=self._properties,
        )

class WatershedSubcatchmentListView(View):
    """
    Provides read-only access to collections of subcatchment instances belonging to the watershed specified through URL parameter.
    """
    def get(self, request, runid):
        qs = Subcatchment.objects.filter(watershed_id=runid)
        return geojson_response(
            qs,
            geo_field='geom',
            properties=(
                'topazid',
                'weppid',
                'slope_scalar',
                'length',
                'width',
                'aspect',
                'hillslope_area',
                'simple_texture',
            ),
        )
    
class WatershedChannelListView(View):
    """
    Provides read-only access to collections of channel instances belonging to the watershed specified through URL parameter.
    """
    def get(self, request, runid):
        qs = Channel.objects.filter(watershed_id=runid)
        return geojson_response(
            qs,
            geo_field='geom',
            properties=(
                'topazid',
                'weppid',
                'order',
            ),
        )