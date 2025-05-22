from rest_framework import viewsets
from server.watershed.models import WatershedBorder, Subcatchment, Channel
from server.watershed.serializers import WatershedBorderSerializer, WatershedBorderSimplifiedSerializer, SubcatchmentSerializer, ChannelSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(
    description="""
**Retrieve watershed border data.**  

- Provides watershed border details with the original geometry
- Best used when selecting an **individual watershed**  

Note that the payload served by this view can be large due to the geometry fields. It is advised to
use the WatershedBorderSimplifiedViewSet for retrieving multiple WatershedBorder model instances.
    """
)
class WatershedBorderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This ViewSet provides read-only access to WatershedBorder model instances with the original geometries.

    Note that the payload served by this view can be large due to the geometry fields. It is advised to
    use the WatershedBorderSimplifiedViewSet for retrieving multiple WatershedBorder model instances.
    """
    queryset = WatershedBorder.objects.defer('simplified_geom')
    serializer_class = WatershedBorderSerializer

@extend_schema(
    description="""
**Retrieve watershed border data with the simplified geometry.**  

- Provides watershed border details with a simplified geometry
- Best used when **retrieving multiple watershed borders** for visualization
    """
)
class WatershedBorderSimplifiedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This ViewSet provides read-only access to BasicWatershedBorder model instances with simplified geometries.
    
    This endpoint is intended for scenarios where an overview of multiple watershed borders is required, 
    particularly for mapping purposes where detailed geometry isn't necessary.
    """
    queryset = WatershedBorder.objects.defer("geom")
    serializer_class = WatershedBorderSimplifiedSerializer

class SubcatchmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides read-only access to Subcatchment model instances.
    """
    queryset = Subcatchment.objects.all()
    serializer_class = SubcatchmentSerializer

class ChannelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides read-only access to Channel model instances.
    """
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer