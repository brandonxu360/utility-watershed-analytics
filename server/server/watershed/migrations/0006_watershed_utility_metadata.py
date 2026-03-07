"""
Add utility metadata fields to the Watershed model.

Fields added from the merged nasa-roses master GeoJSON
(WWS_Watersheds_HUC10_psbs_030426.geojson):

Per-utility fields (one row per PWS in the file):
  - owner_type    : OwnerType   – City/Town, Private, etc.
  - pop_group     : PopGroup    – customers-served range
  - treat_type    : TreatType   – treatment processes (may be multi-valued)
  - conn_group    : ConnGroup   – connection group range

HUC10-level aggregate fields (all utilities sharing the same HUC10 boundary):
  - huc10_pws_names      : semicolon-delimited utility names
  - huc10_owner_types    : semicolon-delimited owner types
  - huc10_pop_groups     : semicolon-delimited population groups
  - huc10_treat_types    : semicolon-delimited treatment types
  - huc10_utility_count  : number of distinct utilities in the HUC10

All fields are nullable so that victoria-ca batch and standalone watersheds
are unaffected.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('watershed', '0005_watershed_area_km2'),
    ]

    operations = [
        migrations.AddField(
            model_name='watershed',
            name='owner_type',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='pop_group',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='treat_type',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='conn_group',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='huc10_pws_names',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='huc10_owner_types',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='huc10_pop_groups',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='huc10_treat_types',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='watershed',
            name='huc10_utility_count',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
