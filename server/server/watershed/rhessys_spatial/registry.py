"""
Static metadata registry for known RHESSys spatial input GeoTIFFs.

Each entry maps a filename to its display name, data type, rendering hints,
and optional group membership.  These values come from analysis of the Gate
Creek dataset (the first watershed with RHESSys data) but the structure is
the same across all watersheds.

Only files present in this registry are currently renderable via the tile
endpoint; requests for unknown filenames return 404 so new rasters must be
explicitly registered here.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class SpatialInputMeta:
    name: str
    data_type: str  # "continuous" | "categorical" | "stream"
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    unique_values: Optional[list[int]] = None
    group: Optional[str] = None
    group_min: Optional[float] = None
    group_max: Optional[float] = None
    reversed_colormap: bool = False
    clamp_max: Optional[float] = None  # cap rendered max (e.g. slope at 60°)


SPATIAL_INPUT_REGISTRY: dict[str, SpatialInputMeta] = {
    "canopy_cover_1985.tif": SpatialInputMeta(
        name="Canopy Cover 1985", data_type="continuous",
        min_val=0.0, max_val=1.05, group="canopy_cover",
        group_min=0.0, group_max=1.05, reversed_colormap=True,
    ),
    "canopy_cover_2021.tif": SpatialInputMeta(
        name="Canopy Cover 2021", data_type="continuous",
        min_val=0.0, max_val=1.0, group="canopy_cover",
        group_min=0.0, group_max=1.05, reversed_colormap=True,
    ),
    "daymet_patch_combination_2021.tif": SpatialInputMeta(
        name="Daymet Patch Combo 2021", data_type="continuous",
        min_val=1500948.0, max_val=841702112.0,
    ),
    "fillna_surface_texture.tif": SpatialInputMeta(
        name="Surface Texture", data_type="categorical",
        unique_values=[3, 6, 8, 9, 10, 12, 13],
    ),
    "flip_wbt_impervious_2001.tif": SpatialInputMeta(
        name="Impervious (Flip) 2001", data_type="continuous",
        min_val=0.0, max_val=1.0, group="flip_wbt_impervious",
        group_min=0.0, group_max=1.0,
    ),
    "flip_wbt_impervious_2021.tif": SpatialInputMeta(
        name="Impervious (Flip) 2021", data_type="continuous",
        min_val=0.0, max_val=1.0, group="flip_wbt_impervious",
        group_min=0.0, group_max=1.0,
    ),
    "impervious_2021.tif": SpatialInputMeta(
        name="Impervious 2021", data_type="continuous",
        min_val=0.0, max_val=1.0,
    ),
    "landuse.tif": SpatialInputMeta(
        name="Land Use", data_type="categorical",
        unique_values=[1, 2, 3], group="landuse",
    ),
    "landuse_1985.tif": SpatialInputMeta(
        name="Land Use 1985", data_type="categorical",
        unique_values=[1, 2, 3], group="landuse",
    ),
    "landuse_2021.tif": SpatialInputMeta(
        name="Land Use 2021", data_type="categorical",
        unique_values=[1, 2, 3], group="landuse",
    ),
    "masked_daymet_patchID_1985.tif": SpatialInputMeta(
        name="Masked Daymet PatchID 1985", data_type="continuous",
        min_val=37866.0, max_val=126605.0, group="masked_daymet_patchID",
        group_min=10403.0, group_max=126605.0,
    ),
    "masked_daymet_patchID_2021.tif": SpatialInputMeta(
        name="Masked Daymet PatchID 2021", data_type="continuous",
        min_val=10403.0, max_val=36406.0, group="masked_daymet_patchID",
        group_min=10403.0, group_max=126605.0,
    ),
    "masked_tol_1000cleaned_hillslop.tif": SpatialInputMeta(
        name="Masked Cleaned Hillslope", data_type="continuous",
        min_val=259.0, max_val=755.0,
    ),
    "road_1985.tif": SpatialInputMeta(
        name="Roads 1985", data_type="categorical",
        unique_values=[0, 1], group="road",
    ),
    "road_2021.tif": SpatialInputMeta(
        name="Roads 2021", data_type="categorical",
        unique_values=[0, 1], group="road",
    ),
    "smothed_gee_elevation.tif": SpatialInputMeta(
        name="Elevation", data_type="continuous",
        min_val=0.0, max_val=1451.0,
    ),
    "strata_overcanopy_1985.tif": SpatialInputMeta(
        name="Strata Over-Canopy 1985", data_type="categorical",
        unique_values=[1, 2, 3, 4, 5, 6], group="strata_overcanopy",
    ),
    "strata_overcanopy_2021.tif": SpatialInputMeta(
        name="Strata Over-Canopy 2021", data_type="categorical",
        unique_values=[1, 2, 3, 4, 5, 6], group="strata_overcanopy",
    ),
    "strata_understory_1985.tif": SpatialInputMeta(
        name="Strata Understory 1985", data_type="categorical",
        unique_values=[49, 50, 51], group="strata_understory",
    ),
    "strata_understory_2021.tif": SpatialInputMeta(
        name="Strata Understory 2021", data_type="categorical",
        unique_values=[49, 50, 51], group="strata_understory",
    ),
    "tol_1000cleaned_hillslop.tif": SpatialInputMeta(
        name="Cleaned Hillslope", data_type="continuous",
        min_val=1.0, max_val=968.0,
    ),
    "tol_1000wbt_stream.tif": SpatialInputMeta(
        name="Stream Network", data_type="stream",
        min_val=1.0, max_val=1.0,
    ),
    "wbt_TWI.tif": SpatialInputMeta(
        name="Topographic Wetness Index", data_type="continuous",
        min_val=0.0, max_val=23.0,
    ),
    "wbt_aspect.tif": SpatialInputMeta(
        name="Aspect", data_type="continuous",
        min_val=-1.0, max_val=360.0,
    ),
    "wbt_basin.tif": SpatialInputMeta(
        name="Basin", data_type="categorical",
        unique_values=[1],
    ),
    "wbt_d8_slope.tif": SpatialInputMeta(
        name="D8 Slope", data_type="continuous",
        min_val=0.0, max_val=90.0, clamp_max=60.0,
    ),
    "wbt_ehorizen.tif": SpatialInputMeta(
        name="East Horizon Angle", data_type="continuous",
        min_val=-45.0, max_val=45.0,
    ),
    "wbt_impervious_2001.tif": SpatialInputMeta(
        name="Impervious 2001", data_type="continuous",
        min_val=0.0, max_val=1.0, group="wbt_impervious",
        group_min=0.0, group_max=1.0,
    ),
    "wbt_impervious_2021.tif": SpatialInputMeta(
        name="Impervious 2021", data_type="continuous",
        min_val=0.0, max_val=1.0, group="wbt_impervious",
        group_min=0.0, group_max=1.0,
    ),
    "wbt_landform.tif": SpatialInputMeta(
        name="Landform Classification", data_type="categorical",
        unique_values=[11, 12, 13, 14, 15, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42],
    ),
    "wbt_slope.tif": SpatialInputMeta(
        name="Slope", data_type="continuous",
        min_val=0.0, max_val=90.0, clamp_max=60.0,
    ),
    "wbt_whorizen.tif": SpatialInputMeta(
        name="West Horizon Angle", data_type="continuous",
        min_val=-45.0, max_val=45.0,
    ),
}


def get_meta(filename: str) -> Optional[SpatialInputMeta]:
    return SPATIAL_INPUT_REGISTRY.get(filename)


def get_display_name(filename: str) -> str:
    meta = get_meta(filename)
    if meta:
        return meta.name
    stem = filename.removesuffix(".tif").replace("_", " ").title()
    return stem


def get_render_range(meta: SpatialInputMeta) -> tuple[float, float]:
    """Return (min, max) used for colormap scaling.

    Prefers group-level min/max so that files in the same group share
    a consistent color scale.  Falls back to per-file min/max.
    """
    lo = meta.group_min if meta.group_min is not None else meta.min_val
    hi = meta.group_max if meta.group_max is not None else meta.max_val
    if meta.clamp_max is not None and hi is not None:
        hi = min(hi, meta.clamp_max)
    if lo is None:
        lo = 0.0
    if hi is None:
        hi = 1.0
    return (lo, hi)
