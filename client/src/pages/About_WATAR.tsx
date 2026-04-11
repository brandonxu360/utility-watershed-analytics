import { tss } from "../utils/tss";
import { useNavigate } from "@tanstack/react-router";
import watar_diagram from "../assets/images/watar_diagram.png";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import SidePanelLayout from "../components/side-panels/SidePanelLayout";

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
        About WATAR
      </Typography>
      <Divider />
      <div className={classes.nutshell}>
        <Typography component="h3" variant="h3" fontWeight="bold" marginY={3}>
          IN A NUTSHELL
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>What it is:</span>
          {` WATAR (`}
          <em>Wildfire Ash Transport and Risk</em>
          {`) is a modeling framework designed to predict how wildfire ash is
            mobilized by runoff and delivered to streams and water supplies after
            a fire.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>Purpose:</span>
          {` Developed to help land and water managers better understand and
            reduce the risks that post-fire ash poses to water quality,
            infrastructure, and municipal water systems.`}
        </Typography>
        <Typography variant="body1" mb={2}>
          <span className={classes.nutshellLabel}>How it works:</span>
          {` Operates as an extension of WEPPcloud, using hydrologic
            simulations as a foundation while explicitly accounting for wildfire
            ash.`}
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
        src={watar_diagram}
        alt="diagram of inputs, processes and outputs of WATAR"
        className={classes.diagramImage}
      />

      <Typography component="h2" className={classes.heading2}>
        Purpose and Applications
      </Typography>
      <Typography variant="body1" mb={3}>
        <strong>WATAR (Wildfire Ash Transport and Risk)</strong> is a modeling
        framework designed to predict how wildfire ash is mobilized by runoff
        and delivered to streams and water supplies after a fire. The model was
        developed to help land and water managers better understand and reduce
        the risks that post-fire ash poses to water quality, infrastructure, and
        municipal water systems.
      </Typography>
      <Typography variant="body1" mb={3}>
        WATAR is built on extensive field measurements, laboratory experiments,
        and Earth observation (satellite) data collected after wildfires in the
        western United States. It operates as an extension of WEPPcloud, using
        WEPP&rsquo;s hydrologic simulations as a foundation while explicitly
        accounting for the unique behavior of wildfire ash.
      </Typography>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        What the Model Does
      </Typography>
      <Typography variant="body1" mb={3}>
        WATAR simulates how ash moves across hillslopes and into water systems
        over time by:
      </Typography>
      <ul>
        <li>
          Ingesting <span>post-fire ash load and ash cover maps</span> derived
          from satellite imagery.
        </li>
        <li>
          Using <span>WEPP-simulated runoff and infiltration</span> to drive ash
          transport.
        </li>
        <li>
          Tracking how ash availability and transport change across{" "}
          <span>multiple rainfall and snowmelt events</span>.
        </li>
      </ul>
      <Typography variant="body1" mb={3}>
        Unlike traditional erosion models that treat post-fire material as
        mineral soil, WATAR treats ash as a distinct material with different
        physical and chemical properties.
      </Typography>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Key Concepts Behind WATAR
      </Typography>
      <ul>
        <li>
          <span>Ash changes runoff behavior:</span> After a fire, ash forms a
          porous layer that can temporarily store water while limiting
          infiltration into the soil below. This affects how much runoff is
          generated and when ash is mobilized.
        </li>
        <li>
          <span>Ash transport evolves over time:</span> Early storms tend to
          move large amounts of fine ash. As storms continue, ash becomes
          compacted, depleted, and less easily transported.
        </li>
        <li>
          <span>Finite ash supply:</span> WATAR explicitly accounts for the fact
          that ash is a limited source that is gradually removed by successive
          runoff events.
        </li>
        <li>
          <span>Event-driven behavior:</span> Transport depends on rainfall
          intensity, timing, and ash condition, allowing the model to capture
          realistic post-fire pulses of ash delivery.
        </li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Model Outputs
      </Typography>
      <Typography variant="body1" mb={3}>
        WATAR provides time-series estimates of:
      </Typography>
      <ul>
        <li>Ash export from hillslopes.</li>
        <li>Cumulative ash delivery to water systems.</li>
        <li>
          First-order estimates of <span>water quality impacts</span>, based on
          the fraction of fine ash most likely to dissolve and release chemical
          constituents.
        </li>
      </ul>
      <Typography variant="body1" mb={3}>
        These outputs help identify{" "}
        <strong>when and where ash poses the greatest risk</strong> following a
        wildfire.
      </Typography>
    </>
  );
};

export default function AboutWATAR() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
