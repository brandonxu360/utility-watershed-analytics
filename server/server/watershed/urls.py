from rest_framework import routers
from django.urls import path, include
from server.watershed.views import WatershedViewSet, WatershedSubcatchmentListView, WatershedChannelListView

# Use router to automatically manage API endpoints based on registered viewsets
router = routers.DefaultRouter()
router.register('', WatershedViewSet, basename='watershed')

# Make router routes accessible to project URL configuration
urlpatterns = [
    path('', include(router.urls)),
    path('<str:runid>/subcatchments', WatershedSubcatchmentListView.as_view(), name='watershed-subcatchments'),
    path('<str:runid>/channels', WatershedChannelListView.as_view(), name='watershed-channels')
]