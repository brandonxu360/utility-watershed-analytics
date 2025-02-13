import { FaLocationDot } from "react-icons/fa6";
import { useMap } from 'react-leaflet';
import './UserLocation.css';

/**
 * UserLocationControl - A custom map control component that centers the map on user's location
 * 
 * @component
 */
export default function UserLocationControl() {
  const map = useMap();

  const handleLocationClick = () => {
    map.locate({ setView: true });
  };

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={handleLocationClick}
        className="location-button"
        aria-label="Find my location"
        title="Find my location"
      >
        <FaLocationDot className="location-icon" />
      </button>
    </div>
  );
}