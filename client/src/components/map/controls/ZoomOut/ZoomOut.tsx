import { useMap } from 'react-leaflet';
import { FaMinus } from "react-icons/fa6";
import './ZoomOut.css'

/**
 * ZoomOutControl - A custom map control component that provides zoom out functionality
 * 
 * This component creates a button that, when clicked, decreases the map's zoom level
 * by one step. It uses react-leaflet's useMap hook to access the map instance and
 * integrates with Leaflet's built-in control styling.
 * 
 * Features:
 * - Implements Leaflet's control styling for consistent UI
 * - Provides accessible controls with ARIA labels
 * - Uses Font Awesome minus icon for visual representation
 * 
 * @component
 * @returns {JSX.Element} A zoom out control button wrapped in a Leaflet control container
 */
export default function ZoomOutControl() {
  // Get access to the Leaflet map instance
  const map = useMap();

  return (
    <div className="leaflet-control leaflet-bar">
      <button
        onClick={() => map.zoomOut()}
        className="zoom-out-button"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <FaMinus />
      </button>
    </div>
  );
}