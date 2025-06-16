import { useState, ChangeEvent, Dispatch, SetStateAction } from 'react';
import { FaLayerGroup, FaXmark } from 'react-icons/fa6';
import './Layers.css';

/**
 * Props for Layers
 */
interface WatershedLayersControlProps {
  setShowSubcatchments: Dispatch<SetStateAction<boolean>>;
  setShowChannels: Dispatch<SetStateAction<boolean>>;
}

/**
 * Layers - A custom map control component that toggles
 * visibility of various watershed overlays (subcatchments, channels, patches).
 *
 * @component
 */
export default function Layers({ setShowSubcatchments, setShowChannels }: WatershedLayersControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState({
    subcatchment: false,
    channels: false,
    patches: false,
  });

  /**
   * Toggles the open state of the control panel
   */
  const toggleOpen = () => setIsOpen(prev => !prev);

  /**
   * Handles checkbox change for a given layer
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setLayers(prev => ({ ...prev, [id]: checked }));

    if (id === 'subcatchment') {
      setShowSubcatchments(checked);
    }

    if (id === 'channels') {
      setShowChannels(checked);
    }
  };

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={toggleOpen}
        className="layers-button"
        aria-label={isOpen ? 'Close layers control' : 'Open layers control'}
        title={isOpen ? 'Close layers control' : 'Open layers control'}
      >
        {isOpen ? (
          <FaXmark className="layers-icon" />
        ) : (
          <FaLayerGroup className="layers-icon" />
        )}
      </button>

      {isOpen && (
        <div className="layers-modal">
          <h3 className="layers-heading">Overlay Settings</h3>
          <div className="layers-content">
            <div className="layer-container">
              <input
                type="checkbox"
                id="subcatchment"
                checked={layers.subcatchment}
                onChange={handleChange}
              />
              <label htmlFor="subcatchment" className="layer-label">
                View Subcatchments
              </label>
            </div>

            <div className="layer-container">
              <input
                type="checkbox"
                id="channels"
                checked={layers.channels}
                onChange={handleChange}
              />
              <label htmlFor="channels" className="layer-label">
                View Channels
              </label>
            </div>

            <div className="layer-container">
              <input
                type="checkbox"
                id="patches"
                checked={layers.patches}
                onChange={handleChange}
                disabled
              />
              <label htmlFor="patches" className="layer-label disabled">
                View Patches
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
