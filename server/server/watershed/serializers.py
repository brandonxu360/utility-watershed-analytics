from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import WatershedBorder
from rest_framework import serializers

class WatershedBorderSerializer(GeoFeatureModelSerializer):
    """
    Full serializer with all watershed border fields.
    Uses specialized GeoFeatureModelSerializer to serialize model data
    into GeoJSON.
    Attributes:
        model (WatershedBorder): The model class being serialized
        geo_field (str): Name of the geometry field ('geom')
        fields (str): Specifies all model fields should be included ('__all__')
    """
    class Meta:
        model = WatershedBorder
        geo_field = 'geom'
        fields = '__all__'

class WatershedBorderBasicSerializer(GeoFeatureModelSerializer):
    """
    Basic serializer with only essential fields and a hyperlink to full details
    """
    details_url = serializers.HyperlinkedIdentityField(
        view_name='watershedborder-detail',
        read_only=True
    )

    class Meta:
        model = WatershedBorder
        geo_field = 'geom'
        fields = ('id', 'geom', 'pws_name', 'city', 'cnty_name', 'acres', 'details_url')