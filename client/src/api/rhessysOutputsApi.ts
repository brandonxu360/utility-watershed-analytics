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

/**
 * Fetch the list of available RHESSys output map scenarios and variables.
 *
 * The backend probes the WEPPcloud file browser under rhessys/maps/ and
 * returns the catalog of discovered scenario directories and variable TIFFs,
 * along with actual min/max value ranges for each scenario/variable combination.
 */
export async function fetchRhessysOutputs(
  runId: string,
  signal?: AbortSignal,
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
 * Returns {spatialId, value} rows for choropleth rendering.
 */
export async function fetchRhessysChoropleth(opts: {
  runId: string;
  scenario: string;
  variable: string;
  spatialScale: SpatialScale;
  year: number;
  signal?: AbortSignal;
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

  const rawRows = await postQuery(runId, payload, "RHESSys Choropleth", signal);

  return rawRows
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        spatialId: toFiniteNumber(row.spatialId ?? row.spatialid, NaN),
        value: toFiniteNumber(row.value, NaN),
      };
    })
    .filter((r) => Number.isFinite(r.spatialId) && Number.isFinite(r.value));
}

/**
 * Fetch the hillslope or patch GeoJSON geometry via the backend proxy.
 * The backend proxies the request to WEPPcloud to avoid CORS issues.
 */
export async function fetchRhessysGeometry(
  runId: string,
  spatialScale: SpatialScale,
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const url = API_ENDPOINTS.RHESSYS_OUTPUTS_GEOMETRY(runId, spatialScale);

  const response = await fetch(url, { signal });
  return checkResponse<GeoJSON.FeatureCollection>(response, {
    url,
    runId,
    prefix: `RHESSys ${spatialScale} Geometry`,
  });
}

export type RhessysTimeSeriesRow = {
  year: number;
  month: number;
  day: number;
  [key: string]: number;
};

/**
 * Fetch time series data from the WEPPcloud Query Engine.
 *
 * - hillslope / null → basin.daily.parquet, aggregated to monthly means
 * - patch → patch.yearly.parquet, aggregated across all patches per year
 */
export async function fetchRhessysTimeSeries(opts: {
  runId: string;
  scenario: string;
  variables: string[];
  spatialScale?: SpatialScale | null;
  signal?: AbortSignal;
}): Promise<RhessysTimeSeriesRow[]> {
  const { runId, scenario, variables, spatialScale, signal } = opts;

  if (spatialScale === "patch") {
    return fetchPatchTimeSeries(runId, scenario, variables, signal);
  }

  const datasetPath = BASIN_DAILY_PATHS[scenario];
  if (!datasetPath) {
    throw new Error(`Unknown scenario for time series: ${scenario}`);
  }

  const alias = "b";
  const aggregations = variables.map((v) => ({
    alias: v,
    expression: `AVG(${alias}.${v})`,
  }));

  const payload: QueryPayload = {
    datasets: [{ alias, path: datasetPath }],
    columns: [`${alias}.year AS year`, `${alias}.month AS month`],
    aggregations,
    group_by: [`${alias}.year`, `${alias}.month`],
    order_by: [`${alias}.year`, `${alias}.month`],
  };

  const rawRows = await postQuery(runId, payload, "RHESSys TimeSeries", signal);

  return rawRows.map((r) => {
    const row = r as Record<string, unknown>;
    const result: Record<string, number> = {
      year: toFiniteNumber(row.year, 0),
      month: toFiniteNumber(row.month, 1),
      day: 1,
    };
    for (const v of variables) {
      result[v] = toFiniteNumber(row[v], 0);
    }
    return result as RhessysTimeSeriesRow;
  });
}

async function fetchPatchTimeSeries(
  runId: string,
  scenario: string,
  variables: string[],
  signal?: AbortSignal,
): Promise<RhessysTimeSeriesRow[]> {
  const parquetPaths = PARQUET_PATHS[scenario];
  if (!parquetPaths) {
    throw new Error(`Unknown scenario for patch time series: ${scenario}`);
  }

  const alias = "p";
  const aggregations = variables.map((v) => ({
    alias: v,
    expression: `AVG(${alias}.${v})`,
  }));

  const payload: QueryPayload = {
    datasets: [{ alias, path: parquetPaths.patch }],
    columns: [`${alias}.year AS year`],
    aggregations,
    group_by: [`${alias}.year`],
    order_by: [`${alias}.year`],
  };

  const rawRows = await postQuery(
    runId,
    payload,
    "RHESSys Patch TimeSeries",
    signal,
  );

  return rawRows.map((r) => {
    const row = r as Record<string, unknown>;
    const result: Record<string, number> = {
      year: toFiniteNumber(row.year, 0),
      month: 0,
      day: 1,
    };
    for (const v of variables) {
      result[v] = toFiniteNumber(row[v], 0);
    }
    return result as RhessysTimeSeriesRow;
  });
}
