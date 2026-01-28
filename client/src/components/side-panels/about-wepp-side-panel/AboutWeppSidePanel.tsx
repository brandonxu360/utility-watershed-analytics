import { useNavigate } from '@tanstack/react-router';


export default function AboutWeppSidePanelContent() {
    const navigate = useNavigate();
    return (
        <div className="about-wepp-panel">
            <h2>About WEPP</h2>
            <hr />
            <div id="nutshell">
                <h3>IN A NUTSHELL</h3>
                <p>
                <span>What it is:</span>&nbsp;
                The Water Erosion Prediction Project (WEPP) is a physically-based 
                computer model that simulates water erosion on hillslopes and small watersheds.
                </p>
                <p>
                <span>Purpose:</span>&nbsp; 
                Used by conservationists for soil and water management, assessing conservation
                effectiveness, and understanding soil hydrology.
                </p>
                <p>
                <span>How it works:</span>&nbsp;  
                Uses inputs for climate, soil, topography, and management (like vegetation)
                to predict erosion, runoff, and plant growth.
                </p>
            </div>

            <br />

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
            <button
                onClick={() => {
                    navigate({ to: "/about-rhessys" });
                }}
                className='actionButton'
                aria-label='Learn about RHESSys'
                title='Learn about RHESSys'
            >
                About RHESSys
            </button>
            
            <br /><br /><br />
            
        </div>
    )
}
  