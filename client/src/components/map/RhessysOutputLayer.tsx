import { TileLayer } from "react-leaflet";
import L from "leaflet";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import { getDescriptor } from "../../layers/registry";
import type { LayerId } from "../../layers/types";

const LAYER_ID: LayerId = "rhessysOutputs";

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRUEFTkSuQmCC";

interface RhessysOutputLayerProps {
  runId: string;
  scenario: string;
  variable: string;
  opacity: number;
  bounds?: L.LatLngBoundsExpression;
}

/**
 * Renders a pre-computed RHESSys output map GeoTIFF as a Leaflet TileLayer.
 *
 * The backend applies the appropriate colormap (sequential for baseline,
 * diverging for change maps) and returns coloured PNG tiles.
 */
export default function RhessysOutputLayer({
  runId,
  scenario,
  variable,
  opacity,
  bounds,
}: RhessysOutputLayerProps) {
  const { zIndex } = getDescriptor(LAYER_ID);
  const url = API_ENDPOINTS.RHESSYS_OUTPUTS_TILE(runId, scenario, variable);

  return (
    <TileLayer
      key={url}
      url={url}
      opacity={opacity}
      zIndex={zIndex}
      crossOrigin="anonymous"
      errorTileUrl={TRANSPARENT_PIXEL}
      maxNativeZoom={15}
      maxZoom={19}
      {...(bounds ? { bounds } : {})}
    />
  );
}
