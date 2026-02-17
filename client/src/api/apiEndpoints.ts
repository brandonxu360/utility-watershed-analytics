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
};
