import { Map } from 'leaflet';

/**
 * Zooms the Leaflet map to the given layer bounds
 */
export function zoomToFeature(map: Map, layer: L.Layer) {
  const bounds = (layer as any).getBounds?.();
  if (bounds) {
    map.flyToBounds(bounds, {
      maxZoom: 14,
    });
  }
}