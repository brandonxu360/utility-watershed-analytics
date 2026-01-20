from rest_framework import viewsets, generics
from server.watershed.models import Watershed, Subcatchment, Channel
from server.watershed.serializers import WatershedSerializer, WatershedSimplifiedSerializer, SubcatchmentSerializer, ChannelSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter

class WatershedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides read-only access to watersheds.
    """
    queryset = Watershed.objects.defer('geom', 'simplified_geom')

    # No logic changes, only decorating for documentation
    @extend_schema(
        parameters=[
            OpenApiParameter(name='simplified_geom', description='Use simplified geometry', required=False, type=bool),
        ]
    )
    def list(self, request, *args, **kwargs):
        """Gets all the available watersheds with the original or simplified geometries (depending on simplified_geom query parameter)"""
        return super().list(request, *args, **kwargs)
    
    # No logic changes, only decorating for documentation
    @extend_schema(
        parameters=[
            OpenApiParameter(name='simplified_geom', description='Use simplified geometry', required=False, type=bool),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        """Gets the specified watershed with the original or simplified geometries (depending on simplified_geom query parameter)"""
        return super().retrieve(request, *args, **kwargs)
    
    # Dynamically choose the serializer depending on if simplified geometry was requested
    def get_serializer_class(self):
        simplified = self.request.query_params.get('simplified_geom', '').lower() == 'true'
        return WatershedSimplifiedSerializer if simplified else WatershedSerializer

class WatershedSubcatchmentListView(generics.ListAPIView):
    """
    Provides read-only access to collections of subcatchment instances belonging to the watershed specified through URL parameter.
    """
    serializer_class = SubcatchmentSerializer

    # Override this method so only subcatchments belonging to the relevant watershed are returned
    def get_queryset(self):
        runid = self.kwargs['runid']
        # Subcatchment model references Watershed via the 'watershed' FK.
        # Watershed has the 'runid' primary key, so filter through the relation.
        return Subcatchment.objects.filter(watershed__runid=runid)
    
class WatershedChannelListView(generics.ListAPIView):
    """
    Provides read-only access to collections of channel instances belonging to the watershed specified through URL parameter.
    """
    serializer_class = ChannelSerializer

    # Override this method so only channels belonging to the relevant watershed are returned
    def get_queryset(self):
        runid = self.kwargs['runid']
        # Channel model references Watershed via the 'watershed' FK.
        # Watershed has the 'runid' primary key, so filter through the relation.
        return Channel.objects.filter(watershed__runid=runid)