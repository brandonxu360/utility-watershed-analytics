from django.contrib.gis.db import models

# Represents an individual watershed - the watershed properties and its geometry.
# This is an auto-generated Django model module created by ogrinspect. 
class Watershed(models.Model):
    pws_id = models.CharField(max_length=9)
    srcname = models.CharField(max_length=255)
    pws_name = models.CharField(max_length=255)
    county_nam = models.CharField(max_length=64)
    state = models.CharField(max_length=6, null=True)
    huc10_id = models.CharField(max_length=12)
    huc10_name = models.CharField(max_length=128)
    wws_code = models.CharField(max_length=32)
    srctype = models.CharField(max_length=32)
    shape_leng = models.FloatField()
    shape_area = models.FloatField()
    runid = models.CharField(primary_key=True, max_length=255)
    geom = models.MultiPolygonField(srid=4326)
    simplified_geom = models.MultiPolygonField(srid=4326, null=True, blank=True)

# This is based on an auto-generated Django model module created by ogrinspect.
class Subcatchment(models.Model):
    watershed = models.ForeignKey(to=Watershed, on_delete=models.CASCADE)
    topazid = models.IntegerField()
    weppid = models.IntegerField()
    geom = models.MultiPolygonField(srid=4326)

# This is based on an auto-generated Django model module created by ogrinspect.
class Channel(models.Model):
    watershed = models.ForeignKey(to=Watershed, on_delete=models.CASCADE)
    topazid = models.IntegerField()
    weppid = models.IntegerField()
    order = models.IntegerField()
    geom = models.MultiPolygonField(srid=4326)