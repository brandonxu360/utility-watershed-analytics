import { TileLayer } from "react-leaflet";
import L from "leaflet";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import { getDescriptor } from "../../layers/registry";
import type { LayerId } from "../../layers/types";

const LAYER_ID: LayerId = "rhessysSpatial";

interface RhessysSpatialLayerProps {
  runId: string;
  filename: string;
  opacity: number;
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
  opacity,
  bounds,
}: RhessysSpatialLayerProps) {
  const { zIndex } = getDescriptor(LAYER_ID);
  const url = API_ENDPOINTS.RHESSYS_SPATIAL_TILE(runId, filename);

  return (
    <TileLayer
      key={url}
      url={url}
      opacity={opacity}
      zIndex={zIndex}
      crossOrigin="anonymous"
      {...(bounds ? { bounds } : {})}
    />
  );
}
