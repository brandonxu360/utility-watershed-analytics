import os
from pathlib import Path
from django.contrib.gis.db.models import Model
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.layer import Layer
from django.contrib.gis.geos import Polygon, MultiPolygon
from server.watershed.models import Subcatchment, Channel

# Auto-generated `LayerMapping` dictionary for Subcatchment model
subcatchment_mapping = {
    'topazid': 'TopazID',
    'weppid': 'WeppID',
    'slope_scalar': 'slope_scalar',
    'length_m': 'length_m',
    'width_m': 'width_m',
    'direction': 'direction',
    'aspect': 'aspect',
    'area_m2': 'area_m2',
    'elevation_m': 'elevation_m',
    'centroid_px': 'centroid_px',
    'centroid_py': 'centroid_py',
    'centroid_lon': 'centroid_lon',
    'centroid_lat': 'centroid_lat',
    'dom': 'dom',
    'desc': 'desc',
    'color': 'color',
    'cancov': 'cancov',
    'inrcov': 'inrcov',
    'rilcov': 'rilcov',
    'disturbed_class': 'disturbed_class',
    'mukey': 'mukey',
    'clay': 'clay',
    'sand': 'sand',
    'll': 'll',
    'simple_texture': 'simple_texture',
    'runoff_volume_m3': 'Runoff_Volume_m3',
    'subrunoff_volume_m3': 'Subrunoff_Volume_m3',
    'baseflow_volume_m3': 'Baseflow_Volume_m3',
    'soil_loss_kg': 'Soil_Loss_kg',
    'sediment_deposition_kg': 'Sediment_Deposition_kg',
    'sediment_yield_kg': 'Sediment_Yield_kg',
    'solub_react_phosphorus_kg': 'Solub_React_Phosphorus_kg',
    'particulate_phosphorus_kg': 'Particulate_Phosphorus_kg',
    'total_phosphorus_kg': 'Total_Phosphorus_kg',
    'soil': 'Soil',
    'runoff_mm': 'Runoff_mm',
    'subrunoff_mm': 'Subrunoff_mm',
    'baseflow_mm': 'Baseflow_mm',
    'deploss_kg': 'DepLoss_kg',
    # 'geom': 'MULTIPOLYGON',
}

# Auto-generated `LayerMapping` dictionary for Channel model
channel_mapping = {
    'topazid': 'TopazID',
    'weppid': 'WeppID',
    'slope_scalar': 'slope_scalar',
    'length_m': 'length_m',
    'width_m': 'width_m',
    'direction': 'direction',
    'order': 'order',
    'aspect': 'aspect',
    'area_m2': 'area_m2',
    'elevation_m': 'elevation_m',
    'centroid_px': 'centroid_px',
    'centroid_py': 'centroid_py',
    'centroid_lon': 'centroid_lon',
    'centroid_lat': 'centroid_lat',
    'discharge_volume_m3': 'Discharge_Volume_m3',
    'sediment_yield_tonne': 'Sediment_Yield_tonne',
    'soil_loss_kg': 'Soil_Loss_kg',
    'upland_charge_m3': 'Upland_Charge_m3',
    'subsuface_flow_volume': 'Subsuface_Flow_Volume',
    'contributing_area_ha': 'Contributing_Area_ha',
    'solub_react_phosphorus_kg': 'Solub_React_Phosphorus_kg',
    'particulate_phosphorus_kg': 'Particulate_Phosphorus_kg',
    'total_phosphorus_kg': 'Total_Phosphorus_kg',
    'weppchnid': 'WeppChnID',
    # 'geom': 'MULTIPOLYGON',
}

data_location = Path(__file__).resolve().parent.parent / "data" / "subcatchments-and-channels"

def save_watershed_associated_layer(layer: Layer, mapping: dict[str, str], associated_watershed_id: str, model_class: type[Model]) -> int:
    """Save a layer of features with a one-to-many relationship with watersheds (one watershed - many layer features) and returns the number of features saved."""

    instances = []

    for feature in layer:
        # Gather the relevant OGR values from the data source
        kwargs = {key: feature.get(value) for key, value in mapping.items()}

        # Handle the geometry
        geom = feature.geom.geos
        kwargs['geom'] = MultiPolygon(geom) if isinstance(geom, Polygon) else geom

        # Add the watershed foreign key reference
        kwargs['watershed_id'] = associated_watershed_id

        instances.append(model_class(**kwargs))
    
    model_class.objects.bulk_create(instances)

    return len(instances)

def load_subcatchments_and_channels(verbose=True):
    # Iterate over all of the subcatchment/channel datafiles
    # Each datafile should correspond to a parent watershed - the name of the datafile should be the webcloud_run_id of the associated watershed
    for entry in os.scandir(data_location):
        """Loads all the subcatchments and channels from the datafiles into the database."""

        # Skip nonfiles
        if not entry.is_file():
            continue

        print(f"Processing: {entry.name}")
        
        try:
            ds = DataSource(entry.path)

            # The datafile name should correspond to the relevant watershed pk (webcloud_run_id)
            watershed_id = os.path.splitext(entry.name)[0]

            # Subcatchments
            subcatchment_count = save_watershed_associated_layer(ds[0], subcatchment_mapping, watershed_id, Subcatchment)
            print(f"    Subcatchments saved: {subcatchment_count}")

            # Channels
            channel_count = save_watershed_associated_layer(ds[1], channel_mapping, watershed_id, Channel)
            print(f"    Channels saved: {channel_count}")

        except Exception as e:
            print(f"Error processing {entry.name}: {e}")

            



