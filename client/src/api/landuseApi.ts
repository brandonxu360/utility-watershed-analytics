import { addQueryFlags, postQuery, toFiniteNumber } from "./queryUtils";
import { FetchLanduseOptions, LanduseMap, LanduseEntry } from "./types";

export type { LanduseMap, LanduseEntry, FetchLanduseOptions };

const LANDUSE_DATASET_PATH = "landuse/landuse.parquet";
const DEFAULT_SCENARIO = "undisturbed";

/**
 * Fetch landuse data from the query engine for a given scenario.
 *
 * Returns a lookup map from topaz_id to { desc, color } for efficient styling.
 * By default uses the "undisturbed" scenario.
 *
 * @param opts - Fetch options including runId and optional scenario
 * @returns LanduseMap - Record mapping topaz_id to { desc, color }
 * @throws Error if runId is empty or the request fails
 */
export async function fetchLanduse(
  opts: FetchLanduseOptions,
): Promise<LanduseMap> {
  const { runId, include_schema, include_sql, limit, scenario } = opts;

  if (!runId || typeof runId !== "string" || runId.trim() === "") {
    throw new Error("Invalid runId provided");
  }

  const payload: Record<string, unknown> = {
    scenario: scenario ?? DEFAULT_SCENARIO,
    datasets: [{ alias: "landuse", path: LANDUSE_DATASET_PATH }],
    columns: [
      "landuse.topaz_id AS topaz_id",
      "landuse.desc AS desc",
      "landuse.color AS color",
    ],
    order_by: ["landuse.topaz_id"],
    limit: typeof limit === "number" ? limit : 200000,
  };

  addQueryFlags(payload, include_schema, include_sql);

  const rawRows = await postQuery(runId, payload, "Landuse");

  const result: LanduseMap = {};

  for (const r of rawRows) {
    const row = r as Record<string, unknown>;
    const topazId = toFiniteNumber(
      row.topaz_id ?? row.topazid ?? row.TopazID ?? row.TopazId,
      NaN,
    );

    if (!Number.isFinite(topazId)) continue;

    result[topazId] = {
      desc: String(row.desc ?? row.landuse_desc ?? ""),
      color: String(row.color ?? row.landuse_color ?? ""),
    };
  }

  return result;
}

export default fetchLanduse;
