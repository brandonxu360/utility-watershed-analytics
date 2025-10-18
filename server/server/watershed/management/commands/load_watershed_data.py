from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from server.watershed.models import Watershed, Subcatchment, Channel
from server.watershed.load import run


class Command(BaseCommand):
    help = 'Load watershed data from GeoJSON files into the database'
    
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
            with transaction.atomic():
                Channel.objects.all().delete()
                Subcatchment.objects.all().delete()
                Watershed.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('Existing data cleared')
            )
        
        if dry_run:
            self.stdout.write('Would load watershed data with current configuration')
            self.stdout.write(f'  Verbosity: {verbosity}')
            return
        
        try:
            self.stdout.write('Loading watershed data...')
            
            with transaction.atomic():
                # Run the main data loading function (includes geometry simplification)
                run(verbose=verbosity > 1)
            
            # Report results
            final_watershed_count = Watershed.objects.count()
            final_subcatchment_count = Subcatchment.objects.count()
            final_channel_count = Channel.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully loaded watershed data:\n'
                    f'  Watersheds: {final_watershed_count}\n'
                    f'  Subcatchments: {final_subcatchment_count}\n'
                    f'  Channels: {final_channel_count}'
                )
            )
            
        except Exception as e:
            raise CommandError(f'Failed to load watershed data: {str(e)}')