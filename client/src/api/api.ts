import { API_ENDPOINTS } from "./apiEndpoints";
import { checkResponse } from "./errors";
import type { WatershedProperties, WatershedCollection } from "../types/WatershedProperties";
import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";

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
export async function fetchWatersheds(): Promise<WatershedCollection> {
  const url = API_ENDPOINTS.WATERSHEDS;
  const res = await fetch(url);
  return checkResponse<WatershedCollection>(res, { url, prefix: "Watersheds" });
}

/**
 * Fetches a singular specified watershed with the original or
 * simplified geometries (depending on simplified_geom query parameter)
 *
 * @async
 * @function fetchWatershed
 * @param {string} id
 *   The unique identifier (e.g. `webcloud_run_id`) of the watershed to fetch.
 * @returns {Promise<GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>>} Resolves with the parsed JSON response from the
 *   `/watershed/:id` endpoint.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchWatershed(
  id: string,
): Promise<GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>> {
  const url = API_ENDPOINTS.WATERSHED(id);
  const res = await fetch(url);
  return checkResponse<GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>>(
    res,
    {
      url,
      runId: id,
      prefix: "Watershed",
    },
  );
}

/**
 * Fetches subcatchment polygons for a given watershed.
 *
 * Accepts a required {@link AbortSignal} so the request is automatically
 * cancelled when the user deselects the watershed.
 *
 * @async
 * @function fetchSubcatchments
 * @param {string} webcloudRunId
 *   The `webcloud_run_id` of the specified watershed.
 * @param {AbortSignal} signal
 *   An {@link AbortSignal} used to cancel the in‑flight request.
 * @returns {Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>>}
 *   Resolves with the subcatchment feature collection.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchSubcatchments(
  webcloudRunId: string,
  signal: AbortSignal,
): Promise<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>
> {
  const url = API_ENDPOINTS.SUBCATCHMENTS(webcloudRunId);
  const res = await fetch(url, { signal });
  return checkResponse<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>
  >(res, { url, runId: webcloudRunId, prefix: "Subcatchments" });
}

/**
 * Fetches channel polygons for a given watershed.
 *
 * Accepts a required {@link AbortSignal} so the request is automatically
 * cancelled when the user deselects the watershed.
 *
 * @async
 * @function fetchChannels
 * @param {string} webcloudRunId
 *   The `webcloud_run_id` of the specified watershed.
 * @param {AbortSignal} signal
 *   An {@link AbortSignal} used to cancel the in‑flight request.
 * @returns {Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>>}
 *   Resolves with the channel feature collection.
 * @throws {Error} If the network request fails or returns a non‑2xx status.
 */
export async function fetchChannels(
  webcloudRunId: string,
  signal: AbortSignal,
): Promise<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>
> {
  const url = API_ENDPOINTS.CHANNELS(webcloudRunId);
  const res = await fetch(url, { signal });
  return checkResponse<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>
  >(res, {
    url,
    runId: webcloudRunId,
    prefix: "Channels",
  });
}
