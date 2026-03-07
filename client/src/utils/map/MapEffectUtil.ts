import { useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { zoomToFeature } from "./MapUtil";
import { WatershedProperties } from "../../types/WatershedProperties";
import L from "leaflet";

interface MapEffectProps {
  watershedId: string | null;
  watersheds: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>;
}

/**
 * Handles map positioning:
 *  1. On initial load (once), fits the map to the bounds of all watersheds so
 *     the view is always correct regardless of how many watersheds exist or
 *     where they are located.
 *  2. When a watershed is selected, zooms to that watershed's feature.
 *
 * State reset is handled automatically by WatershedProvider's runId effect —
 * this component only handles the map zoom transitions.
 *
 * @param watershedId - The parsed watershed id taken from the url (null on home view)
 * @param watersheds  - Fetched watershed FeatureCollection from @see {@link fetchWatersheds}
 * @returns {null}
 */
export function MapEffect({ watershedId, watersheds }: MapEffectProps): null {
  const map = useMap();
  const initialFitDone = useRef(false);

  // ── Initial fit: fill the viewport with all watersheds (fires once) ──────
  useEffect(() => {
    if (initialFitDone.current || !watersheds?.features?.length) return;
    try {
      const bounds = L.geoJSON(watersheds).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
        map.setMaxBounds(bounds.pad(0.5));
        initialFitDone.current = true;
      }
    } catch {
      // ignore invalid geometries
    }
  }, [watersheds, map]);

  // ── Per-watershed zoom: fires whenever the selected watershed changes ─────
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
