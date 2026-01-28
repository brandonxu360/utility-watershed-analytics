import weppcloud_diagram from '../../assets/images/weppcloud_diagram.png'
import './AboutWeppCloudMain.css';


export default function AboutWeppCloud() {

    return (
        <div id="weppcloud-container-main">
          <img src={weppcloud_diagram} alt="diagram of inputs, processes and outputs of WEPP Cloud" /> 
          
          <h2>How WEPPcloud is Used</h2>
          <h3>Automated Input Creation</h3>
            <ul>
              <li>Automatically gathers and processes input data from publicly available databases</li>
              <li>Uses sources such as SSURGO/STATSGO2 for soils and USGS NLCD for land cover</li>
            </ul>

            <h3>Watershed Delineation</h3>
            <ul>
              <li>Delineates watersheds into hillslopes and channels using tools such as TOPAZ or TauDEM</li>
            </ul>

            <h3>Enhanced Modeling Capabilities</h3>
            <ul>
              <li>Includes baseflow simulation using a linear reservoir approach</li>
              <li>Supports pollutant load modeling, including phosphorus loss estimates</li>
              <li>Provides ash transport modeling</li>
            </ul>

            <h3>Scenario Analysis</h3>
            <ul>
              <li>Allows users to evaluate management alternatives and disturbance scenarios, such as:
                <ul>
                  <li>Undisturbed conditions</li>
                  <li>Forest thinning</li>
                  <li>Prescribed fire</li>
                  <li>Varying wildfire severities</li>
                </ul>
              </li>
            </ul>

            <h3>Output Visualization</h3>
            <ul>
              <li>Results are provided in tabular, graphical, and GIS formats, including shapefiles</li>
              <li>Users can visualize and compare outputs such as soil loss and sediment yield maps</li>
            </ul>

            <div className="text-center dash">&mdash;</div>

            <h2>Who Uses WEPPcloud</h2>
            <p>
              WEPPcloud is designed for users who may not have extensive modeling experience, including:
            </p>
            <ul>
              <li>Land and water resource managers</li>
              <li>USDA Forest Service Burned Area Emergency Response (BAER) teams</li>
              <li>Department of the Interior Emergency Stabilization teams</li>
              <li>State agencies</li>
              <li>Water utilities</li>
            </ul>
            
            <p>
              It also supports scientists and researchers by providing a comprehensive, physically based hydrologic modeling framework with pre-processed data.
            </p>
            
        </div>
    )
}
