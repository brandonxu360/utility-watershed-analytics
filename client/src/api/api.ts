import { API_ENDPOINTS } from "./apiEndpoints";

/**
 * Fetches all the available watersheds with the original or 
 * simplified geometries (depending on simplified_geom query parameter).
 * 
 * @async
 * @function fetchWatersheds
 * @returns {Promise<unknown>} Resolves with the parsed JSON response from the
 *   `/watersheds` endpoint. Usually a GeoJSON FeatureCollection of watersheds.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchWatersheds() {
  const res = await fetch(API_ENDPOINTS.WATERSHEDS);
  if (!res.ok) throw new Error('Failed to fetch watersheds');
  return res.json();
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
 *   `/watershed/:id` endpoint. Typically a GeoJSON Feature.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchWatershed(id: string) {
  const res = await fetch(API_ENDPOINTS.WATERSHED(id));
  if (!res.ok) throw new Error("Failed to fetch watershed " + id);
  return res.json();
}

/**
 * Fetches subcatchment polygons for a given watershed.
 *
 * @async
 * @function fetchSubcatchments
 * @param {string} webcloudRunId
 *   The `webcloud_run_id` of the watershed whose subcatchments you want.
 * @returns {Promise<unknown>} Resolves with the parsed JSON response from the
 *   `/watershed/:id/subcatchments` endpoint. Typically a GeoJSON FeatureCollection.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchSubcatchments(webcloudRunId: string) {
  const res = await fetch(API_ENDPOINTS.SUBCATCHMENTS(webcloudRunId));
  if (!res.ok) throw new Error("Failed to fetch subcatchments");
  return res.json();
}
