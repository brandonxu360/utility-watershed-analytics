import { useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { zoomToFeature } from "./MapUtil";
import { WatershedProperties } from "../../types/WatershedProperties";
import L from "leaflet";

// Persists the map viewport at module scope so it survives component
// remounts caused by route changes (/ ↔ /watershed/:id).
let savedCenter: [number, number] | null = null;
let savedZoom: number | null = null;

/** Returns the last-known map viewport, or null on first-ever load. */
export function getSavedMapView(): {
  center: [number, number];
  zoom: number;
} | null {
  return savedCenter && savedZoom != null
    ? { center: savedCenter, zoom: savedZoom }
    : null;
}

/** Clears the saved view (for tests). */
export function resetSavedMapView(): void {
  savedCenter = null;
  savedZoom = null;
}

interface MapEffectProps {
  watershedId: string | null;
  watersheds: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>;
}

/**
 * Handles map positioning:
 *  1. Very first load, no watershed → fits to all watersheds.
 *  2. Very first load via direct URL → instantly fits to that watershed.
 *  3. Subsequent navigation (click a watershed) → animates from current
 *     position (restored via getSavedMapView in MapContainer).
 *  4. Back-navigation (watershed → home) → stays at the user's current
 *     viewport instead of snapping back.
 *
 * Position is saved at module scope so it survives route-change remounts.
 *
 * @param watershedId - The parsed watershed id taken from the url (null on home view)
 * @param watersheds  - Fetched watershed FeatureCollection from @see {@link fetchWatersheds}
 * @returns {null}
 */
export function MapEffect({ watershedId, watersheds }: MapEffectProps): null {
  const map = useMap();
  const hasPositioned = useRef(false);

  // Persist viewport on every move so it survives remounts.
  // Only start saving after the map has been meaningfully positioned,
  // otherwise the (0,0) fallback center gets cached and blocks fitBounds.
  useEffect(() => {
    const save = () => {
      if (!hasPositioned.current) return;
      const c = map.getCenter();
      savedCenter = [c.lat, c.lng];
      savedZoom = map.getZoom();
    };
    map.on("moveend", save);
    return () => {
      map.off("moveend", save);
    };
  }, [map]);

  useEffect(() => {
    if (!Array.isArray(watersheds?.features) || !watersheds.features.length)
      return;

    if (watershedId) {
      const matchingFeature = watersheds.features.find(
        (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
          feature.id && feature.id.toString() === watershedId,
      );
      if (matchingFeature) {
        if (hasPositioned.current || savedCenter) {
          // Map already has a reasonable position — animate.
          zoomToFeature(map, L.geoJSON(matchingFeature));
        } else {
          // Direct URL, first-ever load — jump instantly so the user
          // doesn't see the fallback center.
          const bounds = L.geoJSON(matchingFeature).getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { maxZoom: 16 });
          }
        }
      }
      hasPositioned.current = true;
      return;
    }

    // Home view — only reposition on the very first load.
    if (hasPositioned.current || savedCenter) return;
    try {
      const bounds = L.geoJSON(watersheds).getBounds();
      if (bounds.isValid()) {
        // fitBounds MUST come before setMaxBounds — calling setMaxBounds
        // while the map is at (0,0) zoom 4 causes Leaflet to pan to the
        // constrained area at that zoom level (super zoomed out).
        map.fitBounds(bounds, { padding: [30, 30] });
        map.setMaxBounds(bounds.pad(0.5));
        hasPositioned.current = true;
      }
    } catch {
      // ignore invalid geometries
    }
  }, [watershedId, watersheds, map]);

  return null;
}
