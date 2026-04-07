import { tss } from "../utils/tss";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import { useNavigate } from "@tanstack/react-router";
import sbs_diagram from "../assets/images/sbs_diagram.png";
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
          About Predicted-SBS
        </Typography>
        <Divider />
        <div className={classes.nutshell}>
          <Typography component="h6" variant="h3" fontWeight="bold" marginY={3}>
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
          src={sbs_diagram}
          alt="diagram of inputs, processes and outputs of p-SBS"
          className={classes.diagramImage}
        />

        <Typography component="h2" className={classes.heading2}>
          What is Soil Burn Severity?
        </Typography>
        <Typography variant="body1" mb={3}>
          Soil Burn Severity (SBS) is the extent to which the heat from a
          wildfire changes the hydrological, physical, and chemical properties
          of soil. These changes influence watershed stability, vegetation
          recovery, and the risk of post-fire erosion. In operational contexts,
          USDA Forest Service BAER teams use the term to refer to a standardized
          mapping product. This map is a field-validated, satellite-derived
          image created by comparing pre-fire and post-fire imagery to classify
          severity across a burned area.
        </Typography>

        <Typography className={classes.sectionDivider}>&mdash;</Typography>

        <Typography component="h2" className={classes.heading2}>
          Predicted SBS Tool: Purpose and Applications
        </Typography>
        <Typography variant="body1" mb={3}>
          The predicted-Soil Burn Severity (p-SBS) tool extends the concept of
          SBS into the pre-fire environment to provide a model-based forecast of
          potential severity. Its purpose is to enable proactive planning and
          risk assessment, allowing managers to anticipate areas with higher
          soil vulnerability before a fire happens rather than reacting only
          after impacts occur.
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
          performance. The strongest drivers of severity were found to be
          terrain exposure (elevation), atmospheric aridity (ESI, ETa), and
          vegetation moisture and biomass (NDMI, NDVI).
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
            <span>Soil &amp; Topography:</span> Terrain metrics derived from
            SRTM (e.g., slope, elevation) and soil properties from POLARIS
            (e.g., saturated hydraulic conductivity, plant-available water).
          </li>
          <li>
            <span>Climate &amp; Anthropogenic Factors:</span> Climatological
            data from Daymet v4 and GridMET (e.g., temperature, precipitation,
            dead fuel moisture), alongside human disturbance variables like
            prior burn history, distance to roads, streams, ignition sources.
          </li>
        </ul>

        <Typography component="h3" className={classes.heading3}>
          Outputs
        </Typography>
        <ul>
          <li>
            The model outputs{" "}
            <span>
              forecasted maps representing potential soil burn severity
            </span>
            . It classifies severity into low, moderate, and high categories,
            with particular skill in detecting high-severity burns, which are
            critical for hazard mitigation.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default function AboutSBS() {
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
