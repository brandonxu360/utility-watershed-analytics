from django.contrib.gis import admin
from .models import Watershed, Subcatchment, Channel

admin.site.register(Watershed, admin.GISModelAdmin)
admin.site.register(Subcatchment, admin.GISModelAdmin)
admin.site.register(Channel, admin.GISModelAdmin)