import type { SpatialScale } from "./types/rhessys";

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

import { API_ENDPOINTS } from "./apiEndpoints";
import { YEAR_BOUNDS } from "./types/query";
import type { QueryPayload, QueryFilter } from "./types/query";
import { checkResponse } from "./errors";

/**
 * Extract rows from various query engine response formats.
 * The query engine can return data in multiple formats depending on configuration.
 */
export function extractRows(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;

  const obj = json as Record<string, unknown>;

  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.rows)) return obj.rows;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray((obj.result as Record<string, unknown>)?.records)) {
    return (obj.result as Record<string, unknown>).records as unknown[];
  }

  return [];
}

/**
 * POST a query to the query engine and return the raw rows.
 *
 * @typeParam T - Shape of each returned row (defaults to `unknown`)
 * @param runPath - The batch path for the query
 * @param payload - Typed query payload
 * @param errorPrefix - Prefix for error messages (e.g., "RAP", "ET")
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Array of row objects typed as T
 * @throws ApiError if the request fails
 */
export async function postQuery<T = unknown>(
  runPath: string,
  payload: QueryPayload,
  errorPrefix: string = "Query",
  signal: AbortSignal,
): Promise<T[]> {
  const url = API_ENDPOINTS.QUERY_RUN(runPath);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  const json = await checkResponse(res, {
    url,
    runId: runPath,
    prefix: errorPrefix,
  });
  return extractRows(json) as T[];
}

/**
 * Add optional schema/sql flags to a payload object.
 * Mutates the payload in place for convenience.
 */
export function addQueryFlags(
  payload: QueryPayload,
  include_schema?: boolean,
  include_sql?: boolean,
): void {
  if (typeof include_schema !== "undefined")
    payload.include_schema = include_schema;
  if (typeof include_sql !== "undefined") payload.include_sql = include_sql;
}

/**
 * Safely convert a value to a finite number, with a fallback.
 */
export function toFiniteNumber(value: unknown, fallback: number = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Check if a year value is valid for query filtering.
 */
export function isValidYear(year: unknown): year is number {
  return (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= YEAR_BOUNDS.min &&
    year <= YEAR_BOUNDS.max
  );
}

/**
 * Create a year filter if the year is valid, otherwise return null.
 */
export function createYearFilter(
  year: unknown,
  column: string = "rap.year",
): QueryFilter | null {
  if (!isValidYear(year)) return null;
  return { column, operator: "=", value: year };
}

/**
 * Create a band filter for valid RAP bands (1-6).
 * Returns a single '=' filter for one band, or 'IN' filter for multiple.
 * Throws if no valid bands are provided.
 */
export function createBandFilter(
  bands: number | number[],
  column: string = "rap.band",
): QueryFilter {
  const validBands = (Array.isArray(bands) ? bands : [bands])
    .map(Number)
    .filter((b) => Number.isInteger(b) && b >= 1 && b <= 6);

  if (validBands.length === 0) {
    throw new Error("Invalid band values provided");
  }

  return validBands.length === 1
    ? { column, operator: "=", value: validBands[0] }
    : { column, operator: "IN", value: validBands };
}
