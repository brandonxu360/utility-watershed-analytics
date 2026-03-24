import { API_ENDPOINTS } from "./apiEndpoints";
import { checkResponse } from "./errors";
import { postQuery, toFiniteNumber } from "./queryUtils";

import { getVariableMeta, resolveParquetConfig } from "./rhessysConstants";

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

  const varMeta = getVariableMeta(spatialScale, variable);
  const source = varMeta?.source ?? "base";
  const { datasetPath, idColumn } = resolveParquetConfig(
    scenario,
    spatialScale,
    source,
  );
  const alias = "d";

  const payload: QueryPayload = {
    datasets: [{ alias, path: datasetPath }],
    columns: [`${alias}.${idColumn} AS spatialId`],
    filters: [{ column: `${alias}.year`, operator: "=", value: year }],
    aggregations: [{ alias: "value", expression: `AVG(${alias}.${variable})` }],
    group_by: [`${alias}.${idColumn}`],
    order_by: [`${alias}.${idColumn}`],
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
 * For patch geometry, the `scenario` parameter selects the correct GeoJSON
 * (S1 uses 1985 patch IDs, S2/S4b use 2021 patch IDs).
 *
 * @param runId        - The `webcloud_run_id` of the watershed.
 * @param spatialScale - `"hillslope"` or `"patch"`.
 * @param signal       - {@link AbortSignal} for request cancellation.
 * @param scenario     - Optional scenario id; used to select correct patch geometry.
 */
export async function fetchRhessysGeometry(
  runId: string,
  spatialScale: SpatialScale,
  signal: AbortSignal,
  scenario?: string | null,
): Promise<GeoJSON.FeatureCollection> {
  let url = API_ENDPOINTS.RHESSYS_OUTPUTS_GEOMETRY(runId, spatialScale);
  if (scenario) {
    url += `?scenario=${encodeURIComponent(scenario)}`;
  }

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
 * - `hillslope` (default) → daily basin outputs, aggregated to monthly means:
 *   base hydrology uses `basin.daily.parquet`; growth variables use
 *   `grow_basin.daily.parquet`.
 * - `patch` → `patch.yearly.parquet` or `grow_patch.yearly.parquet`,
 *   aggregated across all patches per year.
 *
 * The variable's `source` field selects base vs grow parquet at both scales.
 *
 * @param opts.runId        - The `webcloud_run_id` of the watershed.
 * @param opts.scenario     - RHESSys scenario id (e.g. `"S1"`).
 * @param opts.variables    - Column names to aggregate.
 * @param opts.spatialScale - `"hillslope"` or `"patch"`.
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
  const effectiveScale: SpatialScale = spatialScale ?? "hillslope";
  const isPatch = effectiveScale === "patch";

  const varMeta = getVariableMeta(effectiveScale, variables[0]);
  const source = varMeta?.source ?? "base";
  const { datasetPath } = resolveParquetConfig(
    scenario,
    effectiveScale,
    source,
    "timeSeries",
  );

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
