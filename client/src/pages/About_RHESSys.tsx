import { tss } from "../utils/tss";
import { useNavigate } from "@tanstack/react-router";
import rhessys_diagram from "../assets/images/rhessys_diagram.png";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import SidePanelLayout from "../components/SidePanelLayout";

const useStyles = tss.create(({ theme }) => ({
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
}));

const SidePanel = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <>
      <Button
        className={classes.backButton}
        onClick={() => navigate({ to: "/about" })}
        aria-label="Back to About"
      >
        BACK
      </Button>
      <Typography component="h2" variant="h2" fontWeight="bold" marginY={2}>
        About RHESSys
      </Typography>
      <Divider />
      <div className={classes.nutshell}>
        <Typography component="h3" variant="h3" fontWeight="bold" marginY={3}>
          IN A NUTSHELL
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>What it is:</span>
          {` RHESSys stands for `}
          <em>Regional Hydro-Ecological Simulation System</em>
          {`\u2014a GIS-based model designed to simulate the cycling of water,
            carbon, and nutrients (primarily nitrogen) within a landscape.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>Purpose:</span>
          {` Simulates flux and storage of water, carbon, and nitrogen over
            spatially variable terrain.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>How it works:</span>
          {` Calculates physical and biological processes within a landscape
            on a daily time step.`}
        </Typography>
      </div>
    </>
  );
};

const Content = () => {
  const { classes } = useStyles();
  return (
    <>
      <img
        src={rhessys_diagram}
        alt="diagram of inputs, processes and outputs of RHESSys"
        className={classes.diagramImage}
      />

      <Typography component="h2" className={classes.heading2}>
        Purpose and Applications
      </Typography>
      <Typography variant="body1" mb={3}>
        The primary purpose of RHESSys (Regional Hydro-Ecological Simulation
        System) is to simulate the fluxes (movement) and storage of water,
        carbon, and nitrogen over spatially variable terrain. It bridges the gap
        between traditional hydrological models (which often ignore dynamic
        vegetation growth) and ecological models (which often ignore the lateral
        movement of water and nutrients across a landscape).
      </Typography>
      <Typography variant="body1" mb={3}>
        RHESSys is used primarily by researchers and watershed managers to
        answer &ldquo;what if&rdquo; questions regarding:
      </Typography>
      <ul>
        <li>
          <span>Climate Change:</span> How will shifting rainfall patterns or
          rising temperatures alter streamflow, snowpack, and forest health?
        </li>
        <li>
          <span>Land Use Change:</span> What happens to water quality or yield
          if a forest is logged, a road is built, or a sub-division is developed
          (urbanization)?
        </li>
        <li>
          <span>Disturbances:</span> Modeling the impact of wildfires, drought
          stress, or insect outbreaks on a watershed&rsquo;s long-term recovery.
        </li>
        <li>
          <span>Nutrient Cycling:</span> Tracking nitrogen pollution
          (nitrification/denitrification) and how it moves from hillslopes into
          streams.
        </li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        How RHESSys Works
      </Typography>
      <Typography variant="body1" mb={3}>
        RHESSys is a process-based model, meaning it calculates physical and
        biological processes rather than just using statistical averages. It
        operates on a daily time step and uses a hierarchical structure to
        represent the landscape:
      </Typography>

      <Typography component="h3" className={classes.heading3}>
        The Spatial Hierarchy
      </Typography>
      <Typography variant="body1" mb={3}>
        To manage complexity, RHESSys breaks a watershed down into nested
        levels:
      </Typography>
      <ol>
        <li>
          <span>Basin:</span> The entire watershed (aggregates streamflow).
        </li>
        <li>
          <span>Zone:</span> Areas with similar climate (e.g., elevation bands).
        </li>
        <li>
          <span>Hillslope:</span> Defines lateral flow; water drains from upper
          hillslopes to lower ones.
        </li>
        <li>
          <span>Patch:</span> The smallest spatial unit (often a grid cell);
          where vertical soil moisture and energy balances are calculated.
        </li>
        <li>
          <span>Canopy Stratum:</span> The vertical layers of vegetation above a
          patch (e.g., trees, shrubs, grasses).
        </li>
      </ol>

      <Typography component="h3" className={classes.heading3}>
        The Core Engines
      </Typography>
      <Typography variant="body1" mb={3}>
        RHESSys is essentially a &ldquo;super-model&rdquo; that combines
        adaptations of three older, well-established models:
      </Typography>
      <ul>
        <li>
          <span>MTN-CLIM:</span> Extrapolates weather data (temperature,
          radiation) across complex terrain (e.g., making north-facing slopes
          cooler).
        </li>
        <li>
          <span>BIOME-BGC:</span> Simulates plant physiology (photosynthesis,
          respiration, growth, mortality) and soil biogeochemistry.
        </li>
        <li>
          <span>TOPMODEL (or DHSVM-style routing):</span> Simulates the movement
          of water, including surface runoff, subsurface flow, and saturation.
        </li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Model Inputs and Outputs
      </Typography>

      <Typography component="h3" className={classes.heading3}>
        Inputs
      </Typography>
      <Typography variant="body1" mb={3}>
        RHESSys is data-intensive because it is spatially explicit. It requires
        two main types of data, spatial and temporal:
      </Typography>

      <Typography component="h4" className={classes.heading4}>
        Static Spatial Data (GIS Maps)
      </Typography>
      <ul>
        <li>
          <span>DEM (Digital Elevation Model):</span> To calculate slope,
          aspect, and elevation.
        </li>
        <li>
          <span>Soil Map:</span> Texture, porosity, and hydraulic conductivity.
        </li>
        <li>
          <span>Land Cover/Vegetation Map:</span> Defines where forests,
          grasslands, or urban areas are.
        </li>
        <li>
          <span>Vegetation Parameters:</span> Physiology tables for the specific
          plants in the region (e.g., pine vs. oak vs. grass).
        </li>
        <li>
          <span>Stream Network:</span> Where the water eventually drains.
        </li>
      </ul>

      <Typography component="h4" className={classes.heading4}>
        Temporal Forcing Data (Time Series)
      </Typography>
      <Typography variant="body1" mb={3}>
        At a minimum, the model requires daily records of:
      </Typography>
      <ul>
        <li>
          <span>Precipitation</span> (rain/snow)
        </li>
        <li>
          <span>Maximum Temperature</span>
        </li>
        <li>
          <span>Minimum Temperature</span>
        </li>
      </ul>
      <Typography variant="body1" mb={3}>
        <span style={{ fontWeight: 800, fontStyle: "italic" }}>
          Optional but helpful:
        </span>
        {` Solar radiation, wind speed, relative humidity (if not provided,
          the model estimates these using MTN-CLIM logic).`}
      </Typography>

      <Typography component="h3" className={classes.heading3}>
        Outputs
      </Typography>
      <Typography variant="body1" mb={3}>
        The model can output data at any level of the hierarchy (e.g., total
        streamflow for the Basin, or soil moisture for a specific Patch).
      </Typography>
      <ul>
        <li>
          <span>Hydrological Outputs:</span> Streamflow (discharge),
          evapotranspiration (ET), soil moisture, snowpack depth, groundwater
          recharge.
        </li>
        <li>
          <span>Ecological Outputs:</span> Net Primary Production (NPP), Gross
          Primary Production (GPP), leaf area index (LAI), plant respiration,
          carbon and nitrogen stores in soil/litter.
        </li>
      </ul>
    </>
  );
};

export default function AboutRHESSys() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
