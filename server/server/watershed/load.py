from django.db import connection
from .loaders.load_or import load_oregon_data
from .loaders.load_wa import load_washington_data

# Save the models to the database using the mapping
def run(verbose=True):
    # Load the Oregon watersheds
    load_oregon_data()

    # Load the Washington watersheds
    load_washington_data()

    # Update the simplified_geom field using PostGIS simplify (potentially more efficient than using geos simplify in the application)
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE watershed_watershedborder
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.02)
            WHERE geom IS NOT NULL;
        """)