import { useMap } from 'react-leaflet';
import { FaPlus } from "react-icons/fa6";
import './ZoomIn.css'

/**
 * ZoomInControl - A custom map control component that provides zoom in functionality
 * 
 * This component creates a button that, when clicked, increases the map's zoom level
 * by one step. It uses react-leaflet's useMap hook to access the map instance and
 * integrates with Leaflet's built-in control styling.
 * 
 * Features:
 * - Implements Leaflet's control styling for consistent UI
 * - Provides accessible controls with ARIA labels
 * - Uses Font Awesome plus icon for visual representation
 * 
 * @component
 * @returns {JSX.Element} A zoom in control button wrapped in a Leaflet control container
 */
export default function ZoomInControl() {
  // Get access to the Leaflet map instance
  const map = useMap();

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={() => map.zoomIn()}
        className="zoom-in-button"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <FaPlus className='plus-icon'/>
      </button>
    </div>
  );
}