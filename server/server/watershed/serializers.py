from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import WatershedBorder
from rest_framework import serializers

class WatershedBorderSerializer(GeoFeatureModelSerializer):
    """
    Serializes the WatershedBorder model with all of its fields.
    """
    class Meta:
        model = WatershedBorder
        geo_field = 'geom'
        fields = '__all__'

class WatershedBorderBasicSerializer(GeoFeatureModelSerializer):
    """
    Serializes a simplified version of the WatershedBorder model,
    including essential fields and a hyperlink to full details.
    """
    details_url = serializers.HyperlinkedIdentityField(
        view_name='watershedborder-detail',
        read_only=True
    )

    class Meta:
        model = WatershedBorder
        geo_field = 'geom'
        fields = ('id', 'geom', 'pws_name', 'city', 'cnty_name', 'acres', 'details_url')
        description = "Basic serializer for Watershed Border with limited fields and a details URL."