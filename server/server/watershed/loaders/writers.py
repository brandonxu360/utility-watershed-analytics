"""
Concrete implementations of data writers.

This module provides the real database writer implementation using Django ORM.
For testing, mock implementations can be injected instead.
"""

import logging
import pandas as pd
from typing import Optional
from collections import defaultdict

from django.contrib.gis.gdal import SpatialReference, CoordTransform
from django.contrib.gis.geos import Polygon, MultiPolygon

from server.watershed.models import Watershed, Subcatchment, Channel

from .config import LoaderConfig, get_config
from .protocols import DataWriter

logger = logging.getLogger("watershed.loader")


# Field mappings for parquet data
HILLSLOPES_FIELD_MAP = [
    ('slope_scalar', 'slope_scalar', float),
    ('length', 'length', float),
    ('width', 'width', float),
    ('direction', 'direction', float),
    ('aspect', 'aspect', float),
    ('hillslope_area', 'area', int),
    ('elevation', 'elevation', float),
    ('centroid_px', 'centroid_px', int),
    ('centroid_py', 'centroid_py', int),
    ('centroid_lon', 'centroid_lon', float),
    ('centroid_lat', 'centroid_lat', float),
]

SOILS_FIELD_MAP = [
    ('mukey', 'mukey', str),
    ('soil_fname', 'fname', str),
    ('soils_dir', 'soils_dir', str),
    ('soil_build_date', 'build_date', str),
    ('soil_desc', 'desc', str),
    ('soil_color', 'color', str),
    ('soil_area', 'area', float),
    ('soil_pct_coverage', 'pct_coverage', float),
    ('clay', 'clay', float),
    ('sand', 'sand', float),
    ('avke', 'avke', float),
    ('bd', 'bd', float),
    ('simple_texture', 'simple_texture', str),
    ('soil_depth', 'soil_depth', float),
    ('rock', 'rock', float),
]

LANDUSE_FIELD_MAP = [
    ('landuse_key', 'key', int),
    ('landuse_map', '_map', str),
    ('man_fn', 'man_fn', str),
    ('man_dir', 'man_dir', str),
    ('landuse_desc', 'desc', str),
    ('landuse_color', 'color', str),
    ('landuse_area', 'area', float),
    ('landuse_pct_coverage', 'pct_coverage', float),
    ('cancov', 'cancov', float),
    ('inrcov', 'inrcov', float),
    ('rilcov', 'rilcov', float),
    ('cancov_override', 'cancov_override', float),
    ('inrcov_override', 'inrcov_override', float),
    ('rilcov_override', 'rilcov_override', float),
    ('disturbed_class', 'disturbed_class', str),
]


# OGR field-source mappings.
# Each value is a tuple of candidate OGR field names tried in order;
# the first one present in the feature wins.  This lets a single mapping
# cover batches with different schemas:
#   nasa-roses: PWS_ID, SrcName, Shape_Leng, Shape_Area, …
#   victoria-ca: name, area_km2 (no PWS_ID, no Shape_* etc.)
#   standalone:  boundary GeoJSON may only carry geometry
WATERSHED_FIELD_SOURCES = {
    'pws_id':     ('PWS_ID',),
    'srcname':    ('SrcName', 'name'),   # nasa-roses: SrcName; victoria: name
    'pws_name':   ('PWS_Name',),
    'county_nam': ('County_Nam',),
    'state':      ('State',),
    'huc10_id':   ('HUC10_ID',),
    'huc10_name': ('HUC10_Name',),
    'wws_code':   ('WWS_Code',),
    'srctype':    ('SrcType',),
    'shape_leng': ('Shape_Leng',),
    'shape_area': ('Shape_Area',),
    'area_km2':   ('area_km2',),         # victoria only
    # Utility metadata fields (present in the merged nasa-roses file)
    'owner_type':          ('OwnerType',),
    'pop_group':           ('PopGroup',),
    'treat_type':          ('TreatType',),
    'conn_group':          ('ConnGroup',),
    'huc10_pws_names':     ('HUC10_PWS_Names',),
    'huc10_owner_types':   ('HUC10_OwnerTypes',),
    'huc10_pop_groups':    ('HUC10_PopGroups',),
    'huc10_treat_types':   ('HUC10_TreatTypes',),
    'huc10_utility_count': ('HUC10_UtilityCount',),
    'runid':      ('runid',),
    'geom':       ('UNKNOWN',),          # sentinel; handled separately
}

