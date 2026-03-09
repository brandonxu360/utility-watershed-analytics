"""
Centralized configuration for the data loading pipeline.

All configurable values that were previously hardcoded are consolidated here.
Some runtime settings can be overridden via environment variables.

Supports two types of data sources:
- Batch-based: Multiple watersheds discovered from a master GeoJSON (e.g. NASA ROSES)
- Standalone runs: Individual WEPPcloud runs with fixed URLs (e.g. Gate Creek)
"""

import os
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger("watershed.loader")

def _get_env_int(key: str, default: int) -> int:
    """Get integer from environment variable with fallback."""
    value = os.environ.get(key)
    if value is not None:
        try:
            return int(value)
        except ValueError:
            logger.warning(
                "Environment variable %s=%r is not an int; using default %s",
                key, value, default
            )
    return default


def _get_env_float(key: str, default: float) -> float:
    """Get float from environment variable with fallback."""
    value = os.environ.get(key)
    if value is not None:
        try:
            return float(value)
        except ValueError:
            logger.warning(
                "Environment variable %s=%r is not a float; using default %s",
                key, value, default
            )
    return default


def _get_env_str(key: str, default: str) -> str:
    """Get string from environment, treating empty string as unset."""
    value = os.environ.get(key)
    if value:
        return value
    return default


@dataclass
class BatchConfig:
    """
    Configuration for a single WEPPcloud batch.

    Each batch has its own URL for discovering watersheds and an optional
    JWT token for authenticated access to the master GeoJSON.

    If ``watersheds_filename`` is provided it overrides the default filename
    derived from the batch URL (``{batch_name}_completed.geojson``). Use this
    when the master GeoJSON has been published under a custom name (e.g. a
    file that has utility metadata merged in).
    """
    batch_url: str
    jwt_token: Optional[str] = None
    watersheds_filename: Optional[str] = None


@dataclass
class StandaloneRunConfig:
    """
    Configuration for a standalone WEPPcloud run (not part of a batch).

    Standalone runs have a fixed runid and URLs derived from a known base URL
    rather than being discovered from a batch API.

    The ``dem_processor`` field controls the DEM sub-path and filename
    conventions used for subcatchment / channel / boundary GeoJSON files:
      - ``"wbt"``   (default) — ``dem/wbt/subcatchments.WGS.geojson``
      - ``"topaz"`` — ``dem/topaz/SUBCATCHMENTS.WGS.JSON`` (uppercase filenames)
    """
    runid: str
    display_name: str
    run_base_url: str
    boundary_url: str
    dem_processor: str = "wbt"

    _DEM_PATHS: dict = field(default=None, init=False, repr=False)

    def __post_init__(self):
        self._DEM_PATHS = {
            "wbt": {
                "subcatchments": "dem/wbt/subcatchments.WGS.geojson",
                "channels": "dem/wbt/channels.WGS.geojson",
            },
            "topaz": {
                "subcatchments": "dem/topaz/SUBCATCHMENTS.WGS.JSON",
                "channels": "dem/topaz/CHANNELS.WGS.JSON",
            },
        }

    def get_data_urls(self) -> dict[str, str]:
        """Generate all data URLs from the run base URL."""
        base = self.run_base_url.rstrip("/")
        dem = self._DEM_PATHS.get(self.dem_processor, self._DEM_PATHS["wbt"])
        return {
            "boundary": self.boundary_url,
            "subcatchments": f"{base}/download/{dem['subcatchments']}",
            "channels": f"{base}/download/{dem['channels']}",
            "hillslopes": f"{base}/download/watershed/hillslopes.parquet",
            "soils": f"{base}/download/soils/soils.parquet",
            "landuse": f"{base}/download/landuse/landuse.parquet",
        }


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 6
    base_delay_seconds: float = 0.2

    @classmethod
    def from_environment(cls) -> "RetryConfig":
        """Create config from environment variables."""
        return cls(
            max_attempts=_get_env_int("LOADER_RETRY_ATTEMPTS", cls.max_attempts),
            base_delay_seconds=_get_env_float("LOADER_RETRY_BASE_DELAY", cls.base_delay_seconds),
        )


def _default_batches() -> list[BatchConfig]:
    return [
        BatchConfig(
            batch_url="https://wepp.cloud/weppcloud/batch/nasa-roses-2026-sbs",
            jwt_token=os.environ.get("WEPPCLOUD_JWT_TOKEN"),
            # Drop-in replacement GeoJSON with utility metadata merged in
            # (OwnerType, PopGroup, TreatType, ConnGroup + HUC10 aggregates).
            # Must contain current nasa-roses-2026-sbs runids.
            watersheds_filename="WWS_Watersheds_HUC10_psbs_030426.geojson",
        ),
        BatchConfig(
            batch_url="https://wepp.cloud/weppcloud/batch/victoria-ca-2026-sbs",
            jwt_token=os.environ.get("WEPPCLOUD_JWT_TOKEN_2"),
        ),
    ]


