from django.contrib.gis import admin
from .models import WatershedBorder, Subcatchment, Channel

admin.site.register(WatershedBorder, admin.GISModelAdmin)
admin.site.register(Subcatchment, admin.GISModelAdmin)
admin.site.register(Channel, admin.GISModelAdmin)