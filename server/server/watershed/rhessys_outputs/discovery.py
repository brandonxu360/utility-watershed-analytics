"""
Discover available RHESSys output map products for a watershed by probing
the WEPPcloud file browser under ``rhessys/maps/``.

The pre-computed maps (Victoria + Mill Creek) live in scenario subdirectories
(e.g. ``baseline/``, ``Pspread_fire_1yr_change/``) each containing variable
GeoTIFFs (``streamflow.tif``, ``lai.tif``, etc.).

Results are cached in memory with a TTL so the remote server is not hammered
on every API request.
"""

from __future__ import annotations

import logging
import re
from typing import Optional

import requests
from cachetools import TTLCache

from server.watershed.loaders.config import resolve_run_base_url
from .registry import (
    SCENARIO_BY_ID,
    VARIABLE_BY_FILENAME,
    OUTPUT_VARIABLES,
    SCENARIO_REGISTRY,
)
from .tile import _get_global_minmax

logger = logging.getLogger("watershed.rhessys_outputs")

_BROWSE_MAPS = "browse/rhessys/maps/"
_DOWNLOAD_MAPS = "download/rhessys/maps"

_discovery_cache: TTLCache[str, Optional[dict]] = TTLCache(maxsize=100, ttl=3600)

_DIR_PATTERN = re.compile(r'[\w\-]+(?=[\s"\'<>])')
_TIF_PATTERN = re.compile(r'[\w\-\.]+\.tif(?=[\s"\'<>])')


def get_map_download_url(runid: str, scenario: str, filename: str) -> str:
    """Build the full download URL for a specific map GeoTIFF."""
    base = resolve_run_base_url(runid)
    return f"{base}/{_DOWNLOAD_MAPS}/{scenario}/{filename}"


def _fetch_page(url: str) -> Optional[str]:
    """Fetch an HTML directory listing, or None on failure."""
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            return resp.text
        logger.info("Browse page returned %d for %s", resp.status_code, url)
    except requests.RequestException as exc:
        logger.warning("Failed to fetch browse page %s: %s", url, exc)
    return None


def _discover_scenarios(runid: str) -> list[str]:
    """List subdirectory names under rhessys/maps/ for a watershed."""
    base = resolve_run_base_url(runid)
    html = _fetch_page(f"{base}/{_BROWSE_MAPS}")
    if html is None:
        return []

    candidates = _DIR_PATTERN.findall(html)
    known = {s.id for s in SCENARIO_REGISTRY}
    seen: set[str] = set()
    result: list[str] = []
    for name in candidates:
        if name in known and name not in seen:
            seen.add(name)
            result.append(name)
    return result


def _discover_variables(runid: str, scenario: str) -> list[str]:
    """List .tif filenames within a scenario subdirectory."""
    base = resolve_run_base_url(runid)
    html = _fetch_page(f"{base}/{_BROWSE_MAPS}{scenario}/")
    if html is None:
        return []

    matches = _TIF_PATTERN.findall(html)
    seen: set[str] = set()
    result: list[str] = []
    for name in matches:
        if name in VARIABLE_BY_FILENAME and name not in seen:
            seen.add(name)
            result.append(name)
    result.sort()
    return result


def _compute_value_ranges(
    runid: str,
    scenarios: list[dict],
    variables: list[dict],
) -> dict[str, dict[str, dict]]:
    """Compute actual min/max value ranges for each scenario/variable.

    Returns a nested dict: {scenario_id: {variable_id: {min, max}}}
    Applies the same symmetrization logic used for rendering change maps.
    """
    ranges: dict[str, dict[str, dict]] = {}
    
    for scenario in scenarios:
        scenario_id = scenario["id"]
        is_change = scenario["is_change"]
        ranges[scenario_id] = {}
        
        for variable in variables:
            variable_id = variable["id"]
            filename = variable["filename"]
            
            # Only compute range if this variable exists in this scenario
            if variable_id not in scenario["variables"]:
                continue
            
            try:
                tif_url = get_map_download_url(runid, scenario_id, filename)
                min_val, max_val = _get_global_minmax(tif_url)
                
                # Apply same symmetrization logic as tile rendering for change maps
                if is_change and min_val < 0:
                    abs_max = max(abs(min_val), abs(max_val))
                    min_val = -abs_max
                    max_val = abs_max
                
                ranges[scenario_id][variable_id] = {
                    "min": float(min_val),
                    "max": float(max_val),
                }
            except Exception as e:
                logger.warning(
                    "Failed to compute range for %s/%s/%s: %s",
                    runid, scenario_id, variable_id, e,
                )
                continue
    
    return ranges


def discover_output_maps(runid: str) -> Optional[dict]:
    """Discover available RHESSys output map products for a watershed.

    Returns a dict with ``scenarios`` and ``variables`` lists, or None
    if the watershed has no map data.  Results are cached for 1 hour.
    """
    if runid in _discovery_cache:
        return _discovery_cache[runid]

    scenarios = _discover_scenarios(runid)
    if not scenarios:
        _discovery_cache[runid] = None
        return None

    available_scenarios: list[dict] = []
    all_variables: set[str] = set()

    for scenario_id in scenarios:
        meta = SCENARIO_BY_ID.get(scenario_id)
        if not meta:
            continue
        var_filenames = _discover_variables(runid, scenario_id)
        if not var_filenames:
            continue
        available_scenarios.append({
            "id": meta.id,
            "label": meta.label,
            "is_change": meta.is_change,
            "variables": [VARIABLE_BY_FILENAME[f].id for f in var_filenames],
        })
        all_variables.update(var_filenames)

    if not available_scenarios:
        _discovery_cache[runid] = None
        return None

    variables = []
    for var in OUTPUT_VARIABLES:
        if var.filename in all_variables:
            variables.append({
                "id": var.id,
                "label": var.label,
                "units": var.units,
                "filename": var.filename,
            })

    # Compute value ranges for each scenario/variable combination
    value_ranges = _compute_value_ranges(runid, available_scenarios, variables)

    result = {
        "scenarios": available_scenarios,
        "variables": variables,
        "value_ranges": value_ranges,
    }
    _discovery_cache[runid] = result
    return result
