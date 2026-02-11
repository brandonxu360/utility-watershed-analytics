import { useNavigate } from '@tanstack/react-router';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import SmallScreenNotice from '../../components/SmallScreenNotice';
import wepp_diagram from '../../assets/images/wepp_diagram.png'
import '../about/About.css';

/* ABOUT WEPP: SIDE PANEL CONTENT */
export function AboutWeppSidePanelContent() { 
  const navigate = useNavigate();
  return (
    <div className="about-panel">
      <button
        onClick={() => {
          navigate({ to: "/about" });
        }}
        className='closeButton'
        aria-label='Close WEPP panel'
        title='Close WEPP panel'
        style={{ padding: '0.313rem 0.5rem', marginBottom: '1rem' }}
      >
        BACK
      </button>

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

      <br /><br /><br />    
    </div>
  )
}

/* ABOUT WEPP: MAIN CONTENT */
export function AboutWeppMainContent() {
  return (
    <div id="about-container-main">
      <img src={wepp_diagram} alt="diagram of inputs, processes and outputs of WEPP" /> 
      
      <h2>What is WEPP?</h2>
      <p>
        WEPP was designed to provide advanced erosion prediction technology for organizations involved in
        soil and water conservation, environmental planning, and land management.
      </p>
      <p>
        WEPP is applicable to agricultural lands, rangelands, and forested environments, and is commonly used for:
      </p>
      <ul>
        <li>Field-sized areas or conservation treatment units</li>
        <li>HUC12 watersheds, though recent developments support watersheds of up to <span className="text-red-400">XXXX</span> ha.</li>
      </ul>
      <p>
        The WEPP model predicts:
      </p>
      <ul>
        <li>Soil loss and sediment deposition from overland flow on hillslopes</li>
        <li>Erosion and sediment transport in small channels</li>
        <li>Erosion and sediment transport at watershed outlets</li>
        <li>Sediment deposition in impoundments (supported, but not commonly applied)</li>
      </ul>
      <p>
        WEPP provides spatial and temporal estimates of erosion and deposition and
        can represent landscapes that range from simple to highly complex and nonuniform.
      </p>

      <div className="text-center dash">&mdash;</div>

      <h2>Purpose and Applications</h2>

      <p>
        The primary objective of WEPP is to support soil and water conservation and
        environmental assessment. It was developed for use by agencies such as:
      </p>

      <ul>
        <li>USDA–Natural Resources Conservation Service</li>
        <li>USDA–Forest Service</li>
        <li>USDI–Bureau of Land Management</li>
        <li>Other organizations involved in land and water resource management</li>
        <li>WEPP is widely used to evaluate erosion risks, sediment delivery, and the effects of land management practices across a variety of landscapes.</li>
      </ul>

      <div className="text-center dash">&mdash;</div>

      <h2>How WEPP Works</h2>
      <p>
        WEPP operates by maintaining a continuous daily water balance and simulating the physical
        processes that control runoff, plant growth, and erosion.
      </p>

      <h3>Climate Inputs</h3>

      <p>
        WEPP requires daily climate inputs to drive hydrology, plant growth, and erosion processes.
        These inputs can be provided in several ways, depending on the application and interface being used.
      </p>

      <h4>Observed or User-Defined Climate Data</h4>
      <p>
        Users may directly supply climate data for WEPP simulations, allowing maximum control over input conditions.
      </p>
      <ul>
        <li>
          <span>Observed daily climate data</span><br />
          Users can upload observed daily records, typically including precipitation and maximum and minimum air temperature.
        </li>
        <li>
          <span>Breakpoint rainfall data</span><br />
          Climate input files can be manually constructed to include breakpoint rainfall data for detailed storm representation.
        </li>
        <li>
          <span>Single Storm simulations</span><br />
          The WEPPcloud interface includes a Single Storm option, allowing users to define storm-specific parameters such as date, total precipitation, duration, and intensity.
        </li>
      </ul>

      <h4>Gridded and Geospatial Climate Datasets</h4>
      <p>
        WEPP GIS-based interfaces, including WEPPcloud, can derive climate inputs from gridded datasets that are interpolated from historic observations and provide spatial coverage across complex watersheds.
      </p>
      <ul>
        <li>
          <span>Daymet</span><br />
          A historic gridded dataset (1 km resolution) providing daily precipitation and maximum and minimum temperature.
        </li>
        <li>
          <span>gridMET</span><br />
          A gridded dataset (4 km resolution) providing interpolated daily precipitation and maximum and minimum temperature.
        </li>
        <li>
          <span>PRISM</span><br />
          The Parameter-elevation Regressions on Independent Slopes Model (PRISM) provides gridded mean monthly precipitation and temperature values. These data are often used to adjust the monthly climate statistics used by models such as CLIGEN, Daymet, or gridMET.
        </li>
        <li>
          <span>Future Climate</span><br />
          The future climate option uses downscaled daily climate series from Coupled Model Intercomparison Project Phase 5 (CMIP5) global climate models to simulate conditions between 2006 and 2099.
        </li>
      </ul>

      <h4>Climate Variable Completion and Stochastic Generation</h4>
      <p>
        When gridded datasets such as Daymet or gridMET are used, not all weather variables required by WEPP are directly available. In these cases:
      </p>
      <ul>
        <li>
          Remaining variables (e.g., storm duration, peak intensity, solar radiation) are typically generated stochastically using CLIGEN, based on the nearest historical weather station data
        </li>
      </ul>

      <h3>Hydrology</h3>
      <p>
        WEPP simulates surface and subsurface hydrologic processes using a continuous daily water balance. The model represents both infiltration-excess and saturation-excess runoff mechanisms, and simulates soil evaporation, plant transpiration, and deep percolation.
      </p>

      <h4>Infiltration and Infiltration-Excess Runoff</h4>
      <p>
        The original WEPP formulation focused primarily on infiltration-excess runoff. Infiltration is calculated using a modified Green and Ampt infiltration equation, and surface runoff is routed using kinematic wave equations.
      </p>
      <ul>
        <li>
          <span>Infiltration-Excess Runoff (Hortonian Flow)</span><br />
          This runoff mechanism occurs when rainfall intensity exceeds the soil's infiltration capacity.
          Rainfall excess is calculated as the difference between rainfall rate and infiltration rate,
          and the resulting runoff is routed downslope using kinematic wave equations.<br />
          WEPP has been widely and successfully applied in environments where this process dominates,
          including erosion modeling on roads, harvested units, and burned areas.
        </li>
      </ul>

      <h4>Saturation-Excess Runoff and Subsurface Flow</h4>
      <p>
        Later versions and model enhancements expanded WEPP's ability to represent saturation-excess runoff, which is essential for simulating variable source area hydrology.
      </p>
      <ul>
        <li>
          <span>Subsurface Hydrology</span><br />
          WEPP includes subsurface flow routines that compute lateral flow using Darcy's law, as part of the model's continuous daily water balance.
        </li>
        <li>
          <span>Saturation-Excess Runoff (Variable Source Areas)</span><br />
          Saturation-excess runoff becomes dominant in humid climates or in landscapes with shallow restrictive soil layers or shallow bedrock, where perched water tables may periodically develop. Surface runoff is generated when soil water content exceeds its drainable threshold, or when storage capacity above a restrictive layer is exceeded.
        </li>
      </ul>
      <p>
        WEPP simulates this process by comparing soil water content to porosity for each soil layer, evaluated from the bottom upward. When the water content in the surface layer exceeds its porosity, surface runoff is predicted due to saturation-excess conditions.
      </p>


      <h3>Importance for Water Quality Applications</h3>
      <p>
        The ability to simulate both infiltration-excess and saturation-excess runoff makes WEPP a valuable
        tool for water quality and sediment transport assessments. Because runoff production areas differ
        substantially between these mechanisms, accurately representing both processes is critical for
        predicting the movement of sediment and agricultural chemicals across landscapes.
      </p>

      <h3>Plant Growth and Residue</h3>
      <ul>
        <li>Simulates above- and below-ground biomass production</li>
        <li>Growth is adjusted for heat, water, and temperature stress</li>
        <li>Tracks standing, flat, and buried residue and its decomposition</li>
      </ul>

      <h3>Erosion</h3>
      <ul>
        <li>Uses a steady-state sediment continuity equation</li>
        <li>Models:
          <ul>
            <li>Interrill erosion driven by rainfall intensity and runoff</li>
            <li>Rill erosion or deposition based on hydraulic shear stress and sediment transport capacity</li>
          </ul>
        </li>
        <li>Estimates selective deposition and sediment size distribution</li>
      </ul>

      <h3>Watershed and Channel Processes</h3>
      <ul>
        <li>Routes runoff and sediment through channels and impoundments</li>
        <li>Includes channel hydrology, channel erosion, and impoundment analysis</li>
      </ul>

      <div className="text-center dash">&mdash;</div>

      <h2>Model Inputs and Outputs</h2>

      <h3>Required Inputs</h3>
      <p>
        For <u>hillslope simulations</u>, WEPP requires four primary input files:
      </p>
      <ul>
        <li>Climate file</li>
        <li>Slope file (landscape geometry and overland flow elements)</li>
        <li>Soil file (texture, organic matter, erodibility, and other properties)</li>
        <li>Plant/management file (crop type, vegetation tillage, and residue management)</li>
      </ul>

      <p>
        For <u>watershed simulations</u>, additional files describe:
      </p>
      <ul>
        <li>Watershed structure and channels</li>
        <li>Channel topography, soils, and management</li>
        <li>Channel hydraulic characteristics</li>
        <li>Optional irrigation and impoundment information</li>
      </ul>

      <h3>Outputs</h3>
      <p>
        WEPP produces multiple output types depending on user needs:
      </p>
      <ul>
        <li><span>Summary outputs:</span> runoff, erosion, sediment delivery, and enrichment (storm, monthly, annual, or average annual)</li>
        <li><span>Spatial outputs:</span> erosion or deposition at a minimum of 100 points along a hillslope</li>
        <li><span>Detailed outputs:</span> water balance, soil conditions, plant growth, crop yield, winter processes, and rangeland conditions</li>
        <li><span>Watershed outputs:</span> runoff and sediment yield for the entire watershed and individual elements, including sediment delivery ratios and particle size distributions</li>
      </ul>

    </div>
  )
}

function SidePanel({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className='side-panel'>
      <div className='side-panel-content'>{children}</div>
    </div>
  );
}

/**
 * Layout for the ABOUT WEPP page.
 */
export default function AboutWepp() {
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className='about-container'>
      <SidePanel>
        <AboutWeppSidePanelContent />
      </SidePanel>
      <div className='about-wrapper' style={{ position: 'relative' }}>
        <AboutWeppMainContent />
      </div>
    </div>
  )

}
