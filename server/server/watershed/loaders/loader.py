"""
Watershed data loader with dependency injection.

This module provides the main loader implementation that:
- Automatically discovers available watershed data from the API
- Supports both batch-based and standalone run loading
- Accepts injected dependencies for easy testing
- Separates concerns between reading, writing, and orchestration
"""

import logging
from typing import Optional, Union

from .config import LoaderConfig, StandaloneRunConfig, get_config
from .discovery import WatershedDataDiscovery, StandaloneRunDiscovery
from .protocols import DataSourceReader, DataWriter
from .readers import RemoteDataSourceReader
from .writers import DjangoDataWriter
from server.watershed.utils.logging import LoaderLogger, LoadPhase, configure_logging

logger = logging.getLogger("watershed.loader")


class WatershedLoader:
    """
    Orchestrates watershed data loading with dependency injection.
    
    Supports two modes:
    - Batch mode (default): loads from a batch discovery source
    - Standalone mode: loads a single watershed from a standalone run config
    """
    
    def __init__(
        self,
        reader: Optional[DataSourceReader] = None,
        writer: Optional[DataWriter] = None,
        discovery: Optional[Union[WatershedDataDiscovery, StandaloneRunDiscovery]] = None,
        config: Optional[LoaderConfig] = None,
        standalone_config: Optional[StandaloneRunConfig] = None,
    ):
        self.config = config or get_config()
        self.reader = reader or RemoteDataSourceReader(self.config)
        self.writer = writer or DjangoDataWriter(self.config)
        self.discovery = discovery or WatershedDataDiscovery(self.config)
        self.standalone_config = standalone_config
        self.logger = LoaderLogger()
    
    def load(
        self,
        runids: Optional[list[str]] = None,
        verbose: bool = True,
    ) -> dict:
        """
        Load watershed data using discovery-based resolution.
        
        For standalone runs, the watershed boundary is loaded separately
        from a boundary GeoJSON (with CRS transformation as needed).
        """
        configure_logging(verbose=verbose)
        
        if runids is None:
            available_runids = self.discovery.discover_runids()
        else:
            available_runids = runids
        
        runids_set = set(available_runids) if available_runids else None
        
        # Load watersheds (batch vs standalone)
        if self.standalone_config:
            watersheds_saved = self._load_standalone_watershed()
        else:
            watersheds_saved = self._load_watersheds(runids_set)
        
        # Subcatchments, channels, and parquet are loaded identically
        subcatchments_saved = self._load_subcatchments(available_runids)
        channels_saved = self._load_channels(available_runids)
        subcatchments_updated = self._load_parquet_data(available_runids)
        
        self.logger.summary()
        
        return {
            "watersheds_saved": watersheds_saved,
            "subcatchments_saved": subcatchments_saved,
            "channels_saved": channels_saved,
            "subcatchments_updated": subcatchments_updated,
        }
    
    def _load_standalone_watershed(self) -> int:
        """Load a watershed from a standalone boundary GeoJSON."""
        self.logger.start_phase(LoadPhase.LOADING_WATERSHEDS, total_items=1)
        
        try:
            url = self.discovery.get_watersheds_url()
            local_path = self.discovery.get_watersheds_local_path()
            
            ds = self.reader.read_geojson(url, local_path)
            count = self.writer.save_standalone_watershed(
                ds[0],
                runid=self.standalone_config.runid,
                display_name=self.standalone_config.display_name,
            )
            self.logger.item_complete(
                self.standalone_config.display_name,
                records_saved=count,
                extra_info="standalone",
            )
            self.logger.end_phase(records_saved=count)
            return count
        except Exception as e:
            self.logger.item_error(self.standalone_config.display_name, e)
            self.logger.end_phase(records_saved=0)
            raise
    
    def _load_watersheds(self, runids: Optional[set[str]] = None) -> int:
        """Load watershed data from the master GeoJSON file."""
        self.logger.start_phase(LoadPhase.LOADING_WATERSHEDS, total_items=1)
        
        try:
            url = self.discovery.get_watersheds_url()
            local_path = self.discovery.get_watersheds_local_path()
            
            # Use getattr so this works for both WatershedDataDiscovery and StandaloneRunDiscovery.
            jwt_token = getattr(self.discovery, 'jwt_token', None)
            headers = {"Authorization": f"Bearer {jwt_token}"} if jwt_token else None
            
            ds = self.reader.read_geojson(url, local_path, headers=headers)
            
            if runids is not None:
                count = self.writer.save_watersheds_filtered(ds[0], runids)
                self.logger.item_complete("watersheds", records_saved=count, extra_info="filtered")
            else:
                count = self.writer.save_watersheds(ds[0])
                self.logger.item_complete("watersheds", records_saved=count)
            
            self.logger.end_phase(records_saved=count)
            return count
            
        except Exception as e:
            self.logger.item_error("watersheds", e)
            self.logger.end_phase(records_saved=0)
            raise
    
    def _load_subcatchments(self, runids: Optional[list[str]] = None) -> int:
        """Load subcatchment data for each watershed."""
        sources = list(self.discovery.iter_subcatchments(runids))
        self.logger.start_phase(LoadPhase.LOADING_SUBCATCHMENTS, total_items=len(sources))
        
        total_saved = 0
        for source in sources:
            try:
                ds = self.reader.read_geojson(source.url, source.local_path)
                count = self.writer.save_subcatchments(source.name, ds[0])
                total_saved += count
                self.logger.item_complete(source.name, records_saved=count)
            except Exception as e:
                self.logger.item_error(source.name, e)
        
        self.logger.end_phase(records_saved=total_saved)
        return total_saved
    
    def _load_channels(self, runids: Optional[list[str]] = None) -> int:
        """Load channel data for each watershed."""
        sources = list(self.discovery.iter_channels(runids))
        self.logger.start_phase(LoadPhase.LOADING_CHANNELS, total_items=len(sources))
        
        total_saved = 0
        for source in sources:
            try:
                ds = self.reader.read_geojson(source.url, source.local_path)
                count = self.writer.save_channels(source.name, ds[0])
                total_saved += count
                self.logger.item_complete(source.name, records_saved=count)
            except Exception as e:
                self.logger.item_error(source.name, e)
        
        self.logger.end_phase(records_saved=total_saved)
        return total_saved
    
    def _load_parquet_data(self, runids: Optional[list[str]] = None) -> int:
        """Load hillslope, soil, and landuse parquet data."""
        runids_to_process = set()
        for data_type in ['hillslopes', 'soils', 'landuse']:
            for source in self.discovery.iter_sources(data_type, runids):
                runids_to_process.add(source.name)
        
        self.logger.start_phase(LoadPhase.LOADING_PARQUET, total_items=len(runids_to_process))
        
        total_updated = 0
        for runid in runids_to_process:
            try:
                self.logger.item_start(runid)
                
                hillslopes = self._load_parquet_for_runid(runid, 'hillslopes')
                soils = self._load_parquet_for_runid(runid, 'soils')
                landuse = self._load_parquet_for_runid(runid, 'landuse')
                
                if hillslopes is None and soils is None and landuse is None:
                    self.logger.item_skipped(runid, reason="no parquet data available")
                    continue
                
                count = self.writer.update_subcatchments_from_parquet(
                    runid, hillslopes, soils, landuse
                )
                total_updated += count
                self.logger.item_complete(runid, records_saved=count)
                
            except Exception as e:
                self.logger.item_error(runid, e)
        
        self.logger.end_phase(records_saved=total_updated)
        return total_updated
    
    def _load_parquet_for_runid(self, runid: str, data_type: str):
        """Load a single parquet file for a runid, returning None on failure."""
        for source in self.discovery.iter_sources(data_type, [runid]):
            try:
                return self.reader.read_parquet(source.url, source.local_path)
            except Exception as e:
                self.logger.warning(f"Could not load {data_type} for {runid}: {e}")
                return None
        return None


