from pathlib import Path
from django.contrib.gis.utils import LayerMapping
from server.watershed.models import WatershedBorder

# Mapping Oregon fields to common schema
or_mapping = {
    'area_m2': 'area_m2',
    'county': 'CNTY_NAME',
    'city': 'CITY',
    'state': 'TINWSYS_ST',
    'watershed_name': 'TINWSF_NAM',
    'watershed_id': 'TINWSF_IS',
    'pws_id': 'PWS_ID',
    'pws_name': 'PWS_Name',
    'webcloud_run_id': 'run_id',
    'huc12_nhd': 'HUC12_NHD',
    'huc12_wbd': 'HUC12_WBD',
    'sq_miles': 'SQMI',
    'geom': 'geometry',
}

or_data_location = Path(__file__).resolve().parent.parent / 'data' / 'borders' / 'OR_drinking_water_source_areas_less_than_130mi2_weppcloud.geojson'

def load_oregon_borders(verbose=True):
    """Loads Oregon watershed data."""
    lm = LayerMapping(WatershedBorder, or_data_location, or_mapping, transform=False)
    lm.save(strict=True, verbose=verbose)
    print(f'Ingested OR borders count: {WatershedBorder.objects.filter(state='OR').count()}')
