import { API_ENDPOINTS } from "./apiEndpoints";
import { checkResponse } from "./errors";

/**
 * Fetches all the available watersheds with the original or
 * simplified geometries (depending on simplified_geom query parameter).
 *
 * @async
 * @function fetchWatersheds
 * @returns {Promise<unknown>} Resolves with the parsed JSON response from the
 *   `/watersheds` endpoint.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchWatersheds() {
  const url = API_ENDPOINTS.WATERSHEDS;
  const res = await fetch(url);
  return checkResponse(res, { url, prefix: "Watersheds" });
}

/**
 * Fetches a singular specified watershed with the original or
 * simplified geometries (depending on simplified_geom query parameter)
 *
 * @async
 * @function fetchWatershed
 * @param {string} id
 *   The unique identifier (e.g. `webcloud_run_id`) of the watershed to fetch.
 * @returns {Promise<unknown>} Resolves with the parsed JSON response from the
 *   `/watershed/:id` endpoint.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchWatershed(id: string) {
  const url = API_ENDPOINTS.WATERSHED(id);
  const res = await fetch(url);
  return checkResponse(res, { url, runId: id, prefix: "Watershed" });
}

/**
 * Fetches subcatchment polygons for a given watershed.
 *
 * @async
 * @function fetchSubcatchments
 * @param {string} webcloudRunId
 *   The `webcloud_run_id` of the specified watershed.
 * @returns {Promise<unknown>} Resolves with the parsed JSON response from the
 *   `/watershed/:id/subcatchments` endpoint.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchSubcatchments(webcloudRunId: string) {
  const url = API_ENDPOINTS.SUBCATCHMENTS(webcloudRunId);
  const res = await fetch(url);
  return checkResponse(res, { url, runId: webcloudRunId, prefix: "Subcatchments" });
}

/**
 * Fetches channel polygons for a given watershed.
 *
 * @async
 * @function fetchChannels
 * @param {string} webcloudRunId
 *   The `webcloud_run_id` of the specified watershed.
 * @returns {Promise<unknown>} Resolves with the parsed JSON response from the
 *   `/watershed/:id/channels` endpoint.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchChannels(webcloudRunId: string) {
  const url = API_ENDPOINTS.CHANNELS(webcloudRunId);
  const res = await fetch(url);
  return checkResponse(res, { url, runId: webcloudRunId, prefix: "Channels" });
}
