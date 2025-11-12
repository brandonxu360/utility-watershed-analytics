#!/usr/bin/env python3
"""
Script to add hillslopes, soils, and landuse parquet file entries to the data manifest.
"""
import requests
import yaml
from pathlib import Path

API_URL = "https://bucket.bearhive.duckdns.org/WWS_Watersheds_HUC10_Merged.geojson"
MANIFEST_PATH = Path("data-manifest.yaml")

# Fetch watershed data
response = requests.get(API_URL)
data = response.json()

# Load existing manifest
with MANIFEST_PATH.open("r") as f:
    manifest = yaml.safe_load(f)

# Create new sections for parquet files
hillslopes_items = []
soils_items = []
landuse_items = []

cfg = "disturbed9002_wbt"
for feature in data.get("features", []):
    runid = feature.get("properties", {}).get("runid")
    
    # Hillslopes entry
    hillslopes_items.append({
        "name": runid,
        "url": f"https://wc-prod.bearhive.duckdns.org/weppcloud/runs/{runid}/{cfg}/browse/watershed/hillslopes.parquet?download",
        "target": f"hillslopes/{runid}.parquet"
    })
    
    # Soils entry
    soils_items.append({
        "name": runid,
        "url": f"https://wc-prod.bearhive.duckdns.org/weppcloud/runs/{runid}/{cfg}/browse/soils/soils.parquet?download",
        "target": f"soils/{runid}.parquet"
    })
    
    # Landuse entry
    landuse_items.append({
        "name": runid,
        "url": f"https://wc-prod.bearhive.duckdns.org/weppcloud/runs/{runid}/{cfg}/browse/landuse/landuse.parquet?download",
        "target": f"landuse/{runid}.parquet"
    })

# Add new sections to manifest
manifest['Hillslopes'] = hillslopes_items
manifest['Soils'] = soils_items
manifest['Landuse'] = landuse_items

# Write updated manifest back
with MANIFEST_PATH.open("w") as f:
    yaml.dump(manifest, f, sort_keys=False, default_flow_style=False)

print(f"Success: Added {len(hillslopes_items)} hillslopes entries")
print(f"Success: Added {len(soils_items)} soils entries")
print(f"Success: Added {len(landuse_items)} landuse entries")
print(f"Updated manifest saved to {MANIFEST_PATH}")
