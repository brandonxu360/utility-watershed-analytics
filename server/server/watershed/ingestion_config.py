"""
Ingestion configuration settings for watershed data loading.

Provides environment-aware defaults and centralized configuration
for the data ingestion pipeline.
"""
import os
from pathlib import Path
from django.conf import settings


def get_ingestion_config():
    """
    Get ingestion configuration with environment-aware defaults.
    
    Returns:
        dict: Configuration dictionary with the following keys:
            - MODE: "url" | "download" - Whether to stream from URL or download first
            - MAX_WORKERS: int - Number of parallel workers for IO operations
            - BATCH_SIZE: int - Database transaction batch size
            - SCOPE: "auto" | "dev_subset" | "all" - Amount of data to load
            - SUBSET_SIZE: int - Number of entries to load in dev subset mode
            - LOG_JSON: bool - Whether to emit structured JSON logs
            - DOWNLOAD_DIR: str - Directory for downloaded files (download mode only)
    """
    # Check if user has overridden in settings.py
    if hasattr(settings, 'INGESTION'):
        user_config = settings.INGESTION
    else:
        user_config = {}
    
    # Determine if we're in debug/dev mode
    is_debug = getattr(settings, 'DEBUG', False)
    
    # Build config with defaults
    config = {
        'MODE': user_config.get('MODE', 'url'),
        'MAX_WORKERS': user_config.get('MAX_WORKERS', 4),
        'BATCH_SIZE': user_config.get('BATCH_SIZE', 500),
        'SCOPE': user_config.get('SCOPE', 'auto'),
        'SUBSET_SIZE': user_config.get('SUBSET_SIZE', 50),
        'LOG_JSON': user_config.get('LOG_JSON', False),
        'DOWNLOAD_DIR': user_config.get('DOWNLOAD_DIR', '/tmp/ingestion'),
    }
    
    # Resolve "auto" scope based on DEBUG setting
    if config['SCOPE'] == 'auto':
        config['SCOPE'] = 'dev_subset' if is_debug else 'all'
    
    return config


def get_manifest_path():
    """
    Get the default path to the data manifest file.
    
    Returns:
        Path: Absolute path to data-manifest.yaml
    """
    return Path(__file__).resolve().parent.parent.parent / "data-manifest.yaml"
