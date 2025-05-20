import { forwardRef, useImperativeHandle, useEffect, memo } from 'react';
import { useMap } from 'react-leaflet/hooks';
import L from 'leaflet';

type Props = {
  data: GeoJSON.GeoJsonObject;
  style: L.PathOptions | L.StyleFunction;
  onEachFeature: (feature: any, layer: L.Layer) => void;
};

const StaticGeoJson = forwardRef<L.GeoJSON, Props>(function StaticGeoJson(
  { data, style, onEachFeature },
  ref
) {
  const map = useMap();
  const layer = new L.GeoJSON(data, { style, onEachFeature });

  useImperativeHandle(ref, () => layer, [layer]);

  useEffect(() => {
    map.addLayer(layer);
    return () => { map.removeLayer(layer); };
  }, [map, layer]);

  return null;
});

export default memo(StaticGeoJson, (prev, next) => prev.data === next.data);
