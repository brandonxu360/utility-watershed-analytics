import rhessys_diagram from '../../assets/images/rhessys_diagram.png'
import './AboutRHESSysMain.css';


export default function AboutRHESSys() {

    return (
        <div id="rhessys-container-main">
            
            <img src={rhessys_diagram} alt="diagram of inputs, processes and outputs of RHESSys" />
            
            <h2>Purpose and Applications</h2>
          
            <p>
                The primary purpose of RHESSys (Regional Hydro-Ecological Simulation System) is to simulate the fluxes (movement) and storage of water, carbon, and nitrogen over spatially variable terrain. It bridges the gap between traditional hydrological models (which often ignore dynamic vegetation growth) and ecological models (which often ignore the lateral movement of water and nutrients across a landscape).
            </p>
            <p>
                RHESSys is used primarily by researchers and watershed managers to answer "what if" questions regarding:
            </p>
            <ul>
                <li><span>Climate Change:</span> How will shifting rainfall patterns or rising temperatures alter streamflow, snowpack, and forest health?</li>
                <li><span>Land Use Change:</span> What happens to water quality or yield if a forest is logged, a road is built, or a sub-division is developed (urbanization)?</li>
                <li><span>Disturbances:</span> Modeling the impact of wildfires, drought stress, or insect outbreaks on a watershed's long-term recovery.</li>
                <li><span>Nutrient Cycling:</span> Tracking nitrogen pollution (nitrification/denitrification) and how it moves from hillslopes into streams</li>
            </ul>

            <div className="text-center dash">&mdash;</div>

            <h2>How RHESSys Works</h2>
            <p>
                RHESSys is a process-based model, meaning it calculates physical and biological processes rather than just 
                using statistical averages. It operates on a daily time step and uses a hierarchical structure to represent 
                the landscape:
            </p>
            
            <h3>The Spatial Hierarchy</h3>
            <p>
                To manage complexity, RHESSys breaks a watershed down into nested levels:
            </p>
            <ol>
                <li><span>Basin:</span> The entire watershed (aggregates streamflow).</li>
                <li><span>Zone:</span> Areas with similar climate (e.g., elevation bands).</li>
                <li><span>Hillslope:</span> Defines lateral flow; water drains from upper hillslopes to lower ones.</li>
                <li><span>Patch:</span> The smallest spatial unit (often a grid cell); where vertical soil moisture and energy balances are calculated.</li>
                <li><span>Canopy Stratum:</span> The vertical layers of vegetation above a patch (e.g., trees, shrubs, grasses).</li>
            </ol>

            <h3>The Core Engines</h3>
            <p>
                RHESSys is essentially a "super-model" that combines adaptations of two older, well-established models:
            </p>
            <ul>
                <li><span>MTN-CLIM:</span> Extrapolates weather data (temperature, radiation) across complex terrain (e.g., making north-facing slopes cooler).</li>
                <li><span>BIOME-BGC:</span> Simulates plant physiology (photosynthesis, respiration, growth, mortality) and soil biogeochemistry.</li>
                <li><span>TOPMODEL (or DHSVM-style routing):</span> Simulates the movement of water, including surface runoff, subsurface flow, and saturation.</li>
            </ul>

            <div className="text-center dash">&mdash;</div>

            <h2>Model Inputs and Outputs</h2>

            <h3>Inputs</h3>
            
            <p>
                RHESSys is data-intensive because it is spatially explicit. It requires two main types of data, spatial and temporal:
            </p>
            
            <h4>Static Spatial Data (GIS Maps)</h4>
            
            <ul>
                <li><span>DEM (Digital Elevation Model):</span> To calculate slope, aspect, and elevation.</li>
                <li><span>Soil Map:</span> Texture, porosity, and hydraulic conductivity.</li>
                <li><span>Land Cover/Vegetation Map:</span> Defines where forests, grasslands, or urban areas are.</li>
                <li><span>Vegetation Paramters:</span> Physiology tables for the specific plants in the region (e.g., pine vs. oak vs. grass).</li>
                <li><span>Stream Network:</span> Where the water eventually drains.</li>
            </ul>
            
            <h4>Temporal Forcing Data (Time Series)</h4>
            
            <p>At a minimum, the model requires daily records of:</p>
            
            <ul>
                <li><span>Precipitation</span> (rain/snow)</li>
                <li><span>Maximum Temperature</span></li>
                <li><span>Minimum Temperature</span></li>
            </ul>
            
            <p><span>Optional but helpful:</span> Solar radiation, wind speed, relative humidity (if not provided, the model estimates these using MTN-CLIM logic).</p>

            <h3>Outputs</h3>
            
            <p>
                The model can output data at any level of the hierarchy (e.g., total streamflow for the Basin, or soil moisture for a specific Patch).
            </p>
            <ul>
                <li><span>Hydrological Outputs:</span><br />
                Streamflow (discharge), evapotranspiration (ET), soil moisture, snowpack depth, groundwater recharge.<br /><br />
                </li>
                <li><span>Ecological Outputs:</span><br />
                Net Primary Production (NPP), Gross Primary Production (GPP), leaf area index (LAI), plant respiration, carbon and nitrogen stores in soil/litter.
                </li>
            </ul>

        </div>
    )
}
