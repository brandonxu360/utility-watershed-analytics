import { tss } from "../utils/tss";
import { Link, useNavigate } from "@tanstack/react-router";
import scenarios_diagram from "../assets/images/scenarios_diagram.png";
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
        Model Scenarios
      </Typography>
      <Divider />
      <Typography variant="body1" mt={3}>
        Scenarios are used to explore &ldquo;what-if&rdquo; conditions that
        affect watershed erosion, runoff, and water quality. By simulating
        specific combinations of land conditions, climate settings, and
        management actions&mdash;such as thinning treatments versus wildfire
        impacts&mdash;scenarios provide a fast, low-cost way to compare
        alternatives and evaluate potential risks without waiting for real-world
        outcomes.
      </Typography>
    </>
  );
};

const Content = () => {
  const { classes } = useStyles();
  return (
    <>
      <img
        src={scenarios_diagram}
        alt="diagram of scenarios modeling"
        className={classes.diagramImage}
      />

      <Typography component="h2" className={classes.heading2}>
        What are Scenarios?
      </Typography>
      <Typography variant="body1" mb={3}>
        Scenarios are used to explore &ldquo;what-if&rdquo; conditions that
        affect erosion, runoff, and water quality. A scenario represents a
        specific combination of land condition, disturbance, management action,
        and climate setting. By comparing scenarios, users can quickly evaluate
        how different choices&mdash;or future conditions&mdash;may influence
        watershed outcomes.
      </Typography>
      <Typography variant="body1" mb={3}>
        Scenarios are a core concept of the Water Erosion Prediction Project (
        <Link to="/about/wepp" className={classes.contentLink}>
          WEPP
        </Link>
        ) model and provide a fast, low-cost way to test alternatives without
        waiting for real-world outcomes. They are widely used as
        decision-support tools by land and water resource managers.
      </Typography>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Disturbance and Management Scenarios
      </Typography>
      <Typography variant="body1" mb={3}>
        These scenarios describe how the landscape is affected by forest
        treatments or wildfire severity. They are commonly used to compare
        erosion and water quality risks under different management strategies.
        Thinning, prescribed fire, and wildfire scenarios (low, moderate, and
        high severity) are applied uniformly across all hillslopes in a
        watershed. While such uniform conditions are unlikely to occur in
        reality, this approach provides managers with a consistent way to
        evaluate relative risk, compare management alternatives, and understand
        the potential upper bounds of erosion and water quality impacts.
      </Typography>
      <ul>
        <li>
          <span>Undisturbed (Baseline)</span> Represents typical, healthy forest
          conditions with full ground cover. This scenario provides a reference
          point for comparing all other scenarios.
        </li>
        <li>
          <span>Thinning Treatments (Hand, Cable, Skidder)</span> Simulate
          mechanical fuel treatments with varying levels of ground disturbance.
          These scenarios help evaluate the short-term erosion impacts of fuel
          reduction treatments, which are generally much lower than those from
          wildfires.
        </li>
        <li>
          <span>Prescribed Fire</span> Represents planned, low-intensity burning
          that reduces ground cover more than thinning but far less than
          uncontrolled wildfire. Used to compare fire-based fuel management with
          mechanical treatments.
        </li>
        <li>
          <span>Low-, Moderate-, and High-Severity Wildfire</span> Simulate
          increasing levels of vegetation and ground cover loss.
          <ul>
            <li>Low severity reflects limited soil disturbance.</li>
            <li>Moderate severity represents partial soil exposure.</li>
            <li>
              High severity represents worst-case conditions, with major erosion
              and water quality impacts.
            </li>
          </ul>
        </li>
        <li>
          <span>Simulated Wildfire</span> Based on a simulated wildfire (
          <Link to="/about/sbs" className={classes.contentLink}>
            p-SBS
          </Link>
          ).
        </li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        How Scenarios are Used
      </Typography>
      <Typography variant="body1" mb={3}>
        Each scenario represents a complete WEPP simulation. Behind the scenes,
        WEPP organizes vegetation, soil conditions, surface disturbance, and
        management actions into structured inputs. Some soil and management
        parameters&mdash;including critical shear stress, hydraulic
        conductivity, and rill and interrill erodibility&mdash;are automatically
        adjusted based on land cover or disturbance type and soil texture. These
        default values are derived from field observations and experimental
        studies conducted across the western United States, ensuring that
        scenario simulations reflect realistic post-disturbance soil behavior.
      </Typography>
      <Typography variant="body1" mb={3}>
        By comparing results across scenarios, users can:
      </Typography>
      <ul>
        <li>Identify areas of high erosion or water quality risk.</li>
        <li>
          Evaluate the benefits of fuel treatments versus wildfire impacts.
        </li>
        <li>Support planning, mitigation, and emergency response decisions.</li>
      </ul>

      <Typography className={classes.sectionDivider}>&mdash;</Typography>

      <Typography component="h2" className={classes.heading2}>
        Who Uses Scenario-Based Modeling?
      </Typography>
      <Typography variant="body1" mb={3}>
        Scenario-based WEPP modeling is used by:
      </Typography>
      <ul>
        <li>Land and watershed managers.</li>
        <li>USDA Forest Service and NRCS.</li>
        <li>Bureau of Land Management (BLM).</li>
        <li>Post-fire emergency response teams (BAER, ES).</li>
        <li>State agencies and water utilities.</li>
        <li>Scientists and researchers.</li>
      </ul>
    </>
  );
};

export default function Scenarios() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
