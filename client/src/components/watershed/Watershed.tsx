import { useNavigate, useParams } from "@tanstack/react-router";

/**
 * Watershed side panel that displays information related to the specified watershed
 * including ways to run watershed models.
 * 
 * @returns {JSX.Element} - Side panel containing the specified watershed information.
 */
export default function Watershed() {
  const { watershedId } = useParams({from: '/watershed/$watershedId'});
  const navigate = useNavigate();

  return (
    <>
      <button onClick={() => navigate({to: "/"})} style={backButtonStyle}>
        ← Back
      </button>
      <h2>Watershed: {watershedId}</h2>
      <p>Some stats, model results, etc…</p>
      {/* Additional watershed info or sub-sections */}
    </>
  );
};

const backButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--clr-primary-100)",
  fontSize: "1rem",
  cursor: "pointer",
  padding: "10px 0",
  textDecoration: "underline",
};