import { tss } from "../utils/tss";
import { Link, useNavigate } from "@tanstack/react-router";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import wsu from "../assets/images/wsu_logo_horiz.png";
import ui from "../assets/images/ui_logo_light_horiz.png";
import unr from "../assets/images/unr_logo.png";
import osu from "../assets/images/osu_logo.png";
import wsu_dark from "../assets/images/wsu_logo_horiz_dark.png";
import ui_dark from "../assets/images/ui_logo_horiz_dark.png";
import unr_dark from "../assets/images/unr_logo_horiz_dark.png";
import osu_dark from "../assets/images/osu_logo_horiz_dark.png";
import usfs from "../assets/images/usfs_rockyMtn_logo.png";
import firewise_diagram from "../assets/images/firewise_diagram.png";
import fire_image from "../assets/images/wildfire-threat-water-supply.jpg";
import SidePanelLayout from "../components/SidePanelLayout";

const useStyles = tss.create(({ theme }) => ({
  navButtons: {
    display: "flex",
    flexDirection: "column",
    marginTop: 16,
    marginBottom: 16,
  },
  navButton: {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${theme.palette.text.primary}`,
    borderRadius: 0,
    color: theme.palette.text.primary,
    fontSize: "1.1rem",
    justifyContent: "flex-start",
    padding: "8px 16px",
    textTransform: "none",
    width: "100%",
    "&:hover": {
      background: theme.palette.action.hover,
      borderBottom: `1px solid ${theme.palette.accent.main}`,
      color: theme.palette.accent.main,
    },
  },
  contentHeading: {
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 800,
    paddingTop: 30,
    marginBottom: 30,
  },
  boxText: {
    border: `1px solid ${theme.palette.text.primary}`,
    padding: "25px 30px",
    fontSize: "1.2rem",
  },
  btnLink: {
    background: theme.palette.accent.main,
    color: theme.palette.accent.contrastText,
    padding: "8px 16px",
    border: `1px solid ${theme.palette.accent.main}`,
    borderRadius: 4,
    "&:hover": {
      background: theme.palette.accent.dark,
      color: theme.palette.accent.contrastText,
    },
  },
  institutions: {
    marginTop: 24,
  },
  logoContainer: {
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 220,
    margin: "0 auto",
    display: "block",
  },
  diagramImage: {
    width: "100%",
    height: "auto",
    marginBottom: 8,
  },
  fireImage: {
    width: "60%",
    height: "auto",
  },
  contentLink: {
    color: theme.palette.accent.main,
    textDecoration: "underline",
    "&:hover": {
      color: theme.palette.accent.dark,
    },
  },
}));

const SidePanel = () => {
  const { classes, theme } = useStyles();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  return (
    <>
      <Typography component="h2" variant="h2" fontWeight="bold" marginY={2}>
        About the Project
      </Typography>
      <Typography variant="body1" mb={4}>
        This product was supported by NASA and builds upon individual components
        developed over many years with funding from multiple state and federal
        agencies.
      </Typography>
      <Link to="/" className={classes.btnLink}>
        Explore Watersheds
      </Link>
      <Typography component="h3" variant="h2" fontWeight="bold" mt={4} mb={1}>
        Model Architecture
      </Typography>
      <div className={classes.navButtons}>
        <Button
          className={classes.navButton}
          onClick={() => navigate({ to: "/about/wepp" })}
        >
          WEPP
        </Button>
        <Button
          className={classes.navButton}
          onClick={() => navigate({ to: "/about/wepp-cloud" })}
        >
          WEPPcloud
        </Button>
        <Button
          className={classes.navButton}
          onClick={() => navigate({ to: "/about/rhessys" })}
        >
          RHESSys
        </Button>
        <Button
          className={classes.navButton}
          onClick={() => navigate({ to: "/about/sbs" })}
        >
          Predicted Soil Burn Severity
        </Button>
        <Button
          className={classes.navButton}
          onClick={() => navigate({ to: "/about/watar" })}
        >
          Wildfire Ash Transport And Risk (WATAR)
        </Button>
        <Button
          className={classes.navButton}
          onClick={() => navigate({ to: "/about/scenarios" })}
        >
          Scenarios
        </Button>
      </div>

      <div className={classes.institutions}>
        <Typography component="h3" variant="h2" fontWeight="bold" mt={4} mb={1}>
          Participating Institutions
        </Typography>
        <div className={classes.logoContainer}>
          <img
            src={isDark ? wsu : wsu_dark}
            alt="Washington State University logo"
            className={classes.logoImage}
          />
        </div>
        <div className={classes.logoContainer}>
          <img
            src={isDark ? ui : ui_dark}
            alt="University of Idaho logo"
            className={classes.logoImage}
          />
        </div>
        <div className={classes.logoContainer}>
          <img
            src={isDark ? unr : unr_dark}
            alt="University of Nevada, Reno logo"
            className={classes.logoImage}
          />
        </div>
        <div className={classes.logoContainer}>
          <img
            src={isDark ? osu : osu_dark}
            alt="Oregon State University logo"
            className={classes.logoImage}
          />
        </div>
        <div className={classes.logoContainer}>
          <img
            src={usfs}
            alt="US Forest Service, Rocky Mountain Research logo"
            className={classes.logoImage}
          />
        </div>
      </div>
    </>
  );
};

const Content = () => {
  const { classes } = useStyles();
  return (
    <>
      <Typography component="h2" className={classes.contentHeading}>
        FireWISE Watersheds Overview
      </Typography>

      <Grid container spacing={6} alignItems="center">
        <Grid size={{ xs: 12, lg: 6 }} textAlign="center">
          <img
            src={fire_image}
            alt="Wildfire threat to water supply"
            className={classes.fireImage}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="body1" className={classes.boxText}>
            <strong>
              FireWISE (Water, Impacts, Scenarios, Erosion) Watersheds
            </strong>
            {` is a decision-support tool for water utilities that conveniently
              brings together climatological, hydrological, and environmental
              data into a predictive modeling tool, allowing users to explore `}
            <strong>short-term changes</strong>
            {` in post-disturbance runoff, erosion, and ash transport, and `}
            <strong>longer-term watershed recovery dynamics</strong>
            {` by assessing vegetation regrowth in watersheds across the western US.`}
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={6} mt={4}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="body1" mb={4}>
            Wildfires are increasingly recognized as a threat to water supply.
            Fires have the potential to increase erosion and runoff in
            watersheds which can threaten water quality for millions of people
            in the western US who rely on forested watersheds for clean drinking
            water. Targeted watershed management before fires can help reduce
            the negative effects of wildfire, and prime forests to weather fires
            and recover from fire events more robustly.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="body1" mb={4}>
            {`Developed in partnership with Pacific Northwest water utilities, `}
            <strong>FireWISE Watersheds</strong>
            {` is designed to be used by managers for `}
            <Link to="/about/scenarios" className={classes.contentLink}>
              scenario-based planning
            </Link>
            , real-time analysis, and long-term resilience assessments. It is
            designed to guide preparedness, treatment operations, and watershed
            management decisions following wildfire disturbances.
          </Typography>
        </Grid>
      </Grid>

      <Typography component="h2" className={classes.contentHeading}>
        Underlying Architecture
      </Typography>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="body1" mb={4}>
            This platform uses two models to provide a predictive tool that can
            integrate wildfire behavior modeling, ecohydrologic simulations, and
            post-fire erosion and ash transport processes within a unified
            interface:
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Link to="/about/wepp" className={classes.btnLink}>
                WEPP
              </Link>
              <Typography variant="body1">
                Watershed Erosion Prediction Project
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Link to="/about/rhessys" className={classes.btnLink}>
                RHESSys
              </Link>
              <Typography variant="body1">
                Regional Hydro-Ecological Simulation System
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="body1" mb={4}>
            Leveraging NASA Earth observations—including Landsat, Sentinel-2,
            SMAP soil moisture, and MODIS vegetation metrics—along with
            {`advanced modeling systems such as `}
            <Link to="/about/rhessys" className={classes.contentLink}>
              RHESSys-WMFire
            </Link>
            {`, `}
            <Link to="/about/wepp" className={classes.contentLink}>
              WEPP
            </Link>
            {`, and `}
            <Link to="/about/watar" className={classes.contentLink}>
              WATAR
            </Link>
            , users can explore how different watershed burn severity affects
            ash deposition, streamflow, sediment loads, changes in forest
            biomass, and nitrogen leaching.
          </Typography>
        </Grid>
      </Grid>

      <Stack alignItems="center" mt={6} spacing={1}>
        <img
          src={firewise_diagram}
          alt="diagram"
          className={classes.diagramImage}
        />
        <Typography variant="body1">
          Building FireWISE Watersheds for water utility decision support
        </Typography>
      </Stack>
    </>
  );
};

export default function About() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