SUBCATCHMENT_MAPPING = {
    'topazid': 'TopazID',
    'weppid': 'WeppID',
}

CHANNEL_MAPPING = {
    'topazid': 'TopazID',
    'weppid': 'WeppID',
    'order': 'Order',
}


def _get_feature_field(feature, *field_names):
    """
    Try multiple OGR field names in order, returning the first match.
    
    This bridges schema differences between batches (e.g. 'SrcName' in
    NASA ROSES vs 'name' in other batches). Fields absent from the layer
    schema raise IndexError in Django's GDAL bindings; we catch that and
    move on to the next candidate.
    """
    for name in field_names:
        try:
            value = feature.get(name)
            if value is not None:
                return value
        except (IndexError, KeyError):
            continue
    return None


def _extract_geometry(feature, target_srid: int = 4326):
    """
    Extract and normalize geometry from an OGR feature.
    
    Transforms to target SRID if necessary and ensures MultiPolygon type.
    """
    ogr_geom = feature.geom

    if ogr_geom.srs and ogr_geom.srs.srid != target_srid:
        target_srs = SpatialReference(target_srid)
        ct = CoordTransform(ogr_geom.srs, target_srs)
        ogr_geom = ogr_geom.clone()
        ogr_geom.transform(ct)

    geom = ogr_geom.geos
    if isinstance(geom, Polygon):
        geom = MultiPolygon(geom)
    return geom


