import { startYear, endYear } from "../utils/constants";

import {
  postQuery,
  addQueryFlags,
  toFiniteNumber,
  createYearFilter,
  createBandFilter,
} from "./queryUtils";

import {
  AggregatedRapRow,
  FetchRapOptions,
  FetchRapChoroplethOptions,
  RapChoroplethRow,
  RapRow,
  QueryPayload,
  QueryFilter,
} from "./types";

/**
 * Build a RAP timeseries query payload for a single Topaz ID.
 * RAP band codes (kept as reference):
 * - 1: annual forbs & grasses
 * - 2: bare ground
 * - 3: litter
 * - 4: perennial forbs & grasses
 * - 5: shrub
 * - 6: tree
 */
function buildRapTimeseriesPayload(
  topazId: number,
  year?: number,
): QueryPayload {
  // Validate topazId is a reasonable positive integer
  const validTopazId = Number(topazId);
  if (!Number.isInteger(validTopazId) || validTopazId < 0) {
    throw new Error("Invalid topazId provided");
  }

  const filters: QueryFilter[] = [
    { column: "rap.topaz_id", operator: "=", value: validTopazId },
    { column: "rap.band", operator: "IN", value: [5, 6] },
  ];

  // Add year filter if valid
  const yearFilter = createYearFilter(year);
  if (yearFilter) {
    filters.push(yearFilter);
  }

  return {
    datasets: [{ path: "rap/rap_ts.parquet", alias: "rap" }],
    columns: [
      "rap.topaz_id AS topaz_id",
      "rap.year AS year",
      "rap.band AS band",
      "rap.value AS value",
    ],
    filters,
    order_by: ["rap.year", "rap.band"],
    include_schema: false,
    include_sql: false,
  };
}

/**
 * Supports hillslope (raw rap rows aggregated client-side)
 * and watershed (server-side CASE aggregations) modes. Returns AggregatedRapRow[]
 * (per-year rows with shrub/tree/coverage fields) which is the shape the UI needs.
 */
export async function fetchRap(
  opts: FetchRapOptions,
  signal: AbortSignal,
): Promise<AggregatedRapRow[]> {
  const { mode, topazId, runId, year, include_schema, include_sql } = opts;

  let payload: QueryPayload;

  if (mode === "hillslope") {
    if (typeof topazId === "undefined")
      throw new Error("topazId required for hillslope mode");
    payload = buildRapTimeseriesPayload(topazId, year);
    addQueryFlags(payload, include_schema, include_sql);
  } else {
    // Build parameterized filters array
    const filters: QueryFilter[] = [
      { column: "rap.band", operator: "IN", value: [5, 6] },
    ];

    const yearFilter = createYearFilter(year);
    if (yearFilter) filters.push(yearFilter);

    payload = {
      datasets: [
        { path: "rap/rap_ts.parquet", alias: "rap" },
        { path: "watershed/hillslopes.parquet", alias: "hillslopes" },
      ],
      joins: [{ left: "rap", right: "hillslopes", on: ["topaz_id"] }],
      columns: ["rap.year AS year"],
      filters,
      aggregations: [
        {
          alias: "shrub",
          expression:
            "SUM(CASE WHEN rap.band = 5 THEN rap.value * hillslopes.area ELSE 0 END) / NULLIF(SUM(CASE WHEN rap.band = 5 THEN hillslopes.area ELSE 0 END), 0)",
        },
        {
          alias: "tree",
          expression:
            "SUM(CASE WHEN rap.band = 6 THEN rap.value * hillslopes.area ELSE 0 END) / NULLIF(SUM(CASE WHEN rap.band = 6 THEN hillslopes.area ELSE 0 END), 0)",
        },
      ],
      group_by: ["rap.year"],
      order_by: ["rap.year"],
    };
    addQueryFlags(payload, include_schema, include_sql);
  }

  const rawRows = await postQuery(runId, payload, "RAP", signal);

  if (mode === "watershed") {
    // Map server-aggregated rows straight to AggregatedRapRow
    const rows = rawRows
      .map((r) => {
        const row = r as Record<string, unknown>;
        const shrub = toFiniteNumber(row.shrub);
        const tree = toFiniteNumber(row.tree);
        return {
          year: toFiniteNumber(row.year),
          shrub,
          tree,
          coverage: shrub + tree,
        };
      })
      .filter((r) => Number.isFinite(r.year));
    return rows;
  }

  // hillslope: raw band rows -> aggregate client-side to per-year
  const bandRows: RapRow[] = rawRows
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        topaz_id: toFiniteNumber(row.topaz_id),
        year: toFiniteNumber(row.year),
        band: toFiniteNumber(row.band),
        value: toFiniteNumber(row.value),
      };
    })
    .filter(
      (r) =>
        Number.isFinite(r.topaz_id) &&
        Number.isFinite(r.year) &&
        Number.isFinite(r.band) &&
        Number.isFinite(r.value),
    );

  const map = new Map<
    number,
    { coverage: number; shrub: number; tree: number }
  >();
  for (let year = startYear; year <= endYear; year++)
    map.set(year, { coverage: 0, shrub: 0, tree: 0 });

  for (const row of bandRows) {
    const entry = map.get(row.year);
    if (!entry) continue;
    if (row.band === 5) {
      entry.shrub += row.value;
      entry.coverage += row.value;
    }
    if (row.band === 6) {
      entry.tree += row.value;
      entry.coverage += row.value;
    }
  }

  return Array.from(map.entries()).map(([yr, v]) => ({
    year: yr,
    shrub: v.shrub,
    tree: v.tree,
    coverage: v.coverage,
  }));
}

