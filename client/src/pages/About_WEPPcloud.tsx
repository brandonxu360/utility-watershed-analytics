import { tss } from "../utils/tss";
import { Link, useNavigate } from "@tanstack/react-router";
import weppcloud_diagram from "../assets/images/weppcloud_diagram.png";
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
  contentLink: {
    color: theme.palette.accent.main,
    textDecoration: "underline",
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
      <Button
        className={classes.backButton}
        onClick={() => navigate({ to: "/about" })}
        aria-label="Back to About"
      >
        BACK
      </Button>
      <Typography component="h2" variant="h2" fontWeight="bold" marginY={2}>
        About WEPPcloud
      </Typography>
      <Divider />
      <div className={classes.nutshell}>
        <Typography component="h3" variant="h3" fontWeight="bold" marginY={3}>
          IN A NUTSHELL
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>What it is:</span>
          {` WEPPcloud is an online interface for the `}
          <Link to="/about/wepp" className={classes.contentLink}>
            WEPP watershed model
          </Link>
          {`, built on a Python software framework (wepppy).`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>Purpose:</span>
          {` WEPPcloud is designed as a decision-support tool that makes the
            WEPP model more accessible to land managers and practitioners.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>How it works:</span>
          {` WEPPcloud runs entirely through a web browser and stores all
            model runs on remote cloud servers, eliminating local computing and
            storage limitations.`}
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
        src={weppcloud_diagram}
        alt="diagram of inputs, processes and outputs of WEPP Cloud"
        className={classes.diagramImage}
      />

      <Typography component="h2" className={classes.heading2}>
        How WEPPcloud is Used
      </Typography>

      <Typography component="h3" className={classes.heading3}>
        Automated Input Creation
      </Typography>
      <ul>
        <li>
          Automatically gathers and processes input data from publicly available
          databases
        </li>
        <li>
          Uses sources such as SSURGO/STATSGO2 for soils and USGS NLCD for land
          cover
        </li>
      </ul>

      <Typography component="h3" className={classes.heading3}>
        Watershed Delineation
      </Typography>
      <ul>
        <li>
          Delineates watersheds into hillslopes and channels using tools such as
          TOPAZ or TauDEM
        </li>
      </ul>

      <Typography component="h3" className={classes.heading3}>
        Enhanced Modeling Capabilities
      </Typography>
      <ul>
        <li>Includes baseflow simulation using a linear reservoir approach</li>
        <li>
          Supports pollutant load modeling, including phosphorus loss estimates
        </li>
        <li>Provides ash transport modeling</li>
      </ul>

      <Typography component="h3" className={classes.heading3}>
        Scenario Analysis
      </Typography>
      <Typography variant="body1" mb={3}>
        Allows users to evaluate management alternatives and disturbance
        scenarios, such as:
      </Typography>
      <ul>
        <li>Undisturbed conditions</li>
        <li>Forest thinning</li>
        <li>Prescribed fire</li>
        <li>Varying wildfire severities</li>
      </ul>

      <Typography component="h3" className={classes.heading3}>
        Output Visualization
      </Typography>
      <ul>
        <li>
          Results are provided in tabular, graphical, and GIS formats, including
          shapefiles
        </li>
        <li>
          Users can visualize and compare outputs such as soil loss and sediment
          yield maps
        </li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Who Uses WEPPcloud
      </Typography>
      <Typography variant="body1" mb={3}>
        WEPPcloud is designed for users who may not have extensive modeling
        experience, including:
      </Typography>
      <ul>
        <li>Land and water resource managers</li>
        <li>USDA Forest Service Burned Area Emergency Response (BAER) teams</li>
        <li>Department of the Interior Emergency Stabilization teams</li>
        <li>State agencies</li>
        <li>Water utilities</li>
      </ul>
      <Typography variant="body1" mb={3}>
        It also supports scientists and researchers by providing a
        comprehensive, physically based hydrologic modeling framework with
        pre-processed data.
      </Typography>
    </>
  );
};

export default function AboutWeppCloud() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