class DjangoDataWriter:
    """
    Production implementation of DataWriter using Django ORM.
    
    Handles bulk creation and updates of watershed-related models.
    """
    
    def __init__(self, config: Optional[LoaderConfig] = None):
        self.config = config or get_config()
    
    def save_watersheds(self, layer) -> int:
        """Save watershed features from a GDAL layer."""
        instances = []
        for feature in layer:
            kwargs = {
                key: _get_feature_field(feature, *sources)
                for key, sources in WATERSHED_FIELD_SOURCES.items()
                if key != 'geom'
            }
            kwargs['geom'] = _extract_geometry(feature)
            instances.append(Watershed(**kwargs))
        
        Watershed.objects.bulk_create(instances)
        return len(instances)
    
    def save_watersheds_filtered(self, layer, runids: set[str]) -> int:
        """Save only watersheds matching the given runids."""
        instances = []
        for feature in layer:
            feature_runid = _get_feature_field(feature, 'runid')
            if feature_runid in runids:
                kwargs = {
                    key: _get_feature_field(feature, *sources)
                    for key, sources in WATERSHED_FIELD_SOURCES.items()
                    if key != 'geom'
                }
                kwargs['geom'] = _extract_geometry(feature)
                instances.append(Watershed(**kwargs))
        
        Watershed.objects.bulk_create(instances)
        return len(instances)
    
    def save_standalone_watershed(
        self,
        layer,
        runid: str,
        display_name: str,
    ) -> int:
        """
        Save a watershed from a standalone boundary GeoJSON.

        Standalone boundary files (e.g. bound.geojson) typically have no
        attribute fields. The runid and display_name are provided externally,
        and geometry is transformed to EPSG:4326 if needed.

        TOPAZ boundary files (BOUND.WGS.JSON) contain two features:
        ``Watershed=1`` (the actual boundary) and ``Watershed=0`` (the
        bounding-box complement).  Only features with ``Watershed=1`` — or
        all features when the property is absent — are used, and their
        geometries are merged into a single MultiPolygon.
        """
        polygons: list[Polygon | MultiPolygon] = []
        for feature in layer:
            try:
                ws_flag = feature.get('Watershed')
            except (IndexError, KeyError):
                ws_flag = None

            if ws_flag is not None and int(ws_flag) != 1:
                continue

            geom = _extract_geometry(feature)
            if isinstance(geom, MultiPolygon):
                polygons.extend(list(geom))
            elif isinstance(geom, Polygon):
                polygons.append(geom)

        if not polygons:
            return 0

        merged = MultiPolygon(polygons) if len(polygons) > 1 else MultiPolygon(polygons[0])

        Watershed.objects.update_or_create(
            runid=runid,
            defaults={'srcname': display_name, 'geom': merged},
        )
        return 1
    
    def save_subcatchments(self, runid: str, layer) -> int:
        """Save subcatchment features for a watershed."""
        return self._save_associated_layer(
            layer=layer,
            mapping=SUBCATCHMENT_MAPPING,
            associated_runid=runid,
            model_class=Subcatchment,
        )
    
    def save_channels(self, runid: str, layer) -> int:
        """Save channel features for a watershed."""
        return self._save_associated_layer(
            layer=layer,
            mapping=CHANNEL_MAPPING,
            associated_runid=runid,
            model_class=Channel,
        )
    
    def _save_associated_layer(self, layer, mapping: dict, associated_runid: str, model_class) -> int:
        """
        Save a layer of features with a one-to-many relationship with watersheds.
        
        Handles merging multiple polygons for the same entity into a MultiPolygon.
        """
        entities = defaultdict(lambda: {'attributes': {}, 'polygons': []})
        
        for feature in layer:
            attributes = {key: feature.get(value) for key, value in mapping.items()}
            
            if model_class == Channel:
                entity_key = (attributes['topazid'], attributes['weppid'], attributes['order'])
            else:
                entity_key = (attributes['topazid'], attributes['weppid'])
            
            if not entities[entity_key]['attributes']:
                entities[entity_key]['attributes'] = attributes
            
            geom = feature.geom.geos
            if isinstance(geom, Polygon):
                entities[entity_key]['polygons'].append(geom)
            elif isinstance(geom, MultiPolygon):
                entities[entity_key]['polygons'].extend(list(geom))
        
        instances = []
        for entity_key, entity_data in entities.items():
            kwargs = entity_data['attributes']
            polygons = entity_data['polygons']
            kwargs['geom'] = MultiPolygon(polygons) if len(polygons) > 1 else MultiPolygon(polygons[0])
            kwargs['watershed_id'] = associated_runid
            instances.append(model_class(**kwargs))
        
        model_class.objects.bulk_create(instances)
        return len(instances)
    
    def update_subcatchments_from_parquet(
        self,
        runid: str,
        hillslopes: Optional[pd.DataFrame],
        soils: Optional[pd.DataFrame],
        landuse: Optional[pd.DataFrame],
    ) -> int:
        """Update subcatchment records with parquet data."""
        dataframes = {}
        field_maps = {}
        
        if hillslopes is not None:
            topaz_col = self._find_topaz_column(hillslopes)
            if topaz_col:
                dataframes['hillslopes'] = hillslopes.set_index(topaz_col)
                field_maps['hillslopes'] = HILLSLOPES_FIELD_MAP
        
        if soils is not None:
            topaz_col = self._find_topaz_column(soils)
            if topaz_col:
                dataframes['soils'] = soils.set_index(topaz_col)
                field_maps['soils'] = SOILS_FIELD_MAP
        
        if landuse is not None:
            topaz_col = self._find_topaz_column(landuse)
            if topaz_col:
                dataframes['landuse'] = landuse.set_index(topaz_col)
                field_maps['landuse'] = LANDUSE_FIELD_MAP
        
        if not dataframes:
            return 0
        
        subcatchments = list(Subcatchment.objects.filter(watershed_id=runid))
        updated_subcatchments = []
        
        for subcatchment in subcatchments:
            topaz_id = subcatchment.topazid
            was_updated = False
            
            for name, df in dataframes.items():
                if topaz_id in df.index:
                    row = df.loc[topaz_id]
                    if self._apply_field_mapping(subcatchment, row, field_maps[name]):
                        was_updated = True
            
            if was_updated:
                updated_subcatchments.append(subcatchment)
        
        if updated_subcatchments:
            all_fields = []
            for field_map in field_maps.values():
                all_fields.extend([f[0] for f in field_map])
            
            Subcatchment.objects.bulk_update(
                updated_subcatchments,
                all_fields,
                batch_size=self.config.geometry.bulk_update_batch_size,
            )
        
        return len(updated_subcatchments)
    
    def _find_topaz_column(self, df: pd.DataFrame) -> Optional[str]:
        """Find the TopazID column trying multiple naming conventions."""
        possible_names = ['TopazID', 'topaz_id', 'topazid', 'TOPAZID', 'Topaz_ID', 'topaz_ID']
        for name in possible_names:
            if name in df.columns:
                return name
        return None
    
    def _apply_field_mapping(self, obj, row: pd.Series, field_map: list) -> bool:
        """Apply field mapping from parquet row to model object."""
        updated = False
        for model_field, parquet_col, converter in field_map:
            value = row.get(parquet_col)
            if pd.notna(value):
                setattr(obj, model_field, converter(value))
                updated = True
            else:
                setattr(obj, model_field, None)
        return updated


def _check_protocol_conformance() -> DataWriter:
    """Type check to ensure DjangoDataWriter conforms to protocol."""
    return DjangoDataWriter()
