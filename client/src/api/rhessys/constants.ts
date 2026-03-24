/**
 * Static domain constants for the Gate Creek RHESSys integration.
 *
 * Parquet paths, scenario/variable catalogs, and geometry metadata.
 * Helper functions live in `utils.ts` alongside this file.
 */

import type { SpatialScale } from "../types";

/**
 * Run IDs whose WEPPcloud stores contain RHESSys scenario parquet files
 * suitable for the dynamic choropleth and time-series features.
 */
export const CHOROPLETH_RUN_IDS: ReadonlySet<string> = new Set([
  "aversive-forestry",
]);

// ---------------------------------------------------------------------------
// Parquet dataset paths
// ---------------------------------------------------------------------------

/** Hydrology parquets: hillslope.daily / patch.yearly per scenario. */
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

/** Growth parquets: grow_hillslope.daily / grow_patch.yearly per scenario. */
export const GROW_PARQUET_PATHS: Record<
  string,
  Record<SpatialScale, string>
> = {
  S1: {
    hillslope: "rhessys/scenarios/S1/grow_hillslope.daily.parquet",
    patch: "rhessys/scenarios/S1/grow_patch.yearly.parquet",
  },
  S2: {
    hillslope: "rhessys/scenarios/S2/grow_hillslope.daily.parquet",
    patch: "rhessys/scenarios/S2/grow_patch.yearly.parquet",
  },
  S4b: {
    hillslope: "rhessys/scenarios/S4b/grow_hillslope.daily.parquet",
    patch: "rhessys/scenarios/S4b/grow_patch.yearly.parquet",
  },
};

/**
 * Basin-level daily parquets (one row per day for the whole watershed).
 * Used as the time-series data source for hillslope-scale views because
 * the basin is the properly area-weighted watershed aggregate computed
 * by RHESSys.
 */
export const BASIN_DAILY_PATHS: Record<string, string> = {
  S1: "rhessys/scenarios/S1/basin.daily.parquet",
  S2: "rhessys/scenarios/S2/basin.daily.parquet",
  S4b: "rhessys/scenarios/S4b/basin.daily.parquet",
};

/** Basin-level growth daily parquets (watershed-scale LAI, GPP, biomass, etc.). */
export const GROW_BASIN_DAILY_PATHS: Record<string, string> = {
  S1: "rhessys/scenarios/S1/grow_basin.daily.parquet",
  S2: "rhessys/scenarios/S2/grow_basin.daily.parquet",
  S4b: "rhessys/scenarios/S4b/grow_basin.daily.parquet",
};

// ---------------------------------------------------------------------------
// Spatial-ID columns
// ---------------------------------------------------------------------------

export const SPATIAL_ID_COLUMN: Record<SpatialScale, string> = {
  hillslope: "hillID",
  patch: "patchID",
};

/** grow_hillslope uses `basinID` as its spatial key per the data spec. */
export const GROW_SPATIAL_ID_COLUMN: Record<SpatialScale, string> = {
  hillslope: "basinID",
  patch: "patchID",
};

// ---------------------------------------------------------------------------
// Variable source type \u2014 determines which parquet file to query
// ---------------------------------------------------------------------------

export type VariableSource = "base" | "grow";

export type GateCreekVariable = {
  id: string;
  label: string;
  units: string;
  source: VariableSource;
};

// ---------------------------------------------------------------------------
// Gate Creek UI metadata
// ---------------------------------------------------------------------------

export const GATE_CREEK_YEAR_RANGE = { min: 1985, max: 2024 };

export const GATE_CREEK_SCENARIOS = [
  { id: "S1", label: "S1 \u2013 Pre-fire Baseline" },
  { id: "S2", label: "S2 \u2013 Post-fire Land Cover" },
  { id: "S4b", label: "S4b \u2013 Post-fire Regrowth" },
];

export const GATE_CREEK_VARIABLES: Record<SpatialScale, GateCreekVariable[]> = {
  hillslope: [
    { id: "streamflow", label: "Streamflow", units: "mm/day", source: "base" },
    { id: "baseflow", label: "Baseflow", units: "mm/day", source: "base" },
    { id: "return", label: "Return Flow", units: "mm/day", source: "base" },
    { id: "trans", label: "Transpiration", units: "mm/day", source: "base" },
    { id: "evap", label: "Evaporation", units: "mm/day", source: "base" },
    { id: "lai", label: "LAI", units: "m\u00b2/m\u00b2", source: "grow" },
    { id: "gpsn", label: "GPP", units: "gC/m\u00b2/day", source: "grow" },
    {
      id: "plantc",
      label: "Plant Biomass",
      units: "kgC/m\u00b2",
      source: "grow",
    },
  ],
  patch: [
    { id: "et", label: "Evapotranspiration", units: "mm/yr", source: "base" },
    { id: "lai", label: "LAI", units: "m\u00b2/m\u00b2", source: "base" },
    {
      id: "plant_c",
      label: "Plant Carbon",
      units: "kgC/m\u00b2",
      source: "grow",
    },
    {
      id: "litter_c",
      label: "Litter Carbon",
      units: "kgC/m\u00b2",
      source: "grow",
    },
    {
      id: "soil_c",
      label: "Soil Carbon",
      units: "kgC/m\u00b2",
      source: "grow",
    },
  ],
};

/** Scenarios that use the 2021 patch geometry instead of 1985. */
export const PATCH_2021_SCENARIOS: ReadonlySet<string> = new Set(["S2", "S4b"]);

/** Distinct patch GeoJSON assets; used for React Query / cache keys. */
export type PatchGeometryRevision = "1985" | "2021";

/**
 * Scenario query value that selects 2021 patch geometry on the API.
 * Any scenario in {@link PATCH_2021_SCENARIOS} works; one canonical id keeps URLs stable.
 */
export const PATCH_GEOMETRY_2021_QUERY_SCENARIO = "S2" as const;
