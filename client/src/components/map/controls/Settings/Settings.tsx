import { FaGear } from "react-icons/fa6";
import './Settings.css';
import { toast } from "react-toastify";

/**
 * SettingsControl - A custom map control component that provides settings functionality
 * 
 * @component
 */
export default function SettingsControl() {
  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={() => toast.error('Feature not implemented yet')}
        className="settings-button"
        aria-label="Open settings"
        title="Open settings"
      >
        <FaGear className="settings-icon" />
      </button>
    </div>
  );
}