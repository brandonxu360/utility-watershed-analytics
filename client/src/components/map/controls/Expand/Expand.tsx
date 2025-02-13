import { FaUpRightAndDownLeftFromCenter, FaDownLeftAndUpRightToCenter } from "react-icons/fa6";
import './Expand.css';

interface ExpandControlProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

/**
 * ExpandControl - A custom map control component that toggles side content visibility
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Current state of the side panel
 * @param {Function} props.setIsOpen - Callback to toggle side panel state
 */
export default function ExpandControl({ isOpen, setIsOpen }: ExpandControlProps) {

  return (
    <div className="leaflet-bar leaflet-control">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="expand-button"
        aria-label={isOpen ? "Collapse side panel" : "Expand side panel"}
        title={isOpen ? "Collapse side panel" : "Expand side panel"}
      >
        {isOpen ? (
          <FaDownLeftAndUpRightToCenter className="expand-icon" />
        ) : (
          <FaUpRightAndDownLeftFromCenter className="expand-icon" />
        )}
      </button>
    </div>
  );
}