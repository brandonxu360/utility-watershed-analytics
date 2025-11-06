# This loader script takes advantage of the fact that all the data files are remote 
# geojson files that can be read directly into a DataSource. This circumvents the need to
# download data files in order to load the data into the database.

import sys
import yaml
import time
from pathlib import Path
from django.contrib.gis.db.models import Model
from urllib.parse import urlparse, unquote
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.layer import Layer
from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.geos import Polygon, MultiPolygon
from server.watershed.models import Watershed, Subcatchment, Channel

# This is an auto-generated layer mapping created by ogrinspect. 
watershed_mapping = {
    'pws_id': 'PWS_ID', 
    'srcname': 'SrcName', 
    'pws_name': 'PWS_Name', 
    'county_nam': 'County_Nam', 
    'state': 'State', 
    'huc10_id': 'HUC10_ID', 
    'huc10_name': 'HUC10_Name', 
    'wws_code': 'WWS_Code', 
    'srctype': 'SrcType', 
    'shape_leng': 'Shape_Leng', 
    'shape_area': 'Shape_Area', 
    'runid': 'runid', 
    'geom': 'UNKNOWN'
}

# This is an auto-generated layer mapping created by ogrinspect. 
subcatchment_mapping = {
    'topazid': 'TopazID', 
    'weppid': 'WeppID', 
    #'geom': 'POLYGON'
}

# This is an auto-generated layer mapping created by ogrinspect. 
channel_mapping = {
    'topazid': 'TopazID', 
    'weppid': 'WeppID', 
    'order': 'Order', 
    #'geom': 'POLYGON'
}

RETRY_ATTEMPTS = 6
BASE_DELAY_S = 0.2

def _sleep_backoff(i):
    time.sleep(BASE_DELAY_S * (2 ** i))  # 1,2,4,8,16,32s

def _open_datasource_with_retry(url: str):
    last_err = None
    print(f'Reading data from : {url}')
    for i in range(RETRY_ATTEMPTS):
        try:
            return DataSource(url)
        except Exception as e:
            last_err = e
            _sleep_backoff(i)
    raise last_err

def _extract_runid_from_url(url: str):
    """
    Returns the runid found immediately after the 'runs' path segment, or None.
    Decodes percent-encoding first so '%3B%3B' becomes ';;'.
    """
    parsed = urlparse(url)
    path = unquote(parsed.path)  # decode %3B etc.
    parts = path.strip('/').split('/')
    try:
        i = parts.index('runs')
        return parts[i + 1]
    except (ValueError, IndexError):
        return None

def _save_watershed_associated_layer(layer: Layer, mapping: dict[str, str], associated_runid: str, model_class: type[Model]) -> int:
    """Save a layer of features with a one-to-many relationship with watersheds (one watershed - many layer features) and returns the number of features saved."""

    instances = []

    for feature in layer:
        # Gather the relevant OGR values from the data source
        kwargs = {key: feature.get(value) for key, value in mapping.items()}

        # Handle the geometry
        geom = feature.geom.geos
        kwargs['geom'] = MultiPolygon(geom) if isinstance(geom, Polygon) else geom

        # Add the watershed foreign key reference
        kwargs['watershed_id'] = associated_runid

        instances.append(model_class(**kwargs))
    
    model_class.objects.bulk_create(instances)

    return len(instances)

def load_from_remote(verbose=True):
    # Load and parse the data manifest YAML
    manifest_path = Path(__file__).resolve().parent.parent.parent.parent / "data-manifest.yaml"
    if not manifest_path.exists():
        print(f"ERROR: Manifest file not found: {manifest_path}")
        sys.exit(1)
        
    try:
        with open(manifest_path) as file:
            manifest = yaml.safe_load(file)
    except Exception as e:
        print(f"ERROR: Failed to load manifest: {e}")
        sys.exit(1)
    
    if not manifest:
        print("WARNING: No items found in manifest")
        return

    # Load watersheds
    watershed_url = manifest['Watersheds'][0]['url']
    watershed_ds = _open_datasource_with_retry(watershed_url)
    watershed_lm = LayerMapping(Watershed, watershed_ds, watershed_mapping)
    watershed_lm.save(strict=True, verbose=verbose)

    # Load subcatchments
    saved_subcatchment_count = 0
    for subcatchment_entry in manifest['Subcatchments']:
        associated_runid = _extract_runid_from_url(subcatchment_entry['url'])
        subcatchment_ds = _open_datasource_with_retry(subcatchment_entry['url'])
        saved_subcatchment_count += _save_watershed_associated_layer(layer=subcatchment_ds[0], mapping=subcatchment_mapping, associated_runid=associated_runid, model_class=Subcatchment)
    print(f"    Subcatchments saved: {saved_subcatchment_count}")
    
    # Load channels
    saved_channel_count = 0
    for channel_entry in manifest['Channels']:
        associated_runid = _extract_runid_from_url(channel_entry['url'])
        channel_ds = _open_datasource_with_retry(channel_entry['url'])
        saved_channel_count += _save_watershed_associated_layer(layer=channel_ds[0], mapping=channel_mapping, associated_runid=associated_runid, model_class=Channel)
    print(f"    Channels saved: {saved_channel_count}")

    

