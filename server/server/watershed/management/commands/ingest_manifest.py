"""
Django management command for watershed data ingestion.

Provides configurable ingestion with parallel fetching, batching,
and environment-aware defaults.
"""
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from server.watershed.ingestion_config import get_ingestion_config, get_manifest_path
from server.watershed.ingestion_orchestrator import IngestionOrchestrator
from server.watershed.ingestion_logger import IngestionLogger
from server.watershed.models import Watershed, Subcatchment, Channel


class Command(BaseCommand):
    help = """
    Ingest watershed data from remote GeoJSON sources with parallel fetching.
    
    Supports development subsetting, configurable concurrency, and batched
    database writes for improved performance.
    
    Examples:
        # Load with defaults (auto-detects dev vs prod)
        python manage.py ingest_manifest
        
        # Load full dataset in dev
        python manage.py ingest_manifest --scope all
        
        # Load with custom concurrency
        python manage.py ingest_manifest --max-workers 8 --batch-size 1000
        
        # Dry run to validate manifest
        python manage.py ingest_manifest --dry-run
        
        # Structured JSON logging
        python manage.py ingest_manifest --log-json
    """
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--manifest',
            type=str,
            help='Path to data manifest YAML file (defaults to project manifest)',
        )
        parser.add_argument(
            '--mode',
            type=str,
            choices=['url', 'download'],
            help='Fetch mode: stream from URL (default) or download first',
        )
        parser.add_argument(
            '--max-workers',
            type=int,
            help='Number of parallel workers for URL fetching (default: 4)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            help='Database batch size for bulk inserts (default: 500)',
        )
        parser.add_argument(
            '--scope',
            type=str,
            choices=['auto', 'dev_subset', 'all'],
            help='Data scope: auto (based on DEBUG), dev_subset (first N runids), or all (default: auto)',
        )
        parser.add_argument(
            '--subset-size',
            type=int,
            help='Number of runids (subcatchments) to load in dev mode (default: 50). '
                 'Loads first N subcatchments and their matching channels/watersheds.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validate manifest without loading data',
        )
        parser.add_argument(
            '--log-json',
            action='store_true',
            help='Emit structured JSON logs',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Clear existing data before loading',
        )
        parser.add_argument(
            '--skip-simplify',
            action='store_true',
            help='Skip geometry simplification step',
        )
    
    def handle(self, *args, **options):
        # Build configuration from CLI args and defaults
        config = get_ingestion_config()
        
        if options['mode']:
            config['MODE'] = options['mode']
        if options['max_workers']:
            config['MAX_WORKERS'] = options['max_workers']
        if options['batch_size']:
            config['BATCH_SIZE'] = options['batch_size']
        if options['scope']:
            config['SCOPE'] = options['scope']
        if options['subset_size']:
            config['SUBSET_SIZE'] = options['subset_size']
        if options['log_json']:
            config['LOG_JSON'] = True
        
        # Get manifest path
        manifest_path = Path(options['manifest']) if options['manifest'] else get_manifest_path()
        
        if not manifest_path.exists():
            raise CommandError(f'Manifest file not found: {manifest_path}')
        
        # Initialize logger
        logger = IngestionLogger(__name__, log_json=config['LOG_JSON'])
        
        # Check for existing data
        existing_count = Watershed.objects.count()
        if existing_count > 0 and not options['force'] and not options['dry_run']:
            raise CommandError(
                f'Database already contains {existing_count} watersheds. '
                f'Use --force to clear and reload, or --dry-run to validate.'
            )
        
        # Clear existing data if forced
        if options['force'] and not options['dry_run']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            with connection.cursor() as cursor:
                cursor.execute('TRUNCATE TABLE watershed_channel CASCADE')
                cursor.execute('TRUNCATE TABLE watershed_subcatchment CASCADE')
                cursor.execute('TRUNCATE TABLE watershed_watershed CASCADE')
            self.stdout.write(self.style.SUCCESS('Existing data cleared'))
        
        # Dry run mode
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE'))
            self.stdout.write(f'Manifest: {manifest_path}')
            self.stdout.write(f'Scope: {config["SCOPE"]}')
            self.stdout.write(f'Max workers: {config["MAX_WORKERS"]}')
            self.stdout.write(f'Batch size: {config["BATCH_SIZE"]}')
            
            orchestrator = IngestionOrchestrator(manifest_path, config, logger)
            if not orchestrator.validate_manifest():
                raise CommandError('Manifest validation failed')
            
            self.stdout.write(self.style.SUCCESS('Manifest is valid'))
            return
        
        # Execute ingestion
        try:
            self.stdout.write('Starting ingestion...')
            
            orchestrator = IngestionOrchestrator(manifest_path, config, logger)
            
            # Validate first
            if not orchestrator.validate_manifest():
                raise CommandError('Manifest validation failed')
            
            # Run ingestion
            stats = orchestrator.run(dry_run=False)
            
            # Simplify geometries (PostGIS operation)
            if not options['skip_simplify']:
                self.stdout.write('Simplifying geometries...')
                with connection.cursor() as cursor:
                    cursor.execute("""
                        UPDATE watershed_watershed
                        SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.00025)
                        WHERE geom IS NOT NULL;
                    """)
                self.stdout.write(self.style.SUCCESS('Geometries simplified'))
            
            # Report results
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nIngestion completed successfully:\n'
                    f'  Watersheds: {stats["watersheds"]}\n'
                    f'  Subcatchments: {stats["subcatchments"]}\n'
                    f'  Channels: {stats["channels"]}\n'
                    f'  Failed fetches: {stats["failed_fetches"]}'
                )
            )
            
        except Exception as e:
            logger.error('Ingestion failed', error=str(e))
            raise CommandError(f'Ingestion failed: {str(e)}')
