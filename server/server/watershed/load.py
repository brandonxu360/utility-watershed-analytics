from pathlib import Path
from django.contrib.gis.utils import LayerMapping
from .models import WatershedBorder
from django.db import connection

# Auto-generated `LayerMapping` dictionary for WatershedBorder model
# /app/server $ django-admin ogrinspect server/watershed/data/OR/OR_drinking_water_source_areas.shp WatershedBorder --srid=4326 --mapping --multi
watershedborder_mapping = {
    'objectid': 'OBJECTID',
    'perimeter': 'Perimeter',
    'area': 'Area',
    'acres': 'ACRES',
    'delinsqmi': 'DELINSQMI',
    'tinwsys_is': 'TINWSYS_IS',
    'pws_id': 'PWS_ID',
    'pws_name': 'PWS_Name',
    'pws_label': 'PWS_label',
    'tinwsys_d_field': 'TINWSYS_D_',
    'tinwsf_is': 'TINWSF_IS',
    'tinwsf_nam': 'TINWSF_NAM',
    'tinwsf_wat': 'TINWSF_WAT',
    'src_label': 'Src_label',
    'dws_id': 'DWS_ID',
    'oregon_dwp': 'OREGON_DWP',
    'city': 'CITY',
    'cnty_name': 'CNTY_NAME',
    'epa_method': 'EPA_METHOD',
    'or_method': 'OR_METHOD',
    'comments': 'Comments',
    'fips_cnty': 'FIPS_CNTY',
    'or_cnty_nu': 'OR_CNTY_NU',
    'tinwsys_st': 'TINWSYS_ST',
    'utm_zone': 'UTM_ZONE',
    'sdwis_link': 'SDWIS_link',
    'upstrm_cd': 'UpStrm_Cd',
    'upstrmpwss': 'UpStrmPWSs',
    'dwnstrm_cd': 'DwnStrm_Cd',
    'assessment': 'Assessment',
    'subbasin': 'SUBBASIN',
    'subbasin_n': 'SUBBASIN_N',
    'huc12_nhd': 'HUC12_NHD',
    'huc12_wbd': 'HUC12_WBD',
    'wrd_basin': 'WRD_basin',
    'date_del': 'DATE_DEL',
    'initials_d': 'INITIALS_D',
    'date_dig': 'DATE_DIG',
    'initials_1': 'INITIALS_1',
    'date_proc': 'DATE_PROC',
    'initials_p': 'INITIALS_P',
    'method': 'METHOD',
    'comment': 'Comment',
    'huc4_edit': 'HUC4_edit',
    'separate': 'Separate',
    'sqmi': 'SQMI',
    'geom': 'MULTIPOLYGON',
}

# Get the file location of the watershed shape file (relative to watershed application)
watershed_shp_location = Path(__file__).resolve().parent / 'data' / 'OR' / 'OR_drinking_water_source_areas.shp'

# Save the models to the database using the mapping
def run(verbose=True):
    lm = LayerMapping(WatershedBorder, watershed_shp_location, watershedborder_mapping, transform=False)
    lm.save(strict=True, verbose=verbose)

    # Update the simplified_geom field using PostGIS simplify (potentially more efficient than using geos simplify in the application)
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE watershed_watershedborder
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.01)
            WHERE geom IS NOT NULL;
        """)