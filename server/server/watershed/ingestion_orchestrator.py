"""
Core ingestion orchestration for watershed data.

Handles parallel fetch and serial database writes with progress tracking.
"""
import time
from typing import Optional, Dict
from pathlib import Path
from urllib.parse import urlparse, unquote

from django.db import transaction
from django.contrib.gis.db.models import Model
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.geos import Polygon, MultiPolygon

from server.watershed.models import Watershed, Subcatchment, Channel
from server.watershed.manifest_reader import ManifestReader, ManifestEntry
from server.watershed.parallel_fetcher import ParallelFetcher, FetchResult
from server.watershed.ingestion_logger import IngestionLogger
from server.watershed.ingestion_config import get_ingestion_config


# Layer mappings from load_remote.py
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

subcatchment_mapping = {
    'topazid': 'TopazID', 
    'weppid': 'WeppID',
}

channel_mapping = {
    'topazid': 'TopazID', 
    'weppid': 'WeppID', 
    'order': 'Order',
}


def _extract_runid_from_url(url: str) -> Optional[str]:
    """
    Extract runid from URL path (appears after 'runs' segment).
    
    Args:
        url: Full URL containing runid
        
    Returns:
        Runid string or None if not found
    """
    parsed = urlparse(url)
    path = unquote(parsed.path)  # decode %3B etc.
    parts = path.strip('/').split('/')
    try:
        i = parts.index('runs')
        return parts[i + 1]
    except (ValueError, IndexError):
        return None


def _save_layer_features(
    data_source: DataSource,
    mapping: dict,
    associated_runid: str,
    model_class: type[Model],
    batch_size: Optional[int] = None
) -> int:
    """
    Save features from a DataSource layer to database.
    
    Args:
        data_source: GDAL DataSource containing features
        mapping: Field mapping from GDAL to Django model
        associated_runid: Foreign key to watershed
        model_class: Django model class (Subcatchment or Channel)
        batch_size: Batch size for bulk_create (None = all at once)
        
    Returns:
        Number of features saved
    """
    layer = data_source[0]
    instances = []
    
    for feature in layer:
        kwargs = {key: feature.get(value) for key, value in mapping.items()}
        
        # Handle geometry
        geom = feature.geom.geos
        kwargs['geom'] = MultiPolygon(geom) if isinstance(geom, Polygon) else geom
        
        # Add watershed foreign key
        kwargs['watershed_id'] = associated_runid
        
        instances.append(model_class(**kwargs))
    
    # Batch insert
    if batch_size and len(instances) > batch_size:
        total_saved = 0
        for i in range(0, len(instances), batch_size):
            batch = instances[i:i + batch_size]
            model_class.objects.bulk_create(batch)
            total_saved += len(batch)
        return total_saved
    else:
        model_class.objects.bulk_create(instances)
        return len(instances)


