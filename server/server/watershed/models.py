from django.db import models
from django.contrib.gis.db import models

# This is an auto-generated Django model module created by ogrinspect.
# /app/server $ django-admin ogrinspect server/watershed/data/OR/OR_drinking_water_source_areas.shp WatershedBorder --srid=4326 --mapping --multi
class WatershedBorder(models.Model):
    id = models.AutoField(primary_key=True)
    area_m2 = models.FloatField()
    pws_id = models.CharField(max_length=10)
    pws_name = models.CharField(max_length=254)
    watershed_name = models.CharField(max_length=254, null=True)
    watershed_id = models.CharField(max_length=50, null=True, unique=True)
    city = models.CharField(max_length=30, null=True)
    county = models.CharField(max_length=35)
    state = models.CharField(max_length=2, null=True)
    huc12_nhd = models.CharField(max_length=254, null=True)
    huc12_wbd = models.CharField(max_length=254, null=True)
    sq_miles = models.FloatField()
    webcloud_run_id = models.CharField(max_length=255)
    geom = models.MultiPolygonField(srid=4326)
    simplified_geom = models.MultiPolygonField(srid=4326, null=True, blank=True)
