from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import WatershedBorder
from rest_framework import serializers

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
    Serializes a the Watershed Border model with the simplified geometry.
    """

    class Meta:
        model = WatershedBorder
        geo_field = 'simplified_geom'
        exclude = ('geom',)
        description = "Basic serializer for Watershed Border with limited fields and a details URL."