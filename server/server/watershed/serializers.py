from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import WatershedBorder

class WatershedBorderSerializer(GeoFeatureModelSerializer):
    """
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