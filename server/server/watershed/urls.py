from rest_framework import routers
from django.urls import path, include
from server.watershed.views import WatershedBorderViewSet, WatershedBorderSimplifiedViewSet, SubcatchmentViewSet, ChannelViewSet

# Use router to automatically manage API endpoints based on registered viewsets
router = routers.DefaultRouter()
router.register('borders', WatershedBorderViewSet, basename='watershedborder')
router.register('borders-simplified', WatershedBorderSimplifiedViewSet, basename='watershedborder-simplified')
router.register('subcatchments', SubcatchmentViewSet)
router.register('channels', ChannelViewSet)


# Make router routes accessible to project URL configuration
urlpatterns = [
    path('', include(router.urls)),
]