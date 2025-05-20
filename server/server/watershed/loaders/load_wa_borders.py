from pathlib import Path
from django.contrib.gis.utils import LayerMapping
from ..models import WatershedBorder

# Mapping Washington fields to common schema
wa_mapping = {
    'area_m2': 'area_m2',
    'county': 'County',
    'city': 'WS_City',
    'pws_id': 'PwsId',
    'pws_name': 'SystemName',
    'webcloud_run_id': 'run_id',
    'sq_miles': 'SqMiles',
    'geom': 'geometry',
}

wa_data_location = Path(__file__).resolve().parent.parent / 'data' / 'borders' / 'WA_drinking_water_source_areas_less_than_130mi2_weppcloud.geojson'

def load_washington_borders(verbose=True):
    """Loads Washington watershed data."""
    lm = LayerMapping(WatershedBorder, wa_data_location, wa_mapping, transform=False)
    
    # Save records and get their IDs
    existing_ids = set(WatershedBorder.objects.values_list('id', flat=True))  # IDs before insert
    lm.save(strict=True, verbose=verbose)
    new_ids = set(WatershedBorder.objects.values_list('id', flat=True)) - existing_ids  # Newly inserted WA IDs

    # Update only the newly inserted records with state='WA'
    WatershedBorder.objects.filter(id__in=new_ids).update(state='WA')

    return WatershedBorder.objects.filter(state='WA').count()