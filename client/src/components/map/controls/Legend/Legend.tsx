import { useState } from 'react';
import { FaListUl, FaXmark, FaEye, FaExpand } from "react-icons/fa6";
import './Legend.css'

/**
 * LegendControl - A custom map control component that displays a toggleable legend
 * showing different watershed tiers and their controls
 *
 * @component
 */
export default function LegendControl() {
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  /**
   * Toggles the visibility state of the legend modal
   */
  const toggleLegend = () => setIsLegendOpen((prev) => !prev);

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={toggleLegend}
        className="legend-button"
        aria-label={isLegendOpen ? 'Close legend' : 'Open legend'}
        title={isLegendOpen ? 'Close legend' : 'Open legend'}
      >
        {isLegendOpen ? (
          <FaXmark className="legend-icon" />
        ) : (
          <FaListUl className="legend-icon" />
        )}
      </button>

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
                  className="legend-icon"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert('Show only icon clicked')}
                />
                <FaEye
                  className="legend-icon"
                  style={{ cursor: 'pointer' }}
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
                  className="legend-icon"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert('Show only icon clicked')}
                />
                <FaEye
                  className="legend-icon"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert('Hide icon clicked')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}