// API base URL configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://unstable.wepp.cloud/api";
const QUERY_RUN_PATH = "https://wepp.cloud/query-engine/runs";

// API endpoints
export const API_ENDPOINTS = {
  // List all watersheds
  WATERSHEDS: `${API_BASE_URL}/watershed/`,
  // Get a single watershed or post-list by id
  WATERSHED: (id: string) => `${API_BASE_URL}/watershed/${id}/`,
  // Subcatchments for a watershed
  SUBCATCHMENTS: (id: string) =>
    `${API_BASE_URL}/watershed/${id}/subcatchments`,
  // Channels for a watershed
  CHANNELS: (id: string) => `${API_BASE_URL}/watershed/${id}/channels`,
  // Query engine endpoint for running queries against a run path.
  QUERY_RUN: (batchPath: string) => `${QUERY_RUN_PATH}/${batchPath}/query`,
  // SBS colormap metadata — used for legend rendering and color-shift toggle.
  // The backend is the single source of truth; both tile rendering and the
  // frontend legend consume this endpoint so colours always agree.
  SBS_COLORMAP: `${API_BASE_URL}/watershed/sbs/colormap`,
  // SBS raster tile URL template for use as a Leaflet TileLayer.
  // Replace {runId} with the watershed run ID before passing to TileLayer.
  SBS_TILE: (runId: string) =>
    `${API_BASE_URL}/watershed/${runId}/sbs/tiles/{z}/{x}/{y}.png`,
  // RHESSys spatial inputs — discover available GeoTIFFs for a watershed.
  RHESSYS_SPATIAL_LIST: (runId: string) =>
    `${API_BASE_URL}/watershed/${runId}/rhessys/spatial-inputs/`,
  // RHESSys spatial input tile URL template for use as a Leaflet TileLayer.
  RHESSYS_SPATIAL_TILE: (runId: string, filename: string) =>
    `${API_BASE_URL}/watershed/${runId}/rhessys/spatial-inputs/${filename}/tiles/{z}/{x}/{y}.png`,
};
