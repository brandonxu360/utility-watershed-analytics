"""
Utility for high-performance GeoJSON FeatureCollection generation.

Uses PostGIS ST_AsGeoJSON to serialize geometries directly in the database,
bypassing Python GEOS -> GeoJSON conversion overhead.
"""

import json

from django.contrib.gis.db.models.functions import AsGeoJSON
from django.http import HttpResponse, JsonResponse


# 6 decimal places is sub-meter precision in WGS84 and trims payload size.
DEFAULT_PRECISION = 6


def _json_default(obj):
    """Handle non-JSON-native scalar values such as datetimes."""
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _feature_json(row, id_field):
    """Build one GeoJSON Feature JSON string from an annotated values() row."""
    geojson_str = row.pop("_geojson")
    feature_id = row.pop(id_field)
    props_json = json.dumps(row, default=_json_default)
    geometry_json = geojson_str if geojson_str is not None else "null"
    return (
        f'{{"id":{json.dumps(feature_id)},"type":"Feature",'
        f'"properties":{props_json},"geometry":{geometry_json}}}'
    )


def _annotated_rows(queryset, geo_field, id_field, properties, precision):
    """Return values() rows with an annotated JSON geometry field."""
    return queryset.annotate(
        _geojson=AsGeoJSON(geo_field, precision=precision)
    ).values(*list(set([id_field] + list(properties) + ["_geojson"])))


def geojson_response(
    queryset,
    geo_field="geom",
    id_field=None,
    properties=None,
    exclude=None,
    precision=DEFAULT_PRECISION,
):
    """Build a GeoJSON FeatureCollection with geometry serialization in PostGIS."""
    model = queryset.model
    meta = model._meta
    exclude = set(exclude or ())
    exclude.add(geo_field)

    if properties is None:
        geo_field_names = {
            f.name for f in meta.get_fields() if hasattr(f, "geom_type")
        }
        properties = [
            f.name
            for f in meta.get_fields()
            if hasattr(f, "column")
            and f.name not in exclude
            and f.name not in geo_field_names
        ]

    if id_field is None:
        id_field = meta.pk.name

    rows = _annotated_rows(queryset, geo_field, id_field, properties, precision)

    feature_strings = []
    for row in rows:
        feature_strings.append(_feature_json(row, id_field))

    body = '{"type":"FeatureCollection","features":[' + ",".join(feature_strings) + "]}"
    return HttpResponse(body, content_type="application/json")


def geojson_feature_response(
    queryset,
    geo_field="geom",
    id_field=None,
    properties=None,
    exclude=None,
    precision=DEFAULT_PRECISION,
):
    """Build a single GeoJSON Feature response or return 404 when missing."""
    model = queryset.model
    meta = model._meta
    exclude = set(exclude or ())
    exclude.add(geo_field)

    if properties is None:
        geo_field_names = {
            f.name for f in meta.get_fields() if hasattr(f, "geom_type")
        }
        properties = [
            f.name
            for f in meta.get_fields()
            if hasattr(f, "column")
            and f.name not in exclude
            and f.name not in geo_field_names
        ]

    if id_field is None:
        id_field = meta.pk.name

    row = _annotated_rows(queryset, geo_field, id_field, properties, precision).first()
    if row is None:
        return JsonResponse({"detail": "Not found."}, status=404)

    return HttpResponse(_feature_json(row, id_field), content_type="application/json")
