import { FaLayerGroup, FaXmark } from "react-icons/fa6";
import { useState } from "react";
import './Layers.css';

interface LayersControlProps {
  selectedLayerId: 'Default' | 'Satellite' | 'Topographic';
  setSelectedLayerId: (id: 'Default' | 'Satellite' | 'Topographic') => void;
}

/**
 * LayersControl - A custom map control component that manages map layers
 * 
 * @component
 */
export default function LayersControl({ selectedLayerId, setSelectedLayerId }: LayersControlProps) {
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const layers = [
    { id: 'Default', name: 'Default' },
    { id: 'Satellite', name: 'Satellite' },
    { id: 'Topographic', name: 'Topographic' }
  ];
 
  const toggleLayers = () => setIsLayersOpen((prev) => !prev);

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={toggleLayers}
        className="layers-button"
        aria-label={isLayersOpen ? 'Close layers' : 'Open layers'}
        title={isLayersOpen ? 'Close layers' : 'Open layers'}
      >
        {isLayersOpen ? (
          <FaXmark className="layers-icon" />
        ) : (
          <FaLayerGroup className="layers-icon" />
        )}
      </button>

      {isLayersOpen && (
        <div className="layers-modal">
          <div className="layers-content">
            <h3 className="layers-heading">Map Layer</h3>
            {layers.map((layer) => (
              <div key={layer.id} className="layer-item">
                <input
                  type="radio"
                  id={layer.id}
                  name="layer"
                  checked={selectedLayerId === layer.id}
                  onChange={() => setSelectedLayerId(layer.id as LayersControlProps['selectedLayerId'])}
                />
                <label htmlFor={layer.id} className="layer-label">
                  {layer.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}