def _default_standalone_runs() -> list[StandaloneRunConfig]:
    return [
        StandaloneRunConfig(
            runid="aversive-forestry",
            display_name="Gate Creek",
            run_base_url="https://wepp.cloud/weppcloud/runs/aversive-forestry/disturbed9002_wbt",
            boundary_url="https://wepp.cloud/weppcloud/runs/aversive-forestry/disturbed9002_wbt/download/dem/wbt/bound.geojson",
        ),
        StandaloneRunConfig(
            runid="mdobre-invincible-scarab",
            display_name="Mill Creek",
            run_base_url="https://wepp.cloud/weppcloud/runs/mdobre-invincible-scarab/disturbed9002",
            boundary_url="https://wepp.cloud/weppcloud/runs/mdobre-invincible-scarab/disturbed9002/download/dem/topaz/BOUND.WGS.JSON",
            dem_processor="topaz",
        ),
    ]


@dataclass
class ApiConfig:
    """Configuration for external API endpoints."""
    weppcloud_base_url: str = "https://wepp.cloud/weppcloud"
    # List of batches to load. Batch URLs are defined in _default_batches().
    # Tokens are provided via WEPPCLOUD_JWT_TOKEN / WEPPCLOUD_JWT_TOKEN_2.
    batches: list[BatchConfig] = field(default_factory=_default_batches)
    standalone_runs: list[StandaloneRunConfig] = field(default_factory=_default_standalone_runs)

    @classmethod
    def from_environment(cls) -> "ApiConfig":
        """Create config from environment variables."""
        return cls(
            weppcloud_base_url=_get_env_str(
                "WEPPCLOUD_BASE_URL",
                cls.weppcloud_base_url,
            ),
            batches=_default_batches(),
            standalone_runs=_default_standalone_runs(),
        )


@dataclass
class GeometryConfig:
    """Configuration for geometry processing."""
    simplify_tolerance: float = 0.00025
    bulk_update_batch_size: int = 500

    @classmethod
    def from_environment(cls) -> "GeometryConfig":
        """Create config from environment variables."""
        return cls(
            simplify_tolerance=_get_env_float("GEOMETRY_SIMPLIFY_TOLERANCE", cls.simplify_tolerance),
            bulk_update_batch_size=_get_env_int("BULK_UPDATE_BATCH_SIZE", cls.bulk_update_batch_size),
        )


@dataclass
class LoaderConfig:
    """
    Master configuration for the data loading pipeline.

    Consolidates all configuration from environment variables.

    Usage:
        config = LoaderConfig.from_environment()
        # or
        config = LoaderConfig()  # uses defaults
    """
    retry: RetryConfig = field(default_factory=RetryConfig)
    api: ApiConfig = field(default_factory=ApiConfig)
    geometry: GeometryConfig = field(default_factory=GeometryConfig)

    # Paths
    local_data_dir: Path = field(default_factory=lambda: Path(__file__).resolve().parent.parent / "data")

    @classmethod
    def from_environment(cls) -> "LoaderConfig":
        """
        Create configuration from environment variables.
        """
        config = cls(
            retry=RetryConfig.from_environment(),
            api=ApiConfig.from_environment(),
            geometry=GeometryConfig.from_environment(),
        )

        # Override local data dir from environment if provided
        data_dir = os.environ.get("LOADER_DATA_DIR")
        if data_dir:
            config.local_data_dir = Path(data_dir)

        return config


# Default singleton instance for convenience
_default_config: Optional[LoaderConfig] = None


def get_config() -> LoaderConfig:
    """
    Get the default loader configuration.

    Lazily initializes from environment on first call.
    """
    global _default_config
    if _default_config is None:
        _default_config = LoaderConfig.from_environment()
    return _default_config


def reset_config() -> None:
    """Reset the default configuration singleton (useful for testing)."""
    global _default_config
    _default_config = None


def resolve_run_base_url(runid: str) -> str:
    """Resolve the WEPPcloud run base URL for a given runid.

    Checks standalone run configs first (which have an explicit base URL),
    then falls back to the batch convention (``{base}/runs/{runid}/disturbed_wbt``).
    """
    config = get_config()
    for sr in config.api.standalone_runs:
        if sr.runid == runid:
            return sr.run_base_url.rstrip("/")

    base = config.api.weppcloud_base_url.rstrip("/")
    return f"{base}/runs/{runid}/disturbed_wbt"
