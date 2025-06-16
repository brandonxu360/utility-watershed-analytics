import { Map } from 'leaflet';

/**
 * Helper function that zooms the Leaflet map to the given layer bounds.
 * 
 * @param map - The map that we are currently using.
 * @param layer - The specific layer we're zooming to.
 * @returns {null} - Doesn't return anything.
 */
export function zoomToFeature(map: Map, layer: L.Layer) {
  const bounds = (layer as any).getBounds?.();
  if (bounds) {
    map.flyToBounds(bounds, {
      maxZoom: 14,
    });
  }
}