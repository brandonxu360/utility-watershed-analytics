# This loader script supports both local and remote data loading.
# It checks for locally cached files first (from the data-downloader service),
# and falls back to fetching from remote URLs if local files are not available.

import sys
import yaml
import time
import requests
import pandas as pd
from io import BytesIO
from pathlib import Path
from django.contrib.gis.db.models import Model
from urllib.parse import urlparse, unquote
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.layer import Layer
from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.geos import Polygon, MultiPolygon
from server.watershed.models import Watershed, Subcatchment, Channel
from collections import defaultdict
from typing import Optional

# Local data directory where the data-downloader service stores cached files
# This path corresponds to the watershed_data volume mount in the server container
LOCAL_DATA_DIR = Path(__file__).resolve().parent.parent / "data"

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

# Parquet field mappings: model_field -> parquet_column
# Each tuple is (model_field, parquet_column, type_converter)
HILLSLOPES_FIELD_MAP = [
    ('slope_scalar', 'slope_scalar', float),
    ('length', 'length', float),
    ('width', 'width', float),
    ('direction', 'direction', float),
    ('aspect', 'aspect', float),
    ('hillslope_area', 'area', int),
    ('elevation', 'elevation', float),
    ('centroid_px', 'centroid_px', int),
    ('centroid_py', 'centroid_py', int),
    ('centroid_lon', 'centroid_lon', float),
    ('centroid_lat', 'centroid_lat', float),
]

SOILS_FIELD_MAP = [
    ('mukey', 'mukey', str),
    ('soil_fname', 'fname', str),
    ('soils_dir', 'soils_dir', str),
    ('soil_build_date', 'build_date', str),
    ('soil_desc', 'desc', str),
    ('soil_color', 'color', str),
    ('soil_area', 'area', float),
    ('soil_pct_coverage', 'pct_coverage', float),
    ('clay', 'clay', float),
    ('sand', 'sand', float),
    ('avke', 'avke', float),
    ('ll', 'll', float),
    ('bd', 'bd', float),
    ('simple_texture', 'simple_texture', str),
]

LANDUSE_FIELD_MAP = [
    ('landuse_key', 'key', int),
    ('landuse_map', '_map', str),
    ('man_fn', 'man_fn', str),
    ('man_dir', 'man_dir', str),
    ('landuse_desc', 'desc', str),
    ('landuse_color', 'color', str),
    ('landuse_area', 'area', float),
    ('landuse_pct_coverage', 'pct_coverage', float),
    ('cancov', 'cancov', float),
    ('inrcov', 'inrcov', float),
    ('rilcov', 'rilcov', float),
    ('cancov_override', 'cancov_override', float),
    ('inrcov_override', 'inrcov_override', float),
    ('rilcov_override', 'rilcov_override', float),
    ('disturbed_class', 'disturbed_class', str),
]

RETRY_ATTEMPTS = 6
BASE_DELAY_S = 0.2

def _sleep_backoff(i):
    time.sleep(BASE_DELAY_S * (2 ** i))  # 0.2,0.4,0.8,1.6,3.2,6.4s for i=0..5


def _get_local_path(target: str) -> Path:
    """Get the local file path for a manifest target."""
    return LOCAL_DATA_DIR / target


def _has_local_file(target: str) -> bool:
    """Check if a local cached file exists for the given manifest target."""
    local_path = _get_local_path(target)
    return local_path.exists() and local_path.is_file()


def _open_datasource(url: str, target: str = None, verbose: bool = False) -> DataSource:
    """
    Open a DataSource, checking for local cached file first.
    
    Args:
        url: Remote URL to fetch from if local file not available
        target: Optional manifest target path for local file lookup
        verbose: Whether to print source information
    
    Returns:
        DataSource from local file or remote URL
    """
    # Check for local file first
    if target and _has_local_file(target):
        local_path = _get_local_path(target)
        if verbose:
            print(f'    Loading from local cache: {local_path}')
        return DataSource(str(local_path))
    
    # Fall back to remote with retry
    if verbose:
        print(f'    Fetching from remote: {url}')
    return _open_datasource_with_retry(url)


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
    """
    Save a layer of features with a one-to-many relationship with watersheds (one watershed - many layer features).
    Handles cases where the same entity (identified by topazid, weppid, and order for channels) may appear 
    in multiple features with different polygons. All polygons for the same entity are merged into a single MultiPolygon.
    Returns the number of unique entities saved.
    """

    # Group features by their unique identifier
    entities = defaultdict(lambda: {'attributes': {}, 'polygons': []})

    for feature in layer:
        # Gather the relevant OGR values from the data source
        attributes = {key: feature.get(value) for key, value in mapping.items()}

        # Create a unique identifier based on the attributes
        if model_class == Channel:
            # For channels, use topazid + weppid + order
            entity_key = (attributes['topazid'], attributes['weppid'], attributes['order'])
        else:
            # For subcatchments, use topazid + weppid
            entity_key = (attributes['topazid'], attributes['weppid'])

        # Store attributes (same for all features of the same entity)
        if not entities[entity_key]['attributes']:
            entities[entity_key]['attributes'] = attributes

        # Collect the polygon
        geom = feature.geom.geos
        if isinstance(geom, Polygon):
            entities[entity_key]['polygons'].append(geom)
        elif isinstance(geom, MultiPolygon):
            # If it's already a MultiPolygon, add each polygon individually
            entities[entity_key]['polygons'].extend(list(geom))

    # Create model instances
    instances = []
    for entity_key, entity_data in entities.items():
        kwargs = entity_data['attributes']
        
        # Merge all polygons into a MultiPolygon
        polygons = entity_data['polygons']
        kwargs['geom'] = MultiPolygon(polygons) if len(polygons) > 1 else MultiPolygon(polygons[0])

        # Add the watershed foreign key reference
        kwargs['watershed_id'] = associated_runid

        instances.append(model_class(**kwargs))
    
    model_class.objects.bulk_create(instances)

    return len(instances)

