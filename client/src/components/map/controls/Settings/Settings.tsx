import { FaGear } from "react-icons/fa6";
import './Settings.css';

/**
 * SettingsControl - A custom map control component that provides settings functionality
 * 
 * @component
 */
export default function SettingsControl() {
  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={() => alert('Settings clicked!')}
        className="settings-button"
        aria-label="Open settings"
        title="Open settings"
      >
        <FaGear className="settings-icon" />
      </button>
    </div>
  );
}