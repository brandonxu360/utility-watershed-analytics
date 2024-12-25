from rest_framework import viewsets
from .models import WatershedBorder
from .serializers import WatershedBorderSerializer

class WatershedBorderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This ViewSet provides read-only access to WatershedBorder model instances,
    allowing only GET requests to list all watershed borders or retrieve specific ones.
    Attributes:
        queryset: QuerySet of all WatershedBorder objects
        serializer_class: Serializer class to convert WatershedBorder objects to/from JSON
    """
    queryset = WatershedBorder.objects.all()
    serializer_class = WatershedBorderSerializer