import { tss } from "../utils/tss";
import { useNavigate } from "@tanstack/react-router";
import sbs_diagram from "../assets/images/sbs_diagram.png";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import SidePanelLayout from "../components/side-panels/SidePanelLayout";
import BackButton from "../components/BackButton";

const useStyles = tss.create(({ theme }) => ({
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
      <BackButton onClick={() => navigate({ to: "/about" })} label="Back to about page" />
      <Typography component="h2" variant="h2" fontWeight="bold" marginY={2}>
        About Predicted-SBS
      </Typography>
      <Divider />
      <div className={classes.nutshell}>
        <Typography component="h3" variant="h3" fontWeight="bold" marginY={3}>
          IN A NUTSHELL
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>What it is:</span>
          {` The p-SBS tool is a model-based forecast of potential soil burn
            severity derived from pre-fire vegetation, soil, terrain, climate,
            and disturbance conditions.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>Purpose:</span>
          {` Intended to support proactive planning and risk assessment,
            enabling managers to anticipate areas of higher soil vulnerability
            before a fire occurs.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>How it works:</span>
          {` Using a multi-source dataset and machine-learning models, the
            p-SBS Tool generates forecasted maps that classify soil burn severity
            into low, moderate, and high categories.`}
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
        src={sbs_diagram}
        alt="diagram of inputs, processes and outputs of p-SBS"
        className={classes.diagramImage}
      />

      <Typography component="h2" className={classes.heading2}>
        What is Soil Burn Severity?
      </Typography>
      <Typography variant="body1" mb={3}>
        Soil Burn Severity (SBS) is the extent to which the heat from a wildfire
        changes the hydrological, physical, and chemical properties of soil.
        These changes influence watershed stability, vegetation recovery, and
        the risk of post-fire erosion. In operational contexts, USDA Forest
        Service BAER teams use the term to refer to a standardized mapping
        product. This map is a field-validated, satellite-derived image created
        by comparing pre-fire and post-fire imagery to classify severity across
        a burned area.
      </Typography>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Predicted SBS Tool: Purpose and Applications
      </Typography>
      <Typography variant="body1" mb={3}>
        The predicted Soil Burn Severity (p-SBS) tool extends the concept of SBS
        into the pre-fire environment to provide a model-based forecast of
        potential severity. Its purpose is to enable proactive planning and risk
        assessment, allowing managers to anticipate areas with higher soil
        vulnerability before a fire happens rather than reacting only after
        impacts occur.
      </Typography>
      <Typography variant="body1" mb={3}>
        The p-SBS tool supports strategic, pre-emptive wildfire management and
        risk reduction by moving assessment from reactive mapping to proactive
        forecasting. Specific applications include:
      </Typography>
      <ul>
        <li>Pre-fire fuel and land-management planning.</li>
        <li>Mitigating erosion and watershed risks.</li>
        <li>
          Using anticipatory severity mapping to guide resource allocation.
        </li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        What the Model Does
      </Typography>
      <Typography variant="body1" mb={3}>
        The tool addresses soil burn severity prediction as a supervised
        multi-class classification problem (low, moderate, high). It utilizes
        ensemble machine-learning models, with Random Forest emerging as the
        best performer among those evaluated. A feature selection process
        reduced the initial dataset to 21 top predictors to maximize
        performance. The strongest drivers of severity were found to be terrain
        exposure (elevation), atmospheric aridity (ESI, ETa), and vegetation
        moisture and biomass (NDMI, NDVI).
      </Typography>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Model Inputs and Outputs
      </Typography>
      <Typography variant="body1" mb={3}>
        The framework uses a multi-source dataset for inputs spanning several
        categories:
      </Typography>

      <Typography component="h3" className={classes.heading3}>
        Inputs
      </Typography>
      <ul>
        <li>
          <span>Remote Sensing &amp; Vegetation:</span> Pre-fire imagery from
          Landsat 8 to compute indices like NDVI and NDMI, and ECOSTRESS
          products like evapotranspiration, evaporative stress index, and
          surface soil moisture.
        </li>
        <li>
          <span>Soil &amp; Topography:</span> Terrain metrics derived from SRTM
          (e.g., slope, elevation) and soil properties from POLARIS (e.g.,
          saturated hydraulic conductivity, plant-available water).
        </li>
        <li>
          <span>Climate &amp; Anthropogenic Factors:</span> Climatological data
          from Daymet v4 and GridMET (e.g., temperature, precipitation, dead
          fuel moisture), alongside human disturbance variables like prior burn
          history, distance to roads, streams, ignition sources.
        </li>
      </ul>

      <Typography component="h3" className={classes.heading3}>
        Outputs
      </Typography>
      <ul>
        <li>
          The model outputs{" "}
          <span>forecasted maps representing potential soil burn severity</span>
          . It classifies severity into low, moderate, and high categories, with
          particular skill in detecting high-severity burns, which are critical
          for hazard mitigation.
        </li>
      </ul>
    </>
  );
};

export default function AboutSBS() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
