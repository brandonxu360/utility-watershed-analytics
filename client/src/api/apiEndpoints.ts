// API base URL configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://unstable.wepp.cloud/api";
const QUERY_RUN_PATH = "https://wepp.cloud/query-engine/runs";
const WEPPCLOUD_BASE = "https://wepp.cloud/weppcloud/runs";

/**
 * Default disturbed-scenario sub-run base used by the WEPPcloud batch pipeline.
 * Standalone runs may use a different base (see WEPP_DASHBOARD_RUN_BASE_OVERRIDES).
 */
const DEFAULT_WEPP_DASHBOARD_RUN_BASE = "disturbed_wbt";

/**
 * Per-runId overrides for the WEPP dashboard sub-run base.
 * Add entries here for standalone runs that deviate from the batch convention.
 */
const WEPP_DASHBOARD_RUN_BASE_OVERRIDES: Record<string, string> = {};

/** Encode a path segment, preserving ;; separators used by WEPPcloud run IDs. */
const e = (s: string) => encodeURIComponent(s).replaceAll("%3B", ";");

// API endpoints
export const API_ENDPOINTS = {
  // List all watersheds
  WATERSHEDS: `${API_BASE_URL}/watershed/`,
  // Get a single watershed or post-list by id
  WATERSHED: (id: string) => `${API_BASE_URL}/watershed/${e(id)}/`,
  // Subcatchments for a watershed
  SUBCATCHMENTS: (id: string) =>
    `${API_BASE_URL}/watershed/${e(id)}/subcatchments`,
  // Channels for a watershed
  CHANNELS: (id: string) => `${API_BASE_URL}/watershed/${e(id)}/channels`,
  // Query engine endpoint for running queries against a run path.
  // batchPath is a multi-segment server path (e.g. "lt:watar/wepp/runs/foo"),
  // so individual segments are not encoded here.
  QUERY_RUN: (batchPath: string) => `${QUERY_RUN_PATH}/${batchPath}/query`,
  // SBS colormap metadata — used for legend rendering and color-shift toggle.
  // The backend is the single source of truth; both tile rendering and the
  // frontend legend consume this endpoint so colours always agree.
  SBS_COLORMAP: `${API_BASE_URL}/watershed/sbs/colormap`,
  // SBS raster tile URL template for use as a Leaflet TileLayer.
  // Replace {runId} with the watershed run ID before passing to TileLayer.
  SBS_TILE: (runId: string) =>
    `${API_BASE_URL}/watershed/${e(runId)}/sbs/tiles/{z}/{x}/{y}.png`,
  // RHESSys spatial inputs — discover available GeoTIFFs for a watershed.
  RHESSYS_SPATIAL_LIST: (runId: string) =>
    `${API_BASE_URL}/watershed/${e(runId)}/rhessys/spatial-inputs`,
  // RHESSys spatial input tile URL template for use as a Leaflet TileLayer.
  RHESSYS_SPATIAL_TILE: (runId: string, filename: string) =>
    `${API_BASE_URL}/watershed/${e(runId)}/rhessys/spatial-inputs/${e(filename)}/tiles/{z}/{x}/{y}.png`,
  // RHESSys output maps — discover available scenarios and variables.
  RHESSYS_OUTPUTS_LIST: (runId: string) =>
    `${API_BASE_URL}/watershed/${e(runId)}/rhessys/outputs`,
  // RHESSys output map tile URL template for use as a Leaflet TileLayer.
  RHESSYS_OUTPUTS_TILE: (runId: string, scenario: string, variable: string) =>
    `${API_BASE_URL}/watershed/${e(runId)}/rhessys/outputs/${e(scenario)}/${e(variable)}/tiles/{z}/{x}/{y}.png`,
  // RHESSys output geometry proxy (hillslope/patch GeoJSON via backend to avoid CORS).
  RHESSYS_OUTPUTS_GEOMETRY: (runId: string, scale: string) =>
    `${API_BASE_URL}/watershed/${e(runId)}/rhessys/outputs/geometry/${e(scale)}`,
  // WEPPcloud dashboard for a given watershed run.
  // Resolves the correct disturbed-scenario sub-run base via the override map,
  // falling back to the standard batch convention (disturbed_wbt).
  WEPP_DASHBOARD: (runId: string) => {
    const runBase =
      WEPP_DASHBOARD_RUN_BASE_OVERRIDES[runId] ??
      DEFAULT_WEPP_DASHBOARD_RUN_BASE;
    return `${WEPPCLOUD_BASE}/${e(runId)}/${runBase}/gl-dashboard`;
  },
  // WEPPcloud deval details report for a given watershed run.
  WEPP_DEVAL_DETAILS: (runId: string) =>
    `${WEPPCLOUD_BASE}/${e(runId)}/disturbed9002_wbt/report/deval_details/`,
  // Direct download link for the SBS 4-class classified GeoTIFF.
  // Uses the same disturbed sub-run base as WEPP_DASHBOARD.
  SBS_TIFF_DOWNLOAD: (runId: string) => {
    const runBase =
      WEPP_DASHBOARD_RUN_BASE_OVERRIDES[runId] ??
      DEFAULT_WEPP_DASHBOARD_RUN_BASE;
    return `${WEPPCLOUD_BASE}/${e(runId)}/${runBase}/browse/disturbed/sbs_4class.tif`;
  },
};
