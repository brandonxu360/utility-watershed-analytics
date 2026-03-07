export type QueryFilter = {
  column: string;
  operator: string;
  value: number | number[] | string;
};

export const YEAR_BOUNDS = { min: 1900, max: 2100 } as const;

export type RapTimeseriesPayload = {
  datasets: { path: string; alias?: string }[];
  columns: string[];
  filters?: QueryFilter[];
  order_by?: string[];
  include_schema?: boolean;
  include_sql?: boolean;
};

export type RapRow = {
  topaz_id: number;
  year: number;
  band: number;
  value: number;
};

export type AggregatedRapRow = {
  year: number;
  shrub: number;
  tree: number;
  coverage: number;
};

export type FetchRapOptions = {
  mode: "hillslope" | "watershed";
  runId: string;
  topazId?: number;
  year?: number;
  include_schema?: boolean;
  include_sql?: boolean;
};

export type FetchRapChoroplethOptions = {
  runId: string;
  band: number | number[];
  year?: number | null;
  include_schema?: boolean;
  include_sql?: boolean;
};

export type RapChoroplethRow = {
  wepp_id: number;
  value: number;
};

export type LanduseEntry = {
  desc: string;
  color: string;
};

export type LanduseMap = Record<number, LanduseEntry>;

// ── SBS Colormap ─────────────────────────────────────────────────────────────

/**
 * Color modes for SBS (Soil Burn Severity) raster tiles and legend.
 * The backend is the source of truth; the frontend passes this value as
 * a query param to both the tile endpoint and GET /api/watershed/sbs/colormap.
 */
export type SbsColorMode = "legacy" | "shift";

/** One row returned by GET /api/watershed/sbs/colormap */
export type SbsColormapEntry = {
  /** SBS canonical class value (130 = Unburned … 133 = High) */
  class_value: number;
  /** Human-readable severity label */
  label: string;
  /** [R, G, B, A] (0-255 each) */
  rgba: [number, number, number, number];
  /** CSS hex string e.g. "#009E73" */
  hex: string;
};

/** Full response from GET /api/watershed/sbs/colormap */
export type SbsColormapResponse = {
  mode: SbsColorMode;
  entries: SbsColormapEntry[];
};

// ── RHESSys Spatial Inputs ───────────────────────────────────────────────────

export type RhessysSpatialLegendStop = {
  value: number;
  hex: string;
};

export type RhessysSpatialFile = {
  filename: string;
  name: string;
  type: "continuous" | "categorical" | "stream";
  min: number | null;
  max: number | null;
  unique_values: number[] | null;
  group: string | null;
  reversed: boolean;
  legend: RhessysSpatialLegendStop[] | null;
};

export type RhessysSpatialListResponse = {
  files: RhessysSpatialFile[];
};

export type FetchLanduseOptions = {
  runId: string;
  include_schema?: boolean;
  include_sql?: boolean;
  limit?: number;
  scenario?: string;
};
