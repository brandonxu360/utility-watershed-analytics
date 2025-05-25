from rest_framework import viewsets, generics
from server.watershed.models import WatershedBorder, Subcatchment, Channel
from server.watershed.serializers import WatershedBorderSerializer, WatershedBorderSimplifiedSerializer, SubcatchmentSerializer, ChannelSerializer

class WatershedBorderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides read-only access to watersheds with their original geometries.

    Note that the payload served by this view can be large due to the geometry fields. It is advisable to
    use simplified geometry endpoint for retrieving multiple watersheds.
    """
    queryset = WatershedBorder.objects.defer('simplified_geom')
    serializer_class = WatershedBorderSerializer

class WatershedBorderSimplifiedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides read-only access to watersheds with simplified geometries.
    
    This endpoint is intended for scenarios where an overview of multiple watershed borders is required, 
    particularly for mapping purposes where detailed geometries aren't necessary.
    """
    queryset = WatershedBorder.objects.defer("geom")
    serializer_class = WatershedBorderSimplifiedSerializer

class WatershedSubcatchmentListView(generics.ListAPIView):
    """
    Provides read-only access to collections of subcatchment instances belonging to the watershed specified through URL parameter.
    """
    serializer_class = SubcatchmentSerializer

    # Override this method so only subcatchments belonging to the relevant watershed are returned
    def get_queryset(self):
        watershed_id = self.kwargs['watershed_id']
        return Subcatchment.objects.filter(watershed_id=watershed_id)
    
class WatershedChannelListView(generics.ListAPIView):
    """
    Provides read-only access to collections of channel instances belonging to the watershed specified through URL parameter.
    """
    serializer_class = ChannelSerializer

    # Override this method so only channels belonging to the relevant watershed are returned
    def get_queryset(self):
        webcloud_run_id = self.kwargs['webcloud_run_id']
        return Channel.objects.filter(watershed_id=webcloud_run_id)