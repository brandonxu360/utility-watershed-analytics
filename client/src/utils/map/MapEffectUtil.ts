import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { zoomToFeature } from './MapUtil';
import L from 'leaflet';

/**
 * Interface for the @see {@link MapEffect} function to enforce type safety
 */
interface MapEffectProps {
  watershedId: string | null;
  watersheds: any; // Replace with a more specific type
}

/**
 * Helper function that zooms onto the specified watershed if the url matches
 * the /watershed/$watershedId format.
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
        (f: any) => f.id && f.id.toString() === watershedId // Might want to replace with a more specific type
      );

      if (matchingFeature) {
        // Create a temporary GeoJSON layer from the feature
        const tempLayer = L.geoJSON(matchingFeature);
        zoomToFeature(map, tempLayer);
      }
    }
  }, [watershedId, watersheds, map]);

  return null;
}
