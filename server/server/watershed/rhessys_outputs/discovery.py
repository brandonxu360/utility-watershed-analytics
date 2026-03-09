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
    ScenarioMeta,
)

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

    result = {
        "scenarios": available_scenarios,
        "variables": variables,
    }
    _discovery_cache[runid] = result
    return result
