import { parquetReadObjects } from "hyparquet";
import { API_ENDPOINTS } from "./apiEndpoints";

/**
 * One row from the scenarios.out.parquet file.
 * Each row has a key (metric name), a numeric value,
 * an optional unit string, and the scenario it belongs to.
 */
export type ScenarioRow = {
  key: string;
  value: number;
  units: string;
  scenario: string;
};

/**
 * Fetch a Parquet file from a URL and parse it into row objects
 * entirely in the browser using hyparquet.
 *
 * @param url - Full URL to a `.parquet` file
 * @returns Array of plain-object rows keyed by column name
 */
export async function fetchParquetRows<T extends Record<string, unknown>>(
  url: string,
): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch parquet file (${response.status} ${response.statusText})`,
    );
  }

  const buffer = await response.arrayBuffer();

  const rows = await parquetReadObjects({ file: buffer });

  return rows as T[];
}

/**
 * Fetch the scenarios parquet file for a given watershed run
 * and return parsed rows.
 *
 * @param runId - The watershed run ID (e.g. "batch;;nasa-roses-2026-sbs;;OR-19")
 * @returns Parsed scenario rows
 */
export async function fetchScenariosParquet(
  runId: string,
): Promise<ScenarioRow[]> {
  const url = API_ENDPOINTS.SCENARIOS_PARQUET(runId);
  return fetchParquetRows<ScenarioRow>(url);
}
