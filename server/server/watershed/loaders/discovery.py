"""
Automatic data source discovery for watershed loading.

This module discovers available watershed data dynamically by:
1. Fetching the master watersheds GeoJSON to get all runids (batch-based)
2. Using fixed URLs for standalone runs (non-batch)
3. Generating data URLs from templates based on runid patterns

Supports two source types:
- WatershedDataDiscovery: Batch-based discovery from a master GeoJSON
- StandaloneRunDiscovery: Fixed URLs for individual WEPPcloud runs
"""

import requests
import logging
from dataclasses import dataclass
from typing import Iterator, Optional
from pathlib import Path
from .config import LoaderConfig, BatchConfig, StandaloneRunConfig, get_config
from .exceptions import DataSourceError

logger = logging.getLogger("watershed.loader")


# Runid conversion utilities
# Canonical runid format examples:
#   NASA ROSES: "batch;;nasa-roses-2026-sbs;;OR-10" (uppercase state code)
#   Victoria:   "batch;;victoria-ca-2026-sbs;;Leech" (mixed-case proper noun, preserved as-is)
#   Standalone: "aversive-forestry" (single segment, never uppercased)


def normalize_runid(runid: str) -> str:
    """
    Normalize a runid to its canonical form.

    For the nasa-roses batch, the last segment is a US state code that was
    historically sometimes provided in lowercase; it is uppercased here for
    consistency.  For all other batches (e.g. victoria-ca-2026-sbs) the last
    segment is a mixed-case proper noun and must be left unchanged.
    Standalone runids (single segment) are always returned unchanged.

    Args:
        runid: Full runid format (e.g., "batch;;nasa-roses-2026-sbs;;or-10")

    Returns:
        Normalized runid

    Examples:
        "batch;;nasa-roses-2026-sbs;;or-10"  -> "batch;;nasa-roses-2026-sbs;;OR-10"
        "batch;;nasa-roses-2026-sbs;;OR-10"  -> "batch;;nasa-roses-2026-sbs;;OR-10"
        "batch;;victoria-ca-2026-sbs;;Leech" -> "batch;;victoria-ca-2026-sbs;;Leech"
        "aversive-forestry"                  -> "aversive-forestry"
    """
    parts = runid.split(";;")
    if len(parts) >= 2 and "nasa-roses" in parts[-2]:
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
    """
    subcatchments: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/dem/wbt/subcatchments.WGS.geojson"
    channels: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/dem/wbt/channels.WGS.geojson"
    hillslopes: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/watershed/hillslopes.parquet"
    soils: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/soils/soils.parquet"
    landuse: str = "{weppcloud_base}/runs/{runid}/disturbed_wbt/download/landuse/landuse.parquet"


class WatershedDataDiscovery:
    """
    Discovers available watershed data from a batch API.
    
    This class automatically:
    1. Fetches the master watersheds GeoJSON
    2. Extracts all available runids
    3. Generates data URLs from configurable templates
    
    The watersheds filename is derived from the batch URL, making it
    generic across different batches (e.g. nasa-roses, victoria).
    """
    
    def __init__(
        self,
        config: Optional[LoaderConfig] = None,
        batch_config: Optional[BatchConfig] = None,
        templates: Optional[UrlTemplates] = None,
        batch_config: Optional[BatchConfig] = None,
    ):
        """
        Initialize discovery with configuration.

        The watersheds filename and URL are derived automatically from the
        batch URL (last path segment), so no code changes are needed when
        switching between batches.

        Args:
            config: Loader configuration (uses default if not provided)
            templates: URL templates (uses default if not provided)
            batch_config: Explicit batch to target. If not provided, the first
                batch in ``config.api.batches`` is used.
        """
        self.config = config or get_config()
        self.templates = templates or UrlTemplates()
        self._cached_runids: Optional[list[str]] = None
        self._cached_watersheds_data: Optional[dict] = None

        # Resolve which batch this discovery instance targets.
        bc = batch_config or self.config.api.batches[0]
        # JWT token used only for the authenticated master GeoJSON fetch.
        self.jwt_token: Optional[str] = bc.jwt_token

        # Derive the batch name and watersheds filename from the batch URL
        # (last path segment), e.g.:
        #   .../batch/nasa-roses-2026-sbs  -> nasa-roses-2026-sbs_completed.geojson
        #   .../batch/victoria-ca-2026-sbs -> victoria-ca-2026-sbs_completed.geojson
        base = bc.batch_url.rstrip("/")
        batch_name = base.split("/")[-1]
        self.watersheds_filename = f"{batch_name}_completed.geojson"
        self.watersheds_url = f"{base}/download/resources/{self.watersheds_filename}"
    
    def discover_runids(self, force_refresh: bool = False) -> list[str]:
        """
        Fetch watersheds GeoJSON and extract all runids.
        
        Runids are normalized to canonical format.
        """
        if self._cached_runids is not None and not force_refresh:
            return self._cached_runids
        
        logger.info(f"Discovering runids from {self.watersheds_url}")
        
        headers = {}
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        
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
                # Normalize: uppercases state code for nasa-roses; preserves case for other batches
                runids.append(normalize_runid(runid))
        
        self._cached_runids = runids
        logger.info(f"Discovered {len(runids)} runids")
        
        return runids
    
    def get_watersheds_source(self) -> DataSource:
        """Get the data source for the master watersheds file."""
        local_path = self.config.local_data_dir / "watersheds" / self.watersheds_filename
        return DataSource(
            name="watersheds",
            url=self.watersheds_url,
            local_path=local_path if local_path.exists() else None,
            data_type="watersheds",
        )
    
    def get_urls_for_runid(self, runid: str) -> dict[str, str]:
        """Generate all data URLs for a given runid."""
        weppcloud_base = self.config.api.weppcloud_base_url.rstrip("/")
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
        """Check if a data source is available (HEAD request)."""
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
        local_path = self.config.local_data_dir / "watersheds" / self.watersheds_filename
        return local_path if local_path.exists() else None
    
    def iter_subcatchments_as_tuples(
        self, runids: Optional[list[str]] = None
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        for source in self.iter_subcatchments(runids):
            yield (source.name, source.url, source.local_path)
    
    def iter_channels_as_tuples(
        self, runids: Optional[list[str]] = None
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        for source in self.iter_channels(runids):
            yield (source.name, source.url, source.local_path)
    
    def iter_parquet_sources(
        self,
        data_type: str,
        runids: Optional[list[str]] = None,
    ) -> Iterator[tuple[str, str, Optional[Path]]]:
        for source in self.iter_sources(data_type, runids):
            yield (source.name, source.url, source.local_path)


class StandaloneRunDiscovery:
    """
    Discovery for standalone WEPPcloud runs (not part of a batch).
    
    Unlike WatershedDataDiscovery, this class doesn't fetch a master GeoJSON
    to discover runids. Instead, it uses fixed URLs from a StandaloneRunConfig.
    
    It implements the same interface as WatershedDataDiscovery so the loader
    can work with both interchangeably.
    """
    
    def __init__(
        self,
        standalone_config: StandaloneRunConfig,
        config: Optional[LoaderConfig] = None,
    ):
        self.standalone_config = standalone_config
        self.config = config or get_config()
        self.jwt_token = None
        self._urls = standalone_config.get_data_urls()
    
    def discover_runids(self, force_refresh: bool = False) -> list[str]:
        return [self.standalone_config.runid]
    
    def get_watersheds_url(self) -> str:
        return self.standalone_config.boundary_url
    
    def get_watersheds_local_path(self) -> Optional[Path]:
        local_path = (
            self.config.local_data_dir
            / "watersheds"
            / f"{self.standalone_config.runid}.geojson"
        )
        return local_path if local_path.exists() else None
    
    def get_watersheds_source(self) -> DataSource:
        local_path = self.get_watersheds_local_path()
        return DataSource(
            name="watersheds",
            url=self.standalone_config.boundary_url,
            local_path=local_path,
            data_type="watersheds",
        )
    
    def get_urls_for_runid(self, runid: str) -> dict[str, str]:
        return {k: v for k, v in self._urls.items() if k != "boundary"}
    
    def _get_local_path(self, runid: str, data_type: str, extension: str) -> Path:
        return self.config.local_data_dir / data_type / f"{runid}.{extension}"
    
    def iter_sources(
        self,
        data_type: str,
        runids: Optional[list[str]] = None,
    ) -> Iterator[DataSource]:
        target_runid = self.standalone_config.runid
        if runids is not None and target_runid not in runids:
            return
        
        url = self._urls.get(data_type)
        if url:
            extension = "parquet" if data_type in ("hillslopes", "soils", "landuse") else "geojson"
            local_path = self._get_local_path(target_runid, data_type, extension)
            yield DataSource(
                name=target_runid,
                url=url,
                local_path=local_path if local_path.exists() else None,
                data_type=data_type,
            )
    
    def iter_subcatchments(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        yield from self.iter_sources("subcatchments", runids)
    
    def iter_channels(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        yield from self.iter_sources("channels", runids)


def discover_all_runids(config: Optional[LoaderConfig] = None) -> list[str]:
    """
    Discover all available runids across all batches and standalone runs.
    """
    cfg = config or get_config()
    all_runids = []
    
    for batch_config in cfg.api.batches:
        discovery = WatershedDataDiscovery(config=cfg, batch_config=batch_config)
        all_runids.extend(discovery.discover_runids())
    
    for standalone in cfg.api.standalone_runs:
        all_runids.append(standalone.runid)
    
    return all_runids
