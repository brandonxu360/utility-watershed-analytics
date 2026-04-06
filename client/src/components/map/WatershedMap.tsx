import { useState } from "react";
import { MapContainer, TileLayer, ScaleControl } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { useRunId } from "../../hooks/useRunId";
import { getSavedMapView } from "../../utils/map/MapEffectUtil";
import { fetchWatersheds } from "../../api/api";
import { tss } from "../../utils/tss";
import { useWatershed } from "../../contexts/WatershedContext";
import { useLayerToasts } from "../../hooks/useLayerToasts";
import { useChoroplethLegend } from "../../hooks/useChoroplethLegend";
import { getLayerParams } from "../../layers/types";
import ZoomInControl from "./controls/ZoomIn";
import ZoomOutControl from "./controls/ZoomOut";
import LayersControl from "./controls/Layers";
import SearchControl from "./controls/Search";
import SbsLegend from "./controls/SbsLegend";
import ChoroplethLegend from "./controls/ChoroplethLegend";
import MapLayers from "./MapLayers";
import "leaflet/dist/leaflet.css";

const useStyles = tss.create(() => ({
  mapContainer: {
    height: "100%",
    width: "100%",
  },
  mapContainerWithPanel: {
    "& .leaflet-bottom": {
      marginBottom: "24px",
    },
  },
}));

// Fallback center used only for the very first render before any data loads.
const FALLBACK_CENTER: [number, number] = [0, 0];

const TILE_LAYERS: Record<
  "Satellite" | "Topographic",
  {
    url: string;
    attribution: string;
    maxZoom: number;
    subdomains?: string[];
  }
> = {
  Satellite: {
    // NOTE: unofficial Google tile endpoint. For production consider using the Google Maps APIs with a key.
    url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "&copy; Google",
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  Topographic: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
  },
};

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 *
 * @param webcloudRunId - Watershed ID taken from the useParams hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function WatershedMap(): JSX.Element {
  const savedView = getSavedMapView();
  const runId = useRunId();
  const { classes, cx } = useStyles();
  const { layerDesired, effective, isEffective } = useWatershed();

  useLayerToasts(layerDesired, effective);

  const choroplethLegendProps = useChoroplethLegend();

  const sbsEffective = isEffective("sbs");
  const rhessysSpatialEffective = isEffective("rhessysSpatial");
  const rhessysOutputsEffective = isEffective("rhessysOutputs");
  const rhessysOutputsChoroplethMode =
    getLayerParams(layerDesired, "rhessysOutputs").mode === "choropleth";

  const { data: watersheds, error: watershedsError } = useQuery({
    queryKey: queryKeys.watersheds.all,
    queryFn: fetchWatersheds,
  });

  const [selectedLayerId, setSelectedLayerId] = useState<
    "Satellite" | "Topographic"
  >("Satellite");

  if (watershedsError) return <div>Error: {watershedsError.message}</div>;

  const tileLayer = TILE_LAYERS[selectedLayerId];

  return (
    <div
      className={cx(
        classes.mapContainer,
        runId &&
          !rhessysSpatialEffective &&
          (!rhessysOutputsEffective || rhessysOutputsChoroplethMode) &&
          classes.mapContainerWithPanel,
      )}
    >
      <MapContainer
        center={savedView?.center ?? FALLBACK_CENTER}
        zoom={savedView?.zoom ?? 4}
        maxZoom={tileLayer.maxZoom}
        zoomControl={false}
        doubleClickZoom={false}
        scrollWheelZoom
        maxBoundsViscosity={0.5}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
      >
        <TileLayer
          key={selectedLayerId}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          maxZoom={tileLayer.maxZoom}
          {...(tileLayer.subdomains
            ? { subdomains: tileLayer.subdomains }
            : {})}
        />

        <ScaleControl metric={true} imperial={true} />

        <div className="leaflet-top leaflet-right">
          <SearchControl watersheds={watersheds} />
          <LayersControl
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
          />
          <ZoomInControl />
          <ZoomOutControl />
        </div>

        <MapLayers />
      </MapContainer>

      {choroplethLegendProps && <ChoroplethLegend {...choroplethLegendProps} />}
      {sbsEffective && <SbsLegend />}
    </div>
  );
}
