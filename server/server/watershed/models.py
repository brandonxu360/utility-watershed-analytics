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
    
    # Hillslope data fields
    slope_scalar = models.FloatField(null=True, blank=True)
    length = models.FloatField(null=True, blank=True)
    width = models.FloatField(null=True, blank=True)
    direction = models.FloatField(null=True, blank=True)
    aspect = models.FloatField(null=True, blank=True)
    hillslope_area = models.IntegerField(null=True, blank=True)
    elevation = models.FloatField(null=True, blank=True)
    centroid_px = models.IntegerField(null=True, blank=True)
    centroid_py = models.IntegerField(null=True, blank=True)
    centroid_lon = models.FloatField(null=True, blank=True)
    centroid_lat = models.FloatField(null=True, blank=True)
    
    # Soil data fields
    mukey = models.CharField(max_length=255, null=True, blank=True)
    soil_fname = models.CharField(max_length=255, null=True, blank=True)
    soils_dir = models.CharField(max_length=255, null=True, blank=True)
    soil_build_date = models.CharField(max_length=255, null=True, blank=True)
    soil_desc = models.TextField(null=True, blank=True)
    soil_color = models.CharField(max_length=50, null=True, blank=True)
    soil_area = models.FloatField(null=True, blank=True)
    soil_pct_coverage = models.FloatField(null=True, blank=True)
    clay = models.FloatField(null=True, blank=True)
    sand = models.FloatField(null=True, blank=True)
    avke = models.FloatField(null=True, blank=True)
    ll = models.FloatField(null=True, blank=True)
    bd = models.FloatField(null=True, blank=True)
    simple_texture = models.CharField(max_length=100, null=True, blank=True)
    
    # Land use data fields
    landuse_key = models.IntegerField(null=True, blank=True)
    landuse_map = models.CharField(max_length=100, null=True, blank=True)
    man_fn = models.CharField(max_length=255, null=True, blank=True)
    man_dir = models.CharField(max_length=255, null=True, blank=True)
    landuse_desc = models.TextField(null=True, blank=True)
    landuse_color = models.CharField(max_length=50, null=True, blank=True)
    landuse_area = models.FloatField(null=True, blank=True)
    landuse_pct_coverage = models.FloatField(null=True, blank=True)
    cancov = models.FloatField(null=True, blank=True)
    inrcov = models.FloatField(null=True, blank=True)
    rilcov = models.FloatField(null=True, blank=True)
    cancov_override = models.FloatField(null=True, blank=True)
    inrcov_override = models.FloatField(null=True, blank=True)
    rilcov_override = models.FloatField(null=True, blank=True)
    disturbed_class = models.CharField(max_length=100, null=True, blank=True)

# This is based on an auto-generated Django model module created by ogrinspect.
class Channel(models.Model):
    watershed = models.ForeignKey(to=Watershed, on_delete=models.CASCADE)
    topazid = models.IntegerField()
    weppid = models.IntegerField()
    order = models.IntegerField()
    geom = models.MultiPolygonField(srid=4326)