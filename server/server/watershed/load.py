from django.db import connection
from server.watershed.loaders.load_remote import load_from_remote

# Save the models to the database using the mapping
def run(verbose=True):
    # Load all the watershed data using the remote method
    load_from_remote(verbose=False)

    # Update the simplified_geom field using PostGIS simplify (potentially more efficient than using geos simplify in the application)
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE watershed_watershed
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.00025)
            WHERE geom IS NOT NULL;
        """)