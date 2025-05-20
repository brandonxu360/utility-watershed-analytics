from pathlib import Path
import requests
import yaml

# The data manifest location will be relative to the script location (as opposed to where the script is run from)
script_dir = Path(__file__).resolve().parent

# Load and parse the data manifest YAML
with open(script_dir / "data-manifest.yaml") as file:
    manifest = yaml.safe_load(file)

for item in manifest:
    name = item["name"]
    url = item["url"]
    target = Path(script_dir / item["target"])

    print(f"==> Getting: {name}")

    # Create the relevant data directory if it doesn't already exist
    target.parent.mkdir(parents=True, exist_ok=True)

    # Skip if the data already exists
    if target.exists():
        print(f"    Skipping (already exists): {target}")
        continue

    # Download and write the contents to the file system
    try:
        res = requests.get(url)
        with open(target, "wb") as file:
            file.write(res.content)
        print(f"    Downloaded to: {target}")
    except requests.RequestException as e:
        print(f"    Error downloading {url}: {e}")
        continue


