import { TileLayer } from "react-leaflet";
import L from "leaflet";
import { API_ENDPOINTS } from "../../api/apiEndpoints";

interface RhessysSpatialLayerProps {
  runId: string;
  filename: string;
  opacity?: number;
  bounds?: L.LatLngBoundsExpression;
}

/**
 * Renders a RHESSys spatial input GeoTIFF as a Leaflet TileLayer.
 *
 * The backend applies the appropriate colormap (rainbow for continuous,
 * categorical palette, or stream cyan) and returns coloured PNG tiles.
 */
export default function RhessysSpatialLayer({
  runId,
  filename,
  opacity = 0.7,
  bounds,
}: RhessysSpatialLayerProps) {
  const url = API_ENDPOINTS.RHESSYS_SPATIAL_TILE(runId, filename);

  return (
    <TileLayer
      key={url}
      url={url}
      opacity={opacity}
      zIndex={510}
      crossOrigin="anonymous"
      {...(bounds ? { bounds } : {})}
    />
  );
}
