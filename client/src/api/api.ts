import { API_ENDPOINTS } from "./apiEndpoints";

/**
 * Fetches basic watershed border data from the API.
 * 
 * @returns {Promise<Object>} A promise that resolves to the JSON response containing watershed data.
 * @throws {Error} Throws an error if the API request fails.
 */
export async function fetchWatersheds() {
  const response = await fetch(API_ENDPOINTS.WATERSHEDS);
  if (!response.ok) throw new Error('Failed to fetch watersheds');
  return response.json(); // must return the same data shape for both
}

/**
 * Fetches subcatchment polygons for a given watershed.
 * 
 * @param {string} watershedId - The unique identifier of the watershed 
 * for which subcatchment data should be retrieved.
 * @returns {Promise<any>} A promise that resolves to the JSON response containing
 * the subcatchment feature collection (e.g., GeoJSON) for the specified watershed.
 */
export async function fetchSubcatchments(watershedId: string) {
  const res = await fetch(`${API_ENDPOINTS.SUBCATCHMENTS}/${watershedId}`);
  if (!res.ok) throw new Error("Failed to fetch subcatchments");
  return res.json();
}
