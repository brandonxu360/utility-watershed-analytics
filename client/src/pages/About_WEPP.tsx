import { tss } from "../utils/tss";
import { useNavigate } from "@tanstack/react-router";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import wepp_diagram from "../assets/images/wepp_diagram_v2.png";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

const useStyles = tss.create(({ theme }) => ({
  root: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
    overflow: "hidden",
  },
  sidePanel: {
    width: "30%",
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: theme.palette.surface.overlay,
    color: theme.palette.text.primary,
  },
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "10px 30px 0",
    boxSizing: "border-box",
  },
  backButton: {
    background: theme.palette.error.main,
    color: theme.palette.common.white,
    borderRadius: 3,
    padding: "5px 8px",
    margin: "16px 0",
    minWidth: "auto",
    textTransform: "none",
    "&:hover": {
      background: theme.palette.error.dark,
    },
  },
  nutshell: {
    marginTop: 20,
  },
  nutshellLabel: {
    fontWeight: 800,
    color: theme.palette.text.primary,
    background: theme.palette.action.selected,
    padding: "3px 6px",
    borderRadius: "4px",
    display: "inline",
  },
  mainWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: "scroll",
    position: "relative",
  },
  mainContent: {
    width: "100%",
    textAlign: "left",
    color: theme.palette.text.primary,
    background: theme.palette.surface.content,
    padding: "0 60px 60px 60px",
    lineHeight: 1.8,
    overflow: "hidden",
  },
  diagramImage: {
    width: "100%",
    height: "auto",
    display: "block",
    margin: "30px auto",
  },
  heading2: {
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 800,
    paddingTop: 30,
    marginBottom: 20,
  },
  heading3: {
    fontSize: "1.7rem",
    fontWeight: 800,
    paddingTop: 20,
    marginBottom: 12,
  },
  heading4: {
    fontSize: "1.3rem",
    fontWeight: 800,
    paddingTop: 16,
    marginBottom: 12,
  },
  sectionDivider: {
    textAlign: "center",
    fontSize: "3rem",
    fontWeight: 100,
    marginBottom: 16,
  },
  contentBody: {
    "& ul, & ol": {
      paddingLeft: 50,
      marginBottom: 24,
    },
    "& li": {
      marginBottom: 16,
      fontSize: "1.2rem",
    },
    "& li > span": {
      fontWeight: 800,
      fontStyle: "italic",
    },
  },
}));

const SidePanel = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <Paper elevation={3} square className={classes.sidePanel}>
      <div className={classes.sidePanelContent}>
        <Button
          className={classes.backButton}
          onClick={() => navigate({ to: "/about" })}
          aria-label="Back to About"
        >
          BACK
        </Button>
        <Typography component="h5" variant="h2" fontWeight="bold" marginY={2}>
          About WEPP
        </Typography>
        <Divider />
        <div className={classes.nutshell}>
          <Typography component="h6" variant="h3" fontWeight="bold" marginY={3}>
            IN A NUTSHELL
          </Typography>
          <Typography variant="body1" mb={2}>
            <span className={classes.nutshellLabel}>What it is:</span>
            {` The Water Erosion Prediction Project (WEPP) is a physically-based
            computer model that simulates water erosion on hillslopes and small
            watersheds.`}
          </Typography>
          <Typography variant="body1" mb={2}>
            <span className={classes.nutshellLabel}>Purpose:</span>
            {` Used by conservationists for soil and water management, assessing
            conservation effectiveness, and understanding soil hydrology.`}
          </Typography>
          <Typography variant="body1" mb={2}>
            <span className={classes.nutshellLabel}>How it works:</span>
            {` Uses inputs for climate, soil, topography, and management (like
            vegetation) to predict erosion, runoff, and plant growth.`}
          </Typography>
        </div>
      </div>
    </Paper>
  );
};

