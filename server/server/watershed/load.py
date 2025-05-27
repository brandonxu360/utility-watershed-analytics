from django.db import connection
from server.watershed.loaders.load_or_borders import load_oregon_borders
from server.watershed.loaders.load_wa_borders import load_washington_borders
from server.watershed.loaders.load_subcatchments_and_channels import load_subcatchments_and_channels

# Save the models to the database using the mapping
def run(verbose=True):
    # Load the Oregon watersheds
    load_oregon_borders(verbose=False)

    # Load the Washington watersheds
    load_washington_borders(verbose=False)

    # Load the subcatchments and channels
    load_subcatchments_and_channels(verbose=False)

    # Update the simplified_geom field using PostGIS simplify (potentially more efficient than using geos simplify in the application)
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE watershed_watershed
            SET simplified_geom = ST_SimplifyPreserveTopology(geom, 0.00025)
            WHERE geom IS NOT NULL;
        """)