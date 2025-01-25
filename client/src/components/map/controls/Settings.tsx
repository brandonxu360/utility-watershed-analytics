import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { FaGear } from "react-icons/fa6";

export default function SettingsControl() {
  const map = useMap();

  useEffect(() => {
    const settingsControl = L.Control.extend({
      onAdd: function () {
        // Container element
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = '#121212';
        container.style.width = '40px';
        container.style.height = '40px';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.cursor = 'pointer';

        // Icon
        const root = createRoot(container);
        root.render(<FaGear style={{ fontSize: '20px', color: 'white' }} />);

        // Click handler
        container.onclick = function () {
          alert('Settings clicked!');
        };

        return container;
      },
    });

    const control = new settingsControl({ position: 'topright' });
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map]);

  return null;
}