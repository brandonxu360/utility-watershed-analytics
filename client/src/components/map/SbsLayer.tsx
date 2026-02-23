import { TileLayer } from "react-leaflet";
import L from "leaflet";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import { SbsColorMode } from "../../api/types";

interface SbsLayerProps {
  runId: string;
  mode?: SbsColorMode;
  opacity?: number;
  /** Leaflet LatLngBounds — tiles outside this rect will not be requested. */
  bounds?: L.LatLngBoundsExpression;
}

/**
 * Renders the SBS (Soil Burn Severity) raster as a Leaflet TileLayer.
 *
 * Passing `bounds` (the selected watershed's bounding box) prevents Leaflet
 * from requesting tiles that lie entirely outside the raster extent, which
 * keeps the server log clean and reduces unnecessary network traffic.
 */
export default function SbsLayer({
  runId,
  mode = "legacy",
  opacity = 0.8,
  bounds,
}: SbsLayerProps) {
  const baseUrl = API_ENDPOINTS.SBS_TILE(runId);
  const url = `${baseUrl}?mode=${mode}`;

  return (
    <TileLayer
      key={url}
      url={url}
      opacity={opacity}
      zIndex={500}
      crossOrigin="anonymous"
      {...(bounds ? { bounds } : {})}
    />
  );
}
