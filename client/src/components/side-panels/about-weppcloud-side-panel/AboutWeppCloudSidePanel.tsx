import { useNavigate } from '@tanstack/react-router';

export default function AboutWeppCloudSidePanelContent() {
    const navigate = useNavigate();  
    return (
        <div className="about-weppcloud-panel">
            <h2>About WEPPcloud</h2>
            <hr />
            <div id="nutshell">
              <h3>IN A NUTSHELL</h3>
              <p>
                <span>What it is:</span>&nbsp;
                WEPPcloud is an online interface for the <a href="about-wepp">WEPP watershed model</a>, built on a 
                Python software framework (wepppy).
              </p>
              <p>
                <span>Purpose:</span>&nbsp; 
                WEPPcloud is designed as a decision-support tool that makes the WEPP model more accessible to 
                land managers and practitioners.
              </p>
              <p>
                <span>How it works:</span>&nbsp;  
                WEPPcloud runs entirely through a web browser and stores all model runs on 
                remote cloud servers, eliminating local computing and storage limitations.
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
  