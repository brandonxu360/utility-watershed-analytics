from rest_framework import routers
from django.urls import path, include
from server.watershed.views import WatershedViewSet, WatershedSubcatchmentListView, WatershedChannelListView
from server.watershed.sbs_raster.views import SbsColormapView, SbsRasterTileView
from server.watershed.rhessys_spatial.views import RhessysSpatialListView, RhessysSpatialTileView

# Use router to automatically manage API endpoints based on registered viewsets
router = routers.DefaultRouter()
router.register('', WatershedViewSet, basename='watershed')

# Make router routes accessible to project URL configuration
urlpatterns = [
    path('', include(router.urls)),
    path('<str:runid>/subcatchments', WatershedSubcatchmentListView.as_view(), name='watershed-subcatchments'),
    path('<str:runid>/channels', WatershedChannelListView.as_view(), name='watershed-channels'),
    path('sbs/colormap', SbsColormapView.as_view(), name='sbs-colormap'),
    path('<str:runid>/sbs/tiles/<int:z>/<int:x>/<int:y>.png', SbsRasterTileView.as_view(), name='sbs-tile'),
    path('<str:runid>/rhessys/spatial-inputs', RhessysSpatialListView.as_view(), name='rhessys-spatial-list'),
    path(
        '<str:runid>/rhessys/spatial-inputs/<str:filename>/tiles/<int:z>/<int:x>/<int:y>.png',
        RhessysSpatialTileView.as_view(),
        name='rhessys-spatial-tile',
    ),
]