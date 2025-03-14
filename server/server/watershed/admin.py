from django.contrib.gis import admin
from .models import WatershedBorder

admin.site.register(WatershedBorder, admin.GISModelAdmin)