def load_from_remote(verbose=True, runids: Optional[list[str]] = None):
    """
    Load watershed data from GeoJSON files (local cache or remote URLs).
    
    Checks for locally cached files first (from data-downloader service),
    and falls back to fetching from remote URLs if local files are not available.
    
    Args:
        verbose: Whether to print verbose output during loading
        runids: Optional list of runids to load. If None, all watersheds are loaded.
                If provided, only watersheds with matching runids and their associated
                subcatchments and channels will be loaded.
    """
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
    watershed_entry = manifest['Watersheds'][0]
    watershed_url = watershed_entry['url']
    watershed_target = watershed_entry.get('target')
    watershed_ds = _open_datasource(watershed_url, watershed_target, verbose)
    
    # If runids filter is specified, filter watersheds
    if runids is not None:
        runids_set = set(runids)
        watershed_layer = watershed_ds[0]
        instances = []
        
        for feature in watershed_layer:
            feature_runid = feature.get('runid')
            if feature_runid in runids_set:
                kwargs = {key: feature.get(value) for key, value in watershed_mapping.items() if key != 'geom'}
                geom = feature.geom.geos
                kwargs['geom'] = MultiPolygon(geom) if isinstance(geom, Polygon) else geom
                instances.append(Watershed(**kwargs))
        
        Watershed.objects.bulk_create(instances)
        if verbose:
            print(f"    Watersheds saved: {len(instances)} (filtered by runids)")
        
        # Use the filtered runids for loading subcatchments and channels
        loaded_runids = runids_set
    else:
        # Load all watersheds using LayerMapping
        watershed_lm = LayerMapping(Watershed, watershed_ds, watershed_mapping)
        watershed_lm.save(strict=True, verbose=verbose)
        loaded_runids = None

    # Load subcatchments
    saved_subcatchment_count = 0
    for subcatchment_entry in manifest['Subcatchments']:
        associated_runid = _extract_runid_from_url(subcatchment_entry['url'])
        
        # Skip if we're filtering and this runid is not in the filter
        if loaded_runids is not None and associated_runid not in loaded_runids:
            continue
        
        subcatchment_url = subcatchment_entry['url']
        subcatchment_target = subcatchment_entry.get('target')
        subcatchment_ds = _open_datasource(subcatchment_url, subcatchment_target, verbose)
        saved_subcatchment_count += _save_watershed_associated_layer(layer=subcatchment_ds[0], mapping=subcatchment_mapping, associated_runid=associated_runid, model_class=Subcatchment)
    print(f"    Subcatchments saved: {saved_subcatchment_count}")
    
    # Load channels
    saved_channel_count = 0
    for channel_entry in manifest['Channels']:
        associated_runid = _extract_runid_from_url(channel_entry['url'])
        
        # Skip if we're filtering and this runid is not in the filter
        if loaded_runids is not None and associated_runid not in loaded_runids:
            continue
        
        channel_url = channel_entry['url']
        channel_target = channel_entry.get('target')
        channel_ds = _open_datasource(channel_url, channel_target, verbose)
        saved_channel_count += _save_watershed_associated_layer(layer=channel_ds[0], mapping=channel_mapping, associated_runid=associated_runid, model_class=Channel)
    print(f"    Channels saved: {saved_channel_count}")

    # Load and merge parquet data into subcatchments
    print("Loading parquet data for subcatchments...")
    _load_parquet_data(manifest, loaded_runids, verbose)
    print("Parquet data loading complete")


def _load_parquet_with_retry(url: str, verbose: bool = False) -> pd.DataFrame:
    """Load a parquet file from URL with retry logic."""
    last_err = None
    for i in range(RETRY_ATTEMPTS):
        try:
            response = requests.get(url)
            response.raise_for_status()
            return pd.read_parquet(BytesIO(response.content))
        except Exception as e:
            last_err = e
            if verbose:
                print(f"    Retry {i+1}/{RETRY_ATTEMPTS} for parquet: {e}")
            _sleep_backoff(i)
    raise last_err


