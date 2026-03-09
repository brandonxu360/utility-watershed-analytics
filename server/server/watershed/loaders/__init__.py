"""
Watershed data loaders package.

This package provides components for loading watershed data from remote
sources into the database using automatic discovery.

Key components:
- WatershedLoader: Main loader class with dependency injection support
- load_with_discovery: Convenience function for loading watershed data
- WatershedDataDiscovery: Auto-discovery of available data sources
- Protocols: DataSourceReader, DataWriter for testability
"""

from .config import LoaderConfig, BatchConfig, StandaloneRunConfig, get_config, reset_config, resolve_run_base_url
from .discovery import WatershedDataDiscovery, StandaloneRunDiscovery, DataSource, discover_all_runids
from .loader import WatershedLoader, load_with_discovery
from .protocols import DataSourceReader, DataWriter, DataSourceProvider
from .readers import RemoteDataSourceReader
from .writers import DjangoDataWriter
from .exceptions import DataLoadError, DataSourceError

__all__ = [
    # Main loader
    "WatershedLoader",
    "load_with_discovery",
    # Configuration
    "LoaderConfig",
    "BatchConfig",
    "StandaloneRunConfig",
    "get_config",
    "reset_config",
    "resolve_run_base_url",
    # Discovery
    "WatershedDataDiscovery",
    "StandaloneRunDiscovery",
    "DataSource",
    "discover_all_runids",
    # Protocols (for testing/extension)
    "DataSourceReader",
    "DataWriter",
    "DataSourceProvider",
    # Implementations
    "RemoteDataSourceReader",
    "DjangoDataWriter",
    # Exceptions
    "DataLoadError",
    "DataSourceError",
]
