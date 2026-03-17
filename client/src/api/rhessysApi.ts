import { API_ENDPOINTS } from "./apiEndpoints";
import { checkResponse } from "./errors";
import type { RhessysSpatialListResponse } from "./types";

/**
 * Fetch the list of available RHESSys spatial input GeoTIFFs for a watershed.
 *
 * The backend probes the WEPPcloud file browser and returns metadata for
 * every .tif found.  Returns `{ files: [] }` when no RHESSys data exists.
 */
export async function fetchRhessysSpatialInputs(
  runId: string,
  signal: AbortSignal,
): Promise<RhessysSpatialListResponse> {
  const url = API_ENDPOINTS.RHESSYS_SPATIAL_LIST(runId);
  const response = await fetch(url, { signal });
  return checkResponse<RhessysSpatialListResponse>(response, {
    url,
    runId,
    prefix: "RHESSys Spatial Inputs",
  });
}
