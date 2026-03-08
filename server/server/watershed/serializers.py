from rest_framework_gis.serializers import GeoFeatureModelSerializer
from server.watershed.models import Watershed, Subcatchment, Channel


# 6 decimals is sub-meter precision in WGS84 and significantly trims payload size.
GEOJSON_COORD_PRECISION = 6

class WatershedSerializer(GeoFeatureModelSerializer):
    """
    Serializes the Watershed model with the original (unsimplified) geometry.
    """
    class Meta:
        model = Watershed
        geo_field = 'geom'
        extra_kwargs = {
            'geom': {'precision': GEOJSON_COORD_PRECISION},
        }
        fields = (
            'runid',
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

class WatershedSimplifiedSerializer(GeoFeatureModelSerializer):
    """
    Serializes the Watershed model with the simplified geometry.
    """

    class Meta:
        model = Watershed
        geo_field = 'simplified_geom'
        extra_kwargs = {
            'simplified_geom': {'precision': GEOJSON_COORD_PRECISION},
        }
        fields = (
            'runid',
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
        description = "Basic serializer for Watershed Border with limited fields and a details URL."

class SubcatchmentSerializer(GeoFeatureModelSerializer):
    """
    Serializes the Subcatchment model to GeoJSON.
    """

    class Meta:
        model = Subcatchment
        geo_field = 'geom'
        extra_kwargs = {
            'geom': {'precision': GEOJSON_COORD_PRECISION},
        }
        fields = (
            'topazid',
            'weppid',
            'slope_scalar',
            'length',
            'width',
            'aspect',
            'hillslope_area',
            'simple_texture',
        )
    
class ChannelSerializer(GeoFeatureModelSerializer):
    """
    Serializes the Channel model to GeoJSON.
    """

    class Meta:
        model = Channel
        geo_field = 'geom'
        extra_kwargs = {
            'geom': {'precision': GEOJSON_COORD_PRECISION},
        }
        fields = (
            'topazid',
            'weppid',
            'order',
        )