class IngestionOrchestrator:
    """
    Orchestrates the complete ingestion pipeline.
    
    Handles manifest reading, parallel fetching, and serial database writes
    with progress tracking and error handling.
    """
    
    def __init__(
        self,
        manifest_path: Path,
        config: Optional[Dict] = None,
        logger: Optional[IngestionLogger] = None
    ):
        """
        Initialize the orchestrator.
        
        Args:
            manifest_path: Path to data manifest YAML file
            config: Configuration dict (uses defaults if None)
            logger: IngestionLogger instance (creates new if None)
        """
        self.manifest_path = manifest_path
        self.config = config or get_ingestion_config()
        self.logger = logger or IngestionLogger(__name__, log_json=self.config['LOG_JSON'])
        
        self.reader = ManifestReader(manifest_path)
        self.fetcher = ParallelFetcher(
            max_workers=self.config['MAX_WORKERS'],
            logger=self.logger
        )
        
        self.stats = {
            'watersheds': 0,
            'subcatchments': 0,
            'channels': 0,
            'failed_fetches': 0
        }
    
    def validate_manifest(self) -> bool:
        """
        Validate manifest structure.
        
        Returns:
            True if valid, False otherwise (errors logged)
        """
        try:
            self.reader.load()
            errors = self.reader.validate()
            
            if errors:
                for error in errors:
                    self.logger.error('Manifest validation error', error=error)
                return False
            
            return True
        except Exception as e:
            self.logger.error('Failed to load manifest', error=str(e))
            return False
    
    def run(self, dry_run: bool = False) -> Dict[str, int]:
        """
        Execute the complete ingestion pipeline.
        
        Args:
            dry_run: If True, validate but don't write to database
            
        Returns:
            Statistics dict with counts of loaded entities
        """
        # Load manifest
        entries = self.reader.get_entries(
            scope=self.config['SCOPE'],
            subset_size=self.config['SUBSET_SIZE']
        )
        
        # In dev_subset mode, collect the runids from subcatchments
        # so we can filter watersheds to match
        selected_runids = None
        if self.config['SCOPE'] in ('dev_subset', 'dev') and entries['subcatchments']:
            selected_runids = {
                _extract_runid_from_url(entry.url) 
                for entry in entries['subcatchments']
            }
            # Remove None if any URL failed to extract runid
            selected_runids.discard(None)
        
        total_entries = sum(len(v) for v in entries.values())
        
        self.logger.log_start(
            scope=self.config['SCOPE'],
            total_entries=total_entries,
            max_workers=self.config['MAX_WORKERS'],
            batch_size=self.config['BATCH_SIZE'],
            mode=self.config['MODE'],
            selected_runids=len(selected_runids) if selected_runids else 'all'
        )
        
        if dry_run:
            self.logger.info('Dry run mode - skipping data load')
            return self.stats
        
        # Load watersheds (filtered by runids if in dev mode)
        if entries['watersheds']:
            self._load_watersheds(entries['watersheds'], selected_runids)
        
        # Load subcatchments (parallel fetch, serial write)
        if entries['subcatchments']:
            self._load_associated_features(
                entries['subcatchments'],
                subcatchment_mapping,
                Subcatchment,
                'subcatchments'
            )
        
        # Load channels (parallel fetch, serial write)
        if entries['channels']:
            self._load_associated_features(
                entries['channels'],
                channel_mapping,
                Channel,
                'channels'
            )
        
        self.logger.log_complete(**self.stats)
        
        return self.stats
    
    def _load_watersheds(self, entries: list[ManifestEntry], selected_runids: Optional[set] = None):
        """
        Load watershed data using LayerMapping.
        
        Args:
            entries: List of watershed manifest entries
            selected_runids: If provided, only load watersheds with these runids (for dev_subset)
        """
        if not entries:
            return
        
        self.logger.info(
            'Loading watersheds', 
            count=len(entries),
            filter_runids=len(selected_runids) if selected_runids else 'all'
        )
        start_time = time.time()
        
        # Watersheds typically have single entry, so fetch directly
        for entry in entries:
            urls = [entry.url]
            results = self.fetcher.fetch_parallel(urls)
            
            if not results[0].success:
                self.logger.error(
                    'Failed to fetch watershed data',
                    url=entry.url,
                    error=results[0].error
                )
                self.stats['failed_fetches'] += 1
                continue
            
            # Use LayerMapping for watersheds (preserves original behavior)
            with transaction.atomic():
                lm = LayerMapping(Watershed, results[0].data_source, watershed_mapping)
                lm.save(strict=True, verbose=False)
                
                # If in dev_subset mode, delete watersheds not in selected_runids
                if selected_runids:
                    deleted_count = Watershed.objects.exclude(runid__in=selected_runids).delete()[0]
                    if deleted_count > 0:
                        self.logger.debug(
                            'Filtered watersheds to subset',
                            kept=len(selected_runids),
                            removed=deleted_count
                        )
            
            self.stats['watersheds'] = Watershed.objects.count()
        
        duration = time.time() - start_time
        self.logger.log_batch_complete(
            entity_type='watersheds',
            batch_size=self.stats['watersheds'],
            duration_s=duration
        )
    
    def _load_associated_features(
        self,
        entries: list[ManifestEntry],
        mapping: dict,
        model_class: type[Model],
        entity_type: str
    ):
        """
        Load subcatchments or channels with parallel fetch and serial writes.
        
        Args:
            entries: List of manifest entries to load
            mapping: Field mapping for this entity type
            model_class: Django model class
            entity_type: 'subcatchments' or 'channels' (for logging)
        """
        if not entries:
            return
        
        self.logger.info(f'Loading {entity_type}', count=len(entries))
        
        # Parallel fetch all URLs
        urls = [entry.url for entry in entries]
        fetch_start = time.time()
        results = self.fetcher.fetch_parallel(urls)
        fetch_duration = time.time() - fetch_start
        
        self.logger.info(
            f'Fetched {entity_type} data',
            count=len(results),
            duration_s=f"{fetch_duration:.2f}",
            success_count=sum(1 for r in results if r.success)
        )
        
        # Serial database writes with batching
        write_start = time.time()
        saved_count = 0
        
        for entry, result in zip(entries, results):
            if not result.success:
                self.logger.warning(
                    f'Skipping {entity_type} entry due to fetch failure',
                    name=entry.name,
                    url=entry.url
                )
                self.stats['failed_fetches'] += 1
                continue
            
            # Extract runid and save features
            runid = _extract_runid_from_url(entry.url)
            if not runid:
                self.logger.error(
                    'Could not extract runid from URL',
                    url=entry.url
                )
                continue
            
            count = _save_layer_features(
                result.data_source,
                mapping,
                runid,
                model_class,
                batch_size=self.config['BATCH_SIZE']
            )
            saved_count += count
            
            # Progress logging every 50 entries
            if (results.index(result) + 1) % 50 == 0:
                self.logger.log_progress(
                    results.index(result) + 1,
                    len(results),
                    entity_type
                )
        
        write_duration = time.time() - write_start
        self.stats[entity_type] = saved_count
        
        self.logger.log_batch_complete(
            entity_type=entity_type,
            batch_size=saved_count,
            duration_s=write_duration
        )
