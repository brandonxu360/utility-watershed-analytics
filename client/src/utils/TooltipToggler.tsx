import { useMapEvents } from 'react-leaflet/hooks';
import { useRef } from 'react';
import type L from 'leaflet';

type Props = {
  geoJsonRef: React.RefObject<L.GeoJSON>;
  threshold: number;
};

export default function TooltipToggler({ geoJsonRef, threshold }: Props) {
  const timeoutRef = useRef<number>();

  const map = useMapEvents({
    zoomend: () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        const z = map.getZoom();
        geoJsonRef.current?.eachLayer((layer: any) => {
          const feature = layer.feature;
          if (!feature || !feature.properties || !feature.properties.watershed_name) return;

          layer.unbindTooltip();

          const tooltipOptions = {
            permanent: z >= threshold,
            direction: 'center',
          };

          layer.bindTooltip(feature.properties.watershed_name, tooltipOptions);

          if (z >= threshold) {
            layer.openTooltip();
          }
        });
      }, 100);
    },
  });

  return null;
}
