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


def _load_parquet_data(manifest: dict, loaded_runids: Optional[set[str]] = None, verbose: bool = True):
    """
    Load hillslopes, soils, and landuse parquet files and update subcatchment records.
    Uses pandas and pyarrow to read parquet files.
    
    Args:
        manifest: The data manifest dictionary
        loaded_runids: Optional set of runids to filter by
        verbose: Whether to print verbose output
    """
    
    # Process each runid
    hillslopes_entries = {item['name']: item for item in manifest.get('Hillslopes', [])}
    soils_entries = {item['name']: item for item in manifest.get('Soils', [])}
    landuse_entries = {item['name']: item for item in manifest.get('Landuse', [])}
    
    # Get all unique runids to process
    all_runids = set(hillslopes_entries.keys()) | set(soils_entries.keys()) | set(landuse_entries.keys())
    
    # Filter by loaded_runids if specified
    if loaded_runids is not None:
        all_runids = all_runids & loaded_runids
    
    updated_count = 0
    skipped_count = 0
    
    for runid in all_runids:
        try:
            if verbose:
                print(f"  Processing parquet data for {runid}...")
            
            # Load parquet files for this runid
            hillslopes_df = None
            soils_df = None
            landuse_df = None
            
            if runid in hillslopes_entries:
                try:
                    entry = hillslopes_entries[runid]
                    hillslopes_df = _load_parquet(entry['url'], entry.get('target'), verbose)
                except Exception as e:
                    if verbose:
                        print(f"    Warning: Could not load hillslopes for {runid}: {e}")
            
            if runid in soils_entries:
                try:
                    entry = soils_entries[runid]
                    soils_df = _load_parquet(entry['url'], entry.get('target'), verbose)
                except Exception as e:
                    if verbose:
                        print(f"    Warning: Could not load soils for {runid}: {e}")
            
            if runid in landuse_entries:
                try:
                    entry = landuse_entries[runid]
                    landuse_df = _load_parquet(entry['url'], entry.get('target'), verbose)
                except Exception as e:
                    if verbose:
                        print(f"    Warning: Could not load landuse for {runid}: {e}")
            
            # Skip if no data was loaded
            if hillslopes_df is None and soils_df is None and landuse_df is None:
                skipped_count += 1
                continue
            
            # Get all subcatchments for this watershed
            subcatchments = Subcatchment.objects.filter(watershed_id=runid)
            
            # Update each subcatchment with parquet data
            for subcatchment in subcatchments:
                topaz_id = subcatchment.topazid
                updated = False
                
                # Update from hillslopes data
                if hillslopes_df is not None:
                    hill_row = hillslopes_df[hillslopes_df['TopazID'] == topaz_id]
                    if not hill_row.empty:
                        hill_row = hill_row.iloc[0]
                        subcatchment.slope_scalar = float(hill_row['slope_scalar']) if pd.notna(hill_row['slope_scalar']) else None
                        subcatchment.length = float(hill_row['length']) if pd.notna(hill_row['length']) else None
                        subcatchment.width = float(hill_row['width']) if pd.notna(hill_row['width']) else None
                        subcatchment.direction = float(hill_row['direction']) if pd.notna(hill_row['direction']) else None
                        subcatchment.aspect = float(hill_row['aspect']) if pd.notna(hill_row['aspect']) else None
                        subcatchment.hillslope_area = int(hill_row['area']) if pd.notna(hill_row['area']) else None
                        subcatchment.elevation = float(hill_row['elevation']) if pd.notna(hill_row['elevation']) else None
                        subcatchment.centroid_px = int(hill_row['centroid_px']) if pd.notna(hill_row['centroid_px']) else None
                        subcatchment.centroid_py = int(hill_row['centroid_py']) if pd.notna(hill_row['centroid_py']) else None
                        subcatchment.centroid_lon = float(hill_row['centroid_lon']) if pd.notna(hill_row['centroid_lon']) else None
                        subcatchment.centroid_lat = float(hill_row['centroid_lat']) if pd.notna(hill_row['centroid_lat']) else None
                        updated = True
                
                # Update from soils data
                if soils_df is not None:
                    soil_row = soils_df[soils_df['TopazID'] == topaz_id]
                    if not soil_row.empty:
                        soil_row = soil_row.iloc[0]
                        subcatchment.mukey = str(soil_row['mukey']) if pd.notna(soil_row['mukey']) else None
                        subcatchment.soil_fname = str(soil_row['fname']) if pd.notna(soil_row['fname']) else None
                        subcatchment.soils_dir = str(soil_row['soils_dir']) if pd.notna(soil_row['soils_dir']) else None
                        subcatchment.soil_build_date = str(soil_row['build_date']) if pd.notna(soil_row['build_date']) else None
                        subcatchment.soil_desc = str(soil_row['desc']) if pd.notna(soil_row['desc']) else None
                        subcatchment.soil_color = str(soil_row['color']) if pd.notna(soil_row['color']) else None
                        subcatchment.soil_area = float(soil_row['area']) if pd.notna(soil_row['area']) else None
                        subcatchment.soil_pct_coverage = float(soil_row['pct_coverage']) if pd.notna(soil_row['pct_coverage']) else None
                        subcatchment.clay = float(soil_row['clay']) if pd.notna(soil_row['clay']) else None
                        subcatchment.sand = float(soil_row['sand']) if pd.notna(soil_row['sand']) else None
                        subcatchment.avke = float(soil_row['avke']) if pd.notna(soil_row['avke']) else None
                        subcatchment.ll = float(soil_row['ll']) if pd.notna(soil_row['ll']) else None
                        subcatchment.bd = float(soil_row['bd']) if pd.notna(soil_row['bd']) else None
                        subcatchment.simple_texture = str(soil_row['simple_texture']) if pd.notna(soil_row['simple_texture']) else None
                        updated = True
                
                # Update from landuse data
                if landuse_df is not None:
                    land_row = landuse_df[landuse_df['TopazID'] == topaz_id]
                    if not land_row.empty:
                        land_row = land_row.iloc[0]
                        subcatchment.landuse_key = int(land_row['key']) if pd.notna(land_row['key']) else None
                        subcatchment.landuse_map = str(land_row['_map']) if pd.notna(land_row['_map']) else None
                        subcatchment.man_fn = str(land_row['man_fn']) if pd.notna(land_row['man_fn']) else None
                        subcatchment.man_dir = str(land_row['man_dir']) if pd.notna(land_row['man_dir']) else None
                        subcatchment.landuse_desc = str(land_row['desc']) if pd.notna(land_row['desc']) else None
                        subcatchment.landuse_color = str(land_row['color']) if pd.notna(land_row['color']) else None
                        subcatchment.landuse_area = float(land_row['area']) if pd.notna(land_row['area']) else None
                        subcatchment.landuse_pct_coverage = float(land_row['pct_coverage']) if pd.notna(land_row['pct_coverage']) else None
                        subcatchment.cancov = float(land_row['cancov']) if pd.notna(land_row['cancov']) else None
                        subcatchment.inrcov = float(land_row['inrcov']) if pd.notna(land_row['inrcov']) else None
                        subcatchment.rilcov = float(land_row['rilcov']) if pd.notna(land_row['rilcov']) else None
                        subcatchment.cancov_override = float(land_row['cancov_override']) if pd.notna(land_row['cancov_override']) else None
                        subcatchment.inrcov_override = float(land_row['inrcov_override']) if pd.notna(land_row['inrcov_override']) else None
                        subcatchment.rilcov_override = float(land_row['rilcov_override']) if pd.notna(land_row['rilcov_override']) else None
                        subcatchment.disturbed_class = str(land_row['disturbed_class']) if pd.notna(land_row['disturbed_class']) else None
                        updated = True
                
                if updated:
                    subcatchment.save()
                    updated_count += 1
            
            if verbose:
                print(f"    Updated {subcatchments.count()} subcatchments for {runid}")
                
        except Exception as e:
            print(f"  Error processing parquet data for {runid}: {e}")
            skipped_count += 1
    
    print(f"    Total subcatchments updated with parquet data: {updated_count}")
    if skipped_count > 0:
        print(f"    Skipped {skipped_count} runids due to errors")
    

