from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection
from server.watershed.models import Watershed, Subcatchment, Channel
from server.watershed.ingestion_config import get_ingestion_config, get_manifest_path
from server.watershed.ingestion_orchestrator import IngestionOrchestrator
from server.watershed.ingestion_logger import IngestionLogger


class Command(BaseCommand):
    help = """
    Load watershed data from GeoJSON files into the database.
    
    This command now delegates to the new ingestion pipeline with
    parallel fetching and batched writes. For more control, use
    the 'ingest_manifest' command directly.
    """
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reload data (clear existing watershed data first)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be loaded without actually loading data',
        )
    
    def handle(self, *args, **options):
        verbosity = options['verbosity']
        force = options['force']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No data will be loaded')
            )
        
        # Check if data already exists
        existing_count = Watershed.objects.count()
        if existing_count > 0 and not force:
            raise CommandError(
                f'Database already contains {existing_count} watersheds. '
                f'Use --force to reload data or --dry-run to preview.'
            )
        
        if force and not dry_run:
            self.stdout.write('Clearing existing watershed data...')
            with connection.cursor() as cursor:
                cursor.execute('TRUNCATE TABLE watershed_channel CASCADE')
                cursor.execute('TRUNCATE TABLE watershed_subcatchment CASCADE')
                cursor.execute('TRUNCATE TABLE watershed_watershed CASCADE')
            self.stdout.write(
                self.style.SUCCESS('Existing data cleared')
            )
        
        if dry_run:
            self.stdout.write('Would load watershed data with current configuration')
            self.stdout.write(f'  Verbosity: {verbosity}')
            return
        
        try:
            self.stdout.write('Loading watershed data...')
            
            # Use new ingestion pipeline
            config = get_ingestion_config()
            manifest_path = get_manifest_path()
            logger = IngestionLogger(__name__, log_json=False)
            
            orchestrator = IngestionOrchestrator(manifest_path, config, logger)
            
            # Validate
            if not orchestrator.validate_manifest():
                raise CommandError('Manifest validation failed')
            
            # Run ingestion
            stats = orchestrator.run(dry_run=False)
            
            # Simplify geometries (PostGIS operation)
            if verbosity > 0:
                self.stdout.write('Simplifying geometries...')
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE watershed_watershed
                    SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.00025)
                    WHERE geom IS NOT NULL;
                """)
            
            # Report results
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully loaded watershed data:\n'
                    f'  Watersheds: {stats["watersheds"]}\n'
                    f'  Subcatchments: {stats["subcatchments"]}\n'
                    f'  Channels: {stats["channels"]}'
                )
            )
            
        except Exception as e:
            raise CommandError(f'Failed to load watershed data: {str(e)}')