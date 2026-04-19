import { API_ENDPOINTS } from "./apiEndpoints";
import { checkResponse } from "./errors";
import type { SbsColorMode, SbsColormapResponse } from "./types/sbs";

/**
 * Fetch SBS colormap metadata from the backend.
 *
 * The backend is the single source of truth for SBS color definitions —
 * calling this endpoint ensures the legend and the tile renderer always
 * display identical colours.
 *
 * @param mode - "legacy" (default) or "shift" (Okabe-Ito colorblind-safe)
 * @returns SbsColormapResponse containing the active mode and one entry per
 *          SBS severity class (Unburned, Low, Moderate, High).
 * @throws Error if the request fails
 */
export async function fetchSbsColormap(
  mode: SbsColorMode = "legacy",
): Promise<SbsColormapResponse> {
  const url = new URL(API_ENDPOINTS.SBS_COLORMAP);
  url.searchParams.set("mode", mode);

  const response = await fetch(url.toString());
  return checkResponse<SbsColormapResponse>(response, {
    url: url.toString(),
    prefix: "SBS Colormap",
  });
}
