/**
 * HomeSidePanelContent component that provides an overview of how to use the website.
 * Displays information about different watershed tiers and their significance.
 * 
 * @returns {JSX.Element} A sidebar panel containing watershed information.
 */
export default function HomeSidePanelContent() {
  return (
    <div className="home-panel">
      <h2>Explore Watershed Analytics</h2>
      <p>
        Visualize and analyze hydrologic and environmental data...
      </p>
      <h3>Tier 1 Watersheds</h3>
      <p>Access modeled results that provide initial insights...</p>
      <h3>Tier 2 Watersheds</h3>
      <p>Explore calibrated model results for enhanced accuracy...</p>
      <strong>Get Started: Select a watershed to explore its data.</strong>
    </div>
  );
}