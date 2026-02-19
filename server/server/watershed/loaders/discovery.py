"""
Automatic data source discovery for watershed loading.

This module discovers available watershed data dynamically by:
1. Fetching the master watersheds GeoJSON to get all runids
2. Generating data URLs from templates based on runid patterns

Key benefits:
- No manual manifest maintenance required
- Automatically picks up new watersheds as they become available
- Centralizes URL pattern definitions
- Enables runtime validation of data availability
"""

import requests
import logging
from dataclasses import dataclass
from typing import Iterator, Optional
from pathlib import Path
from .config import LoaderConfig, get_config
from .exceptions import DataSourceError

logger = logging.getLogger("watershed.loader")


# Runid conversion utilities
# Canonical runid format: "batch;;nasa-roses-2026-sbs;;OR-10" (uppercase state code)
# Note: Watersheds file now contains correct uppercase state codes.
# Normalization is kept for defensive programming.

BATCH_NAME = "nasa-roses-2026-sbs"  # Used in URL templates


def normalize_runid(runid: str) -> str:
    """
    Ensure runid has uppercase state code.
    
    Defensive normalization since the data source now correctly provides
    uppercase state codes. Kept to handle any edge cases gracefully.
    
    Args:
        runid: Full runid format (e.g., "batch;;nasa-roses-2026-sbs;;or-10")
    
    Returns:
        Runid with uppercase state code
        
    Examples:
        "batch;;nasa-roses-2026-sbs;;OR-10" -> "batch;;nasa-roses-2026-sbs;;OR-10"
        "batch;;nasa-roses-2026-sbs;;or-10" -> "batch;;nasa-roses-2026-sbs;;OR-10"
    """
    parts = runid.split(";;")
    parts[-1] = parts[-1].upper()
    return ";;".join(parts)


@dataclass
class DataSource:
    """
    Represents a single data source (URL + optional local cache path).
    
    Attributes:
        name: Identifier for this source (typically runid)
        url: Remote URL to fetch data from
        local_path: Optional path to locally cached file
        data_type: Type of data (watersheds, subcatchments, channels, hillslopes, soils, landuse)
    """
    name: str
    url: str
    local_path: Optional[Path] = None
    data_type: str = ""
    
    def has_local_cache(self) -> bool:
        """Check if local cached file exists."""
        return self.local_path is not None and self.local_path.exists()


@dataclass
class UrlTemplates:
    """
    URL templates for generating data source URLs.
    
    Uses {weppcloud_base} and {runid} placeholders that get substituted
    with actual values at runtime.
    
    NASA ROSES 2026 URL patterns using the disturbed_wbt config:
    - Base: https://wepp.cloud/weppcloud/runs/{runid}/disturbed_wbt/download/...
    - Subcatchments: /download/dem/wbt/subcatchments.WGS.geojson
    - Channels: /download/dem/wbt/channels.WGS.geojson
    - Hillslopes: /download/watershed/hillslopes.parquet
    - Soils: /download/soils/soils.parquet
    - Landuse: /download/landuse/landuse.parquet
    
    Where {runid} is the full normalized runid: batch;;nasa-roses-2026-sbs;;OR-10
    """
    subcatchments: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/dem/wbt/subcatchments.WGS.geojson"
    channels: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/dem/wbt/channels.WGS.geojson"
    hillslopes: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/watershed/hillslopes.parquet"
    soils: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/soils/soils.parquet"
    landuse: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/landuse/landuse.parquet"


