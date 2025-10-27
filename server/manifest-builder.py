# Helper script that might be useful to reference for future changes to the data manifest.
# This script was used to build the subcatchments/channels datafile entries explicitly listed 
# in the manifest. 

import requests
import yaml
from pathlib import Path

API_URL = "https://unstable.wepp.cloud/api/watershed/"

# Output file path
output_path = Path("data-manifest-builder-dump.yaml")
response = requests.get(API_URL)
data = response.json()

entries = []

for feature in data.get("features", []):
    wid = feature["id"]
    entry = {
        "name": f"{wid} Subcatchments and Channels",
        "url": f"https://wepp.cloud/weppcloud/runs/{wid}/disturbed9002/download/export/arcmap/{wid}.gpkg",
        "target": f"subcatchments-and-channels/{wid}.gpkg"
    }
    entries.append(entry)

# Write entries to file
with output_path.open("w") as f:
    #f.write("# Subcatchments and Channels\n")
    yaml.dump(entries, f, sort_keys=False)

print(f"Success: Wrote {len(entries)} entries to {output_path}")
