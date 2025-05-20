from django.db import connection
from .loaders.load_or_borders import load_oregon_borders
from .loaders.load_wa_borders import load_washington_borders

# Save the models to the database using the mapping
def run(verbose=True):
    # Load the Oregon watersheds
    load_oregon_borders()

    # Load the Washington watersheds
    load_washington_borders()

    # Update the simplified_geom field using PostGIS simplify (potentially more efficient than using geos simplify in the application)
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE watershed_watershedborder
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.00025)
            WHERE geom IS NOT NULL;
        """)