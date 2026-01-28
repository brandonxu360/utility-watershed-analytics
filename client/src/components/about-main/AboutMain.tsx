import puff_diagram from '../../assets/images/puff_diagram.png'
import fire_image from '../../assets/images/wildfire-threat-water-supply.jpg'
import './AboutMain.css';

export default function About() { 

    return (
        <div id="about-container-main">
            <h2>FireWISE Watersheds Overview</h2>
            
            <div className="row">
                <div className="col-1">
                    <p className="text-center"><img src={fire_image} /></p>
                </div>
                <div className="col-2">
                    <p>
                        Wildfires are increasingly recognized as a threat to water supply. Fires have the potential to 
                        increase erosion and runoff in watersheds which can create threaten water quality for millions 
                        of people in the western US who rely on forested watersheds for clean drinking water. Targeted 
                        watershed management before fires can help reduce the negative effects of wildfire, and prime 
                        forests to weather fires and recover from fire events more robustly.
                    </p>
                    <p>
                        <strong>FireWISE (Water, Impacts, Sediment, Erosion) Watersheds</strong> is a decision-support tool for water utilities that conveniently brings together 
                        climatological, hydrological, and environmental data into a predictive modeling tool, allowing 
                        users to explore short-term changes in post-fire erosion, ash transport, and runoff and longer-term 
                        watershed recovery dynamics by assessing vegetation regrowth and nitrogen leaching in watersheds 
                        across the US West. 
                    </p>
                    <p>
                        Developed in partnership with Pacific Northwest water utilities, the tool is designed to be used 
                        by managers for scenario-based planning, real-time analysis, and long-term resilience assessments. 
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
                        and MODIS vegetation metrics—along with advanced modeling systems such as RHESSys-WMFire, 
                        WEPP, and WATAR, users can explore how different watershed burn severity affects ash 
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