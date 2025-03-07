import { useParams } from "@tanstack/react-router";

/**
 * Watershed side panel that displays information related to the specified watershed
 * including ways to run watershed models.
 * 
 * @returns {JSX.Element} - Side panel containing the specified watershed information.
 */
const Watershed = () => {
  const { watershedId } = useParams({from: '/watershed/$watershedId'});

  return (
    <div>
      <h1>Watershed {watershedId}</h1>
      {/* Optionally render UI for individual watershed */}
    </div>
  )
};

export default Watershed;