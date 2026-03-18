import { API_ENDPOINTS } from "./apiEndpoints";
import { checkResponse } from "./errors";
import { postQuery, toFiniteNumber } from "./queryUtils";

import {
  PARQUET_PATHS,
  SPATIAL_ID_COLUMN,
  BASIN_DAILY_PATHS,
} from "./rhessysConstants";

import type {
  RhessysOutputListResponse,
  RhessysChoroplethRow,
  QueryPayload,
  SpatialScale,
} from "./types";

export type RhessysTimeSeriesRow = {
  year: number;
  month: number;
  day: number;
  [key: string]: number;
};

/**
 * Fetch the list of available RHESSys output map scenarios and variables.
 *
 * The backend probes the WEPPcloud file browser under `rhessys/maps/` and
 * returns the catalog of discovered scenario directories and variable TIFFs,
 * along with actual min/max value ranges for each scenario/variable combination.
 *
 * @param runId  - The `webcloud_run_id` of the watershed.
 * @param signal - {@link AbortSignal} for request cancellation.
 */
export async function fetchRhessysOutputs(
  runId: string,
  signal: AbortSignal,
): Promise<RhessysOutputListResponse> {
  const url = API_ENDPOINTS.RHESSYS_OUTPUTS_LIST(runId);
  const response = await fetch(url, { signal });
  return checkResponse<RhessysOutputListResponse>(response, {
    url,
    runId,
    prefix: "RHESSys Outputs",
  });
}

/**
 * Query the WEPPcloud Query Engine for aggregated RHESSys data by spatial unit.
 *
 * Returns `{spatialId, value}` rows for choropleth rendering. Rows where
 * either field is non-finite are silently dropped.
 *
 * @param opts.runId        - The `webcloud_run_id` of the watershed.
 * @param opts.scenario     - RHESSys scenario id (e.g. `"S1"`).
 * @param opts.variable     - Column name to aggregate (e.g. `"streamflow"`).
 * @param opts.spatialScale - `"hillslope"` or `"patch"`.
 * @param opts.year         - Calendar year to filter on.
 * @param opts.signal       - {@link AbortSignal} for request cancellation.
 */
export async function fetchRhessysChoropleth(opts: {
  runId: string;
  scenario: string;
  variable: string;
  spatialScale: SpatialScale;
  year: number;
  signal: AbortSignal;
}): Promise<RhessysChoroplethRow[]> {
  const { runId, scenario, variable, spatialScale, year, signal } = opts;

  const parquetPaths = PARQUET_PATHS[scenario];
  if (!parquetPaths) throw new Error(`Unknown scenario: ${scenario}`);

  const datasetPath = parquetPaths[spatialScale];
  const idCol = SPATIAL_ID_COLUMN[spatialScale];
  const alias = "d";

  const payload: QueryPayload = {
    datasets: [{ alias, path: datasetPath }],
    columns: [`${alias}.${idCol} AS spatialId`],
    filters: [{ column: `${alias}.year`, operator: "=", value: year }],
    aggregations: [{ alias: "value", expression: `AVG(${alias}.${variable})` }],
    group_by: [`${alias}.${idCol}`],
    order_by: [`${alias}.${idCol}`],
  };

  type RawRow = { spatialId?: number; spatialid?: number; value?: number };
  const rawRows = await postQuery<RawRow>(
    runId,
    payload,
    "RHESSys Choropleth",
    signal,
  );

  return rawRows
    .map((row) => ({
      spatialId: toFiniteNumber(row.spatialId ?? row.spatialid, NaN),
      value: toFiniteNumber(row.value, NaN),
    }))
    .filter((r) => Number.isFinite(r.spatialId) && Number.isFinite(r.value));
}

/**
 * Fetch the hillslope or patch GeoJSON geometry via the backend proxy.
 *
 * The backend proxies the request to WEPPcloud to avoid CORS issues.
 *
 * @param runId        - The `webcloud_run_id` of the watershed.
 * @param spatialScale - `"hillslope"` or `"patch"`.
 * @param signal       - {@link AbortSignal} for request cancellation.
 */
export async function fetchRhessysGeometry(
  runId: string,
  spatialScale: SpatialScale,
  signal: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const url = API_ENDPOINTS.RHESSYS_OUTPUTS_GEOMETRY(runId, spatialScale);

  const response = await fetch(url, { signal });
  return checkResponse<GeoJSON.FeatureCollection>(response, {
    url,
    runId,
    prefix: `RHESSys ${spatialScale} Geometry`,
  });
}

/**
 * Fetch time series data from the WEPPcloud Query Engine.
 *
 * - `hillslope` / `null` → `basin.daily.parquet`, aggregated to monthly means.
 * - `patch` → `patch.yearly.parquet`, aggregated across all patches per year.
 *
 * @param opts.runId        - The `webcloud_run_id` of the watershed.
 * @param opts.scenario     - RHESSys scenario id (e.g. `"S1"`).
 * @param opts.variables    - Column names to aggregate.
 * @param opts.spatialScale - `"hillslope"`, `"patch"`, or `null`.
 * @param opts.signal       - {@link AbortSignal} for request cancellation.
 */
export async function fetchRhessysTimeSeries(opts: {
  runId: string;
  scenario: string;
  variables: string[];
  spatialScale?: SpatialScale | null;
  signal: AbortSignal;
}): Promise<RhessysTimeSeriesRow[]> {
  const { runId, scenario, variables, spatialScale, signal } = opts;
  const isPatch = spatialScale === "patch";

  // Resolve dataset path
  let datasetPath: string;
  if (isPatch) {
    const parquetPaths = PARQUET_PATHS[scenario];
    if (!parquetPaths) throw new Error(`Unknown scenario: ${scenario}`);
    datasetPath = parquetPaths.patch;
  } else {
    datasetPath = BASIN_DAILY_PATHS[scenario];
    if (!datasetPath) throw new Error(`Unknown scenario: ${scenario}`);
  }

  const alias = isPatch ? "p" : "b";
  const columns = isPatch
    ? [`${alias}.year AS year`]
    : [`${alias}.year AS year`, `${alias}.month AS month`];
  const groupBy = isPatch
    ? [`${alias}.year`]
    : [`${alias}.year`, `${alias}.month`];

  const payload: QueryPayload = {
    datasets: [{ alias, path: datasetPath }],
    columns,
    aggregations: variables.map((v) => ({
      alias: v,
      expression: `AVG(${alias}.${v})`,
    })),
    group_by: groupBy,
    order_by: groupBy,
  };

  const rawRows = await postQuery(runId, payload, "RHESSys TimeSeries", signal);

  return rawRows.map((r) => {
    const row = r as Record<string, unknown>;
    const result: Record<string, number> = {
      year: toFiniteNumber(row.year, 0),
      month: isPatch ? 0 : toFiniteNumber(row.month, 1),
      day: 1,
    };
    for (const v of variables) {
      result[v] = toFiniteNumber(row[v], 0);
    }
    return result as RhessysTimeSeriesRow;
  });
}
