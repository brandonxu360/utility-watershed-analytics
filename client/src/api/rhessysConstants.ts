/**
 * Static domain constants for the Gate Creek RHESSys integration.
 *
 * Centralises parquet paths, scenario/variable catalogs, year ranges,
 * and the set of run IDs that support the dynamic choropleth / time-series
 * features.  Fetch functions live in rhessysOutputsApi.ts and import
 * from here as needed.
 */

import type { SpatialScale } from "./types";

/**
 * Run IDs whose WEPPcloud stores contain RHESSys scenario parquet files
 * suitable for the dynamic choropleth and time-series features.
 */
export const CHOROPLETH_RUN_IDS: ReadonlySet<string> = new Set([
  "aversive-forestry",
]);

// Parquet dataset paths

export const PARQUET_PATHS: Record<string, Record<SpatialScale, string>> = {
  S1: {
    hillslope: "rhessys/scenarios/S1/hillslope.daily.parquet",
    patch: "rhessys/scenarios/S1/patch.yearly.parquet",
  },
  S2: {
    hillslope: "rhessys/scenarios/S2/hillslope.daily.parquet",
    patch: "rhessys/scenarios/S2/patch.yearly.parquet",
  },
  S4b: {
    hillslope: "rhessys/scenarios/S4b/hillslope.daily.parquet",
    patch: "rhessys/scenarios/S4b/patch.yearly.parquet",
  },
};

export const SPATIAL_ID_COLUMN: Record<SpatialScale, string> = {
  hillslope: "hillID",
  patch: "patchID",
};

export const BASIN_DAILY_PATHS: Record<string, string> = {
  S1: "rhessys/scenarios/S1/basin.daily.parquet",
  S2: "rhessys/scenarios/S2/basin.daily.parquet",
  S4b: "rhessys/scenarios/S4b/basin.daily.parquet",
};

// Gate Creek UI metadata

export const GATE_CREEK_YEAR_RANGE = { min: 1985, max: 2024 };

export const GATE_CREEK_SCENARIOS = [
  { id: "S1", label: "S1 \u2013 Pre-fire Baseline" },
  { id: "S2", label: "S2 \u2013 Post-fire Land Cover" },
  { id: "S4b", label: "S4b \u2013 Post-fire Regrowth" },
];

export const GATE_CREEK_VARIABLES: Record<
  SpatialScale,
  { id: string; label: string; units: string }[]
> = {
  hillslope: [
    { id: "streamflow", label: "Streamflow", units: "mm/day" },
    { id: "baseflow", label: "Baseflow", units: "mm/day" },
    { id: "return", label: "Return Flow", units: "mm/day" },
    { id: "trans", label: "Transpiration", units: "mm/day" },
    { id: "evap", label: "Evaporation", units: "mm/day" },
  ],
  patch: [
    { id: "et", label: "Evapotranspiration", units: "mm/yr" },
    { id: "lai", label: "LAI", units: "m\u00b2/m\u00b2" },
    { id: "plantc", label: "Plant Carbon", units: "kgC/m\u00b2" },
    { id: "streamflow", label: "Streamflow", units: "mm/yr" },
  ],
};

export const TIME_SERIES_VARIABLES = [
  { id: "streamflow", label: "Streamflow", units: "mm/day" },
  { id: "baseflow", label: "Baseflow", units: "mm/day" },
  { id: "return", label: "Return Flow", units: "mm/day" },
  { id: "trans", label: "Transpiration", units: "mm/day" },
  { id: "evap", label: "Evaporation", units: "mm/day" },
];
