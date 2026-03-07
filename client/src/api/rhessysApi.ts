import { API_ENDPOINTS } from "./apiEndpoints";
import type { RhessysSpatialListResponse } from "./types";

/**
 * Fetch the list of available RHESSys spatial input GeoTIFFs for a watershed.
 *
 * The backend probes the WEPPcloud file browser and returns metadata for
 * every .tif found.  Returns `{ files: [] }` when no RHESSys data exists.
 */
export async function fetchRhessysSpatialInputs(
  runId: string,
): Promise<RhessysSpatialListResponse> {
  const url = API_ENDPOINTS.RHESSYS_SPATIAL_LIST(runId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch RHESSys spatial inputs (${response.status} ${response.statusText})`,
    );
  }

  return response.json() as Promise<RhessysSpatialListResponse>;
}
