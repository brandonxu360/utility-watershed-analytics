"""
Discover available RHESSys spatial input GeoTIFFs for a watershed by
probing the WEPPcloud file browser.

Results are cached in memory with a TTL so the remote server is not
hammered on every API request.
"""

from __future__ import annotations

import logging
import re
from typing import Optional

import requests
from cachetools import TTLCache

from server.watershed.loaders.config import get_config
from .registry import (
    get_display_name,
    get_meta,
    get_render_range,
)

logger = logging.getLogger("watershed.rhessys_spatial")

_BROWSE_SUBPATH = "browse/rhessys/spatial_inputs_and_climates/"
_DOWNLOAD_SUBPATH = "download/rhessys/spatial_inputs_and_climates"

# filename → [metadata dicts] per runid, cached for 1 hour, up to 100 watersheds
_discovery_cache: TTLCache[str, Optional[list[dict]]] = TTLCache(maxsize=100, ttl=3600)


def _resolve_run_base_url(runid: str) -> str:
    """Resolve the WEPPcloud run base URL for a given runid.

    Checks standalone run configs first (which have an explicit base URL),
    then falls back to the batch convention.
    """
    config = get_config()
    for sr in config.api.standalone_runs:
        if sr.runid == runid:
            return sr.run_base_url.rstrip("/")

    base = config.api.weppcloud_base_url.rstrip("/")
    return f"{base}/runs/{runid}/disturbed_wbt"


def get_download_url(runid: str, filename: str) -> str:
    """Build the full download URL for a specific spatial input GeoTIFF."""
    base = _resolve_run_base_url(runid)
    return f"{base}/{_DOWNLOAD_SUBPATH}/{filename}"


def _fetch_browse_page(runid: str) -> Optional[str]:
    """Fetch the HTML directory listing from WEPPcloud, or None on failure."""
    base = _resolve_run_base_url(runid)
    url = f"{base}/{_BROWSE_SUBPATH}"
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            return resp.text
        logger.info(
            "Browse page returned %d for runid=%s url=%s",
            resp.status_code, runid, url,
        )
    except requests.RequestException as exc:
        logger.warning("Failed to fetch browse page for runid=%s: %s", runid, exc)
    return None


_TIF_PATTERN = re.compile(r'[\w\-]+\.tif(?=[\s"\'<>])')


def _parse_tif_filenames(html: str) -> list[str]:
    """Extract unique .tif filenames from the WEPPcloud browse page HTML."""
    matches = _TIF_PATTERN.findall(html)
    seen: set[str] = set()
    result: list[str] = []
    for name in matches:
        if name not in seen:
            seen.add(name)
            result.append(name)
    result.sort()
    return result


def _build_file_metadata(filename: str) -> dict:
    """Build metadata dict for a single spatial input file."""
    meta = get_meta(filename)
    if meta:
        lo, hi = get_render_range(meta)
        return {
            "filename": filename,
            "name": meta.name,
            "type": meta.data_type,
            "min": lo,
            "max": hi,
            "unique_values": meta.unique_values,
            "group": meta.group,
            "reversed": meta.reversed_colormap,
        }
    return {
        "filename": filename,
        "name": get_display_name(filename),
        "type": "continuous",
        "min": None,
        "max": None,
        "unique_values": None,
        "group": None,
        "reversed": False,
    }


def discover_spatial_inputs(runid: str) -> Optional[list[dict]]:
    """Discover available RHESSys spatial input GeoTIFFs for a watershed.

    Returns a list of metadata dicts, or None if the watershed has no
    RHESSys data (browse page returned 404 / error).  Results are cached.
    """
    if runid in _discovery_cache:
        return _discovery_cache[runid]

    html = _fetch_browse_page(runid)
    if html is None:
        _discovery_cache[runid] = None
        return None

    filenames = _parse_tif_filenames(html)
    if not filenames:
        _discovery_cache[runid] = None
        return None

    result = [_build_file_metadata(f) for f in filenames]
    _discovery_cache[runid] = result
    return result