class WatershedDataDiscovery:
    """
    Discovers available watershed data from source APIs.
    
    This class automatically:
    1. Fetches the master watersheds GeoJSON
    2. Extracts all available runids
    3. Generates data URLs from configurable templates
    
    Example:
        discovery = WatershedDataDiscovery()
        
        # Get all available runids
        runids = discovery.discover_runids()
        
        # Generate URLs for a specific runid
        urls = discovery.get_urls_for_runid("batch;;nasa-roses-2026-sbs;;OR-20")
        
        # Iterate through all subcatchment sources
        for source in discovery.iter_subcatchments():
            process(source)
    """
    
    # Filename for the master watersheds (NASA ROSES 2026)
    WATERSHEDS_FILENAME = "nasa-roses-2026-sbs_completed.geojson"
    
    def __init__(
        self,
        config: Optional[LoaderConfig] = None,
        templates: Optional[UrlTemplates] = None,
    ):
        """
        Initialize discovery with configuration.
        
        Args:
            config: Loader configuration (uses default if not provided)
            templates: URL templates (uses default if not provided)
        """
        self.config = config or get_config()
        self.templates = templates or UrlTemplates()
        self._cached_runids: Optional[list[str]] = None
        self._cached_watersheds_data: Optional[dict] = None

        # Construct the watersheds URL from the configured batch base URL
        base = self.config.api.weppcloud_batch_url.rstrip("/")
        self.watersheds_url = f"{base}/download/resources/{self.WATERSHEDS_FILENAME}"
    
    def discover_runids(self, force_refresh: bool = False) -> list[str]:
        """
        Fetch watersheds GeoJSON and extract all runids.
        
        Runids are in canonical format (uppercase state codes).
        
        Args:
            force_refresh: If True, ignore cache and fetch fresh data
        
        Returns:
            List of all available runids in canonical format
        
        Raises:
            DataSourceError: If watersheds data cannot be fetched
        """
        if self._cached_runids is not None and not force_refresh:
            return self._cached_runids
        
        logger.info(f"Discovering runids from {self.watersheds_url}")
        
        headers = {}
        jwt_token = self.config.api.weppcloud_jwt_token
        if jwt_token:
            headers["Authorization"] = f"Bearer {jwt_token}"
        
        try:
            response = requests.get(self.watersheds_url, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            raise DataSourceError(
                f"Failed to fetch watersheds for discovery: {e}",
                url=self.watersheds_url
            )
        
        self._cached_watersheds_data = data
        
        runids = []
        for feature in data.get("features", []):
            runid = feature.get("properties", {}).get("runid")
            if runid:
                # Normalize (defensive - data should already be uppercase)
                runids.append(normalize_runid(runid))
        
        self._cached_runids = runids
        logger.info(f"Discovered {len(runids)} runids")
        
        return runids
    
    def get_watersheds_source(self) -> DataSource:
        """Get the data source for the master watersheds file."""
        local_path = self.config.local_data_dir / "watersheds" / self.WATERSHEDS_FILENAME
        return DataSource(
            name="watersheds",
            url=self.watersheds_url,
            local_path=local_path if local_path.exists() else None,
            data_type="watersheds",
        )
    
    def get_urls_for_runid(self, runid: str) -> dict[str, str]:
        """
        Generate all data URLs for a given runid.
        
        Args:
            runid: The watershed runid (any format - will be normalized)
        
        Returns:
            Dictionary mapping data type to URL
            
        Example:
            For runid "batch;;nasa-roses-2026-sbs;;or-10":
            {
                "subcatchments": "https://wepp.cloud/weppcloud/runs/batch;;nasa-roses-2026-sbs;;OR-10/disturbed_wbt/download/dem/wbt/subcatchments.WGS.geojson",
                ...
            }
        """
        weppcloud_base = self.config.api.weppcloud_base_url.rstrip("/")
        # Normalize runid (defensive uppercase conversion)
        normalized = normalize_runid(runid)
        
        return {
            "subcatchments": self.templates.subcatchments.format(
                weppcloud_base=weppcloud_base, runid=normalized
            ),
            "channels": self.templates.channels.format(
                weppcloud_base=weppcloud_base, runid=normalized
            ),
            "hillslopes": self.templates.hillslopes.format(
                weppcloud_base=weppcloud_base, runid=normalized
            ),
            "soils": self.templates.soils.format(
                weppcloud_base=weppcloud_base, runid=normalized
            ),
            "landuse": self.templates.landuse.format(
                weppcloud_base=weppcloud_base, runid=normalized
            ),
        }
    
    def _get_local_path(self, runid: str, data_type: str, extension: str) -> Path:
        """Generate local cache path for a data file."""
        return self.config.local_data_dir / data_type / f"{runid}.{extension}"
    
    def iter_sources(
        self,
        data_type: str,
        runids: Optional[list[str]] = None,
    ) -> Iterator[DataSource]:
        """
        Iterate through data sources of a specific type.
        
        Args:
            data_type: One of 'subcatchments', 'channels', 'hillslopes', 'soils', 'landuse'
            runids: Optional filter - only yield sources for these runids
        
        Yields:
            DataSource objects for each available data file
        """
        available_runids = runids if runids is not None else self.discover_runids()
        
        extension = "parquet" if data_type in ("hillslopes", "soils", "landuse") else "geojson"
        
        for runid in available_runids:
            urls = self.get_urls_for_runid(runid)
            url = urls.get(data_type)
            if url:
                local_path = self._get_local_path(runid, data_type, extension)
                yield DataSource(
                    name=runid,
                    url=url,
                    local_path=local_path if local_path.exists() else None,
                    data_type=data_type,
                )
    
    def iter_subcatchments(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        """Iterate through subcatchment data sources."""
        yield from self.iter_sources("subcatchments", runids)
    
    def iter_channels(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        """Iterate through channel data sources."""
        yield from self.iter_sources("channels", runids)
    
    def iter_hillslopes(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        """Iterate through hillslope parquet data sources."""
        yield from self.iter_sources("hillslopes", runids)
    
    def iter_soils(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        """Iterate through soils parquet data sources."""
        yield from self.iter_sources("soils", runids)
    
    def iter_landuse(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        """Iterate through landuse parquet data sources."""
        yield from self.iter_sources("landuse", runids)
    
    def check_availability(self, source: DataSource, timeout: float = 5.0) -> bool:
        """
        Check if a data source is available (HEAD request).
        
        Args:
            source: The data source to check
            timeout: Request timeout in seconds
        
        Returns:
            True if the source is available, False otherwise
        """
        if source.has_local_cache():
            return True
        
        try:
            response = requests.head(source.url, timeout=timeout)
            return response.status_code == 200
        except requests.RequestException:
            return False
    
    # DataSourceProvider protocol implementation
    
    def get_watersheds_url(self) -> str:
        """Get the URL for the master watersheds file."""
        return self.watersheds_url
    
    def get_watersheds_local_path(self) -> Optional[Path]:
        """Get the local cache path for watersheds, if available."""
        local_path = self.config.local_data_dir / "watersheds" / self.WATERSHEDS_FILENAME
        return local_path if local_path.exists() else None
    
    def iter_subcatchments_as_tuples(
        self, runids: Optional[list[str]] = None
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        """
        Iterate through subcatchment data sources as tuples.
        
        This method implements the DataSourceProvider protocol.
        
        Yields:
            Tuples of (runid, url, local_path)
        """
        for source in self.iter_subcatchments(runids):
            yield (source.name, source.url, source.local_path)
    
    def iter_channels_as_tuples(
        self, runids: Optional[list[str]] = None
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        """
        Iterate through channel data sources as tuples.
        
        This method implements the DataSourceProvider protocol.
        
        Yields:
            Tuples of (runid, url, local_path)
        """
        for source in self.iter_channels(runids):
            yield (source.name, source.url, source.local_path)
    
    def iter_parquet_sources(
        self,
        data_type: str,
        runids: Optional[list[str]] = None,
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        """
        Iterate through parquet data sources as tuples.
        
        Args:
            data_type: One of 'hillslopes', 'soils', 'landuse'
            runids: Optional filter for specific runids
        
        Yields:
            Tuples of (runid, url, local_path)
        """
        for source in self.iter_sources(data_type, runids):
            yield (source.name, source.url, source.local_path)


# Convenience function for simple usage
def discover_all_runids(config: Optional[LoaderConfig] = None) -> list[str]:
    """
    Discover all available runids.
    
    This is a convenience function for simple usage patterns.
    For more control, use the WatershedDataDiscovery class directly.
    """
    discovery = WatershedDataDiscovery(config=config)
    return discovery.discover_runids()
