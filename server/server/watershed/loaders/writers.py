"""
Concrete implementations of data writers.

This module provides the real database writer implementation using Django ORM.
For testing, mock implementations can be injected instead.
"""

import logging
import pandas as pd
from typing import Optional
from collections import defaultdict

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
    ('ll', 'll', float),
    ('bd', 'bd', float),
    ('simple_texture', 'simple_texture', str),
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


# OGR field mappings
WATERSHED_MAPPING = {
    'pws_id': 'PWS_ID',
    'srcname': 'SrcName',
    'pws_name': 'PWS_Name',
    'county_nam': 'County_Nam',
    'state': 'State',
    'huc10_id': 'HUC10_ID',
    'huc10_name': 'HUC10_Name',
    'wws_code': 'WWS_Code',
    'srctype': 'SrcType',
    'shape_leng': 'Shape_Leng',
    'shape_area': 'Shape_Area',
    'runid': 'runid',
    'geom': 'UNKNOWN'
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


class DjangoDataWriter:
    """
    Production implementation of DataWriter using Django ORM.
    
    Handles bulk creation and updates of watershed-related models.
    """
    
    def __init__(self, config: Optional[LoaderConfig] = None):
        self.config = config or get_config()
    
    def save_watersheds(self, layer) -> int:
        """
        Save watershed features from a GDAL layer.
        
        Args:
            layer: GDAL Layer containing watershed features
        
        Returns:
            Number of watersheds saved
        """
        instances = []
        for feature in layer:
            kwargs = {
                key: feature.get(value)
                for key, value in WATERSHED_MAPPING.items()
                if key != 'geom'
            }
            geom = feature.geom.geos
            kwargs['geom'] = MultiPolygon(geom) if isinstance(geom, Polygon) else geom
            instances.append(Watershed(**kwargs))
        
        Watershed.objects.bulk_create(instances)
        return len(instances)
    
    def save_watersheds_filtered(self, layer, runids: set[str]) -> int:
        """
        Save only watersheds matching the given runids.
        
        Args:
            layer: GDAL Layer containing watershed features
            runids: Set of runids to filter by
        
        Returns:
            Number of watersheds saved
        """
        instances = []
        for feature in layer:
            feature_runid = feature.get('runid')
            if feature_runid in runids:
                kwargs = {
                    key: feature.get(value)
                    for key, value in WATERSHED_MAPPING.items()
                    if key != 'geom'
                }
                geom = feature.geom.geos
                kwargs['geom'] = MultiPolygon(geom) if isinstance(geom, Polygon) else geom
                instances.append(Watershed(**kwargs))
        
        Watershed.objects.bulk_create(instances)
        return len(instances)
    
    def save_subcatchments(self, runid: str, layer) -> int:
        """
        Save subcatchment features for a watershed.
        
        Args:
            runid: The parent watershed runid
            layer: GDAL Layer containing subcatchment features
        
        Returns:
            Number of subcatchments saved
        """
        return self._save_associated_layer(
            layer=layer,
            mapping=SUBCATCHMENT_MAPPING,
            associated_runid=runid,
            model_class=Subcatchment,
        )
    
    def save_channels(self, runid: str, layer) -> int:
        """
        Save channel features for a watershed.
        
        Args:
            runid: The parent watershed runid
            layer: GDAL Layer containing channel features
        
        Returns:
            Number of channels saved
        """
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
            
            # Create unique identifier based on model type
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
        """
        Update subcatchment records with parquet data.
        
        Args:
            runid: The watershed runid
            hillslopes: DataFrame with hillslope data (may be None)
            soils: DataFrame with soils data (may be None)
            landuse: DataFrame with landuse data (may be None)
        
        Returns:
            Number of subcatchments updated
        """
        # Prepare dataframes indexed by TopazID
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
        
        # Get subcatchments and apply updates
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
        
        # Bulk update
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


# Verify protocol conformance
def _check_protocol_conformance() -> DataWriter:
    """Type check to ensure DjangoDataWriter conforms to protocol."""
    return DjangoDataWriter()
