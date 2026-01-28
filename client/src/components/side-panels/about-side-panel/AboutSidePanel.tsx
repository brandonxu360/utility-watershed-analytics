import { useNavigate } from '@tanstack/react-router';
import { Link } from "@tanstack/react-router";
import wsu from '../../../assets/images/wsu_logo_horiz.png';
import ui from '../../../assets/images/ui_logo_light_horiz.png';
import unr from '../../../assets/images/unr_logo.png';
import osu from '../../../assets/images/osu_logo.png';
import usfs from '../../../assets/images/usfs_rockyMtn_logo.png';


export default function AboutSidePanelContent() {
    const navigate = useNavigate();
    return (
        <div className="about-panel">
            <h2>About the Project</h2>
            <p>
                FireWISE Watersheds is a predictive, decision-support tool for water 
                utilities that allows users to explore short-term changes in post-fire 
                erosion, ash transport, and runoff and longer-term watershed recovery 
                dynamics in watersheds across the US West.
            </p>
            <br />
            <p>
                <Link to="/" className="btn-link">
                    Explore Watersheds
                </Link>
            </p>
            <br />
            <h2>Model Architecture</h2>
            
            <button
                onClick={() => {
                    navigate({ to: "/about-wepp" });
                }}
                className='actionButton'
                aria-label='Learn about WEPP'
                title='Learn about WEPP'
            >
                WEPP
            </button>
            <button
                onClick={() => {
                    navigate({ to: "/about-wepp-cloud" });
                }}
                className='actionButton'
                aria-label='Learn about WEPPcloud'
                title='Learn about WEPPcloud'
            >
                WEPPcloud
            </button>
            <button
                onClick={() => {
                    navigate({ to: "/about-rhessys" });
                }}
                className='actionButton'
                aria-label='Learn about RHESSys'
                title='Learn about RHESSys'
            >
                RHESSys
            </button>
            
            <br /><br /><br />
            
            <div className="institutions">
                <h2>Participating Institutions</h2>
                <p className="text-center"><img src={wsu} alt="Washington State University logo" /></p>
                <p><img src={ui} alt="University of Idaho logo" /></p>
                <p><img src={unr} alt="University of Nevada, Reno logo" /></p>
                <p><img src={osu} alt="Oregon State University logo" /></p>
                <p><img src={usfs} alt="US Forest Service, Rocky Mountain Research logo" /></p>
            </div>
        
        </div>

    )
    
    
}
  