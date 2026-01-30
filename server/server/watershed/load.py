"""
Main entry point for watershed data loading.

This module orchestrates the data loading pipeline and handles
geometry simplification after data is loaded.

The loader automatically discovers available watershed data from the API,
eliminating the need for manual manifest maintenance, and loads data into
the database with proper geometry processing.
"""

import logging
from typing import Optional

from django.db import connection

from server.watershed.loaders.loader import load_with_discovery
from server.watershed.loaders.config import LoaderConfig, get_config
from server.watershed.utils.logging import configure_logging

logger = logging.getLogger("watershed.loader")


def run(
    verbose: bool = True,
    runids: Optional[list[str]] = None,
    config: Optional[LoaderConfig] = None,
) -> dict:
    """
    Load watershed data and update simplified geometries.
    
    This is the main entry point for the data loading pipeline. It automatically
    discovers available watershed data from the API and loads it into the database.
    
    Args:
        verbose: Whether to print verbose output during loading
        runids: Optional list of runids to load. If None, all watersheds are loaded.
        config: Optional loader configuration. If None, uses default from environment.
    
    Returns:
        Dictionary with loading statistics:
        - watersheds_saved: Number of watersheds loaded
        - subcatchments_saved: Number of subcatchments loaded
        - channels_saved: Number of channels loaded
        - subcatchments_updated: Number updated with parquet data
    
    Raises:
        DataLoadError: If data loading fails
    """
    cfg = config or get_config()
    configure_logging(verbose=verbose)
    
    logger.info("Starting watershed data loading...")
    result = load_with_discovery(verbose=verbose, runids=runids, config=cfg)

    # Update the simplified_geom field using PostGIS simplify
    # (more efficient than using GEOS simplify in the application)
    logger.info("Simplifying watershed geometries...")
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE watershed_watershed
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, %s)
            WHERE geom IS NOT NULL;
            """,
            [cfg.geometry.simplify_tolerance]
        )
    
    logger.info("Watershed data loading complete")
    return result