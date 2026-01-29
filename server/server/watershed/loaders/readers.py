"""
Concrete implementations of data source readers.

This module provides the real implementations that read from local files
or remote URLs. For testing, mock implementations can be injected instead.
"""

import logging
import requests
import pandas as pd
from io import BytesIO
from pathlib import Path
from typing import Optional, Any

from django.contrib.gis.gdal import DataSource as GDALDataSource

from .config import LoaderConfig, get_config
from .exceptions import DataSourceError
from .protocols import DataSourceReader
from server.watershed.utils.retry import with_retry

logger = logging.getLogger("watershed.loader")


class RemoteDataSourceReader:
    """
    Production implementation of DataSourceReader.
    
    Reads GeoJSON and Parquet files from local cache or remote URLs,
    with automatic retry logic for transient network failures.
    """
    
    def __init__(self, config: Optional[LoaderConfig] = None):
        self.config = config or get_config()
    
    def read_geojson(self, url: str, local_path: Optional[Path] = None) -> GDALDataSource:
        """
        Read GeoJSON data, checking local cache first.
        
        Args:
            url: Remote URL to fetch from if local not available
            local_path: Optional local cache path to check first
        
        Returns:
            GDAL DataSource object
        """
        # Check local cache first
        if local_path and local_path.exists():
            logger.debug(f"Loading GeoJSON from local cache: {local_path}")
            return GDALDataSource(str(local_path))
        
        # Fall back to remote with retry
        logger.debug(f"Fetching GeoJSON from remote: {url}")
        return self._fetch_geojson_with_retry(url)
    
    def _fetch_geojson_with_retry(self, url: str) -> GDALDataSource:
        """Fetch GeoJSON from URL with retry logic."""
        @with_retry(
            max_attempts=self.config.retry.max_attempts,
            base_delay=self.config.retry.base_delay_seconds,
        )
        def fetch() -> GDALDataSource:
            return GDALDataSource(url)
        
        try:
            return fetch()
        except Exception as e:
            raise DataSourceError(
                f"Failed to fetch GeoJSON after {self.config.retry.max_attempts} attempts: {e}",
                url=url
            ) from e
    
    def read_parquet(self, url: str, local_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Read Parquet data, checking local cache first.
        
        Args:
            url: Remote URL to fetch from if local not available
            local_path: Optional local cache path to check first
        
        Returns:
            Pandas DataFrame
        """
        # Check local cache first
        if local_path and local_path.exists():
            logger.debug(f"Loading parquet from local cache: {local_path}")
            return pd.read_parquet(local_path)
        
        # Fall back to remote with retry
        logger.debug(f"Fetching parquet from remote: {url}")
        return self._fetch_parquet_with_retry(url)
    
    def _fetch_parquet_with_retry(self, url: str) -> pd.DataFrame:
        """Fetch Parquet from URL with retry logic."""
        @with_retry(
            max_attempts=self.config.retry.max_attempts,
            base_delay=self.config.retry.base_delay_seconds,
        )
        def fetch() -> pd.DataFrame:
            response = requests.get(url)
            response.raise_for_status()
            return pd.read_parquet(BytesIO(response.content))
        
        try:
            return fetch()
        except Exception as e:
            raise DataSourceError(
                f"Failed to fetch parquet after {self.config.retry.max_attempts} attempts: {e}",
                url=url
            ) from e


# Verify the class implements the protocol (this is a static type check)
def _check_protocol_conformance() -> DataSourceReader:
    """Type check to ensure RemoteDataSourceReader conforms to protocol."""
    return RemoteDataSourceReader()
