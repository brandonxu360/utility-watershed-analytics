import React from 'react';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import { Link, useNavigate } from '@tanstack/react-router';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
import wsu from '../../assets/images/wsu_logo_horiz.png';
import ui from '../../assets/images/ui_logo_light_horiz.png';
import unr from '../../assets/images/unr_logo.png';
import osu from '../../assets/images/osu_logo.png';
import usfs from '../../assets/images/usfs_rockyMtn_logo.png';
import puff_diagram from '../../assets/images/puff_diagram.png'
import fire_image from '../../assets/images/wildfire-threat-water-supply.jpg'
import './About.css';

/* ABOUT: SIDE PANEL CONTENT */
export function AboutSidePanelContent() {
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
      
      <button onClick={() => {
        navigate({ to: "/about-wepp" });
      }}
      className='actionButton'
      aria-label='Learn about WEPP'
      title='Learn about WEPP'>WEPP
      </button>

      <button onClick={() => {
        navigate({ to: "/about-wepp-cloud" });
      }}
      className='actionButton'
      aria-label='Learn about WEPPcloud'
      title='Learn about WEPPcloud'>WEPPcloud
      </button>
      
      <button onClick={() => {
        navigate({ to: "/about-rhessys" });
      }}
      className='actionButton'
      aria-label='Learn about RHESSys'
      title='Learn about RHESSys'>RHESSys
      </button>

      <button onClick={() => {
          navigate({ to: "/about-sbs" });
        }}
        className='actionButton'
        aria-label='Learn about Predicted SBS'
        title='Learn about Predicted SBS'>Predicted-SBS
      </button>

      <button onClick={() => {
          navigate({ to: "/about-watar" });
        }}
        className='actionButton'
        aria-label='Learn about WATAR'
        title='Learn about WATAR'>WATAR
      </button>

      <button onClick={() => {
          navigate({ to: "/scenarios" });
        }}
        className='actionButton'
        aria-label='Learn about Scenarios'
        title='Learn about Scenarios'>Scenarios
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

/* ABOUT: MAIN CONTENT */
export function AboutMainContent() { 
  return (
    <div id="about-container-main">
      <h2>FireWISE Watersheds Overview</h2>
      
      <div className="row">
        <div className="col">
          <p className="text-center"><img src={fire_image} /></p>
        </div>
        <div className="col">
        <p>
          <strong>FireWISE (Water, Impacts, Sediment, Erosion) Watersheds</strong> is a decision-support tool for water utilities that conveniently brings together 
          climatological, hydrological, and environmental data into a predictive modeling tool, allowing 
          users to explore <strong>short-term changes</strong> in post-fire erosion, ash transport, and runoff and <strong>longer-term 
          watershed recovery dynamics</strong> by assessing vegetation regrowth and nitrogen leaching in watersheds 
          across the US West. 
        </p>
          
        </div>
      </div>

      <div className="row">
        <div className="col">
          <p>
            Wildfires are increasingly recognized as a threat to water supply. Fires have the potential to 
            increase erosion and runoff in watersheds which can create threaten water quality for millions 
            of people in the western US who rely on forested watersheds for clean drinking water. Targeted 
            watershed management before fires can help reduce the negative effects of wildfire, and prime 
            forests to weather fires and recover from fire events more robustly.
          </p>
        </div>
        <div className="col">
          <p>
            Developed in partnership with Pacific Northwest water utilities, <strong>FireWISE Watersheds</strong> is designed to be used 
            by managers for <a href="scenarios">scenario-based planning</a>, real-time analysis, and long-term resilience assessments. 
            It is designed to guide preparedness, treatment operations, and watershed management decisions 
            following wildfire disturbances.
          </p> 
        </div>
      </div>

      
      
      <h2>Underlying Architecture</h2>
      <div className="row">
        <div className="col">
          <p>
            This platform uses two models to provide a predictive tool that can integrate 
            wildfire behavior modeling, ecohydrologic simulations, and post-fire erosion 
            and ash transport processes within a unified interface:
          </p>
          <table>
            <tbody>
              <tr>
                <td>
                    <p className="text-center"><a href="about-wepp" className="btn-link">WEPP</a>&nbsp;</p>
                </td>
                <td>
                    <p>Watershed Erosion Prediction Project</p>
                </td>
              </tr>
              <tr>
                <td>
                    <p><a href="about-rhessys" className="btn-link">RHESSys</a>&nbsp;</p>
                </td>
                <td>
                    <p>Regional HydroEcological Simulation System</p>
                </td>
              </tr>
            </tbody> 
          </table>  
        </div>
        <div className="col">
          <p>
            Leveraging NASA Earth observations—including Landsat, Sentinel-2, SMAP soil moisture, 
            and MODIS vegetation metrics—along with advanced modeling systems such as <a href="about-rhessys">RHESSys-WMFire</a>, 
            <a href="about-wepp">WEPP</a>, and <a href="about-watar">WATAR</a>, users can explore how different watershed burn severity affects ash 
            deposition, streamflow, sediment loads, changes in forest biomass, and nitrogen leaching.
          </p>
        </div>
      </div>
      
      <div>
        <br />
        <img src={puff_diagram} alt="diagram" />
        <br />
        <p className="text-center">Building WEPP-PUFF for water utility decision support</p>
      </div>

      <br /><br />

    </div>
  )
}


/**
 * SidePanel component 
 */
function SidePanel({ children }: { children: React.ReactNode }) { 
  return (
    <div className='side-panel'>
      <div className='side-panel-content'>{children}</div>
    </div>
  )
}

/**
 * Layout for the ABOUT page.
 */
export default function About() { 
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className='about-container'>
      <SidePanel>
        <AboutSidePanelContent />
      </SidePanel>
      <div className='about-wrapper' style={{ position: 'relative' }}>
        <AboutMainContent />
      </div>
    </div>
  )
}
