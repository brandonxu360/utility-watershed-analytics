"""
Containerized data downloader for watershed analytics data.

This script downloads data files specified in data-manifest.yaml to a configurable
output directory, typically used within a Docker container with shared volumes.
"""

import os
import sys
from pathlib import Path
import requests
import yaml


def download_watershed_data():
    """Download watershed data files from manifest to output directory."""
    
    # Get output directory from environment variable
    # Default to /data for containerized environments
    output_dir = Path(os.environ.get('DATA_OUTPUT_DIR', '/data'))
    script_dir = Path(__file__).resolve().parent
    
    print(f"==> Starting data download to: {output_dir}")
    print(f"==> Script directory: {script_dir}")
    
    # Load and parse the data manifest YAML
    manifest_path = script_dir / "data-manifest.yaml"
    if not manifest_path.exists():
        print(f"ERROR: Manifest file not found: {manifest_path}")
        sys.exit(1)
        
    try:
        with open(manifest_path) as file:
            manifest = yaml.safe_load(file)
    except Exception as e:
        print(f"ERROR: Failed to load manifest: {e}")
        sys.exit(1)
    
    if not manifest:
        print("WARNING: No items found in manifest")
        return
    
    download_count = 0
    skip_count = 0
    
    for item in manifest:
        name = item["name"]
        url = item["url"]
        
        target = output_dir / Path(item["target"])

        print(f"\n==> Processing: {name}")

        # Create the relevant data directory if it doesn't already exist
        target.parent.mkdir(parents=True, exist_ok=True)

        # Skip if the data already exists
        if target.exists():
            print(f"    Skipping (already exists): {target}")
            print(f"    Existing file size: {target.stat().st_size} bytes")
            skip_count += 1
            continue

        # Download and write the contents to the file system
        try:
            print(f"    Downloading from: {url}")
            
            # Use session for connection pooling and timeout
            with requests.Session() as session:
                response = session.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                # Write file in chunks to handle large files
                with open(target, "wb") as file:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            file.write(chunk)
                            
            file_size = target.stat().st_size
            print(f"    ✓ Downloaded to: {target}")
            print(f"    ✓ File size: {file_size:,} bytes")
            download_count += 1
            
        except requests.RequestException as e:
            print(f"    ✗ Network error downloading {url}: {e}")
            # Clean up partial file
            if target.exists():
                target.unlink()
            sys.exit(1)
        except Exception as e:
            print(f"    ✗ Unexpected error for {url}: {e}")
            # Clean up partial file
            if target.exists():
                target.unlink()
            sys.exit(1)

    print("\n==> Download Summary:")
    print(f"    ✓ Downloaded: {download_count} files")
    print(f"    - Skipped: {skip_count} files (already exist)")
    print(f"    ✓ Total processed: {download_count + skip_count} files")
    
    if download_count > 0:
        print("\n==> All downloads completed successfully!")
    else:
        print("\n==> No new files downloaded (all files already exist)")


if __name__ == "__main__":
    download_watershed_data()
