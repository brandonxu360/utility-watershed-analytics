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

  const toggleLegend = () => setIsLegendOpen((prev) => !prev);

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={toggleLegend}
        className="legend-button"
        aria-label={isLegendOpen ? 'Close legend' : 'Open legend'}
        title={isLegendOpen ? 'Close legend' : 'Open legend'}
        data-testid="legend-toggle-button"
      >
        {isLegendOpen ? (
          <FaXmark className="legend-icon" />
        ) : (
          <FaListUl className="legend-icon" />
        )}
      </button>

      {isLegendOpen && (
        <div className="legend-modal" data-testid="legend-container">
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
                  data-testid="tier1-show-icon"
                />
                <FaEye
                  className="legend-icon"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert('Hide icon clicked')}
                  data-testid="tier1-hide-icon"
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
                  data-testid="tier2-show-icon"
                />
                <FaEye
                  className="legend-icon"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert('Hide icon clicked')}
                  data-testid="tier2-hide-icon"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}