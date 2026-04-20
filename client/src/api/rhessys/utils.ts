import type { SpatialScale } from "../types/rhessys";

import type {
  GateCreekVariable,
  PatchGeometryRevision,
  VariableSource,
} from "./constants";
import {
  BASIN_DAILY_PATHS,
  GATE_CREEK_VARIABLES,
  GROW_BASIN_DAILY_PATHS,
  GROW_PARQUET_PATHS,
  GROW_SPATIAL_ID_COLUMN,
  PARQUET_PATHS,
  PATCH_2021_SCENARIOS,
  PATCH_GEOMETRY_2021_QUERY_SCENARIO,
  SPATIAL_ID_COLUMN,
} from "./constants";

/** Look up variable metadata, including its source parquet type. */
export function getVariableMeta(
  spatialScale: SpatialScale,
  variableId: string,
): GateCreekVariable | undefined {
  return GATE_CREEK_VARIABLES[spatialScale].find((v) => v.id === variableId);
}

/**
 * How to resolve parquet paths for a variable.
 *
 * - `choropleth` — spatial outputs (`hillslope.daily`, `patch.yearly`, etc.).
 * - `timeSeries` — same as choropleth for patch; for hillslope uses
 *   `basin.daily` / `grow_basin.daily` (watershed aggregate daily series).
 */
export type ParquetResolutionMode = "choropleth" | "timeSeries";

/** Resolve the parquet path and spatial-ID column for a given variable. */
export function resolveParquetConfig(
  scenario: string,
  spatialScale: SpatialScale,
  source: VariableSource,
  mode: ParquetResolutionMode = "choropleth",
): { datasetPath: string; idColumn: string } {
  if (mode === "timeSeries" && spatialScale === "hillslope") {
    const datasetPath =
      source === "grow"
        ? GROW_BASIN_DAILY_PATHS[scenario]
        : BASIN_DAILY_PATHS[scenario];
    if (!datasetPath) throw new Error(`Unknown scenario: ${scenario}`);
    return {
      datasetPath,
      // Unused for time-series queries; basin-level daily rows use basinID.
      idColumn: "basinID",
    };
  }

  const paths = source === "grow" ? GROW_PARQUET_PATHS : PARQUET_PATHS;
  const scenarioPaths = paths[scenario];
  if (!scenarioPaths) throw new Error(`Unknown scenario: ${scenario}`);

  const idColumns =
    source === "grow" ? GROW_SPATIAL_ID_COLUMN : SPATIAL_ID_COLUMN;

  return {
    datasetPath: scenarioPaths[spatialScale],
    idColumn: idColumns[spatialScale],
  };
}

/** Geometry revision for cache keys: hillslope → null; patch → 1985 or 2021. */
export function getPatchGeometryRevision(
  spatialScale: SpatialScale,
  scenario: string | null | undefined,
): PatchGeometryRevision | null {
  if (spatialScale !== "patch") return null;
  if (scenario && PATCH_2021_SCENARIOS.has(scenario)) return "2021";
  return "1985";
}

/** Query param for geometry fetch; null means omit (1985 patch IDs on the server). */
export function getPatchGeometryQueryScenario(
  revision: PatchGeometryRevision | null,
): string | null {
  if (revision === "2021") return PATCH_GEOMETRY_2021_QUERY_SCENARIO;
  return null;
}
