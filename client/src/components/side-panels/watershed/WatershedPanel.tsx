import { Outlet } from "@tanstack/react-router";
import "./Watershed.css";

/**
 * Watershed side panel that displays information related to the specified watershed,
 * including ways to run watershed models.
 * 
 * @returns {JSX.Element} - Side panel containing the specific watershed information.
 */
export default function WatershedPanel(): JSX.Element {
  return (
    <div className="watershedPanel">
      <Outlet />
    </div>
  );
}
