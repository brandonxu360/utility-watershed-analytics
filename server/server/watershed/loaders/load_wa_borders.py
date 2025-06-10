from pathlib import Path
from django.contrib.gis.utils import LayerMapping
from server.watershed.models import Watershed

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
    lm = LayerMapping(Watershed, wa_data_location, wa_mapping, transform=False)
    
    # Save records and get their IDs
    existing_ids = set(Watershed.objects.values_list('webcloud_run_id', flat=True))  # IDs before insert
    lm.save(strict=True, verbose=verbose)
    new_ids = set(Watershed.objects.values_list('webcloud_run_id', flat=True)) - existing_ids  # Newly inserted WA IDs

    # Update only the newly inserted records with state='WA'
    wa_borders = Watershed.objects.filter(webcloud_run_id__in=new_ids)
    wa_borders.update(state='WA')

    print(f'Ingested WA borders count: {wa_borders.count()}')