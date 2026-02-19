"""
Protocol definitions for dependency injection in the data loading pipeline.

These protocols define interfaces that can be implemented by different
backends (real implementations, mocks for testing, etc.), enabling
proper unit testing without network or database access.
"""

from typing import Protocol, Optional, Iterator, Any, runtime_checkable
import pandas as pd
from pathlib import Path


@runtime_checkable
class DataSourceReader(Protocol):
    """
    Protocol for reading data from local or remote sources.
    
    Implementations handle the details of:
    - Local cache checking
    - Remote fetching with retries
    - File format parsing (GeoJSON, Parquet)
    """
    
    def read_geojson(
        self,
        url: str,
        local_path: Optional[Path] = None,
        headers: Optional[dict] = None,
    ) -> Any:
        """
        Read GeoJSON data from URL or local cache.
        
        Args:
            url: Remote URL to fetch from if local not available
            local_path: Optional local cache path to check first
            headers: Optional HTTP headers to include in the request (e.g. Authorization)
        
        Returns:
            GDAL DataSource or compatible object with layer access
        """
        ...
    
    def read_parquet(self, url: str, local_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Read Parquet data from URL or local cache.
        
        Args:
            url: Remote URL to fetch from if local not available
            local_path: Optional local cache path to check first
        
        Returns:
            Pandas DataFrame with parquet data
        """
        ...


@runtime_checkable
class DataWriter(Protocol):
    """
    Protocol for writing data to the database.
    
    Implementations handle Django ORM operations, allowing tests
    to use mock writers that don't require a database.
    """
    
    def save_watersheds(self, layer: Any) -> int:
        """
        Save watershed features from a GDAL layer.
        
        Args:
            layer: GDAL Layer containing watershed features
        
        Returns:
            Number of watersheds saved
        """
        ...
    
    def save_watersheds_filtered(self, layer: Any, runids: set[str]) -> int:
        """
        Save only watersheds matching the given runids.
        
        Args:
            layer: GDAL Layer containing watershed features
            runids: Set of runids to filter by
        
        Returns:
            Number of watersheds saved
        """
        ...
    
    def save_subcatchments(self, runid: str, layer: Any) -> int:
        """
        Save subcatchment features for a watershed.
        
        Args:
            runid: The parent watershed runid
            layer: GDAL Layer containing subcatchment features
        
        Returns:
            Number of subcatchments saved
        """
        ...
    
    def save_channels(self, runid: str, layer: Any) -> int:
        """
        Save channel features for a watershed.
        
        Args:
            runid: The parent watershed runid
            layer: GDAL Layer containing channel features
        
        Returns:
            Number of channels saved
        """
        ...
    
    def update_subcatchments_from_parquet(
        self,
        runid: str,
        hillslopes: Optional[pd.DataFrame],
        soils: Optional[pd.DataFrame],
        landuse: Optional[pd.DataFrame],
    ) -> int:
        """
        Update subcatchment records with parquet data.
        
        Args:
            runid: The watershed runid
            hillslopes: DataFrame with hillslope data (may be None)
            soils: DataFrame with soils data (may be None)
            landuse: DataFrame with landuse data (may be None)
        
        Returns:
            Number of subcatchments updated
        """
        ...


@runtime_checkable
class DataSourceProvider(Protocol):
    """
    Protocol for providing data source information.
    
    Implemented by WatershedDataDiscovery for automatic discovery
    of available watershed data from the API.
    """
    
    def get_watersheds_url(self) -> str:
        """Get the URL for the master watersheds file."""
        ...
    
    def get_watersheds_local_path(self) -> Optional[Path]:
        """Get the local cache path for watersheds, if available."""
        ...
    
    def iter_subcatchments(
        self, runids: Optional[list[str]] = None
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        """
        Iterate through subcatchment data sources.
        
        Args:
            runids: Optional filter for specific runids
        
        Yields:
            Tuples of (runid, url, local_path)
        """
        ...
    
    def iter_channels(
        self, runids: Optional[list[str]] = None
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        """
        Iterate through channel data sources.
        
        Args:
            runids: Optional filter for specific runids
        
        Yields:
            Tuples of (runid, url, local_path)
        """
        ...
    
    def iter_parquet_sources(
        self,
        data_type: str,
        runids: Optional[list[str]] = None,
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        """
        Iterate through parquet data sources.
        
        Args:
            data_type: One of 'hillslopes', 'soils', 'landuse'
            runids: Optional filter for specific runids
        
        Yields:
            Tuples of (runid, url, local_path)
        """
        ...
