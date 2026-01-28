import { useNavigate } from '@tanstack/react-router';


export default function AboutRhessysSidePanelContent() {
    const navigate = useNavigate();  
    return (
        <div className="about-rhessys-panel">
            <h2>About RHESSys</h2>
            <hr />
            <div id="nutshell">
                <h3>IN A NUTSHELL</h3>
                <p>
                    <span>What it is:</span>&nbsp;
                    RHESSys stands for <em>Regional Hydro-Ecological Simulation System</em>&mdash;a GIS-based model designed to simulate the cycling of water, carbon, 
                    and nutrients (primarily nitrogen) within a landscape.
                </p>
                <p>
                    <span>Purpose:</span>&nbsp; 
                    Simulates flux and storage of water, carbon, and nitrogen over spatially variable terrain.
                </p>
                <p>
                    <span>How it works:</span>&nbsp;  
                    Calculates physical and biological processes within a landscape on a daily time step.
                </p>
            </div>

            <br />
            <button
                onClick={() => {
                    navigate({ to: "/about-wepp" });
                }}
                className='actionButton'
                aria-label='Learn about WEPP'
                title='Learn about WEPP'
            >
                About WEPP
            </button>
            <button
                onClick={() => {
                    navigate({ to: "/about-wepp-cloud" });
                }}
                className='actionButton'
                aria-label='Learn about WEPPcloud'
                title='Learn about WEPPcloud'
            >
                About WEPPcloud
            </button>
            
            <br /><br /><br />
        </div>
    )
}
  