export default fetchRap;

/**
 * Fetch RAP values aggregated by watershed (wepp_id) for building a choropleth.
 * If `year` is provided the expression is restricted to that year, otherwise
 * it averages across all years. Returns rows with { wepp_id, value }.
 */
export async function fetchRapChoropleth(
  opts: FetchRapChoroplethOptions,
  signal: AbortSignal,
): Promise<RapChoroplethRow[]> {
  const { runId, band, year, include_schema, include_sql } = opts;

  // Validate bands using the shared helper (also builds the filter)
  const bandFilter = createBandFilter(band);
  const validBands = Array.isArray(bandFilter.value)
    ? (bandFilter.value as number[])
    : [bandFilter.value as number];

  const filters: QueryFilter[] = [bandFilter];

  // Add year filter if valid
  const yearFilter = createYearFilter(year);
  if (yearFilter) {
    filters.push(yearFilter);
  }

  // For multiple bands, sum each band's area-weighted average so that
  // e.g. "all" = shrub + tree rather than (shrub + tree) / 2.
  // For a single band the simple expression is equivalent and faster.
  const aggregationExpr =
    validBands.length > 1
      ? validBands
          .map(
            (b) =>
              `COALESCE(SUM(CASE WHEN rap.band = ${b} THEN rap.value * hillslopes.area ELSE 0 END) / NULLIF(SUM(CASE WHEN rap.band = ${b} THEN hillslopes.area ELSE 0 END), 0), 0)`,
          )
          .join(" + ")
      : "COALESCE(SUM(rap.value * hillslopes.area) / NULLIF(SUM(hillslopes.area), 0), 0)";

  const payload: QueryPayload = {
    datasets: [
      { path: "rap/rap_ts.parquet", alias: "rap" },
      { path: "watershed/hillslopes.parquet", alias: "hillslopes" },
    ],
    joins: [{ left: "rap", right: "hillslopes", on: ["topaz_id"] }],
    columns: ["hillslopes.wepp_id AS wepp_id"],
    filters,
    aggregations: [
      {
        alias: "value",
        expression: aggregationExpr,
      },
    ],
    group_by: ["hillslopes.wepp_id"],
    order_by: ["hillslopes.wepp_id"],
  };
  addQueryFlags(payload, include_schema, include_sql);

  const rawRows = await postQuery(runId, payload, "RAP Choropleth", signal);

  return rawRows
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        wepp_id: toFiniteNumber(row.wepp_id),
        value: toFiniteNumber(row.value ?? row.val),
      };
    })
    .filter((r) => Number.isFinite(r.wepp_id));
}
