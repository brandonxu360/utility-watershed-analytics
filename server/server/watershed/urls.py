from rest_framework import routers
from django.urls import path, include
from .views import WatershedBorderViewSet, WatershedBorderSimplifiedViewSet

# Use router to automatically manage API endpoints based on registered viewsets
router = routers.DefaultRouter()
router.register('borders', WatershedBorderViewSet, basename='watershedborder')
router.register('borders-simplified', WatershedBorderSimplifiedViewSet, basename='watershedborder-simplified')

# Make router routes accessible to project URL configuration
urlpatterns = [
    path('', include(router.urls)),
]