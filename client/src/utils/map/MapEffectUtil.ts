import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { zoomToFeature } from "./MapUtil";
import { WatershedProperties } from "../../types/WatershedProperties";
import L from "leaflet";

interface MapEffectProps {
  watershedId: string | null;
  watersheds: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>;
}

/**
 * Helper function that zooms onto the specified watershed if the url matches
 * the /watershed/$watershedId format.
 *
 * State reset is handled automatically by WatershedProvider's runId effect —
 * this component only handles the map zoom transition.
 *
 * @param webcloudRunId - The parsed watershed id taken from the url
 * @param watersheds - Our fetched watershed data from @see {@link fetchWatersheds}
 * @returns {null} - Doesn't return anything
 */
export function MapEffect({ watershedId, watersheds }: MapEffectProps): null {
  const map = useMap();

  useEffect(() => {
    if (watershedId && watersheds && Array.isArray(watersheds.features)) {
      const matchingFeature = watersheds.features.find(
        (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
          feature.id && feature.id.toString() === watershedId,
      );

      if (matchingFeature) {
        const tempLayer = L.geoJSON(matchingFeature);
        zoomToFeature(map, tempLayer);
      }
    }
  }, [watershedId, watersheds, map]);

  return null;
}
