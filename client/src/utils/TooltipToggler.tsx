import { useMapEvents } from 'react-leaflet/hooks';
import { useEffect, useRef, useCallback } from 'react';
import type L from 'leaflet';

type Props = {
  geoJsonRef: React.RefObject<L.GeoJSON>;
  threshold: number;
  watershedId: string;
};

export default function TooltipToggler({
  geoJsonRef,
  threshold,
  watershedId,
}: Props) {
  const timeoutRef = useRef<number>();

  const updateTooltips = useCallback(() => {
    const z = geoJsonRef.current?._map?.getZoom() ?? 0;
    geoJsonRef.current?.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (!feature?.properties?.watershed_name) return;

      // selected watershed is always permanent if zoom >= threshold
      const isSelected = feature.id?.toString() === watershedId;
      const permanent = isSelected || z >= threshold;

      layer.unbindTooltip();
      layer.bindTooltip(feature.properties.watershed_name, {
        permanent,
        direction: 'center',
      });

      if (permanent) {
        layer.openTooltip();
      }
    });
  }, [geoJsonRef, threshold, watershedId]);

  useEffect(() => {
    updateTooltips();
  }, [updateTooltips]);

  useMapEvents({
    zoomend: () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(updateTooltips, 100);
    },
    moveend: () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(updateTooltips, 100);
    },
    click: () => {
      const z = geoJsonRef.current?._map?.getZoom() ?? 0;
      if (z < threshold) return;

      geoJsonRef.current?.eachLayer((layer: any) => {
        if (layer.feature.id?.toString() === watershedId) {
          layer.openTooltip();
        }
      });
    },
  });

  return null;
}