const Content = () => {
  const { classes } = useStyles();
  return (
    <div className={classes.mainWrapper}>
      <div className={`${classes.mainContent} ${classes.contentBody}`}>
        <img
          src={wepp_diagram}
          alt="diagram of inputs, processes and outputs of WEPP"
          className={classes.diagramImage}
        />
        <Typography component="h2" className={classes.heading2}>
          What is WEPP?
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP was designed to provide advanced erosion prediction technology
          for organizations involved in soil and water conservation,
          environmental planning, and land management.
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP is applicable to agricultural lands, rangelands, and forested
          environments, and is commonly used for:
        </Typography>
        <ul>
          <li>Field-sized areas or conservation treatment units</li>
          <li>
            HUC12 watersheds, though recent developments support watersheds of
            up to <span className="text-red-400">XXXX</span> ha.
          </li>
        </ul>
        <Typography variant="body1" mb={3}>
          The WEPP model predicts:
        </Typography>
        <ul>
          <li>
            Soil loss and sediment deposition from overland flow on hillslopes
          </li>
          <li>Erosion and sediment transport in small channels</li>
          <li>Erosion and sediment transport at watershed outlets</li>
          <li>
            Sediment deposition in impoundments (supported, but not commonly
            applied)
          </li>
        </ul>
        <Typography variant="body1" mb={3}>
          WEPP provides spatial and temporal estimates of erosion and deposition
          and can represent landscapes that range from simple to highly complex
          and nonuniform.
        </Typography>

        <Typography className={classes.sectionDivider}>&mdash;</Typography>

        <Typography component="h2" className={classes.heading2}>
          Purpose and Applications
        </Typography>
        <Typography variant="body1" mb={3}>
          The primary objective of WEPP is to support soil and water
          conservation and environmental assessment. It was developed for use by
          agencies such as:
        </Typography>
        <ul>
          <li>USDA&ndash;Natural Resources Conservation Service</li>
          <li>USDA&ndash;Forest Service</li>
          <li>USDI&ndash;Bureau of Land Management (BLM)</li>
          <li>
            Other organizations involved in land and water resource management
          </li>
        </ul>
        <Typography variant="body1" mb={3}>
          WEPP is widely used to evaluate erosion risks, sediment delivery, and
          the effects of land management practices across a variety of
          landscapes.
        </Typography>

        <Typography className={classes.sectionDivider}>&mdash;</Typography>

        <Typography component="h2" className={classes.heading2}>
          How WEPP Works
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP operates by maintaining a continuous daily water balance and
          simulating the physical processes that control runoff, plant growth,
          and erosion.
        </Typography>

        <Typography component="h3" className={classes.heading3}>
          Climate Inputs
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP requires daily climate inputs to drive hydrology, plant growth,
          and erosion processes. These inputs can be provided in several ways,
          depending on the application and interface being used.
        </Typography>

        <Typography component="h4" className={classes.heading4}>
          Observed or User-Defined Climate Data
        </Typography>
        <Typography variant="body1" mb={3}>
          Users may directly supply climate data for WEPP simulations, allowing
          maximum control over input conditions.
        </Typography>
        <ul>
          <li>
            <span>Observed daily climate data</span>
            <br />
            Users can upload observed daily records, typically including
            precipitation and maximum and minimum air temperature.
          </li>
          <li>
            <span>Breakpoint rainfall data</span>
            <br />
            Climate input files can be manually constructed to include breakpoint
            rainfall data for detailed storm representation.
          </li>
          <li>
            <span>Single Storm simulations</span>
            <br />
            The WEPPcloud interface includes a Single Storm option, allowing
            users to define storm-specific parameters such as date, total
            precipitation, duration, and intensity.
          </li>
        </ul>

        <Typography component="h4" className={classes.heading4}>
          Gridded and Geospatial Climate Datasets
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP GIS-based interfaces, including WEPPcloud, can derive climate
          inputs from gridded datasets that are interpolated from historic
          observations and provide spatial coverage across complex watersheds.
        </Typography>
        <ul>
          <li>
            <span>Daymet</span>
            <br />A historic gridded dataset (1 km resolution) providing daily
            precipitation and maximum and minimum temperature.
          </li>
          <li>
            <span>gridMET</span>
            <br />A gridded dataset (4 km resolution) providing interpolated
            daily precipitation and maximum and minimum temperature.
          </li>
          <li>
            <span>PRISM</span>
            <br />
            The Parameter-elevation Regressions on Independent Slopes Model
            (PRISM) provides gridded mean monthly precipitation and temperature
            values. These data are often used to adjust the monthly climate
            statistics used by models such as CLIGEN, Daymet, or gridMET.
          </li>
          <li>
            <span>Future Climate</span>
            <br />
            The future climate option uses downscaled daily climate series from
            Coupled Model Intercomparison Project Phase 5 (CMIP5) global
            climate models to simulate conditions between 2006 and 2099.
          </li>
        </ul>

        <Typography component="h4" className={classes.heading4}>
          Climate Variable Completion and Stochastic Generation
        </Typography>
        <Typography variant="body1" mb={3}>
          When gridded datasets such as Daymet or gridMET are used, not all
          weather variables required by WEPP are directly available. In these
          cases:
        </Typography>
        <ul>
          <li>
            Remaining variables (e.g., storm duration, peak intensity, solar
            radiation) are typically generated stochastically using CLIGEN,
            based on the nearest historical weather station data.
          </li>
        </ul>

        <Typography component="h3" className={classes.heading3}>
          Hydrology
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP simulates surface and subsurface hydrologic processes using a
          continuous daily water balance. The model represents both
          infiltration-excess and saturation-excess runoff mechanisms, and
          simulates soil evaporation, plant transpiration, and deep percolation.
        </Typography>

        <Typography component="h4" className={classes.heading4}>
          Infiltration and Infiltration-Excess Runoff
        </Typography>
        <Typography variant="body1" mb={3}>
          The original WEPP formulation focused primarily on infiltration-excess
          runoff. Infiltration is calculated using a modified Green and Ampt
          infiltration equation, and surface runoff is routed using kinematic
          wave equations.
        </Typography>
        <ul>
          <li>
            <span>Infiltration-Excess Runoff (Hortonian Flow)</span>
            <br />
            This runoff mechanism occurs when rainfall intensity exceeds the
            soil's infiltration capacity. Rainfall excess is calculated as the
            difference between rainfall rate and infiltration rate, and the
            resulting runoff is routed downslope using kinematic wave equations.
            <br />
            WEPP has been widely and successfully applied in environments where
            this process dominates, including erosion modeling on roads,
            harvested units, and burned areas.
          </li>
        </ul>

        <Typography component="h4" className={classes.heading4}>
          Saturation-Excess Runoff and Subsurface Flow
        </Typography>
        <Typography variant="body1" mb={3}>
          Later versions and model enhancements expanded WEPP's ability to
          represent saturation-excess runoff, which is essential for simulating
          variable source area hydrology.
        </Typography>
        <ul>
          <li>
            <span>Subsurface Hydrology</span>
            <br />
            WEPP includes subsurface flow routines that compute lateral flow
            using Darcy's law, as part of the model's continuous daily water
            balance.
          </li>
          <li>
            <span>Saturation-Excess Runoff (Variable Source Areas)</span>
            <br />
            Saturation-excess runoff becomes dominant in humid climates or in
            landscapes with shallow restrictive soil layers or shallow bedrock,
            where perched water tables may periodically develop. Surface runoff
            is generated when soil water content exceeds its drainable
            threshold, or when storage capacity above a restrictive layer is
            exceeded.
          </li>
        </ul>
        <Typography variant="body1" mb={3}>
          WEPP simulates this process by comparing soil water content to
          porosity for each soil layer, evaluated from the bottom upward. When
          the water content in the surface layer exceeds its porosity, surface
          runoff is predicted due to saturation-excess conditions.
        </Typography>

        <Typography component="h3" className={classes.heading3}>
          Importance for Water Quality Applications
        </Typography>
        <Typography variant="body1" mb={3}>
          The ability to simulate both infiltration-excess and saturation-excess
          runoff makes WEPP a valuable tool for water quality and sediment
          transport assessments. Because runoff production areas differ
          substantially between these mechanisms, accurately representing both
          processes is critical for predicting the movement of sediment and
          agricultural chemicals across landscapes.
        </Typography>

        <Typography component="h3" className={classes.heading3}>
          Plant Growth and Residue
        </Typography>
        <ul>
          <li>Simulates above- and below-ground biomass production</li>
          <li>Growth is adjusted for heat, water, and temperature stress</li>
          <li>
            Tracks standing, flat, and buried residue and its decomposition
          </li>
        </ul>

        <Typography component="h3" className={classes.heading3}>
          Erosion
        </Typography>
        <ul>
          <li>Uses a steady-state sediment continuity equation</li>
          <li>
            Models:
            <ul>
              <li>Interrill erosion driven by rainfall intensity and runoff</li>
              <li>
                Rill erosion or deposition based on hydraulic shear stress and
                sediment transport capacity
              </li>
            </ul>
          </li>
          <li>Estimates selective deposition and sediment size distribution</li>
        </ul>

        <Typography component="h3" className={classes.heading3}>
          Watershed and Channel Processes
        </Typography>
        <ul>
          <li>Routes runoff and sediment through channels and impoundments</li>
          <li>
            Includes channel hydrology, channel erosion, and impoundment
            analysis
          </li>
        </ul>

        <Typography className={classes.sectionDivider}>&mdash;</Typography>

        <Typography component="h2" className={classes.heading2}>
          Model Inputs and Outputs
        </Typography>

        <Typography component="h3" className={classes.heading3}>
          Required Inputs
        </Typography>
        <Typography variant="body1" mb={3}>
          For <u>hillslope simulations</u>, WEPP requires four primary input
          files:
        </Typography>
        <ul>
          <li>Climate file</li>
          <li>Slope file (landscape geometry and overland flow elements)</li>
          <li>
            Soil file (texture, organic matter, erodibility, and other
            properties)
          </li>
          <li>
            Plant/management file (crop type, vegetation tillage, and residue
            management)
          </li>
        </ul>
        <Typography variant="body1" mb={3}>
          For <u>watershed simulations</u>, additional files describe:
        </Typography>
        <ul>
          <li>Watershed structure and channels</li>
          <li>Channel topography, soils, and management</li>
          <li>Channel hydraulic characteristics</li>
          <li>Optional irrigation and impoundment information</li>
        </ul>

        <Typography component="h3" className={classes.heading3}>
          Outputs
        </Typography>
        <Typography variant="body1" mb={3}>
          WEPP produces multiple output types depending on user needs:
        </Typography>
        <ul>
          <li>
            <span>Summary outputs:</span> runoff, erosion, sediment delivery,
            and enrichment (storm, monthly, annual, or average annual)
          </li>
          <li>
            <span>Spatial outputs:</span> erosion or deposition at a minimum of
            100 points along a hillslope
          </li>
          <li>
            <span>Detailed outputs:</span> water balance, soil conditions, plant
            growth, crop yield, winter processes, and rangeland conditions
          </li>
          <li>
            <span>Watershed outputs:</span> runoff and sediment yield for the
            entire watershed and individual elements, including sediment
            delivery ratios and particle size distributions
          </li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Layout for the ABOUT WEPP page.
 */
export default function AboutWepp() {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.root}>
      <SidePanel />
      <Content />
    </div>
  );
}
