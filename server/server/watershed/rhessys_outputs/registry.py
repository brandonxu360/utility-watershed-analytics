"""
Metadata registry for RHESSys output map variables and scenario categories.

Covers the pre-computed GeoTIFF map products found under ``rhessys/maps/``
for Victoria (Sooke09, Sooke15) and Mill Creek watersheds, as well as the
dynamic choropleth variables used for Gate Creek.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class OutputVariableMeta:
    id: str
    label: str
    units: str
    filename: str  # e.g. "streamflow.tif"


@dataclass(frozen=True)
class ScenarioMeta:
    id: str
    label: str
    is_change: bool  # True for delta maps (need diverging colormap)


OUTPUT_VARIABLES: list[OutputVariableMeta] = [
    OutputVariableMeta("streamflow", "Streamflow", "m/day", "streamflow.tif"),
    OutputVariableMeta("lai", "LAI", "m\u00b2/m\u00b2", "lai.tif"),
    OutputVariableMeta("ET", "Evapotranspiration", "m/day", "ET.tif"),
    OutputVariableMeta(
        "aboveground_biomass", "Aboveground Biomass", "Kg/m\u00b2",
        "Aboveground_Biomass__Kg_m2_.tif",
    ),
    OutputVariableMeta(
        "nitrate", "Nitrate", "mg/m\u00b2/day",
        "Nitrate__mg_m2_day_.tif",
    ),
    OutputVariableMeta(
        "ammonium", "Ammonium", "mg/m\u00b2/day",
        "Ammonium__mg_m2_day_.tif",
    ),
    OutputVariableMeta(
        "doc", "Dissolved Organic Carbon", "mg/m\u00b2/day",
        "DOC__mg_m2_day_.tif",
    ),
    OutputVariableMeta(
        "don", "Dissolved Organic Nitrogen", "mg/m\u00b2/day",
        "DON__mg_m2_day_.tif",
    ),
]

VARIABLE_BY_ID: dict[str, OutputVariableMeta] = {v.id: v for v in OUTPUT_VARIABLES}
VARIABLE_BY_FILENAME: dict[str, OutputVariableMeta] = {v.filename: v for v in OUTPUT_VARIABLES}


SCENARIO_REGISTRY: list[ScenarioMeta] = [
    ScenarioMeta("baseline", "Baseline", is_change=False),
    ScenarioMeta("Pspread_fire_1yr_change", "Fire \u2013 1yr Change", is_change=True),
    ScenarioMeta("Pspread_fire_5yr_change", "Fire \u2013 5yr Change", is_change=True),
    ScenarioMeta("heavy_thin_1yr_change", "Heavy Thin \u2013 1yr Change", is_change=True),
    ScenarioMeta("heavy_thin_5yr_change", "Heavy Thin \u2013 5yr Change", is_change=True),
    # Judge Creek has additional diff maps
    ScenarioMeta("Pspread_fire_1yr_diff", "Fire \u2013 1yr Diff", is_change=True),
    ScenarioMeta("heavy_thin_1yr_diff", "Heavy Thin \u2013 1yr Diff", is_change=True),
]

SCENARIO_BY_ID: dict[str, ScenarioMeta] = {s.id: s for s in SCENARIO_REGISTRY}


def get_variable(variable_id: str) -> Optional[OutputVariableMeta]:
    return VARIABLE_BY_ID.get(variable_id)


def get_scenario(scenario_id: str) -> Optional[ScenarioMeta]:
    return SCENARIO_BY_ID.get(scenario_id)


def is_change_scenario(scenario_id: str) -> bool:
    meta = get_scenario(scenario_id)
    return meta.is_change if meta else "change" in scenario_id or "diff" in scenario_id
