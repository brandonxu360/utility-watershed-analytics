from rest_framework import viewsets
from .models import WatershedBorder
from .serializers import WatershedBorderSerializer, WatershedBorderBasicSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(
    description="""
**Retrieve comprehensive watershed border data.**  

- Provides **full details** for each watershed border  
- Best used when selecting an **individual watershed**  

Due to the detailed nature of this API, it is **not recommended** for retrieving large datasets at once.
    """
)
class WatershedBorderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This ViewSet provides read-only access to WatershedBorder model instances.

    Note that the payload served by this view can be large and thus, requesting multiple WatershedBorder
    model instances is not advised.
    """
    queryset = WatershedBorder.objects.defer('simplified_geom')
    serializer_class = WatershedBorderSerializer

@extend_schema(
    description="""
**Retrieve simplified watershed border data.**  

- Provides **only essential** information for each watershed border  
- Best used when **retrieving multiple watershed borders** for visualization
    """
)
class WatershedBorderBasicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This ViewSet provides read-only access to simplified BasicWatershedBorder model instances.
    
    This endpoint is intended for scenarios where an overview of multiple watershed borders is required, 
    particularly for mapping purposes where detailed geometry isn't necessary.
    """
    queryset = WatershedBorder.objects.only("id", "simplified_geom", "pws_name", "city", "cnty_name", "acres")
    serializer_class = WatershedBorderBasicSerializer