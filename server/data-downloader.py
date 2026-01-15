"""
Containerized data downloader for watershed analytics data.

This script downloads data files specified in data-manifest.yaml to a configurable
output directory, typically used within a Docker container with shared volumes.

Usage:
    # Download development subset (recommended for developers)
    python data-downloader.py --dev
    
    # Download specific watersheds by runid
    python data-downloader.py --runids 'batch;;nasa-roses-2025;;wa-0' 'batch;;nasa-roses-2025;;wa-1'
    
    # Download ALL data (production only - very large!)
    python data-downloader.py --all
"""

import os
import sys
import argparse
from pathlib import Path
import requests
import yaml

# Development subset - same runids used in entrypoint.dev.sh
# This is a small subset for fast development iteration
DEV_RUNIDS = [
    'batch;;nasa-roses-2025;;or,wa-108',
    'batch;;nasa-roses-2025;;wa-174',
    'batch;;nasa-roses-2025;;or-6',
    'batch;;nasa-roses-2025;;or-202',
]


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Download watershed data files for local caching.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --dev                    Download development subset (fast, recommended)
  %(prog)s --runids wa-0 wa-1       Download specific watersheds
  %(prog)s --all                    Download ALL data (large, use with caution)

The --dev flag downloads the same subset used by the development entrypoint,
enabling fast container restarts without re-downloading data.
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '--dev',
        action='store_true',
        help='Download development subset only (recommended for developers)'
    )
    group.add_argument(
        '--runids',
        nargs='+',
        metavar='RUNID',
        help='Download only specified watersheds by runid (space-separated)'
    )
    group.add_argument(
        '--all',
        action='store_true',
        help='Download ALL data files (warning: very large, use for production only)'
    )
    
    return parser.parse_args()


def should_download_item(item_name: str, section: str, runids_filter: set[str] | None) -> bool:
    """
    Determine if an item should be downloaded based on filter criteria.
    
    Args:
        item_name: The name/runid of the item
        section: The manifest section (Watersheds, Subcatchments, etc.)
        runids_filter: Set of runids to filter by, or None for all
    
    Returns:
        True if the item should be downloaded
    """
    # Always download watersheds (single merged file)
    if section == 'Watersheds':
        return True
    
    # If no filter, download everything
    if runids_filter is None:
        return True
    
    # Check if this item's runid is in the filter
    return item_name in runids_filter


def download_watershed_data(runids_filter: set[str] | None = None):
    """
    Download watershed data files from manifest to output directory.
    
    Args:
        runids_filter: Optional set of runids to download. If None, downloads all.
    """
    # Get output directory from environment variable
    # Default to /data for containerized environments
    output_dir = Path(os.environ.get('DATA_OUTPUT_DIR', '/data'))
    script_dir = Path(__file__).resolve().parent
    
    print(f"==> Starting data download to: {output_dir}")
    print(f"==> Script directory: {script_dir}")
    
    if runids_filter:
        print(f"==> Filtering by runids: {len(runids_filter)} watershed(s)")
        for runid in sorted(runids_filter):
            print(f"    - {runid}")
    else:
        print("==> Downloading ALL data (no filter)")
    
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
    filtered_count = 0
    total_downloaded_bytes = 0
    total_skipped_bytes = 0
    
    # Process each section in the manifest
    for section_name, items in manifest.items():
        print(f"\n==> Section: {section_name}")
        
        if not isinstance(items, list):
            continue
            
        for item in items:
            name = item.get("name", "unknown")
            url = item.get("url")
            target_path = item.get("target")
            
            if not url or not target_path:
                print(f"    WARNING: Skipping invalid item: {name}")
                continue
            
            # Check if this item should be downloaded
            if not should_download_item(name, section_name, runids_filter):
                filtered_count += 1
                continue
            
            target = output_dir / Path(target_path)
            
            print(f"\n    Processing: {name}")

            # Create the relevant data directory if it doesn't already exist
            target.parent.mkdir(parents=True, exist_ok=True)

            # Skip if the data already exists
            if target.exists():
                existing_size = target.stat().st_size
                print(f"    Skipping (already exists): {target}")
                print(f"    Existing file size: {existing_size:,} bytes ({existing_size / (1024*1024):.2f} MB)")
                skip_count += 1
                total_skipped_bytes += existing_size
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
                print(f"    ✓ File size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")
                download_count += 1
                total_downloaded_bytes += file_size
                
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

    print("\n" + "=" * 60)
    print("==> Download Summary:")
    print(f"    ✓ Downloaded: {download_count} files ({total_downloaded_bytes:,} bytes / {total_downloaded_bytes / (1024*1024):.2f} MB)")
    print(f"    - Skipped (cached): {skip_count} files ({total_skipped_bytes:,} bytes / {total_skipped_bytes / (1024*1024):.2f} MB)")
    if filtered_count > 0:
        print(f"    - Filtered out: {filtered_count} files (not in runids filter)")
    print(f"    ✓ Total processed: {download_count + skip_count} files")
    total_bytes = total_downloaded_bytes + total_skipped_bytes
    print(f"    ✓ Total data size: {total_bytes:,} bytes ({total_bytes / (1024*1024):.2f} MB / {total_bytes / (1024*1024*1024):.2f} GB)")
    
    if download_count > 0:
        print("\n==> All downloads completed successfully!")
    else:
        print("\n==> No new files downloaded (all files already cached)")


def main():
    """Main entry point."""
    args = parse_args()
    
    if args.dev:
        print("=" * 60)
        print("==> DEVELOPMENT MODE: Downloading subset for fast iteration")
        print("=" * 60)
        runids_filter = set(DEV_RUNIDS)
    elif args.runids:
        runids_filter = set(args.runids)
    else:  # args.all
        print("=" * 60)
        print("==> WARNING: Downloading ALL data files")
        print("==> This may take a long time and use significant bandwidth")
        print("=" * 60)
        runids_filter = None
    
    download_watershed_data(runids_filter)


if __name__ == "__main__":
    main()
