import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FaListUl, FaXmark, FaEye, FaExpand } from "react-icons/fa6";

export default function LegendControl() {
  const map = useMap(); // Gets the map that we're using
  const [isLegendOpen, setIsLegendOpen] = useState(false); // Defines the state of the legend modal

  const toggleLegend = () => setIsLegendOpen((prev) => !prev); // Toggles the card open and close

  useEffect(() => {
    const legendControl = L.Control.extend({
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
        root.render(
          isLegendOpen ? (
            <FaXmark style={{ fontSize: '20px', color: 'white', margin: 'auto' }} />
          ) : (
            <FaListUl style={{ fontSize: '20px', color: 'white' }} />
          )
        );

        // Click handler
        container.onclick = toggleLegend;
        return container;
      },
    });

    const control = new legendControl({ position: 'topleft' });
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, isLegendOpen]);

  return (
    <>
      {isLegendOpen && (
        <div className="legend-modal">
          <div className="legend-content">
            <div className="watershed-container">
              <div className="watershed-left">
                <div style={{ background: '#00FF7F', width: 20, height: 20, display: 'inline-block', borderRadius: 5 }}></div>
                <span className="legend-text" style={{ fontWeight: 'bold' }}>Tier 1 watersheds</span>
              </div>
              <div className="watershed-right">
                <FaExpand 
                  style={{ fontSize: '20px', color: 'white', margin: 'auto', cursor: 'pointer' }} 
                  onClick={() => alert('Show only icon clicked')}
                />
                <FaEye 
                  style={{ fontSize: '20px', color: 'white', margin: 'auto', cursor: 'pointer' }} 
                  onClick={() => alert('Hide icon clicked')}
                />
              </div>
            </div>
            <div className="watershed-container">
              <div className="watershed-left">
                <div style={{ background: '#0000FF', width: 20, height: 20, display: 'inline-block', borderRadius: 5 }}></div>
                <span className="legend-text" style={{ fontWeight: 'bold' }}>Tier 2 watersheds</span>
              </div>              
              <div className="watershed-right">
                <FaExpand 
                  style={{ fontSize: '20px', color: 'white', margin: 'auto', cursor: 'pointer' }} 
                  onClick={() => alert('Show only icon clicked')}
                />
                <FaEye 
                  style={{ fontSize: '20px', color: 'white', margin: 'auto', cursor: 'pointer' }} 
                  onClick={() => alert('Hide icon clicked')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}