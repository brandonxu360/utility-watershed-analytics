from django.db import connection
from server.watershed.loaders.load_remote import load_from_remote
from typing import Optional

# Save the models to the database using the mapping
def run(verbose=True, runids: Optional[list[str]] = None):
    """
    Load watershed data and update simplified geometries.
    
    Args:
        verbose: Whether to print verbose output during loading
        runids: Optional list of runids to load. If None, all watersheds are loaded.
    """
    # Load all the watershed data using the remote method
    load_from_remote(verbose=verbose, runids=runids)

    # Update the simplified_geom field using PostGIS simplify (potentially more efficient than using geos simplify in the application)
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE watershed_watershed
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.00025)
            WHERE geom IS NOT NULL;
        """)