def _load_parquet(url: str, target: str = None, verbose: bool = False) -> pd.DataFrame:
    """
    Load a parquet file, checking for local cached file first.
    
    Args:
        url: Remote URL to fetch from if local file not available
        target: Optional manifest target path for local file lookup
        verbose: Whether to print source information
    
    Returns:
        DataFrame from local file or remote URL
    """
    # Check for local file first
    if target and _has_local_file(target):
        local_path = _get_local_path(target)
        if verbose:
            print(f"      Loading from local cache: {local_path}")
        return pd.read_parquet(local_path)
    
    # Fall back to remote with retry
    if verbose:
        print(f"      Fetching from remote: {url}")
    return _load_parquet_with_retry(url, verbose)


def _apply_field_mapping(obj, row: pd.Series, field_map: list) -> bool:
    """
    Apply a field mapping from a parquet row to a model object.
    
    Args:
        obj: The model instance to update
        row: A pandas Series containing the parquet data
        field_map: List of (model_field, parquet_column, type_converter) tuples
    
    Returns:
        True if any field was updated, False otherwise
    """
    updated = False
    for model_field, parquet_col, converter in field_map:
        value = row.get(parquet_col)
        if pd.notna(value):
            setattr(obj, model_field, converter(value))
            updated = True
        else:
            setattr(obj, model_field, None)
    return updated


def _load_parquet_for_runid(entries: dict, runid: str, verbose: bool) -> Optional[pd.DataFrame]:
    """Load parquet data for a specific runid, returning None on failure."""
    if runid not in entries:
        return None
    try:
        entry = entries[runid]
        return _load_parquet(entry['url'], entry.get('target'), verbose)
    except Exception as e:
        if verbose:
            print(f"    Warning: Could not load data for {runid}: {e}")
        return None


def _load_parquet_data(manifest: dict, loaded_runids: Optional[set[str]] = None, verbose: bool = True):
    """
    Load hillslopes, soils, and landuse parquet files and update subcatchment records.
    Uses pandas and pyarrow to read parquet files.
    
    Args:
        manifest: The data manifest dictionary
        loaded_runids: Optional set of runids to filter by
        verbose: Whether to print verbose output
    """
    # Build lookup dictionaries for each data type
    parquet_sources = {
        'hillslopes': ({item['name']: item for item in manifest.get('Hillslopes', [])}, HILLSLOPES_FIELD_MAP),
        'soils': ({item['name']: item for item in manifest.get('Soils', [])}, SOILS_FIELD_MAP),
        'landuse': ({item['name']: item for item in manifest.get('Landuse', [])}, LANDUSE_FIELD_MAP),
    }
    
    # Determine which runids to process
    all_runids = set()
    for entries, _ in parquet_sources.values():
        all_runids |= set(entries.keys())
    
    if loaded_runids is not None:
        all_runids &= loaded_runids
    
    updated_count = 0
    skipped_count = 0
    
    # Collect all fields that might be updated for bulk_update
    all_update_fields = [field for _, field_map in parquet_sources.values() for field, _, _ in field_map]
    
    for runid in all_runids:
        try:
            if verbose:
                print(f"  Processing parquet data for {runid}...")
            
            # Load all parquet dataframes for this runid
            dataframes = {}
            for name, (entries, _) in parquet_sources.items():
                df = _load_parquet_for_runid(entries, runid, verbose)
                if df is not None:
                    # Index by TopazID for O(1) lookups
                    dataframes[name] = df.set_index('TopazID')
            
            if not dataframes:
                skipped_count += 1
                continue
            
            # Get all subcatchments for this watershed
            subcatchments = list(Subcatchment.objects.filter(watershed_id=runid))
            updated_subcatchments = []
            
            for subcatchment in subcatchments:
                topaz_id = subcatchment.topazid
                was_updated = False
                
                # Apply each data source's field mapping
                for name, (_, field_map) in parquet_sources.items():
                    if name in dataframes and topaz_id in dataframes[name].index:
                        row = dataframes[name].loc[topaz_id]
                        if _apply_field_mapping(subcatchment, row, field_map):
                            was_updated = True
                
                if was_updated:
                    updated_subcatchments.append(subcatchment)
            
            # Bulk update all modified subcatchments at once
            if updated_subcatchments:
                Subcatchment.objects.bulk_update(updated_subcatchments, all_update_fields, batch_size=500)
                updated_count += len(updated_subcatchments)
            
            if verbose:
                print(f"    Updated {len(updated_subcatchments)} subcatchments for {runid}")
                
        except Exception as e:
            print(f"  Error processing parquet data for {runid}: {e}")
            skipped_count += 1
    
    print(f"    Total subcatchments updated with parquet data: {updated_count}")
    if skipped_count > 0:
        print(f"    Skipped {skipped_count} runids due to errors")
    

