# Helper script that might be useful to reference for future changes to the data manifest.
# This script was used to build the subcatchments/channels datafile entries explicitly listed 
# in the manifest. 

import requests
import yaml
from pathlib import Path

API_URL = "https://bucket.bearhive.duckdns.org/WWS_Watersheds_HUC10_Merged.geojson"

# Output file path
output_path = Path("data-manifest-builder-dump.yaml")
response = requests.get(API_URL)
data = response.json()

items = []

cfg = "disturbed9002_wbt"
for feature in data.get("features", []):
    runid = feature.get("properties", {}).get("runid")
    entry = {
        "name": runid,
        # Subcatchments data file structure
        "url": f"https://wc-prod.bearhive.duckdns.org/weppcloud/runs/{runid}/{cfg}/download/dem/wbt/subcatchments.WGS.geojson",
        "target": f"subcatchments/{runid}.geojson"
    }
    items.append(entry)

# Wrap in section
entries = [{
    "section": "Subcatchments",
    "items": items
}]

# Write entries to file
with output_path.open("w") as f:
    #f.write("# Subcatchments and Channels\n")
    yaml.dump(entries, f, sort_keys=False)

print(f"Success: Wrote {len(entries)} entries to {output_path}")
