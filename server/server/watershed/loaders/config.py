"""
Centralized configuration for the data loading pipeline.

All configurable values that were previously hardcoded are consolidated here.
Values can be overridden via environment variables.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

def _get_env_int(key: str, default: int) -> int:
    """Get integer from environment variable with fallback."""
    value = os.environ.get(key)
    if value is not None:
        try:
            return int(value)
        except ValueError:
            pass
    return default


def _get_env_float(key: str, default: float) -> float:
    """Get float from environment variable with fallback."""
    value = os.environ.get(key)
    if value is not None:
        try:
            return float(value)
        except ValueError:
            pass
    return default


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 6
    base_delay_seconds: float = 0.2
    
    @classmethod
    def from_environment(cls) -> "RetryConfig":
        """Create config from environment variables."""
        defaults = cls()
        return cls(
            max_attempts=_get_env_int("LOADER_RETRY_ATTEMPTS", cls.max_attempts),
            base_delay_seconds=_get_env_float("LOADER_RETRY_BASE_DELAY", cls.base_delay_seconds),
        )


@dataclass
class ApiConfig:
    """Configuration for external API endpoints."""
    weppcloud_base_url: str = "https://wc-prod.bearhive.duckdns.org/weppcloud"
    bucket_base_url: str = "https://bucket.bearhive.duckdns.org"
    default_config: str = "disturbed9002_wbt"
    
    @classmethod
    def from_environment(cls) -> "ApiConfig":
        """Create config from environment variables."""
        return cls(
            weppcloud_base_url=os.environ.get(
                "WEPPCLOUD_BASE_URL",
                cls.weppcloud_base_url
            ),
            bucket_base_url=os.environ.get(
                "BUCKET_BASE_URL",
                cls.bucket_base_url
            ),
            default_config=os.environ.get(
                "WEPPCLOUD_DEFAULT_CONFIG",
                cls.default_config
            ),
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
    """Reset the default configuration (useful for testing)."""
    global _default_config
    _default_config = None
