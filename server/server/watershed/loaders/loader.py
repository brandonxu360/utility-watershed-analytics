"""
Watershed data loader with dependency injection.

This module provides the main loader implementation that:
- Automatically discovers available watershed data from the API
- Accepts injected dependencies for easy testing
- Separates concerns between reading, writing, and orchestration
"""

import logging
from typing import Optional

from .config import LoaderConfig, get_config
from .discovery import WatershedDataDiscovery
from .protocols import DataSourceReader, DataWriter
from .readers import RemoteDataSourceReader
from .writers import DjangoDataWriter
from server.watershed.utils.logging import LoaderLogger, LoadPhase, configure_logging

logger = logging.getLogger("watershed.loader")


class WatershedLoader:
    """
    Orchestrates watershed data loading with dependency injection.
    
    This class coordinates reading from data sources and writing to the
    database, with all I/O operations delegated to injected dependencies.
    This enables easy testing by injecting mock implementations.
    
    Example (production):
        loader = WatershedLoader()
        result = loader.load()
    
    Example (testing):
        loader = WatershedLoader(
            reader=MockDataSourceReader(),
            writer=MockDataWriter(),
            discovery=MockDiscovery(),
        )
        result = loader.load()
    """
    
    def __init__(
        self,
        reader: Optional[DataSourceReader] = None,
        writer: Optional[DataWriter] = None,
        discovery: Optional[WatershedDataDiscovery] = None,
        config: Optional[LoaderConfig] = None,
    ):
        """
        Initialize the loader with dependencies.
        
        Args:
            reader: Data source reader (defaults to RemoteDataSourceReader)
            writer: Database writer (defaults to DjangoDataWriter)
            discovery: Data discovery provider (defaults to WatershedDataDiscovery)
            config: Loader configuration (defaults to environment-based config)
        """
        self.config = config or get_config()
        self.reader = reader or RemoteDataSourceReader(self.config)
        self.writer = writer or DjangoDataWriter(self.config)
        self.discovery = discovery or WatershedDataDiscovery(self.config)
        self.logger = LoaderLogger()
    
    def load(
        self,
        runids: Optional[list[str]] = None,
        verbose: bool = True,
    ) -> dict:
        """
        Load watershed data using discovery-based resolution.
        
        Args:
            runids: Optional list of runids to load. If None, discovers all.
            verbose: Whether to enable verbose logging
        
        Returns:
            Dictionary with loading statistics
        """
        configure_logging(verbose=verbose)
        
        # Discover runids if not provided
        if runids is None:
            available_runids = self.discovery.discover_runids()
        else:
            available_runids = runids
        
        runids_set = set(available_runids) if available_runids else None
        
        # Load watersheds
        watersheds_saved = self._load_watersheds(runids_set)
        
        # Load subcatchments
        subcatchments_saved = self._load_subcatchments(available_runids)
        
        # Load channels
        channels_saved = self._load_channels(available_runids)
        
        # Load parquet data
        subcatchments_updated = self._load_parquet_data(available_runids)
        
        self.logger.summary()
        
        return {
            "watersheds_saved": watersheds_saved,
            "subcatchments_saved": subcatchments_saved,
            "channels_saved": channels_saved,
            "subcatchments_updated": subcatchments_updated,
        }
    
    def _load_watersheds(self, runids: Optional[set[str]] = None) -> int:
        """Load watershed data from the master GeoJSON file."""
        self.logger.start_phase(LoadPhase.LOADING_WATERSHEDS, total_items=1)
        
        try:
            url = self.discovery.get_watersheds_url()
            local_path = self.discovery.get_watersheds_local_path()
            
            ds = self.reader.read_geojson(url, local_path)
            
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
        # Get unique runids from any parquet source
        runids_to_process = set()
        for data_type in ['hillslopes', 'soils', 'landuse']:
            for source in self.discovery.iter_sources(data_type, runids):
                runids_to_process.add(source.name)
        
        self.logger.start_phase(LoadPhase.LOADING_PARQUET, total_items=len(runids_to_process))
        
        total_updated = 0
        for runid in runids_to_process:
            try:
                self.logger.item_start(runid)
                
                # Load each parquet type for this runid
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
                logger.warning(f"Could not load {data_type} for {runid}: {e}")
                return None
        return None


def load_with_discovery(
    verbose: bool = True,
    runids: Optional[list[str]] = None,
    config: Optional[LoaderConfig] = None,
) -> dict:
    """
    Load watershed data with automatic discovery.
    
    This is the main entry point for loading watershed data. It automatically
    discovers available watersheds from the API and loads them into the database.
    
    Args:
        verbose: Whether to print verbose output during loading
        runids: Optional list of runids to load. If None, all are discovered.
        config: Optional loader configuration
    
    Returns:
        Dictionary with loading statistics:
        - watersheds_saved: Number of watersheds loaded
        - subcatchments_saved: Number of subcatchments loaded
        - channels_saved: Number of channels loaded
        - subcatchments_updated: Number updated with parquet data
    """
    loader = WatershedLoader(config=config)
    return loader.load(runids=runids, verbose=verbose)
