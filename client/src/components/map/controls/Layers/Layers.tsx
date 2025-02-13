import { FaLayerGroup } from "react-icons/fa6";
import './Layers.css';

/**
 * LayersControl - A custom map control component that manages map layers
 * 
 * @component
 */
export default function LayersControl() {
  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={() => alert('Layers clicked!')}
        className="layers-button"
        aria-label="Toggle map layers"
        title="Toggle map layers"
      >
        <FaLayerGroup className="layers-icon" />
      </button>
    </div>
  );
}