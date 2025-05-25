from rest_framework import routers
from django.urls import path, include
from server.watershed.views import WatershedBorderViewSet, WatershedBorderSimplifiedViewSet, WatershedSubcatchmentListView, WatershedChannelListView

# Use router to automatically manage API endpoints based on registered viewsets
router = routers.DefaultRouter()
router.register('borders', WatershedBorderViewSet, basename='watershedborder')
router.register('borders-simplified', WatershedBorderSimplifiedViewSet, basename='watershedborder-simplified')

# Make router routes accessible to project URL configuration
urlpatterns = [
    path('', include(router.urls)),
    path('<slug:webcloud_run_id>/subcatchments', WatershedSubcatchmentListView.as_view()),
    path('<slug:webcloud_run_id>/channels', WatershedSubcatchmentListView.as_view())
]