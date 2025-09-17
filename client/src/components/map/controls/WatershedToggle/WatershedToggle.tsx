import { ChangeEvent, useState } from 'react';
import { FaInfo, FaXmark } from 'react-icons/fa6';
import { useWatershedOverlayContext } from '../../../../context/watershed-overlay/WatershedOverlayProvider';
import './WatershedToggle.css';

/**
 * WatershedToggle - A custom map control component that toggles
 * visibility of various watershed overlays (subcatchments, channels, patches).
 *
 * @component
 */
export default function WatershedToggle() {
  const { setSubcatchment, setChannels, setPatches } = useWatershedOverlayContext();
  const [isOpen, setIsOpen] = useState(false);
  const [WatershedToggle, setLayers] = useState({
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
    setLayers(prev => ({...prev, [id]: checked}));
    if (id === 'subcatchment') setSubcatchment(checked);
    if (id === 'channels') setChannels(checked);
    if (id === 'patches') setPatches(checked);
  };

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={toggleOpen}
        className="watershed-toggle-button"
        aria-label={isOpen ? 'Close watershed toggle modal' : 'Open watershed toggle modal'}
        title={isOpen ? 'Close watershed toggle modal' : 'Open watershed toggle modal'}
      >
        {isOpen ? (
          <FaXmark className="watershed-toggle-icon" />
        ) : (
          <FaInfo className="watershed-toggle-icon" />
        )}
      </button>

      {isOpen && (
        <div className="watershed-toggle-modal">
          <h3 className="watershed-toggle-heading">Overlay Settings</h3>
          <div className="watershed-toggle-content">
            <div className="watershed-toggle-container">
              <input
                type="checkbox"
                id="subcatchment"
                checked={WatershedToggle.subcatchment}
                onChange={handleChange}
              />
              <label htmlFor="subcatchment" className="watershed-toggle-label">
                View Subcatchments
              </label>
            </div>

            <div className="watershed-toggle-container">
              <input
                type="checkbox"
                id="channels"
                checked={WatershedToggle.channels}
                onChange={handleChange}
              />
              <label htmlFor="channels" className="watershed-toggle-label">
                View Channels
              </label>
            </div>

            <div className="watershed-toggle-container">
              <input
                type="checkbox"
                id="patches"
                checked={WatershedToggle.patches}
                onChange={handleChange}
                disabled
              />
              <label htmlFor="patches" className="watershed-toggle-label disabled">
                View Patches
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