def load_with_discovery(
    verbose: bool = True,
    runids: Optional[list[str]] = None,
    config: Optional[LoaderConfig] = None,
) -> dict:
    """
    Load watershed data with automatic discovery across all configured sources.

    Iterates over all configured batches and standalone runs, loading each
    with its own discovery instance. Runids are filtered to the appropriate
    batch/standalone based on their format.

    Args:
        verbose: Whether to print verbose output during loading
        runids: Optional list of runids to load. If None, all are discovered
            for each batch/standalone run.
        config: Optional loader configuration

    Returns:
        Dictionary with combined loading statistics:
        - watersheds_saved
        - subcatchments_saved
        - channels_saved
        - subcatchments_updated
    """
    from .discovery import WatershedDataDiscovery, StandaloneRunDiscovery

    cfg = config or get_config()
    total_stats: dict[str, int] = {
        "watersheds_saved": 0,
        "subcatchments_saved": 0,
        "channels_saved": 0,
        "subcatchments_updated": 0,
    }

    # 1. Load batch-based watersheds
    for batch_cfg in cfg.api.batches:
        discovery = WatershedDataDiscovery(config=cfg, batch_config=batch_cfg)
        # The batch name is the last path segment of the batch URL — this is
        # what appears in runids (e.g. "batch;;nasa-roses-2026-sbs;;OR-20").
        # Do NOT derive it from watersheds_filename, which may be an override
        # with an unrelated name (e.g. "WWS_Watersheds_HUC10_psbs_030426.geojson").
        batch_name = batch_cfg.batch_url.rstrip("/").split("/")[-1]

        # When explicit runids are provided, only pass those that belong to
        # this batch (the batch name is the middle segment of the runid, e.g.
        # "batch;;nasa-roses-2026-sbs;;OR-20").  This prevents one batch from
        # re-processing the other batch's runids.
        if runids is not None:
            batch_runids = [r for r in runids if f";;{batch_name};;" in r]
            if not batch_runids:
                continue  # nothing for this batch — skip entirely
        else:
            batch_runids = None

        loader = WatershedLoader(config=cfg, discovery=discovery)
        result = loader.load(runids=batch_runids, verbose=verbose)
        for key in total_stats:
            total_stats[key] += result[key]

    # 2. Load standalone runs
    for standalone_config in cfg.api.standalone_runs:
        if runids is not None and standalone_config.runid not in runids:
            continue

        logger.info(f"Loading standalone run: {standalone_config.display_name}")
        discovery = StandaloneRunDiscovery(standalone_config, config=cfg)
        loader = WatershedLoader(
            config=cfg,
            discovery=discovery,
            standalone_config=standalone_config,
        )
        result = loader.load(
            runids=[standalone_config.runid],
            verbose=verbose,
        )
        for key in total_stats:
            total_stats[key] += result[key]

    return total_stats
