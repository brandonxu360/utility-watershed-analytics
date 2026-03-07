"""
Django management command for downloading watershed data.

This command uses WatershedDataDiscovery and StandaloneRunDiscovery to
automatically discover available data sources and download them to a
configurable output directory.

Usage:
    # Download development subset (recommended for developers)
    python manage.py download_data --dev
    
    # Download specific watersheds by runid
    python manage.py download_data --runids 'batch;;nasa-roses-2026-sbs;;or-20' 'aversive-forestry'
    
    # Download ALL data (production only - very large!)
    python manage.py download_data --all
"""

from pathlib import Path
from urllib.parse import urlparse

import requests
from django.core.management.base import BaseCommand, CommandError

from server.watershed.loaders.discovery import (
    WatershedDataDiscovery,
    StandaloneRunDiscovery,
    DataSource,
)
from server.watershed.loaders.config import LoaderConfig
from server.watershed.constants import DEV_RUNIDS


class Command(BaseCommand):
    help = 'Download watershed data files for local caching.'

    def add_arguments(self, parser):
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
        
        parser.add_argument(
            '--output-dir',
            type=str,
            default=None,
            help='Output directory for downloaded files (default: $DATA_OUTPUT_DIR or /data)'
        )

    def handle(self, *args, **options):
        if options['dev']:
            self.stdout.write("=" * 60)
            self.stdout.write(self.style.WARNING(
                "==> DEVELOPMENT MODE: Downloading subset for fast iteration"
            ))
            self.stdout.write("=" * 60)
            runids_filter = DEV_RUNIDS
        elif options['runids']:
            runids_filter = options['runids']
        else:  # options['all']
            self.stdout.write("=" * 60)
            self.stdout.write(self.style.WARNING(
                "==> WARNING: Downloading ALL data files"
            ))
            self.stdout.write(self.style.WARNING(
                "==> This may take a long time and use significant bandwidth"
            ))
            self.stdout.write("=" * 60)
            runids_filter = None
        
        output_dir = options['output_dir']
        if output_dir:
            output_dir = Path(output_dir)
        
        try:
            self._download_watershed_data(runids_filter, output_dir)
        except Exception as e:
            raise CommandError(f"Download failed: {e}")

    def _download_file(
        self,
        url: str,
        target: Path,
        session: requests.Session,
        headers: dict | None = None,
    ) -> int:
        """Download a file from URL to target path."""
        response = session.get(url, headers=headers, timeout=60, stream=True)
        response.raise_for_status()
        
        with open(target, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)
        
        return target.stat().st_size

    def _process_source(
        self,
        source: DataSource,
        output_dir: Path,
        session: requests.Session,
        stats: dict,
        headers: dict | None = None,
    ) -> None:
        """Process a single data source - download if not cached."""
        if source.data_type == "watersheds":
            # For the master watersheds GeoJSON, use a batch-specific
            # filename so multiple batches can coexist in the cache
            # directory without overwriting each other.
            if source.local_path is not None:
                filename = source.local_path.name
            else:
                parsed = urlparse(source.url)
                filename = Path(parsed.path).name or "WWS_Watersheds_HUC10_Merged.geojson"
            target = output_dir / "watersheds" / filename
        elif source.data_type in ("subcatchments", "channels"):
            target = output_dir / source.data_type / f"{source.name}.geojson"
        else:
            target = output_dir / source.data_type / f"{source.name}.parquet"
        
        self.stdout.write(f"\n    Processing: {source.data_type}/{source.name}")
        
        target.parent.mkdir(parents=True, exist_ok=True)
        
        if target.exists():
            existing_size = target.stat().st_size
            self.stdout.write(f"    Skipping (already exists): {target}")
            self.stdout.write(
                f"    Existing file size: {existing_size:,} bytes "
                f"({existing_size / (1024*1024):.2f} MB)"
            )
            stats["skip_count"] += 1
            stats["total_skipped_bytes"] += existing_size
            return
        
        try:
            self.stdout.write(f"    Downloading from: {source.url}")
            file_size = self._download_file(source.url, target, session, headers=headers)
            self.stdout.write(self.style.SUCCESS(f"    ✓ Downloaded to: {target}"))
            self.stdout.write(self.style.SUCCESS(
                f"    ✓ File size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)"
            ))
            stats["download_count"] += 1
            stats["total_downloaded_bytes"] += file_size
            
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(
                f"    ✗ Network error downloading {source.url}: {e}"
            ))
            if target.exists():
                target.unlink()
            raise CommandError(f"Network error: {e}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"    ✗ Unexpected error for {source.url}: {e}"
            ))
            if target.exists():
                target.unlink()
            raise CommandError(f"Unexpected error: {e}")

    def _download_watershed_data(
        self,
        runids_filter: list[str] | None = None,
        output_dir: Path | None = None
    ):
        """
        Download watershed data files for all configured batches and standalone runs.

        Args:
            runids_filter: Optional list of runids to download. If None, downloads all.
            output_dir: Output directory. Defaults to the loader's configured data directory.
        """
        # Initialize config
        config = LoaderConfig.from_environment()

        # Get output directory - use loader's configured data dir as default
        if output_dir is None:
            output_dir = config.local_data_dir

        self.stdout.write(f"==> Starting data download to: {output_dir}")

        if runids_filter:
            self.stdout.write(f"==> Filtering by runids: {len(runids_filter)} watershed(s)")
            for runid in sorted(runids_filter):
                self.stdout.write(f"    - {runid}")
        else:
            self.stdout.write("==> Downloading ALL data (discovering from API)")

        # Stats tracking (accumulated across all batches and standalone runs)
        stats = {
            "download_count": 0,
            "skip_count": 0,
            "total_downloaded_bytes": 0,
            "total_skipped_bytes": 0,
        }

        with requests.Session() as session:
            # Process each configured batch
            for batch_cfg in config.api.batches:
                discovery = WatershedDataDiscovery(config=config, batch_config=batch_cfg)
                batch_name = discovery.watersheds_filename.replace("_completed.geojson", "")
                self.stdout.write(f"\n{'=' * 60}")
                self.stdout.write(self.style.WARNING(f"==> Batch: {batch_name}"))
                self.stdout.write(f"{'=' * 60}")

                # When a runid filter is provided, restrict to runids that
                # belong to this batch (identified by the middle segment of the
                # runid, e.g. "batch;;nasa-roses-2026-sbs;;OR-20").  Skip the
                # batch entirely if no runids match.
                if runids_filter is not None:
                    batch_runids = [r for r in runids_filter if f";;{batch_name};;" in r]
                    if not batch_runids:
                        self.stdout.write("    No matching runids for this batch — skipping")
                        continue
                else:
                    self.stdout.write("==> Discovering available runids from API...")
                    batch_runids = discovery.discover_runids()
                    self.stdout.write(f"    Found {len(batch_runids)} watersheds")

                auth_headers = (
                    {"Authorization": f"Bearer {discovery.jwt_token}"}
                    if discovery.jwt_token else None
                )

                # Download master watersheds file
                self.stdout.write("\n==> Section: Watersheds")
                watershed_source = discovery.get_watersheds_source()
                self._process_source(watershed_source, output_dir, session, stats, headers=auth_headers)

                # Download subcatchments
                self.stdout.write("\n==> Section: Subcatchments")
                for source in discovery.iter_subcatchments(batch_runids):
                    self._process_source(source, output_dir, session, stats)

                # Download channels
                self.stdout.write("\n==> Section: Channels")
                for source in discovery.iter_channels(batch_runids):
                    self._process_source(source, output_dir, session, stats)

                # Download parquet files
                for data_type in ["hillslopes", "soils", "landuse"]:
                    self.stdout.write(f"\n==> Section: {data_type.capitalize()}")
                    for source in discovery.iter_sources(data_type, batch_runids):
                        self._process_source(source, output_dir, session, stats)

            # Process standalone runs
            for standalone_config in config.api.standalone_runs:
                if runids_filter is not None and standalone_config.runid not in runids_filter:
                    continue

                self.stdout.write(f"\n{'=' * 60}")
                self.stdout.write(self.style.WARNING(
                    f"==> Standalone: {standalone_config.display_name} "
                    f"({standalone_config.runid})"
                ))
                self.stdout.write("=" * 60)

                discovery = StandaloneRunDiscovery(standalone_config, config=config)

                self.stdout.write("\n==> Section: Boundary")
                boundary_source = discovery.get_watersheds_source()
                self._process_source(boundary_source, output_dir, session, stats)

                runid_list = [standalone_config.runid]

                self.stdout.write("\n==> Section: Subcatchments")
                for source in discovery.iter_subcatchments(runid_list):
                    self._process_source(source, output_dir, session, stats)

                self.stdout.write("\n==> Section: Channels")
                for source in discovery.iter_channels(runid_list):
                    self._process_source(source, output_dir, session, stats)

                for data_type in ["hillslopes", "soils", "landuse"]:
                    self.stdout.write(f"\n==> Section: {data_type.capitalize()}")
                    for source in discovery.iter_sources(data_type, runid_list):
                        self._process_source(source, output_dir, session, stats)
        
        # Print summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("==> Download Summary:")
        self.stdout.write(self.style.SUCCESS(
            f"    ✓ Downloaded: {stats['download_count']} files "
            f"({stats['total_downloaded_bytes']:,} bytes / "
            f"{stats['total_downloaded_bytes'] / (1024*1024):.2f} MB)"
        ))
        self.stdout.write(
            f"    - Skipped (cached): {stats['skip_count']} files "
            f"({stats['total_skipped_bytes']:,} bytes / "
            f"{stats['total_skipped_bytes'] / (1024*1024):.2f} MB)"
        )
        self.stdout.write(self.style.SUCCESS(
            f"    ✓ Total processed: {stats['download_count'] + stats['skip_count']} files"
        ))
        total_bytes = stats['total_downloaded_bytes'] + stats['total_skipped_bytes']
        self.stdout.write(self.style.SUCCESS(
            f"    ✓ Total data size: {total_bytes:,} bytes "
            f"({total_bytes / (1024*1024):.2f} MB / "
            f"{total_bytes / (1024*1024*1024):.2f} GB)"
        ))
        
        if stats['download_count'] > 0:
            self.stdout.write(self.style.SUCCESS(
                "\n==> All downloads completed successfully!"
            ))
        else:
            self.stdout.write("\n==> No new files downloaded (all files already cached)")
