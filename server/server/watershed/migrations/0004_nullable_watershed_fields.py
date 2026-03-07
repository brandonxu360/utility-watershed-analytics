"""
Make Watershed attribute fields nullable to support non-batch sources.

Standalone runs (e.g. Gate Creek / aversive-forestry) and other batch types
may not provide US-specific fields like PWS_ID, HUC10_ID, etc. Making these
fields nullable allows storing watersheds from diverse sources in the same
table.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('watershed', '0003_remove_subcatchment_ll_subcatchment_rock_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='watershed',
            name='pws_id',
            field=models.CharField(blank=True, max_length=9, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='srcname',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='pws_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='county_nam',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='huc10_id',
            field=models.CharField(blank=True, max_length=12, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='huc10_name',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='wws_code',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='srctype',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='shape_leng',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='shape_area',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='watershed',
            name='state',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
    ]
