import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { PathOptions } from "leaflet";

interface RhessysChoroplethLayerProps {
  geometry: GeoJSON.FeatureCollection;
  getStyle: (spatialId: number | undefined) => PathOptions;
  spatialScale: "hillslope" | "patch";
  opacity: number;
  /** Opaque token that changes whenever the style inputs change, used
   *  to trigger an in-place setStyle rather than a full layer remount. */
  styleKey: string;
}

/**
 * Renders Gate Creek RHESSys output data as a colored GeoJSON vector
 * choropleth managed imperatively via Leaflet.
 *
 * The layer is only created/destroyed when the geometry or spatial scale
 * changes.  Style updates (scenario, variable, year, opacity) are applied
 * in-place via `layer.setStyle()`, avoiding the expensive unmount/remount
 * cycle that the react-leaflet `<GeoJSON key={...}>` pattern requires.
 */
export default function RhessysChoroplethLayer({
  geometry,
  getStyle,
  spatialScale,
  opacity,
  styleKey,
}: RhessysChoroplethLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  // Refs keep the style effect free of stale closures while letting us
  // exclude these from the geometry-creation dependency array.
  const getStyleRef = useRef(getStyle);
  const opacityRef = useRef(opacity);
  getStyleRef.current = getStyle;
  opacityRef.current = opacity;

  // Stable style-applier: reads from refs so it never goes stale.
  const applyStyle = useCallback(
    (feature: GeoJSON.Feature | undefined): PathOptions => {
      const spatialId = feature?.properties?.DN as number | undefined;
      const base = getStyleRef.current(spatialId);
      return {
        ...base,
        fillOpacity: (base.fillOpacity ?? 0.85) * opacityRef.current,
      };
    },
    [],
  );

  // Create / replace the Leaflet layer only when geometry changes.
  // `spatialScale` is included because a scale change means new geometry
  // features (hillslope vs patch polygons), so the layer must be rebuilt.
  useEffect(() => {
    const layer = L.geoJSON(geometry);
    layer.addTo(map);
    layerRef.current = layer;

    layer.setStyle(applyStyle);

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, geometry, spatialScale, applyStyle]);

  // Re-style in-place when style inputs change — no DOM churn.
  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.setStyle(applyStyle);
  }, [styleKey, opacity, applyStyle]);

  return null;
}
