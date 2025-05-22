from rest_framework_gis.serializers import GeoFeatureModelSerializer
from server.watershed.models import WatershedBorder, Subcatchment, Channel

class WatershedBorderSerializer(GeoFeatureModelSerializer):
    """
    Serializes the WatershedBorder model with the original (unsimplified) geometry.
    """
    class Meta:
        model = WatershedBorder
        geo_field = 'geom'
        exclude = ('simplified_geom',)

class WatershedBorderSimplifiedSerializer(GeoFeatureModelSerializer):
    """
    Serializes the WatershedBorder model with the simplified geometry.
    """

    class Meta:
        model = WatershedBorder
        geo_field = 'simplified_geom'
        exclude = ('geom',)
        description = "Basic serializer for Watershed Border with limited fields and a details URL."

class SubcatchmentSerializer(GeoFeatureModelSerializer):
    """
    Serializes the Subcatchment model to GeoJSON.
    """

    class Meta:
        model = Subcatchment
        geo_field = 'geom'
        fields = '__all__'
    
class ChannelSerializer(GeoFeatureModelSerializer):
    """
    Serializes the Channel model to GeoJSON.
    """

    class Meta:
        model = Channel
        geo_field = 'geom'
        fields = '__all__'